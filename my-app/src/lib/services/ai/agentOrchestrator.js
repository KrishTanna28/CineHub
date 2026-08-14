import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { getLangChainTools } from './tools';
import { serializeContextData } from './assistantChain';
import {
  AGENT_SYSTEM_PROMPT,
  CITATION_INSTRUCTIONS,
  ROUTING_INSTRUCTIONS
} from './systemPrompt';
import { citationsToContext, runRerankerCitationChain } from './rerankerChain';
import { langchainCache } from './langchainCache';

let agentPrompt = null;

function getAgentPrompt() {
  if (agentPrompt) return agentPrompt;

  agentPrompt = ChatPromptTemplate.fromMessages([
    ['system', AGENT_SYSTEM_PROMPT],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad')
  ]);

  return agentPrompt;
}

function getAgentModel() {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-3.6-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
    maxOutputTokens: 1024,
    cache: langchainCache,
  });
}

function coerceOutput(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    return output
      .map(part => typeof part === 'string' ? part : part?.text || '')
      .join('')
      .trim();
  }
  return output?.content || output?.text || '';
}

export async function runAssistantAgent({
  message,
  userId,
  systemPrompt,
  contextData,
  classification,
  chatHistoryMessages = []
}) {

  const citationRetrieval = await runRerankerCitationChain({
    query: message,
    namespaces: classification?.vectorNamespaces,
    enabled: Boolean(classification?.shouldUseVectorSearch),
    topK: process.env.RAG_RERANK_TOP_K || process.env.RAG_TOP_K
  });

  const tools = getLangChainTools(userId);
  const agent = await createToolCallingAgent({
    llm: getAgentModel(),
    tools,
    prompt: getAgentPrompt()
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    maxIterations: 5,
    returnIntermediateSteps: false
  });

  const result = await executor.invoke({
    input: message,
    chat_history: chatHistoryMessages,
    system_prompt: systemPrompt,
    routing_instructions: ROUTING_INSTRUCTIONS,
    citation_instructions: CITATION_INSTRUCTIONS,
    context_data: serializeContextData(contextData),
    citation_context: citationsToContext(citationRetrieval.citations)
  });

  return {
    answer: coerceOutput(result.output),
    citations: citationRetrieval.citations,
    raw: result
  };
}

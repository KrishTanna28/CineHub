import { InMemoryCache } from "@langchain/core/caches";
import { set_llm_cache } from "@langchain/core/globals";

let cacheInitialized = false;

export function initLangChainCache() {
  if (cacheInitialized) return;
  set_llm_cache(new InMemoryCache());
  cacheInitialized = true;
}
import { InMemoryCache } from "@langchain/core/caches";
import { setGlobalCache } from "@langchain/core/globals";

let cacheInitialized = false;

export function initLangChainCache() {
  if (cacheInitialized) return;
  setGlobalCache(new InMemoryCache());
  cacheInitialized = true;
}

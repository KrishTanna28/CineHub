import { InMemoryCache, setGlobalCache } from '@langchain/core/caches';

let cacheInitialized = false;

export function initLangChainCache() {
  if (cacheInitialized) return;
  setGlobalCache(new InMemoryCache());
  cacheInitialized = true;
}

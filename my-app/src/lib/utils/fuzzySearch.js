/**
 * Escape special regex meta-characters so the string can be safely
 * embedded inside a RegExp.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── regex generators ───────────────────────────────────────────────

/**
 * Build a regex that inserts a lazy `.{0,N}?` gap between every typed
 * character.  This lets the pattern skip over characters the user forgot
 * to type.
 *
 * Example (maxGap = 2):
 *   "avngrs" → /a.{0,2}?v.{0,2}?n.{0,2}?g.{0,2}?r.{0,2}?s/i
 *   matches  "avengers" because the missing 'e's fall within the gaps.
 *
 * @param {string} query
 * @param {number} [maxGap=2] – max chars allowed between each typed char
 * @returns {RegExp}
 */
export function generateFuzzyRegex(query, maxGap = 2) {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return new RegExp(escapeRegex(trimmed), 'i');
  }
  const chars = trimmed.split('').map(c => escapeRegex(c));
  return new RegExp(chars.join(`.{0,${maxGap}}?`), 'i');
}

// ─── variant generators ─────────────────────────────────────────────

/**
 * Produce strings where exactly one character is removed at a time.
 * If the user typed an extra character ("aveangers") one of these
 * variants will be the correct spelling ("avengers").
 *
 * @param {string} query
 * @param {number} [max=6] – caps the number of variants returned
 * @returns {string[]}
 */
export function generateDeletionVariants(query, max = 6) {
  const variants = [];
  for (let i = 0; i < query.length && variants.length < max; i++) {
    const v = query.slice(0, i) + query.slice(i + 1);
    if (v.length >= 2 && !variants.includes(v)) variants.push(v);
  }
  return variants;
}

/**
 * Swap every pair of adjacent characters to cover simple transpositions.
 *
 * @param {string} query
 * @param {number} [max=5] – caps the number of variants returned
 * @returns {string[]}
 */
export function generateTranspositions(query, max = 5) {
  const variants = [];
  for (let i = 0; i < query.length - 1 && variants.length < max; i++) {
    if (query[i] !== query[i + 1]) {
      variants.push(
        query.slice(0, i) + query[i + 1] + query[i] + query.slice(i + 2)
      );
    }
  }
  return variants;
}

// ─── MongoDB query builder ──────────────────────────────────────────

/**
 * Build a MongoDB `$or` query that fuzzy-matches a search string against
 * one or more document fields.
 *
 * The resulting query keeps the original exact regex (so current behaviour
 * is preserved) and layers on:
 *  • a gap-tolerant fuzzy regex      (catches missing chars)
 *  • deletion variants               (catches extra chars the user typed)
 *  • transposition variants          (catches swapped adjacent chars)
 *
 * For queries shorter than 3 characters only the exact regex is used to
 * avoid noisy false positives.
 *
 * @param {string} query   – the raw search string from the user
 * @param {string[]} fields – document field names to match against
 * @returns {object}        – a Mongo query object (safe to spread into a filter)
 */
export function buildFuzzyMongoQuery(query, fields) {
  const trimmed = query.trim();
  if (!trimmed) return {};

  const conditions = [];

  // 1. Original exact regex — always present, preserves current behaviour
  const exactRegex = { $regex: escapeRegex(trimmed), $options: 'i' };
  fields.forEach(f => conditions.push({ [f]: exactRegex }));

  // Only layer on fuzzy patterns for queries with 3+ characters
  if (trimmed.length >= 3) {
    // 2. Fuzzy gap-tolerant regex (handles missing characters)
    const fuzzyRe = generateFuzzyRegex(trimmed);
    fields.forEach(f =>
      conditions.push({ [f]: { $regex: fuzzyRe.source, $options: 'i' } })
    );

    // 3. Deletion variants (handles extra characters typed by user)
    const deletions = generateDeletionVariants(trimmed, 4);
    for (const v of deletions) {
      fields.forEach(f =>
        conditions.push({ [f]: { $regex: escapeRegex(v), $options: 'i' } })
      );
    }

    // 4. Transposition variants (handles adjacent char swaps)
    const transpositions = generateTranspositions(trimmed, 3);
    for (const v of transpositions) {
      fields.forEach(f =>
        conditions.push({ [f]: { $regex: escapeRegex(v), $options: 'i' } })
      );
    }
  }

  return { $or: conditions };
}

// ─── External-API helper ────────────────────────────────────────────

/**
 * Produce a small set of query strings to try against external APIs
 * (like TMDB) that don't support fuzzy matching natively.
 *
 * Returns the original query first (most likely to be correct), then
 * the best transposition and deletion candidates.  The caller should
 * try them in order and stop as soon as good results appear.
 *
 * @param {string} query
 * @returns {string[]}
 */
export function generateQueryVariants(query) {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [trimmed];

  const seen = new Set([trimmed.toLowerCase()]);
  const variants = [trimmed];

  // Top transposition variants (covers swapped chars)
  for (const t of generateTranspositions(trimmed, 3)) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      variants.push(t);
    }
  }

  // Top deletion variants (covers extra chars the user typed)
  for (const d of generateDeletionVariants(trimmed, 3)) {
    const key = d.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      variants.push(d);
    }
  }

  return variants;
}

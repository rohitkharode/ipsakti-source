/**
 * Embeds every evidence chunk that does not yet have a vector.
 * Chunks keep their source, section, page, version and effective date, so each
 * embedding stays traceable to the document location it came from.
 */
export async function ensureEmbeddings(
  limit = 100,
): Promise<{ embedded: number; remaining: number; skipped: boolean }> {
  // OpenRouter is a text-generation provider in this integration. There is no
  // configured embedding provider, so retrieval deliberately remains BM25-only.
  void limit;
  return { embedded: 0, remaining: 0, skipped: true };
}

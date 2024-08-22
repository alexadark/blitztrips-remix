import { TavilyClient } from 'tavily';
/**
 * Performs a search using the Tavily API.
 *
 * @param {string} query - The search query.
 * @param {('advanced' | 'basic')} [search_depth='advanced'] - The depth of the search.
 * @param {boolean} [include_answer=true] - Whether to include the answer in the search results.
 * @param {boolean} [include_images=false] - Whether to include images in the search results.
 * @param {number} [max_results=10] - The maximum number of search results to return.
 * @param {string[]} [include_domains=['https://www.tripadvisor.com/']] - The domains to include in the search.
 * @returns {Promise<string>} - A promise that resolves to the answer of the search.
 */
export async function tavilySearch(
  query: string,
  search_depth: 'advanced' | 'basic' = 'advanced',
  include_answer: boolean = true,
  include_images: boolean = false,
  max_results: number = 10,
  include_domains: string[] = ['https://www.tripadvisor.com/']
): Promise<string> {
  const tavily = new TavilyClient();

  const result = await tavily.search({
    query,
    search_depth,
    include_answer,
    include_images,
    max_results,
    include_domains,
  });

  return {
    answer: result.answer,
    // results: result.results,
    query: result.query,
  };
}

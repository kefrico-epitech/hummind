import { safeFetch, SafeResponse } from "./safeFetch";

const SEARCH_API_URL = "/search";

export type GlobalSearchResultType =
  | "ORGANISATION"
  | "DEPARTEMENT"
  | "SALLE"
  | "INDEPENDANT"
  | "COURSE";

export interface GlobalSearchResult {
  id: string;
  name: string;
  type: GlobalSearchResultType;
}

export class SearchService {
  static async globalSearch(
    query: string,
  ): Promise<SafeResponse<GlobalSearchResult[]>> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        status: 200,
        data: [],
        error: null,
      };
    }

    const params = new URLSearchParams({ q: normalizedQuery });

    return safeFetch<GlobalSearchResult[]>(
      `${SEARCH_API_URL}?${params.toString()}`,
      {
        method: "GET",
      },
    );
  }
}

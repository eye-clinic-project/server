export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface LanguageRequest {
  headers: Record<string, string | string[] | undefined>;
  credentials?: {
    user?: {
      lang?: string;
    };
  };
}

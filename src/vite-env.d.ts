/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_AI_ENABLED: string;
  readonly VITE_AI_MODEL: string;
  readonly VITE_AI_DAILY_TOKEN_LIMIT: string;
  readonly VITE_AI_REQUEST_TIMEOUT_MS: string;
  readonly VITE_AI_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

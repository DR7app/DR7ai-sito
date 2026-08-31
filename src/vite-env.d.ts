/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORTAL_SUPABASE_URL?: string
  readonly VITE_PORTAL_SUPABASE_ANON_KEY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

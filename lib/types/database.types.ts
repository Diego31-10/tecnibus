export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          apellido: string
          avatar_url: string | null
          correo: string
          created_at: string | null
          id: string
          nombre: string
          push_token: string | null
          rol: string
          telefono: string | null
        }
      }
    }
  }
}

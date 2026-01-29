export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asignaciones_chofer: {
        Row: {
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          id_buseta: string | null
          id_chofer: string | null
        }
        Insert: {
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          id_buseta?: string | null
          id_chofer?: string | null
        }
        Update: {
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          id_buseta?: string | null
          id_chofer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_chofer_id_buseta_fkey"
            columns: ["id_buseta"]
            isOneToOne: false
            referencedRelation: "busetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_chofer_id_chofer_fkey"
            columns: ["id_chofer"]
            isOneToOne: false
            referencedRelation: "choferes"
            referencedColumns: ["id"]
          },
        ]
      }
      busetas: {
        Row: {
          capacidad: number
          id: string
          placa: string
        }
        Insert: {
          capacidad: number
          id?: string
          placa: string
        }
        Update: {
          capacidad?: number
          id?: string
          placa?: string
        }
        Relationships: []
      }
      choferes: {
        Row: {
          id: string
          id_buseta: string | null
          tipo_licencia: string | null
        }
        Insert: {
          id: string
          id_buseta?: string | null
          tipo_licencia?: string | null
        }
        Update: {
          id?: string
          id_buseta?: string | null
          tipo_licencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "choferes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estudiantes: {
        Row: {
          apellido: string
          created_at: string | null
          id: string
          id_padre: string | null
          id_ruta: string | null
          nombre: string
        }
        Insert: {
          apellido: string
          created_at?: string | null
          id?: string
          id_padre?: string | null
          id_ruta?: string | null
          nombre: string
        }
        Update: {
          apellido?: string
          created_at?: string | null
          id?: string
          id_padre?: string | null
          id_ruta?: string | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudiantes_id_padre_fkey"
            columns: ["id_padre"]
            isOneToOne: false
            referencedRelation: "padres"
            referencedColumns: ["id"]
          },
        ]
      }
      padres: {
        Row: {
          id: string
          ref_domicilio: string | null
          tipo_representante: string | null
        }
        Insert: {
          id: string
          ref_domicilio?: string | null
          tipo_representante?: string | null
        }
        Update: {
          id?: string
          ref_domicilio?: string | null
          tipo_representante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "padres_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paradas: {
        Row: {
          direccion: string | null
          hora_aprox: string | null
          id: string
          id_ruta: string | null
          latitud: number
          longitud: number
          nombre: string | null
          orden: number | null
        }
        Insert: {
          direccion?: string | null
          hora_aprox?: string | null
          id?: string
          id_ruta?: string | null
          latitud: number
          longitud: number
          nombre?: string | null
          orden?: number | null
        }
        Update: {
          direccion?: string | null
          hora_aprox?: string | null
          id?: string
          id_ruta?: string | null
          latitud?: number
          longitud?: number
          nombre?: string | null
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paradas_id_ruta_fkey"
            columns: ["id_ruta"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido: string
          correo: string
          created_at: string | null
          id: string
          nombre: string
          rol: string
          telefono: string | null
        }
        Insert: {
          apellido: string
          correo: string
          created_at?: string | null
          id: string
          nombre: string
          rol: string
          telefono?: string | null
        }
        Update: {
          apellido?: string
          correo?: string
          created_at?: string | null
          id?: string
          nombre?: string
          rol?: string
          telefono?: string | null
        }
        Relationships: []
      }
      rutas: {
        Row: {
          estado: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          nombre: string
        }
        Insert: {
          estado?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          nombre: string
        }
        Update: {
          estado?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      rutas_buseta: {
        Row: {
          id_buseta: string
          id_ruta: string
        }
        Insert: {
          id_buseta: string
          id_ruta: string
        }
        Update: {
          id_buseta?: string
          id_ruta?: string
        }
        Relationships: [
          {
            foreignKeyName: "rutas_buseta_id_buseta_fkey"
            columns: ["id_buseta"]
            isOneToOne: false
            referencedRelation: "busetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rutas_buseta_id_ruta_fkey"
            columns: ["id_ruta"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role: "admin" | "padre" | "chofer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "padre", "chofer"],
    },
  },
} as const

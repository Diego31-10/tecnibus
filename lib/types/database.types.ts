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
      asignaciones_ruta: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          dias_semana: string[] | null
          hora_fin: string
          hora_inicio: string
          id: string
          id_chofer: string
          id_ruta: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dias_semana?: string[] | null
          hora_fin: string
          hora_inicio: string
          id?: string
          id_chofer: string
          id_ruta: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dias_semana?: string[] | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          id_chofer?: string
          id_ruta?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_ruta_id_chofer_fkey"
            columns: ["id_chofer"]
            isOneToOne: false
            referencedRelation: "choferes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_ruta_id_ruta_fkey"
            columns: ["id_ruta"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          created_at: string | null
          fecha_hora: string
          id: string
          id_asignacion: string | null
          id_chofer: string
          id_estudiante: string
          latitud: number | null
          longitud: number | null
          notas: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          fecha_hora?: string
          id?: string
          id_asignacion?: string | null
          id_chofer: string
          id_estudiante: string
          latitud?: number | null
          longitud?: number | null
          notas?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          fecha_hora?: string
          id?: string
          id_asignacion?: string | null
          id_chofer?: string
          id_estudiante?: string
          latitud?: number | null
          longitud?: number | null
          notas?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_id_asignacion_fkey"
            columns: ["id_asignacion"]
            isOneToOne: false
            referencedRelation: "asignaciones_ruta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_id_chofer_fkey"
            columns: ["id_chofer"]
            isOneToOne: false
            referencedRelation: "choferes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_id_estudiante_fkey"
            columns: ["id_estudiante"]
            isOneToOne: false
            referencedRelation: "estudiantes"
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
          id_parada: string | null
          nombre: string
        }
        Insert: {
          apellido: string
          created_at?: string | null
          id?: string
          id_padre?: string | null
          id_parada?: string | null
          nombre: string
        }
        Update: {
          apellido?: string
          created_at?: string | null
          id?: string
          id_padre?: string | null
          id_parada?: string | null
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
          {
            foreignKeyName: "estudiantes_id_parada_fkey"
            columns: ["id_parada"]
            isOneToOne: false
            referencedRelation: "paradas"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_hora_recorrido: { Args: { p_id_asignacion: string }; Returns: boolean }
      esta_en_buseta: { Args: { p_id_estudiante: string }; Returns: boolean }
      get_recorridos_chofer_hoy: {
        Args: { p_id_chofer: string }
        Returns: {
          descripcion: string
          estado_ruta: string
          hora_fin: string
          hora_inicio: string
          id: string
          id_ruta: string
          nombre_ruta: string
        }[]
      }
      get_ultima_asistencia_hoy: {
        Args: { p_id_estudiante: string }
        Returns: {
          fecha_hora: string
          id: string
          tipo: string
        }[]
      }
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

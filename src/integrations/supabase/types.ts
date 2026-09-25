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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          abstained: boolean
          analysis_ref: string
          case_id: string
          classification: Json
          confidence: number | null
          confidence_label: string | null
          created_at: string
          evidence: Json
          explanation: Json
          id: string
          language: string
          missing_information: Json
          review: Json | null
          routes: Json
          status: string
          updated_at: string
        }
        Insert: {
          abstained?: boolean
          analysis_ref: string
          case_id: string
          classification?: Json
          confidence?: number | null
          confidence_label?: string | null
          created_at?: string
          evidence?: Json
          explanation?: Json
          id?: string
          language?: string
          missing_information?: Json
          review?: Json | null
          routes?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          abstained?: boolean
          analysis_ref?: string
          case_id?: string
          classification?: Json
          confidence?: number | null
          confidence_label?: string | null
          created_at?: string
          evidence?: Json
          explanation?: Json
          id?: string
          language?: string
          missing_information?: Json
          review?: Json | null
          routes?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          analysis_id: string | null
          case_id: string | null
          created_at: string
          detail: Json
          event_type: string
          id: string
        }
        Insert: {
          analysis_id?: string | null
          case_id?: string | null
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
        }
        Update: {
          analysis_id?: string | null
          case_id?: string | null
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_ref: string
          created_at: string
          id: string
          language: string
          product: Json
          reviewer: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          case_ref: string
          created_at?: string
          id?: string
          language?: string
          product: Json
          reviewer?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          case_ref?: string
          created_at?: string
          id?: string
          language?: string
          product?: Json
          reviewer?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          analysis_id: string
          created_at: string
          description: string
          due_date: string | null
          evidence_id: string | null
          id: string
          notes: string | null
          owner: string | null
          position: number
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          description: string
          due_date?: string | null
          evidence_id?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          position?: number
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          evidence_id?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          position?: number
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_hash: string | null
          document_status: string
          effective_date: string | null
          id: string
          language: string
          retrieved_at: string
          source_id: string
          title: string
          version: string
        }
        Insert: {
          created_at?: string
          document_hash?: string | null
          document_status?: string
          effective_date?: string | null
          id: string
          language?: string
          retrieved_at?: string
          source_id: string
          title: string
          version: string
        }
        Update: {
          created_at?: string
          document_hash?: string | null
          document_status?: string
          effective_date?: string | null
          id?: string
          language?: string
          retrieved_at?: string
          source_id?: string
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_chunks: {
        Row: {
          authority_level: number
          created_at: string
          document_id: string
          evidence_quality: string
          effective_date: string | null
          embedding: string | null
          id: string
          jurisdiction: string
          language: string
          page: string | null
          search: unknown
          section: string
          source_id: string
          source_type: string
          tags: string[]
          text: string
          topic: string
          verification_status: string
          market_scope: string[]
          version: string
        }
        Insert: {
          authority_level?: number
          created_at?: string
          document_id: string
          evidence_quality?: string
          effective_date?: string | null
          embedding?: string | null
          id: string
          jurisdiction: string
          language?: string
          page?: string | null
          search?: unknown
          section: string
          source_id: string
          source_type?: string
          tags?: string[]
          text: string
          topic: string
          verification_status?: string
          market_scope?: string[]
          version: string
        }
        Update: {
          authority_level?: number
          created_at?: string
          document_id?: string
          evidence_quality?: string
          effective_date?: string | null
          embedding?: string | null
          id?: string
          jurisdiction?: string
          language?: string
          page?: string | null
          search?: unknown
          section?: string
          source_id?: string
          source_type?: string
          tags?: string[]
          text?: string
          topic?: string
          verification_status?: string
          market_scope?: string[]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          action: string
          analysis_id: string
          created_at: string
          id: string
          level: string
          packet: Json
          reason: string
          requested_by: string | null
          status: string
        }
        Insert: {
          action: string
          analysis_id: string
          created_at?: string
          id?: string
          level?: string
          packet?: Json
          reason: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          action?: string
          analysis_id?: string
          created_at?: string
          id?: string
          level?: string
          packet?: Json
          reason?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          authority_label: string
          authority_level: number
          created_at: string
          document_type: string
          effective_date: string | null
          id: string
          jurisdiction: string
          name: string
          official_url: string | null
          publisher: string
          retrieved_at: string
          source_type: string
          topics: string[]
          verification_status: string
          version: string
        }
        Insert: {
          authority_label?: string
          authority_level?: number
          created_at?: string
          document_type: string
          effective_date?: string | null
          id: string
          jurisdiction: string
          name: string
          official_url?: string | null
          publisher: string
          retrieved_at?: string
          source_type?: string
          topics?: string[]
          verification_status?: string
          version: string
        }
        Update: {
          authority_label?: string
          authority_level?: number
          created_at?: string
          document_type?: string
          effective_date?: string | null
          id?: string
          jurisdiction?: string
          name?: string
          official_url?: string | null
          publisher?: string
          retrieved_at?: string
          source_type?: string
          topics?: string[]
          verification_status?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bm25_evidence: {
        Args: { match_count?: number; query_text: string }
        Returns: {
          id: string
          score: number
        }[]
      }
      match_evidence: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

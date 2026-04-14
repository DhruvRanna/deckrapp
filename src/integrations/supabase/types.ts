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
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          last_swipe_date: string | null
          niches: string[]
          notifications_enabled: boolean
          onboarding_completed: boolean
          plan: string
          platforms: string[]
          posting_frequency: string
          scripts_this_month: number
          streak: number
          swipes_today: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          last_swipe_date?: string | null
          niches?: string[]
          notifications_enabled?: boolean
          onboarding_completed?: boolean
          plan?: string
          platforms?: string[]
          posting_frequency?: string
          scripts_this_month?: number
          streak?: number
          swipes_today?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          last_swipe_date?: string | null
          niches?: string[]
          notifications_enabled?: boolean
          onboarding_completed?: boolean
          plan?: string
          platforms?: string[]
          posting_frequency?: string
          scripts_this_month?: number
          streak?: number
          swipes_today?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_ideas: {
        Row: {
          color: string
          competition: string
          created_at: string
          duration: string
          hook: string
          id: string
          insight: string
          platform: string
          scheduled_date: string | null
          tags: string[]
          title: string
          user_id: string
          viral_score: number
        }
        Insert: {
          color?: string
          competition?: string
          created_at?: string
          duration?: string
          hook: string
          id?: string
          insight?: string
          platform: string
          scheduled_date?: string | null
          tags?: string[]
          title: string
          user_id: string
          viral_score?: number
        }
        Update: {
          color?: string
          competition?: string
          created_at?: string
          duration?: string
          hook?: string
          id?: string
          insight?: string
          platform?: string
          scheduled_date?: string | null
          tags?: string[]
          title?: string
          user_id?: string
          viral_score?: number
        }
        Relationships: []
      }
      scripts: {
        Row: {
          body_text: string
          created_at: string
          cta_text: string
          delivery_tip: string
          hook_text: string
          id: string
          idea_id: string | null
          platform: string
          title: string
          user_id: string
        }
        Insert: {
          body_text: string
          created_at?: string
          cta_text?: string
          delivery_tip?: string
          hook_text: string
          id?: string
          idea_id?: string | null
          platform: string
          title: string
          user_id: string
        }
        Update: {
          body_text?: string
          created_at?: string
          cta_text?: string
          delivery_tip?: string
          hook_text?: string
          id?: string
          idea_id?: string | null
          platform?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "saved_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

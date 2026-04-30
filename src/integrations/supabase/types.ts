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
      assistant_settings: {
        Row: {
          display_name: string
          email_subject: string
          enabled: boolean
          escalation_enabled: boolean
          fallback_message: string
          faq_seed: string
          greeting: string
          id: number
          support_email: string
          updated_at: string
        }
        Insert: {
          display_name?: string
          email_subject?: string
          enabled?: boolean
          escalation_enabled?: boolean
          fallback_message?: string
          faq_seed?: string
          greeting?: string
          id?: number
          support_email?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          email_subject?: string
          enabled?: boolean
          escalation_enabled?: boolean
          fallback_message?: string
          faq_seed?: string
          greeting?: string
          id?: number
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_logo: string | null
          away_short: string
          away_team: string
          category: string | null
          city: string
          competition: string
          country: string
          created_at: string
          date: string
          featured: boolean
          home_logo: string | null
          home_short: string
          home_team: string
          id: string
          official_link: string | null
          priority: boolean
          sportmonks_id: number | null
          stadium: string
          starting_price: number | null
          ticket_release_date: string | null
          ticket_sources: Json
          ticket_status: string
          updated_at: string
        }
        Insert: {
          away_logo?: string | null
          away_short: string
          away_team: string
          category?: string | null
          city?: string
          competition: string
          country?: string
          created_at?: string
          date: string
          featured?: boolean
          home_logo?: string | null
          home_short: string
          home_team: string
          id: string
          official_link?: string | null
          priority?: boolean
          sportmonks_id?: number | null
          stadium?: string
          starting_price?: number | null
          ticket_release_date?: string | null
          ticket_sources?: Json
          ticket_status?: string
          updated_at?: string
        }
        Update: {
          away_logo?: string | null
          away_short?: string
          away_team?: string
          category?: string | null
          city?: string
          competition?: string
          country?: string
          created_at?: string
          date?: string
          featured?: boolean
          home_logo?: string | null
          home_short?: string
          home_team?: string
          id?: string
          official_link?: string | null
          priority?: boolean
          sportmonks_id?: number | null
          stadium?: string
          starting_price?: number | null
          ticket_release_date?: string | null
          ticket_sources?: Json
          ticket_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_matches: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          id: string
          match_id: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          match_id: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          match_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_escalations: {
        Row: {
          created_at: string
          current_page: string | null
          email_sent: boolean
          escalation_status: string
          id: string
          language: string | null
          related_match_id: string | null
          related_match_name: string | null
          user_id: string | null
          user_message: string
          user_type: string | null
        }
        Insert: {
          created_at?: string
          current_page?: string | null
          email_sent?: boolean
          escalation_status?: string
          id?: string
          language?: string | null
          related_match_id?: string | null
          related_match_name?: string | null
          user_id?: string | null
          user_message: string
          user_type?: string | null
        }
        Update: {
          created_at?: string
          current_page?: string | null
          email_sent?: boolean
          escalation_status?: string
          id?: string
          language?: string | null
          related_match_id?: string | null
          related_match_name?: string | null
          user_id?: string | null
          user_message?: string
          user_type?: string | null
        }
        Relationships: []
      }
      ticket_offers: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          id: string
          in_stock: boolean
          last_checked_at: string
          match_id: string
          price: number | null
          provider: string
          provider_logo: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          in_stock?: boolean
          last_checked_at?: string
          match_id: string
          price?: number | null
          provider: string
          provider_logo?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          in_stock?: boolean
          last_checked_at?: string
          match_id?: string
          price?: number | null
          provider?: string
          provider_logo?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_offers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          favorite_leagues: string[]
          favorite_teams: string[]
          id: string
          onboarding_completed: boolean
          onboarding_skipped_at: string | null
          updated_at: string
          user_id: string
          user_intent: string[]
        }
        Insert: {
          created_at?: string
          favorite_leagues?: string[]
          favorite_teams?: string[]
          id?: string
          onboarding_completed?: boolean
          onboarding_skipped_at?: string | null
          updated_at?: string
          user_id: string
          user_intent?: string[]
        }
        Update: {
          created_at?: string
          favorite_leagues?: string[]
          favorite_teams?: string[]
          id?: string
          onboarding_completed?: boolean
          onboarding_skipped_at?: string | null
          updated_at?: string
          user_id?: string
          user_intent?: string[]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

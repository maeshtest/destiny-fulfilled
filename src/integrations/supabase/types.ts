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
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      donation_goals: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          target_amount: number
          title: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          target_amount: number
          title: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          target_amount?: number
          title?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          email: string | null
          frequency: string
          id: string
          message: string | null
          name: string | null
          payment_method: string
          payment_provider: string
          phone: string | null
          screenshot_url: string | null
          show_info: boolean | null
          status: string
          transaction_code: string | null
          transaction_id: string | null
          verification_type: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          email?: string | null
          frequency?: string
          id?: string
          message?: string | null
          name?: string | null
          payment_method: string
          payment_provider?: string
          phone?: string | null
          screenshot_url?: string | null
          show_info?: boolean | null
          status?: string
          transaction_code?: string | null
          transaction_id?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          email?: string | null
          frequency?: string
          id?: string
          message?: string | null
          name?: string | null
          payment_method?: string
          payment_provider?: string
          phone?: string | null
          screenshot_url?: string | null
          show_info?: boolean | null
          status?: string
          transaction_code?: string | null
          transaction_id?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      kopokopo_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          donation_id: string | null
          gateway_event_id: string | null
          id: string
          k2_payment_id: string | null
          msisdn: string
          raw_callback: Json | null
          reference: string | null
          status: string
          till: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          donation_id?: string | null
          gateway_event_id?: string | null
          id?: string
          k2_payment_id?: string | null
          msisdn: string
          raw_callback?: Json | null
          reference?: string | null
          status?: string
          till?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          donation_id?: string | null
          gateway_event_id?: string | null
          id?: string
          k2_payment_id?: string | null
          msisdn?: string
          raw_callback?: Json | null
          reference?: string | null
          status?: string
          till?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pesaflux_transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string
          donation_id: string | null
          id: string
          merchant_request_id: string | null
          msisdn: string
          raw_callback: Json | null
          receipt: string | null
          reference: string | null
          response_code: string | null
          status: string
          transaction_request_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          donation_id?: string | null
          id?: string
          merchant_request_id?: string | null
          msisdn: string
          raw_callback?: Json | null
          receipt?: string | null
          reference?: string | null
          response_code?: string | null
          status?: string
          transaction_request_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          donation_id?: string | null
          id?: string
          merchant_request_id?: string | null
          msisdn?: string
          raw_callback?: Json | null
          receipt?: string | null
          reference?: string | null
          response_code?: string | null
          status?: string
          transaction_request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pesaflux_transactions_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          message_id: string | null
          phone: string
          raw_response: Json | null
          sender_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_id?: string | null
          phone: string
          raw_response?: Json | null
          sender_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_id?: string | null
          phone?: string
          raw_response?: Json | null
          sender_id?: string | null
          status?: string
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
      volunteers: {
        Row: {
          constituency: string | null
          county: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          constituency?: string | null
          county?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          constituency?: string | null
          county?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          donation_id: string | null
          error: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          provider: string
          signature_valid: boolean | null
        }
        Insert: {
          created_at?: string
          donation_id?: string | null
          error?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          provider: string
          signature_valid?: boolean | null
        }
        Update: {
          created_at?: string
          donation_id?: string | null
          error?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          provider?: string
          signature_valid?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "editor"
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
      app_role: ["admin", "moderator", "editor"],
    },
  },
} as const

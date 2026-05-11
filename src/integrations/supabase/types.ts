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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          image: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          image?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          image?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          created_at: string
          id: string
          last_order: string | null
          name: string
          order_count: number
          phone: string
          preference: string | null
          total_spent: number
          user_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          last_order?: string | null
          name: string
          order_count?: number
          phone?: string
          preference?: string | null
          total_spent?: number
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          last_order?: string | null
          name?: string
          order_count?: number
          phone?: string
          preference?: string | null
          total_spent?: number
          user_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_document: string
          client_email: string | null
          client_name: string
          created_at: string
          description: string
          id: string
          invoice_number: string
          invoice_type: string
          issued_at: string
          status: string
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          client_document: string
          client_email?: string | null
          client_name: string
          created_at?: string
          description: string
          id?: string
          invoice_number: string
          invoice_type?: string
          issued_at?: string
          status?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_document?: string
          client_email?: string | null
          client_name?: string
          created_at?: string
          description?: string
          id?: string
          invoice_number?: string
          invoice_type?: string
          issued_at?: string
          status?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          addons: Json
          created_at: string
          id: string
          notes: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          addons?: Json
          created_at?: string
          id?: string
          notes?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          addons?: Json
          created_at?: string
          id?: string
          notes?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          change_for: number | null
          channel: string
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_status: string | null
          delivery_type: string
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          notes: string
          number: number
          payment: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string
          change_for?: number | null
          channel?: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string
          delivery_status?: string | null
          delivery_type?: string
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          notes?: string
          number: number
          payment?: string
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          change_for?: number | null
          channel?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_status?: string | null
          delivery_type?: string
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          notes?: string
          number?: number
          payment?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          addons: Json
          badge: string | null
          category_id: string | null
          created_at: string
          description: string
          featured: boolean
          id: string
          image: string
          name: string
          prep_time: number | null
          price: number
          user_id: string
        }
        Insert: {
          active?: boolean
          addons?: Json
          badge?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image?: string
          name: string
          prep_time?: number | null
          price?: number
          user_id: string
        }
        Update: {
          active?: boolean
          addons?: Json
          badge?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image?: string
          name?: string
          prep_time?: number | null
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          auto_accept: boolean
          auto_print_delivery: boolean
          auto_print_kitchen: boolean
          auto_print_on_selection: boolean | null
          close_time: string
          created_at: string
          delivery_fee: number
          id: string
          min_order: number
          open_time: string
          prep_time: number
          primary_color: string
          print_width: string | null
          sound_enabled: boolean
          store_name: string
          updated_at: string
          user_id: string
          whatsapp_msg: string
          whatsapp_number: string
        }
        Insert: {
          auto_accept?: boolean
          auto_print_delivery?: boolean
          auto_print_kitchen?: boolean
          auto_print_on_selection?: boolean | null
          close_time?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          min_order?: number
          open_time?: string
          prep_time?: number
          primary_color?: string
          print_width?: string | null
          sound_enabled?: boolean
          store_name?: string
          updated_at?: string
          user_id: string
          whatsapp_msg?: string
          whatsapp_number?: string
        }
        Update: {
          auto_accept?: boolean
          auto_print_delivery?: boolean
          auto_print_kitchen?: boolean
          auto_print_on_selection?: boolean | null
          close_time?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          min_order?: number
          open_time?: string
          prep_time?: number
          primary_color?: string
          print_width?: string | null
          sound_enabled?: boolean
          store_name?: string
          updated_at?: string
          user_id?: string
          whatsapp_msg?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          email: string
          id: string
          monthly_revenue: number
          name: string
          notes: string
          orders_count: number
          owner_id: string | null
          phone: string
          plan: string
          products_count: number
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          monthly_revenue?: number
          name: string
          notes?: string
          orders_count?: number
          owner_id?: string | null
          phone?: string
          plan?: string
          products_count?: number
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          monthly_revenue?: number
          name?: string
          notes?: string
          orders_count?: number
          owner_id?: string | null
          phone?: string
          plan?: string
          products_count?: number
          slug?: string | null
          status?: string
          updated_at?: string
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
      whatsapp_messages: {
        Row: {
          created_at: string
          direction: string
          from_phone: string
          id: string
          message: string
          order_id: string | null
          status: string
          to_phone: string
          user_id: string
          wa_message_id: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          from_phone?: string
          id?: string
          message?: string
          order_id?: string | null
          status?: string
          to_phone?: string
          user_id: string
          wa_message_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          from_phone?: string
          id?: string
          message?: string
          order_id?: string | null
          status?: string
          to_phone?: string
          user_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: { _action_type: string; _details: Json; _target_id: string }
        Returns: undefined
      }
      restore_demo_data: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "user"
        | "cozinha"
        | "pedidos"
        | "entrega"
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
      app_role: [
        "super_admin",
        "admin",
        "user",
        "cozinha",
        "pedidos",
        "entrega",
      ],
    },
  },
} as const

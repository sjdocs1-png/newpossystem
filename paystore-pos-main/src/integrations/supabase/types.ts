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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advance_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          paid_at: string | null
          reason: string | null
          staff_id: string
          staff_name: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          reason?: string | null
          staff_id: string
          staff_name: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          reason?: string | null
          staff_id?: string
          staff_name?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advance_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_counters: {
        Row: {
          bill_counter: number
          counter_date: string
          id: string
          kot_counter: number
          store_id: string
          updated_at: string
        }
        Insert: {
          bill_counter?: number
          counter_date?: string
          id?: string
          kot_counter?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          bill_counter?: number
          counter_date?: string
          id?: string
          kot_counter?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_counters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_counters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          name: string | null
          store_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          id?: string
          name?: string | null
          store_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          id?: string
          name?: string | null
          store_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          message_type: string
          sender_id: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string
          sender_id: string
          sender_name: string
          sender_role: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          bill_number: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          due_amount: number
          id: string
          notes: string | null
          order_id: string | null
          paid_amount: number
          payment_status: string
          store_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_number?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          due_amount?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_amount?: number
          payment_status?: string
          store_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          bill_number?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          due_amount?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_amount?: number
          payment_status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_payments: {
        Row: {
          amount: number
          created_at: string
          credit_id: string
          id: string
          notes: string | null
          payment_method: string
          received_by: string | null
          store_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          credit_id: string
          id?: string
          notes?: string | null
          payment_method?: string
          received_by?: string | null
          store_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_id?: string
          id?: string
          notes?: string | null
          payment_method?: string
          received_by?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_payments_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          business_name: string
          business_type: string
          created_at: string
          enabled_addons: string[]
          id: string
          is_active: boolean | null
          max_stores: number
          outlet_limit: number
          owner_email: string
          owner_name: string
          phone: string | null
          ref_code: string | null
          staff_limit: number
          subscription_end: string | null
          subscription_plan: string | null
          subscription_start: string | null
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          business_type?: string
          created_at?: string
          enabled_addons?: string[]
          id?: string
          is_active?: boolean | null
          max_stores?: number
          outlet_limit?: number
          owner_email: string
          owner_name: string
          phone?: string | null
          ref_code?: string | null
          staff_limit?: number
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          business_type?: string
          created_at?: string
          enabled_addons?: string[]
          id?: string
          is_active?: boolean | null
          max_stores?: number
          outlet_limit?: number
          owner_email?: string
          owner_name?: string
          phone?: string | null
          ref_code?: string | null
          staff_limit?: number
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          delivered_at: string | null
          delivery_boy_name: string
          delivery_boy_phone: string | null
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          delivered_at?: string | null
          delivery_boy_name: string
          delivery_boy_phone?: string | null
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          delivered_at?: string | null
          delivery_boy_name?: string
          delivery_boy_phone?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          paid_by: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id: string
          paid_by?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          paid_by?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      held_bills: {
        Row: {
          created_at: string
          customer_name: string | null
          held_at: string
          id: string
          items: Json
          store_id: string
          table_number: number | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          held_at?: string
          id: string
          items?: Json
          store_id: string
          table_number?: number | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          held_at?: string
          id?: string
          items?: Json
          store_id?: string
          table_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "held_bills_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "held_bills_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_components: {
        Row: {
          child_inventory_id: string
          created_at: string
          id: string
          parent_inventory_id: string
          quantity_required: number
          unit: string
        }
        Insert: {
          child_inventory_id: string
          created_at?: string
          id?: string
          parent_inventory_id: string
          quantity_required?: number
          unit?: string
        }
        Update: {
          child_inventory_id?: string
          created_at?: string
          id?: string
          parent_inventory_id?: string
          quantity_required?: number
          unit?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          barcode: string | null
          batch_number: string | null
          cost_per_unit: number
          cost_unit: string | null
          created_at: string
          expiry_date: string | null
          gst_percentage: number
          hsn_code: string | null
          id: string
          min_stock: number
          name: string
          production_yield: number | null
          production_yield_unit: string | null
          quantity: number
          store_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          batch_number?: string | null
          cost_per_unit?: number
          cost_unit?: string | null
          created_at?: string
          expiry_date?: string | null
          gst_percentage?: number
          hsn_code?: string | null
          id: string
          min_stock?: number
          name: string
          production_yield?: number | null
          production_yield_unit?: string | null
          quantity?: number
          store_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          batch_number?: string | null
          cost_per_unit?: number
          cost_unit?: string | null
          created_at?: string
          expiry_date?: string | null
          gst_percentage?: number
          hsn_code?: string | null
          id?: string
          min_stock?: number
          name?: string
          production_yield?: number | null
          production_yield_unit?: string | null
          quantity?: number
          store_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          staff_id?: string
          staff_name?: string
          start_date?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_time: string | null
          attempt_type: string
          id: string
          identifier: string
          ip_address: string | null
          success: boolean | null
        }
        Insert: {
          attempt_time?: string | null
          attempt_type: string
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean | null
        }
        Update: {
          attempt_time?: string | null
          attempt_type?: string
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      menu_item_ingredients: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          menu_item_id: string
          quantity_required: number
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          menu_item_id: string
          quantity_required?: number
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          menu_item_id?: string
          quantity_required?: number
          unit?: string
        }
        Relationships: []
      }
      menu_item_variations: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          menu_item_id: string
          name: string
          price: number
          sku: string | null
          sort_order: number
          stock: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id: string
          name: string
          price?: number
          sku?: string | null
          sort_order?: number
          stock?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id?: string
          name?: string
          price?: number
          sku?: string | null
          sort_order?: number
          stock?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variations_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          barcode: string | null
          category: string
          created_at: string
          description: string | null
          gramage_per_unit: number | null
          id: string
          image_url: string | null
          is_available: boolean
          linked_inventory_id: string | null
          name: string
          name_hindi: string | null
          preparation_time: number | null
          price: number
          sku: string | null
          stock: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string
          created_at?: string
          description?: string | null
          gramage_per_unit?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          linked_inventory_id?: string | null
          name: string
          name_hindi?: string | null
          preparation_time?: number | null
          price?: number
          sku?: string | null
          stock?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string
          created_at?: string
          description?: string | null
          gramage_per_unit?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          linked_inventory_id?: string | null
          name?: string
          name_hindi?: string | null
          preparation_time?: number | null
          price?: number
          sku?: string | null
          stock?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      online_orders: {
        Row: {
          commission_amount: number
          commission_percentage: number
          created_at: string
          delivery_charge: number
          id: string
          items: Json
          net_receivable: number
          platform: string
          platform_order_id: string
          raw_payload: Json | null
          status: string
          store_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          delivery_charge?: number
          id?: string
          items?: Json
          net_receivable?: number
          platform?: string
          platform_order_id: string
          raw_payload?: Json | null
          status?: string
          store_id: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          delivery_charge?: number
          id?: string
          items?: Json
          net_receivable?: number
          platform?: string
          platform_order_id?: string
          raw_payload?: Json | null
          status?: string
          store_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          bill_number: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          container_charge: number
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_charge: number
          discount: number
          id: string
          items: Json
          order_type: string
          payment_details: Json | null
          payment_method: string
          status: string
          store_id: string
          subtotal: number
          table_number: string | null
          tax: number
          tip: number
          total: number
          updated_at: string
        }
        Insert: {
          bill_number: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          container_charge?: number
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_charge?: number
          discount?: number
          id?: string
          items?: Json
          order_type?: string
          payment_details?: Json | null
          payment_method?: string
          status?: string
          store_id: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          tip?: number
          total?: number
          updated_at?: string
        }
        Update: {
          bill_number?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          container_charge?: number
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_charge?: number
          discount?: number
          id?: string
          items?: Json
          order_type?: string
          payment_details?: Json | null
          payment_method?: string
          status?: string
          store_id?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          tip?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_disputes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          payment_id: string
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          payment_id: string
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          payment_id?: string
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_disputes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settlements: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          net_amount: number
          payment_count: number
          settlement_date: string | null
          settlement_id: string | null
          status: string
          store_id: string
          tax: number
          updated_at: string
          utr: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          payment_count?: number
          settlement_date?: string | null
          settlement_id?: string | null
          status?: string
          store_id: string
          tax?: number
          updated_at?: string
          utr?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          payment_count?: number
          settlement_date?: string | null
          settlement_id?: string | null
          status?: string
          store_id?: string
          tax?: number
          updated_at?: string
          utr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_settlements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_settlements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_date: string
          created_at: string
          currency: string
          error_message: string | null
          expires_at: string | null
          id: string
          internal_order_id: string
          payment_mode: string | null
          payment_provider: string
          provider_data: Json | null
          provider_order_id: string | null
          provider_payment_id: string | null
          status: string
          store_id: string
          updated_at: string
          webhook_verified: boolean
        }
        Insert: {
          amount?: number
          business_date?: string
          created_at?: string
          currency?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          internal_order_id: string
          payment_mode?: string | null
          payment_provider?: string
          provider_data?: Json | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          status?: string
          store_id: string
          updated_at?: string
          webhook_verified?: boolean
        }
        Update: {
          amount?: number
          business_date?: string
          created_at?: string
          currency?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          internal_order_id?: string
          payment_mode?: string | null
          payment_provider?: string
          provider_data?: Json | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          webhook_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_recommendations: {
        Row: {
          analysis_period_end: string | null
          analysis_period_start: string | null
          avg_daily_sales: number
          category: string | null
          created_at: string
          current_stock: number
          days_until_stockout: number | null
          generated_at: string
          id: string
          inventory_item_id: string | null
          min_stock: number
          predicted_demand_7d: number
          product_name: string
          reason: string
          status: string
          store_id: string
          suggested_quantity: number
          trend: string | null
          updated_at: string
        }
        Insert: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          avg_daily_sales?: number
          category?: string | null
          created_at?: string
          current_stock?: number
          days_until_stockout?: number | null
          generated_at?: string
          id?: string
          inventory_item_id?: string | null
          min_stock?: number
          predicted_demand_7d?: number
          product_name: string
          reason?: string
          status?: string
          store_id: string
          suggested_quantity?: number
          trend?: string | null
          updated_at?: string
        }
        Update: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          avg_daily_sales?: number
          category?: string | null
          created_at?: string
          current_stock?: number
          days_until_stockout?: number | null
          generated_at?: string
          id?: string
          inventory_item_id?: string | null
          min_stock?: number
          predicted_demand_7d?: number
          product_name?: string
          reason?: string
          status?: string
          store_id?: string
          suggested_quantity?: number
          trend?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_recommendations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_recommendations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_orders: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_instructions: string | null
          estimated_delivery_time: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          platform_commission: number | null
          platform_customer_id: string | null
          platform_order_id: string | null
          platform_type: string | null
          status: string
          store_id: string
          subtotal: number
          table_number: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_instructions?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          platform_commission?: number | null
          platform_customer_id?: string | null
          platform_order_id?: string | null
          platform_type?: string | null
          status?: string
          store_id: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_instructions?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          platform_commission?: number | null
          platform_customer_id?: string | null
          platform_order_id?: string | null
          platform_type?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          check_in_distance: number | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_time: string
          check_out_distance: number | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_time: string | null
          created_at: string
          id: string
          status: string
          store_id: string
          user_id: string
          verification_method: string | null
        }
        Insert: {
          check_in_distance?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string
          check_out_distance?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          status?: string
          store_id: string
          user_id: string
          verification_method?: string | null
        }
        Update: {
          check_in_distance?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string
          check_out_distance?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          status?: string
          store_id?: string
          user_id?: string
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          message: string | null
          staff_id: string | null
          store_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          staff_id?: string | null
          store_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          staff_id?: string | null
          store_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          shift: string
          staff_id: string
          staff_name: string
          start_time: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string
          id?: string
          notes?: string | null
          shift?: string
          staff_id: string
          staff_name: string
          start_time?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          shift?: string
          staff_id?: string
          staff_name?: string
          start_time?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          category_id: string
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          name_hindi: string | null
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          name_hindi?: string | null
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          name_hindi?: string | null
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          business_type: string
          country: string
          created_at: string
          currency_code: string
          customer_id: string
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          password: string | null
          phone: string | null
          ref_code: string | null
          store_code: string | null
          store_name: string
          tax_percentage: number
          tax_type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_type?: string
          country?: string
          created_at?: string
          currency_code?: string
          customer_id: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          password?: string | null
          phone?: string | null
          ref_code?: string | null
          store_code?: string | null
          store_name: string
          tax_percentage?: number
          tax_type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_type?: string
          country?: string
          created_at?: string
          currency_code?: string
          customer_id?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          password?: string | null
          phone?: string | null
          ref_code?: string | null
          store_code?: string | null
          store_name?: string
          tax_percentage?: number
          tax_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plan_features: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_enabled: boolean
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_visible: boolean
          monthly_price: number
          name: string
          sort_order: number
          tier_key: string
          updated_at: string
          yearly_price: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_visible?: boolean
          monthly_price?: number
          name: string
          sort_order?: number
          tier_key: string
          updated_at?: string
          yearly_price?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_visible?: boolean
          monthly_price?: number
          name?: string
          sort_order?: number
          tier_key?: string
          updated_at?: string
          yearly_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subscription_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          customer_id: string | null
          face_photo_url: string | null
          fingerprint_enabled: boolean | null
          id: string
          is_active: boolean | null
          pin: string | null
          ref_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          salary: number | null
          staff_code: string | null
          store_id: string | null
          user_id: string
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          face_photo_url?: string | null
          fingerprint_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          pin?: string | null
          ref_code?: string | null
          role: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          staff_code?: string | null
          store_id?: string | null
          user_id: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          face_photo_url?: string | null
          fingerprint_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          pin?: string | null
          ref_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          staff_code?: string | null
          store_id?: string | null
          user_id?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stores_safe: {
        Row: {
          address: string | null
          business_type: string | null
          country: string | null
          created_at: string | null
          currency_code: string | null
          customer_id: string | null
          id: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          store_code: string | null
          store_name: string | null
          tax_percentage: number | null
          tax_type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_id?: string | null
          id?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          store_code?: string | null
          store_name?: string | null
          tax_percentage?: number | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_id?: string | null
          id?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          store_code?: string | null
          store_name?: string | null
          tax_percentage?: number | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_verification_logs: {
        Row: {
          id: string
          task_id: string | null
          submission_id: string | null
          verification_type: string
          success: boolean
          confidence: number
          reason: string | null
          raw_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          submission_id?: string | null
          verification_type: string
          success?: boolean
          confidence?: number
          reason?: string | null
          raw_response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          submission_id?: string | null
          verification_type?: string
          success?: boolean
          confidence?: number
          reason?: string | null
          raw_response?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      hygiene_checks: {
        Row: {
          id: string
          task_id: string | null
          submission_id: string | null
          staff_id: string
          store_id: string
          check_type: string
          result: Json | null
          passed: boolean
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          submission_id?: string | null
          staff_id: string
          store_id: string
          check_type: string
          result?: Json | null
          passed?: boolean
          confidence?: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          submission_id?: string | null
          staff_id?: string
          store_id?: string
          check_type?: string
          result?: Json | null
          passed?: boolean
          confidence?: number
          created_at?: string
        }
        Relationships: []
      }
      cleaning_audits: {
        Row: {
          id: string
          task_id: string | null
          submission_id: string | null
          staff_id: string
          store_id: string
          area: string
          audit_result: Json | null
          passed: boolean
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          submission_id?: string | null
          staff_id: string
          store_id: string
          area: string
          audit_result?: Json | null
          passed?: boolean
          confidence?: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          submission_id?: string | null
          staff_id?: string
          store_id?: string
          area?: string
          audit_result?: Json | null
          passed?: boolean
          confidence?: number
          created_at?: string
        }
        Relationships: []
      }
      staff_scores: {
        Row: {
          id: string
          staff_id: string
          store_id: string
          customer_id: string
          score_date: string
          daily_score: number
          weekly_score: number
          monthly_score: number
          total_score: number
          completion_rate: number
          rejection_rate: number
          average_response_time: number
          hygiene_score: number
          cleaning_score: number
          tasks_completed: number
          tasks_rejected: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          store_id: string
          customer_id: string
          score_date: string
          daily_score?: number
          weekly_score?: number
          monthly_score?: number
          total_score?: number
          completion_rate?: number
          rejection_rate?: number
          average_response_time?: number
          hygiene_score?: number
          cleaning_score?: number
          tasks_completed?: number
          tasks_rejected?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          store_id?: string
          customer_id?: string
          score_date?: string
          daily_score?: number
          weekly_score?: number
          monthly_score?: number
          total_score?: number
          completion_rate?: number
          rejection_rate?: number
          average_response_time?: number
          hygiene_score?: number
          cleaning_score?: number
          tasks_completed?: number
          tasks_rejected?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_rankings: {
        Row: {
          id: string
          period: string
          store_id: string
          staff_id: string
          category: string
          rank: number
          score: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          period: string
          store_id: string
          staff_id: string
          category: string
          rank: number
          score: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          period?: string
          store_id?: string
          staff_id?: string
          category?: string
          rank?: number
          score?: number
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      recurring_tasks: {
        Row: {
          id: string
          assignment_id: string | null
          template_id: string
          store_id: string
          customer_id: string
          schedule: Json | null
          next_run: string | null
          is_active: boolean
          assigned_staff: Json | null
          assigned_departments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id?: string | null
          template_id: string
          store_id: string
          customer_id: string
          schedule?: Json | null
          next_run?: string | null
          is_active?: boolean
          assigned_staff?: Json | null
          assigned_departments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string | null
          template_id?: string
          store_id?: string
          customer_id?: string
          schedule?: Json | null
          next_run?: string | null
          is_active?: boolean
          assigned_staff?: Json | null
          assigned_departments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_max_attempts?: number
          p_type: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      delete_store_cascade: { Args: { p_store_id: string }; Returns: undefined }
      generate_8_digit_code: { Args: never; Returns: string }
      get_customer_analytics: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_customer_enabled_features: {
        Args: { _customer_id: string }
        Returns: {
          feature_key: string
        }[]
      }
      get_customer_plan_id: { Args: { _customer_id: string }; Returns: string }
      get_customer_retention: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_delivery_performance: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_discount_report: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_hourly_sales: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_invoice_report: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_item_performance: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_kitchen_performance: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_loss_control_report: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_multi_outlet_report: {
        Args: {
          p_customer_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
      get_order_behavior: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_payment_breakdown: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_pl_report: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_sales_trends: {
        Args: {
          p_end_date: string
          p_granularity?: string
          p_start_date: string
          p_store_id: string
        }
        Returns: Json
      }
      get_store_plan_id: { Args: { _store_id: string }; Returns: string }
      get_table_performance: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_target_achievement: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_tax_report: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_user_conversation_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_user_customer_id: { Args: { user_uuid: string }; Returns: string }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_store_id: { Args: { user_uuid: string }; Returns: string }
      has_customer_feature: {
        Args: { _customer_id: string; _feature_key: string }
        Returns: boolean
      }
      has_store_feature: {
        Args: { _feature_key: string; _store_id: string }
        Returns: boolean
      }
      increment_bill_counter: {
        Args: { p_date?: string; p_store_id: string }
        Returns: number
      }
      increment_kot_counter: {
        Args: { p_date?: string; p_store_id: string }
        Returns: number
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_conversation_member: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      is_owner: { Args: { user_uuid: string }; Returns: boolean }
      log_login_attempt: {
        Args: {
          p_identifier: string
          p_ip?: string
          p_success: boolean
          p_type: string
        }
        Returns: undefined
      }
      run_scheduled_inventory_analysis: { Args: never; Returns: undefined }
      secure_store_login: {
        Args: { p_password: string; p_store_code: string }
        Returns: {
          customer_id: string
          store_address: string
          store_id: string
          store_name: string
          store_phone: string
        }[]
      }
      validate_store_login: {
        Args: { p_password: string; p_store_code: string }
        Returns: {
          customer_id: string
          store_address: string
          store_id: string
          store_name: string
          store_phone: string
        }[]
      }
      verify_staff_pin: {
        Args: { p_pin: string; p_staff_code: string }
        Returns: {
          customer_id: string
          role: string
          store_id: string
          user_id: string
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "owner" | "store_manager" | "staff"
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
      user_role: ["admin", "owner", "store_manager", "staff"],
    },
  },
} as const


// AUTO-GENERATED — do not edit manually.
// Run: supabase gen types typescript --project-id <id> > packages/db-types/src/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: Database['public']['Enums']['user_role']
          team_id: string | null
          can_see_prices: boolean
          lang: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      teams: {
        Row: {
          id: string
          name: string
          code: string
          supervisor_id: string | null
          project_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      projects: {
        Row: {
          id: string
          code: string
          name_ar: string
          name_en: string | null
          client: string
          contractor: string
          contract_ref: string | null
          po_number: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      sites: {
        Row: {
          id: string
          project_id: string
          code: string
          name_ar: string
          location: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sites']['Insert']>
      }
      cabinets: {
        Row: {
          id: string
          site_id: string
          code: string
          type: string
          capacity: number | null
          location: string | null
          installed_at: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cabinets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cabinets']['Insert']>
      }
      boxes: {
        Row: {
          id: string
          cabinet_id: string
          code: string
          type: string
          fiber_count: number | null
          location: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['boxes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['boxes']['Insert']>
      }
      contract_groups: {
        Row: {
          id: string
          project_id: string
          code: string
          name_ar: string
          name_en: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['contract_groups']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['contract_groups']['Insert']>
      }
      contract_items: {
        Row: {
          id: string
          group_id: string
          project_id: string
          code: string
          description_ar: string
          description_en: string | null
          unit: string
          task_type: Database['public']['Enums']['task_type']
          contract_qty: number
          unit_price: number | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['contract_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['contract_items']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          site_id: string
          contract_item_id: string
          team_id: string
          technician_id: string
          task_date: string
          task_type: Database['public']['Enums']['task_type']
          status: Database['public']['Enums']['task_status']
          from_cabinet_id: string | null
          to_box_id: string | null
          route_length_m: number | null
          route_geometry: string | null
          node_cabinet_id: string | null
          node_box_id: string | null
          quantity: number | null
          unit_price: number | null
          line_total: number | null
          gps_location: string | null
          gps_accuracy_m: number | null
          notes: string | null
          invoice_id: string | null
          rejected_reason: string | null
          submitted_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          client_id: string | null
          synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'line_total' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      task_photos: {
        Row: {
          id: string
          task_id: string
          storage_path: string
          public_url: string
          gps_location: string | null
          gps_accuracy_m: number | null
          taken_at: string | null
          photo_order: number
          exif_data: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['task_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['task_photos']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          project_id: string
          site_id: string
          invoice_number: string
          invoice_date: string
          period_start: string
          period_end: string
          status: Database['public']['Enums']['invoice_status']
          subtotal: number
          retention_pct: number
          tax_pct: number
          retention_amt: number
          tax_amt: number
          net_payable: number
          po_number: string | null
          notes: string | null
          pdf_url: string | null
          excel_url: string | null
          created_by: string
          approved_by: string | null
          approved_at: string | null
          issued_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'retention_amt' | 'tax_amt' | 'net_payable' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      materials: {
        Row: {
          id: string
          project_id: string
          name_ar: string
          name_en: string | null
          unit: string
          contract_qty: number
          consumed_qty: number
          alert_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['materials']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['materials']['Insert']>
      }
      audit_log: {
        Row: {
          id: number
          table_name: string
          record_id: string
          operation: string
          old_data: Json | null
          new_data: Json | null
          performed_by: string | null
          performed_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'performed_at'>
        Update: never
      }
    }
    Views: {
      contract_items_safe: {
        Row: Database['public']['Tables']['contract_items']['Row']
      }
    }
    Functions: {
      get_dashboard_kpis: {
        Args: { p_project_id: string }
        Returns: {
          completion_pct: number
          microduct_m: number
          microduct_target_m: number
          boxes_installed: number
          boxes_total: number
          receivables_egp: number
          weekly_microduct_delta: number
          weekly_completion_delta: number
        }[]
      }
    }
    Enums: {
      user_role: 'admin' | 'project_manager' | 'field_supervisor' | 'field_technician' | 'finance'
      task_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'invoiced'
      task_type: 'route' | 'node'
      invoice_status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'paid'
    }
  }
}

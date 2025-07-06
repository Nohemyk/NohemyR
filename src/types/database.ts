export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'area_manager' | 'analyst' | 'consultant';
          area: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'area_manager' | 'analyst' | 'consultant';
          area?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'area_manager' | 'analyst' | 'consultant';
          area?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      indicators: {
        Row: {
          id: string;
          name: string;
          area: string;
          target: number;
          actual: number;
          measurement_date: string;
          responsible: string;
          status: 'achieved' | 'at_risk' | 'critical' | 'in_progress';
          observations: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          area: string;
          target: number;
          actual: number;
          measurement_date: string;
          responsible: string;
          status?: 'achieved' | 'at_risk' | 'critical' | 'in_progress';
          observations?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          area?: string;
          target?: number;
          actual?: number;
          measurement_date?: string;
          responsible?: string;
          status?: 'achieved' | 'at_risk' | 'critical' | 'in_progress';
          observations?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          name: string;
          indicator_id: string;
          area: string;
          status: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed';
          progress: number;
          start_date: string;
          estimated_end_date: string;
          actual_end_date: string | null;
          responsible: string;
          observations: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          indicator_id: string;
          area: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed';
          progress?: number;
          start_date: string;
          estimated_end_date: string;
          actual_end_date?: string | null;
          responsible: string;
          observations?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          indicator_id?: string;
          area?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed';
          progress?: number;
          start_date?: string;
          estimated_end_date?: string;
          actual_end_date?: string | null;
          responsible?: string;
          observations?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      risks: {
        Row: {
          id: string;
          name: string;
          area: string;
          category: string;
          impact: 'alto' | 'medio' | 'bajo';
          probability: 'alta' | 'media' | 'baja';
          exposure: number;
          mitigation_plan: string;
          mitigation_status: 'pending' | 'in_progress' | 'completed';
          status: 'active' | 'mitigated' | 'monitoring';
          responsible: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          area: string;
          category: string;
          impact: 'alto' | 'medio' | 'bajo';
          probability: 'alta' | 'media' | 'baja';
          exposure: number;
          mitigation_plan: string;
          mitigation_status?: 'pending' | 'in_progress' | 'completed';
          status?: 'active' | 'mitigated' | 'monitoring';
          responsible: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          area?: string;
          category?: string;
          impact?: 'alto' | 'medio' | 'bajo';
          probability?: 'alta' | 'media' | 'baja';
          exposure?: number;
          mitigation_plan?: string;
          mitigation_status?: 'pending' | 'in_progress' | 'completed';
          status?: 'active' | 'mitigated' | 'monitoring';
          responsible?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      import_history: {
        Row: {
          id: string;
          file_name: string;
          file_size: number;
          file_hash: string;
          import_date: string;
          file_type: string;
          indicators_count: number;
          activities_count: number;
          risks_count: number;
          status: 'success' | 'error';
          error_message: string | null;
          imported_by: string;
          areas_affected: string[];
        };
        Insert: {
          id?: string;
          file_name: string;
          file_size: number;
          file_hash: string;
          import_date?: string;
          file_type: string;
          indicators_count: number;
          activities_count: number;
          risks_count: number;
          status: 'success' | 'error';
          error_message?: string | null;
          imported_by: string;
          areas_affected: string[];
        };
        Update: {
          id?: string;
          file_name?: string;
          file_size?: number;
          file_hash?: string;
          import_date?: string;
          file_type?: string;
          indicators_count?: number;
          activities_count?: number;
          risks_count?: number;
          status?: 'success' | 'error';
          error_message?: string | null;
          imported_by?: string;
          areas_affected?: string[];
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin' | 'area_manager' | 'analyst' | 'consultant';
      indicator_status: 'achieved' | 'at_risk' | 'critical' | 'in_progress';
      activity_status: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed';
      risk_impact: 'alto' | 'medio' | 'bajo';
      risk_probability: 'alta' | 'media' | 'baja';
      risk_status: 'active' | 'mitigated' | 'monitoring';
    };
  };
}
export interface Area {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'area_manager' | 'analyst' | 'consultant';
  area?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Indicator {
  id: string;
  name: string;
  area: string;
  target: number;
  actual: number;
  measurementDate: string;
  responsible: string;
  status: 'achieved' | 'at_risk' | 'critical' | 'in_progress';
  observations: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  indicatorId: string;
  area: string;
  status: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed'; // Agregados nuevos estados
  progress: number;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  responsible: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface Risk {
  id: string;
  name: string;
  area: string;
  category: string;
  impact: 'alto' | 'medio' | 'bajo';
  probability: 'alta' | 'media' | 'baja';
  exposure: number; // Calculated field: impact * probability
  mitigationPlan: string;
  mitigationStatus: 'pending' | 'in_progress' | 'completed';
  status: 'active' | 'mitigated' | 'monitoring';
  responsible: string;
  createdAt: string;
  updatedAt: string;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: 'number' | 'percentage' | 'currency';
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface FilterState {
  area: string;
  dateRange: {
    start: string;
    end: string;
  };
  status: string;
  search: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ImportData {
  indicators: Omit<Indicator, 'id' | 'activities' | 'createdAt' | 'updatedAt'>[];
  activities: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>[];
  risks: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>[];
}
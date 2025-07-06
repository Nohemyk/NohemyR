import { Area, Indicator, Activity, KPI, User } from '../types';
import { format, subMonths, addDays, addMonths } from 'date-fns';

export const areas: Area[] = [
  { id: 'all', name: 'Todas las Áreas', code: 'ALL', color: '#6B7280' },
  { id: 'quality', name: 'Calidad y Funcional', code: 'QF', color: '#2563EB' },
  { id: 'projects', name: 'Proyectos y Procesos', code: 'PP', color: '#0D9488' },
  { id: 'infrastructure', name: 'Infraestructura', code: 'INF', color: '#DC2626' },
  { id: 'systems', name: 'Sistemas', code: 'SYS', color: '#7C3AED' },
  { id: 'vp_tech', name: 'VP Tecnología', code: 'VPT', color: '#EA580C' },
];

// Sistema inicia en Abril 2025
export const SYSTEM_START_DATE = new Date('2025-04-01');

// Solo el usuario administrador - DATOS LIMPIOS
export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: 'Hersan Romero',
    email: 'Hersan_romero@yahoo.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    lastLogin: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  },
  {
    id: 'user-002',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@company.com',
    password: 'quality123',
    role: 'area_manager',
    area: 'quality',
    isActive: true,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  },
  {
    id: 'user-003',
    name: 'Ana García',
    email: 'ana.garcia@company.com',
    password: 'projects123',
    role: 'area_manager',
    area: 'projects',
    isActive: true,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  }
];

// SISTEMA COMPLETAMENTE LIMPIO - Sin indicadores iniciales
export const mockIndicators: Indicator[] = [];

// KPIs vacíos inicialmente
export const mockKPIs: KPI[] = [
  {
    id: 'kpi-001',
    label: 'Indicadores Activos',
    value: 0,
    previousValue: 0,
    format: 'number',
    trend: 'stable',
    color: '#2563EB',
  },
  {
    id: 'kpi-002',
    label: 'En Riesgo Crítico',
    value: 0,
    previousValue: 0,
    format: 'number',
    trend: 'stable',
    color: '#DC2626',
  },
  {
    id: 'kpi-003',
    label: 'Cumplimiento Promedio',
    value: 0,
    previousValue: 0,
    format: 'percentage',
    trend: 'stable',
    color: '#059669',
  },
  {
    id: 'kpi-004',
    label: 'Riesgos Activos',
    value: 0,
    previousValue: 0,
    format: 'number',
    trend: 'stable',
    color: '#0D9488',
  },
];

export const generateMockActivities = (indicatorId: string, area: string, count: number = 3): Activity[] => {
  const activities: Activity[] = [];
  const statuses: Activity['status'][] = ['pending', 'in_progress', 'completed'];
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const progress = status === 'completed' ? 100 : status === 'in_progress' ? Math.floor(Math.random() * 80) + 20 : 0;
    
    activities.push({
      id: `act-${indicatorId}-${i + 1}`,
      name: `Actividad ${i + 1} - ${indicatorId}`,
      indicatorId,
      area,
      status,
      progress,
      startDate: format(addMonths(SYSTEM_START_DATE, Math.floor(Math.random() * 8)), 'yyyy-MM-dd'),
      estimatedEndDate: format(addDays(new Date(), Math.floor(Math.random() * 90)), 'yyyy-MM-dd'),
      actualEndDate: status === 'completed' ? format(subMonths(new Date(), Math.floor(Math.random() * 2)), 'yyyy-MM-dd') : undefined,
      responsible: `Responsable ${i + 1}`,
      observations: `Observaciones de la actividad ${i + 1} para el área`,
      createdAt: format(addMonths(SYSTEM_START_DATE, 1), 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    });
  }
  
  return activities;
};

// Datos históricos SOLO desde Abril 2025 - NO antes
export const generateHistoricalData = (area: string, months: number = 8) => {
  const data = [];
  const currentDate = new Date();
  
  // Calcular cuántos meses han pasado desde abril 2025
  const monthsFromStart = Math.max(1, Math.floor((currentDate.getTime() - SYSTEM_START_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const actualMonths = Math.min(months, monthsFromStart + 1);
  
  console.log(`📊 Generando datos históricos para ${area}: ${actualMonths} meses desde abril 2025`);
  
  for (let i = 0; i < actualMonths; i++) {
    const date = addMonths(SYSTEM_START_DATE, i);
    
    // Solo generar datos si la fecha es <= fecha actual
    if (date <= currentDate) {
      // Valores base realistas por área - SOLO si hay datos reales
      let basePerformance = 0;
      
      // Solo mostrar rendimiento si hay indicadores cargados en el sistema
      const storedIndicators = localStorage.getItem('systemIndicators');
      if (storedIndicators) {
        const indicators = JSON.parse(storedIndicators);
        const areaIndicators = area === 'all' ? indicators : indicators.filter((ind: any) => ind.area === area);
        
        if (areaIndicators.length > 0) {
          // Calcular rendimiento promedio real del área
          const avgPerformance = areaIndicators.reduce((acc: number, ind: any) => 
            acc + (ind.actual / ind.target * 100), 0) / areaIndicators.length;
          
          // Usar el rendimiento real como base con variación histórica
          basePerformance = Math.max(70, avgPerformance + (Math.random() - 0.5) * 10);
        }
      }
      
      data.push({
        month: format(date, 'MMM yyyy'),
        value: basePerformance
      });
    }
  }
  
  console.log(`✅ Datos históricos generados para ${area}:`, data.length, 'puntos de datos');
  return data;
};

// Datos para matriz de rendimiento - SOLO con datos reales
export const getPerformanceMatrix = (indicators: Indicator[]) => {
  if (indicators.length === 0) {
    console.log('📊 No hay indicadores para matriz de rendimiento');
    return [];
  }
  
  return areas.slice(1, -1).map(area => {
    const areaIndicators = indicators.filter(ind => ind.area === area.id);
    const avgTarget = areaIndicators.length > 0 
      ? areaIndicators.reduce((acc, ind) => acc + ind.target, 0) / areaIndicators.length 
      : 0;
    const avgActual = areaIndicators.length > 0 
      ? areaIndicators.reduce((acc, ind) => acc + ind.actual, 0) / areaIndicators.length 
      : 0;
    
    return {
      area: area.name,
      target: avgTarget,
      actual: avgActual,
      performance: avgTarget > 0 ? (avgActual / avgTarget) * 100 : 0,
      color: area.color,
      indicators: areaIndicators.length
    };
  }).filter(area => area.indicators > 0); // Solo mostrar áreas con indicadores
};

// Función para verificar si hay datos en el sistema
export const hasSystemData = (): boolean => {
  const indicators = localStorage.getItem('systemIndicators');
  const risks = localStorage.getItem('systemRisks');
  
  const indicatorsCount = indicators ? JSON.parse(indicators).length : 0;
  const risksCount = risks ? JSON.parse(risks).length : 0;
  
  return indicatorsCount > 0 || risksCount > 0;
};

// Función para obtener estadísticas del sistema
export const getSystemStats = () => {
  const indicators = localStorage.getItem('systemIndicators');
  const risks = localStorage.getItem('systemRisks');
  
  const indicatorsData = indicators ? JSON.parse(indicators) : [];
  const risksData = risks ? JSON.parse(risks) : [];
  
  return {
    totalIndicators: indicatorsData.length,
    totalActivities: indicatorsData.reduce((acc: number, ind: any) => acc + (ind.activities?.length || 0), 0),
    totalRisks: risksData.length,
    lastUpdate: localStorage.getItem('systemLastUpdate') || null
  };
};
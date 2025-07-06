import React, { useState, useMemo, useEffect } from 'react';
import { SupabaseAuthProvider, useSupabaseAuthContext } from './context/SupabaseAuthContext';
import { SupabaseLoginForm } from './components/Auth/SupabaseLoginForm';
import { SupabaseSetup } from './components/Setup/SupabaseSetup';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { IndicatorsView } from './components/Indicators/IndicatorsView';
import { ActivitiesView } from './components/Activities/ActivitiesView';
import { RisksView } from './components/Risks/RisksView';
import { ReportsView } from './components/Reports/ReportsView';
import { UsersManagement } from './components/Users/UsersManagement';
import { ImportView } from './components/Import/ImportView';
import { areas } from './data/mockData';
import { FilterState, Indicator, Risk } from './types';
import { useSupabaseData } from './hooks/useSupabaseData';
import { loadSystemData, saveSystemData } from './utils/dataRecovery';

type ViewType = 'dashboard' | 'indicators' | 'activities' | 'risks' | 'reports' | 'users' | 'import';

// Componente para el sistema con Supabase
function SupabaseAppContent() {
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuthContext();
  const { 
    indicators, 
    risks, 
    loading: dataLoading, 
    error: dataError,
    saveIndicator,
    saveRisk,
    deleteIndicator,
    deleteRisk,
    refreshData
  } = useSupabaseData();

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedArea, setSelectedArea] = useState('all');
  const [filters, setFilters] = useState<FilterState>({
    area: 'all',
    dateRange: {
      start: '2025-04-01',
      end: '2025-12-31'
    },
    status: 'all',
    search: ''
  });

  // Move all useMemo hooks to the top, before any conditional returns
  // Update KPIs based on current indicators
  const updatedKPIs = useMemo(() => {
    const totalIndicators = indicators.length;
    const criticalCount = indicators.filter(i => i.status === 'critical').length;
    const avgCompliance = totalIndicators > 0 
      ? Math.round(indicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / totalIndicators)
      : 0;
    
    // Find best performing area
    const areaPerformance = areas.slice(1, -1).map(area => {
      const areaIndicators = indicators.filter(ind => ind.area === area.id);
      const avgPerformance = areaIndicators.length > 0 
        ? areaIndicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / areaIndicators.length
        : 0;
      return { area: area.name, performance: avgPerformance };
    });
    
    const bestArea = areaPerformance.reduce((best, current) => 
      current.performance > best.performance ? current : best, 
      { area: '', performance: 0 }
    );

    return [
      {
        id: 'kpi-001',
        label: 'Indicadores Activos',
        value: totalIndicators,
        previousValue: Math.max(0, totalIndicators - 2),
        format: 'number' as const,
        trend: totalIndicators > 0 ? 'up' as const : 'stable' as const,
        color: '#2563EB',
      },
      {
        id: 'kpi-002',
        label: 'En Riesgo Crítico',
        value: criticalCount,
        previousValue: Math.max(0, criticalCount - 1),
        format: 'number' as const,
        trend: criticalCount > 0 ? 'down' as const : 'stable' as const,
        color: '#DC2626',
      },
      {
        id: 'kpi-003',
        label: 'Cumplimiento Promedio',
        value: avgCompliance,
        previousValue: Math.max(0, avgCompliance - 5),
        format: 'percentage' as const,
        trend: avgCompliance > 85 ? 'up' as const : avgCompliance > 70 ? 'stable' as const : 'down' as const,
        color: '#059669',
      },
      {
        id: 'kpi-004',
        label: 'Riesgos Activos',
        value: risks.filter(r => r.status === 'active').length,
        previousValue: Math.max(0, risks.filter(r => r.status === 'active').length - 1),
        format: 'number' as const,
        trend: risks.filter(r => r.status === 'active').length > 0 ? 'down' as const : 'stable' as const,
        color: '#0D9488',
      },
    ];
  }, [indicators, risks]);

  const filteredIndicators = useMemo(() => {
    let filtered = indicators;

    // Filter by user role and area
    if (user?.role !== 'admin') {
      if (user?.role === 'area_manager' || user?.role === 'analyst') {
        filtered = filtered.filter(indicator => indicator.area === user.area);
      }
    }

    // Apply additional filters
    return filtered.filter(indicator => {
      if (filters.area !== 'all' && indicator.area !== filters.area) return false;
      if (filters.status !== 'all' && indicator.status !== filters.status) return false;
      if (filters.search && !indicator.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [indicators, filters, user]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <SupabaseLoginForm />;
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    setFilters(prev => ({ ...prev, area: areaId }));
  };

  const handleIndicatorsChange = async (newIndicators: Indicator[]) => {
    console.log('🔄 Actualizando indicadores en Supabase...');
    
    // Save each indicator to Supabase
    for (const indicator of newIndicators) {
      const result = await saveIndicator(indicator);
      if (!result.success) {
        console.error('Error guardando indicador:', result.error);
        alert(`Error guardando indicador: ${result.error}`);
        return;
      }
    }
    
    // Refresh data from Supabase
    await refreshData();
  };

  const handleRisksChange = async (newRisks: Risk[]) => {
    console.log('🔄 Actualizando riesgos en Supabase...');
    
    // Save each risk to Supabase
    for (const risk of newRisks) {
      const result = await saveRisk(risk);
      if (!result.success) {
        console.error('Error guardando riesgo:', result.error);
        alert(`Error guardando riesgo: ${result.error}`);
        return;
      }
    }
    
    // Refresh data from Supabase
    await refreshData();
  };

  const renderView = () => {
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      );
    }

    if (dataError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error cargando datos</h3>
            <p className="text-gray-600 mb-4">{dataError}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          indicators={filteredIndicators} 
          kpis={updatedKPIs}
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          filters={filters}
          onFiltersChange={setFilters}
        />;
      case 'indicators':
        return <IndicatorsView 
          indicators={indicators}
          filters={filters}
          onFiltersChange={setFilters}
          onIndicatorsChange={handleIndicatorsChange}
        />;
      case 'activities':
        return <ActivitiesView 
          indicators={indicators}
          filters={filters}
          onFiltersChange={setFilters}
          onIndicatorsChange={handleIndicatorsChange}
        />;
      case 'risks':
        return <RisksView 
          risks={risks}
          filters={filters}
          onFiltersChange={setFilters}
          onRisksChange={handleRisksChange}
        />;
      case 'import':
        return <ImportView 
          indicators={indicators}
          risks={risks}
          onIndicatorsChange={handleIndicatorsChange}
          onRisksChange={handleRisksChange}
        />;
      case 'reports':
        return <ReportsView 
          indicators={filteredIndicators}
          risks={risks}
          selectedArea={selectedArea}
        />;
      case 'users':
        return user?.role === 'admin' ? <UsersManagement /> : null;
      default:
        return <Dashboard 
          indicators={filteredIndicators} 
          kpis={updatedKPIs}
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          filters={filters}
          onFiltersChange={setFilters}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Connection Status */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 text-sm font-medium">
              Sistema Colaborativo Activo - Sincronización en Tiempo Real
            </span>
          </div>
          <div className="text-green-700 text-xs">
            Usuario: {user?.name} ({user?.role}) {user?.area && `- ${user.area}`}
          </div>
        </div>
      </div>
      
      <div className="flex">
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          areas={areas}
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          indicators={indicators}
          risks={risks}
        />
        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

// Componente para el sistema local (fallback)
function LocalAppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedArea, setSelectedArea] = useState('all');
  const [filters, setFilters] = useState<FilterState>({
    area: 'all',
    dateRange: {
      start: '2025-04-01',
      end: '2025-12-31'
    },
    status: 'all',
    search: ''
  });

  // Load data from localStorage
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);

  useEffect(() => {
    const data = loadSystemData();
    setIndicators(data.indicators);
    setRisks(data.risks);
  }, []);

  // Move useMemo hooks to the top, before any conditional returns
  // Update KPIs based on current indicators
  const updatedKPIs = useMemo(() => {
    const totalIndicators = indicators.length;
    const criticalCount = indicators.filter(i => i.status === 'critical').length;
    const avgCompliance = totalIndicators > 0 
      ? Math.round(indicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / totalIndicators)
      : 0;

    return [
      {
        id: 'kpi-001',
        label: 'Indicadores Activos',
        value: totalIndicators,
        previousValue: Math.max(0, totalIndicators - 2),
        format: 'number' as const,
        trend: totalIndicators > 0 ? 'up' as const : 'stable' as const,
        color: '#2563EB',
      },
      {
        id: 'kpi-002',
        label: 'En Riesgo Crítico',
        value: criticalCount,
        previousValue: Math.max(0, criticalCount - 1),
        format: 'number' as const,
        trend: criticalCount > 0 ? 'down' as const : 'stable' as const,
        color: '#DC2626',
      },
      {
        id: 'kpi-003',
        label: 'Cumplimiento Promedio',
        value: avgCompliance,
        previousValue: Math.max(0, avgCompliance - 5),
        format: 'percentage' as const,
        trend: avgCompliance > 85 ? 'up' as const : avgCompliance > 70 ? 'stable' as const : 'down' as const,
        color: '#059669',
      },
      {
        id: 'kpi-004',
        label: 'Riesgos Activos',
        value: risks.filter(r => r.status === 'active').length,
        previousValue: Math.max(0, risks.filter(r => r.status === 'active').length - 1),
        format: 'number' as const,
        trend: risks.filter(r => r.status === 'active').length > 0 ? 'down' as const : 'stable' as const,
        color: '#0D9488',
      },
    ];
  }, [indicators, risks]);

  const filteredIndicators = useMemo(() => {
    let filtered = indicators;

    // Filter by user role and area
    if (user?.role !== 'admin') {
      if (user?.role === 'area_manager' || user?.role === 'analyst') {
        filtered = filtered.filter(indicator => indicator.area === user.area);
      }
    }

    // Apply additional filters
    return filtered.filter(indicator => {
      if (filters.area !== 'all' && indicator.area !== filters.area) return false;
      if (filters.status !== 'all' && indicator.status !== filters.status) return false;
      if (filters.search && !indicator.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [indicators, filters, user]);

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    setFilters(prev => ({ ...prev, area: areaId }));
  };

  const handleIndicatorsChange = (newIndicators: Indicator[]) => {
    setIndicators(newIndicators);
    saveSystemData(newIndicators, risks);
  };

  const handleRisksChange = (newRisks: Risk[]) => {
    setRisks(newRisks);
    saveSystemData(indicators, newRisks);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          indicators={filteredIndicators} 
          kpis={updatedKPIs}
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          filters={filters}
          onFiltersChange={setFilters}
        />;
      case 'indicators':
        return <IndicatorsView 
          indicators={indicators}
          filters={filters}
          onFiltersChange={setFilters}
          onIndicatorsChange={handleIndicatorsChange}
        />;
      case 'activities':
        return <ActivitiesView 
          indicators={indicators}
          filters={filters}
          onFiltersChange={setFilters}
          onIndicatorsChange={handleIndicatorsChange}
        />;
      case 'risks':
        return <RisksView 
          risks={risks}
          filters={filters}
          onFiltersChange={setFilters}
          onRisksChange={handleRisksChange}
        />;
      case 'import':
        return <ImportView 
          indicators={indicators}
          risks={risks}
          onIndicatorsChange={handleIndicatorsChange}
          onRisksChange={handleRisksChange}
        />;
      case 'reports':
        return <ReportsView 
          indicators={filteredIndicators}
          risks={risks}
          selectedArea={selectedArea}
        />;
      case 'users':
        return user?.role === 'admin' ? <UsersManagement /> : null;
      default:
        return <Dashboard 
          indicators={filteredIndicators} 
          kpis={updatedKPIs}
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          filters={filters}
          onFiltersChange={setFilters}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Connection Status */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-800 text-sm font-medium">
              Modo Local - Sin Sincronización en Tiempo Real
            </span>
          </div>
          <div className="text-yellow-700 text-xs">
            Usuario: {user?.name} ({user?.role}) {user?.area && `- ${user.area}`}
          </div>
        </div>
      </div>
      
      <div className="flex">
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          areas={areas}
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          indicators={indicators}
          risks={risks}
        />
        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  // Check if Supabase is configured
  const isSupabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Show setup screen if Supabase is not configured
  if (!isSupabaseConfigured) {
    return <SupabaseSetup />;
  }

  // Use Supabase version if configured, otherwise fallback to local
  return (
    <SupabaseAuthProvider>
      <AuthProvider>
        <SupabaseAppContent />
      </AuthProvider>
    </SupabaseAuthProvider>
  );
}

export default App;
import React from 'react';
import { KPICards } from './KPICards';
import { AreaSelector } from './AreaSelector';
import { ChartsGrid } from './ChartsGrid';
import { IndicatorsTable } from './IndicatorsTable';
import { FilterBar } from '../Common/FilterBar';
import { Indicator, KPI, FilterState } from '../../types';
import { areas } from '../../data/mockData';
import { getSystemStats } from '../../utils/dataRecovery';

interface DashboardProps {
  indicators: Indicator[];
  kpis: KPI[];
  selectedArea: string;
  onAreaChange: (areaId: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  indicators,
  kpis,
  selectedArea,
  onAreaChange,
  filters,
  onFiltersChange,
}) => {
  const selectedAreaData = areas.find(area => area.id === selectedArea);
  const systemStats = getSystemStats();
  
  // Calculate best performing area
  const areaPerformance = areas.slice(1, -1).map(area => {
    const areaIndicators = indicators.filter(ind => ind.area === area.id);
    const avgPerformance = areaIndicators.length > 0 
      ? areaIndicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / areaIndicators.length
      : 0;
    return { 
      area: area.name, 
      code: area.code,
      performance: avgPerformance,
      color: area.color,
      indicators: areaIndicators.length
    };
  });
  
  const bestArea = areaPerformance.reduce((best, current) => 
    current.performance > best.performance ? current : best, 
    { area: 'Sin datos', code: 'N/A', performance: 0, color: '#6B7280', indicators: 0 }
  );
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de indicadores y actividades - VP Tecnología
          </p>
          {systemStats.hasData && (
            <div className="mt-2 text-sm text-gray-500">
              Última actualización: {systemStats.lastUpdate} • {systemStats.importCount} importaciones realizadas
            </div>
          )}
        </div>
        <AreaSelector
          areas={areas}
          selectedArea={selectedArea}
          onAreaChange={onAreaChange}
        />
      </div>

      {/* System Status Alert */}
      {systemStats.hasData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium">Sistema Activo</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Datos cargados y sincronizados correctamente. 
            {systemStats.totalIndicators} indicadores, {systemStats.totalActivities} actividades, {systemStats.totalRisks} riesgos.
          </p>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        areas={areas}
      />

      {/* KPI Cards */}
      <KPICards kpis={kpis} />

      {/* Best Performing Area Highlight */}
      {indicators.length > 0 && bestArea.performance > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🏆 Área con Mejor Rendimiento
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: bestArea.color }}
                  />
                  <span className="font-medium text-gray-900">{bestArea.area}</span>
                  <span className="text-sm text-gray-600">({bestArea.code})</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(bestArea.performance)}%
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {bestArea.indicators} indicador{bestArea.indicators !== 1 ? 'es' : ''} monitoreado{bestArea.indicators !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <ChartsGrid 
        indicators={indicators}
        selectedArea={selectedArea}
        selectedAreaData={selectedAreaData}
      />

      {/* Recent Indicators Table - Separated with proper spacing */}
      {indicators.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Indicadores Recientes
                </h2>
                <div className="text-sm text-gray-500">
                  Últimos {Math.min(10, indicators.length)} indicadores
                </div>
              </div>
              <IndicatorsTable indicators={indicators.slice(0, 10)} />
            </div>
          </div>
        </div>
      )}

      {/* Empty State cuando no hay indicadores */}
      {indicators.length === 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sistema Limpio - Listo para Carga Inicial
              </h3>
              <p className="text-gray-600 mb-6">
                No hay indicadores cargados. Utiliza la sección "Importar Datos" para cargar tu primer archivo HTML o Excel.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => window.location.hash = '#import'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Importar Datos
                </button>
                <button 
                  onClick={() => window.location.hash = '#indicators'}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Crear Manualmente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { AreaChart } from './Charts/AreaChart';
import { BarChart } from './Charts/BarChart';
import { PieChart } from './Charts/PieChart';
import { PerformanceMatrix } from './Charts/PerformanceMatrix';
import { Indicator, Area } from '../../types';

interface ChartsGridProps {
  indicators: Indicator[];
  selectedArea: string;
  selectedAreaData?: Area;
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({
  indicators,
  selectedArea,
  selectedAreaData,
}) => {
  return (
    <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Area Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart="area-performance">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rendimiento por Área (Desde Abril 2025)
        </h3>
        <AreaChart indicators={indicators} />
      </div>

      {/* Indicators Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart="indicators-performance">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cumplimiento de Indicadores
        </h3>
        <BarChart indicators={indicators} />
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart="status-distribution">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribución por Estado
        </h3>
        <PieChart indicators={indicators} />
      </div>

      {/* Performance Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart="performance-matrix">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Matriz de Rendimiento
        </h3>
        <PerformanceMatrix indicators={indicators} />
      </div>
    </div>
  );
};
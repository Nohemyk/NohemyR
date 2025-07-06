import React from 'react';
import { Indicator } from '../../../types';
import { getPerformanceMatrix } from '../../../data/mockData';

interface PerformanceMatrixProps {
  indicators: Indicator[];
}

export const PerformanceMatrix: React.FC<PerformanceMatrixProps> = ({ indicators }) => {
  const matrixData = getPerformanceMatrix(indicators);
  
  const getPerformanceColor = (performance: number) => {
    if (performance >= 100) return 'bg-green-500';
    if (performance >= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getPerformanceLabel = (performance: number) => {
    if (performance >= 100) return 'Excelente';
    if (performance >= 90) return 'Bueno';
    if (performance >= 80) return 'Regular';
    return 'Crítico';
  };

  if (matrixData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No hay datos disponibles</p>
          <p className="text-gray-400 text-sm mt-2">
            La matriz de rendimiento se genera automáticamente cuando se cargan indicadores por área
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 p-4">
      <div className="grid grid-cols-2 gap-4 h-full">
        {matrixData.map((area) => (
          <div
            key={area.area}
            className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">{area.area}</h4>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: area.color }}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Meta:</span>
                <span className="font-medium">{area.target.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Real:</span>
                <span className="font-medium">{area.actual.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Indicadores:</span>
                <span className="font-medium">{area.indicators}</span>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Rendimiento</span>
                <span className="text-xs font-medium">{area.performance.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getPerformanceColor(area.performance)}`}
                  style={{ width: `${Math.min(100, area.performance)}%` }}
                />
              </div>
              <div className="text-center mt-1">
                <span className={`text-xs font-medium ${
                  area.performance >= 100 ? 'text-green-600' :
                  area.performance >= 90 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getPerformanceLabel(area.performance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
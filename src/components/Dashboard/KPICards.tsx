import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPI } from '../../types';
import clsx from 'clsx';

interface KPICardsProps {
  kpis: KPI[];
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const changeValue = kpi.previousValue !== undefined && kpi.previousValue > 0
          ? ((kpi.value - kpi.previousValue) / kpi.previousValue * 100).toFixed(1)
          : '0';

        return (
          <div
            key={kpi.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${kpi.color}15` }}
              >
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: kpi.color }}
                />
              </div>
              <div className={clsx('flex items-center space-x-1', getTrendColor(kpi.trend))}>
                {getTrendIcon(kpi.trend)}
                <span className="text-sm font-medium">{changeValue}%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">{kpi.label}</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(kpi.value, kpi.format)}
              </p>
              {kpi.previousValue !== undefined && kpi.previousValue > 0 && (
                <p className="text-xs text-gray-500">
                  vs {formatValue(kpi.previousValue, kpi.format)} anterior
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, User, Calendar, Edit } from 'lucide-react';
import { Indicator } from '../../types';
import { areas } from '../../data/mockData';
import clsx from 'clsx';
import { format } from 'date-fns';

interface IndicatorsTableProps {
  indicators: Indicator[];
  onEdit?: (indicator: Indicator) => void;
}

const statusConfig = {
  achieved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Cumplido'
  },
  at_risk: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'En Riesgo'
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Crítico'
  },
  in_progress: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'En Progreso'
  }
};

export const IndicatorsTable: React.FC<IndicatorsTableProps> = ({ indicators, onEdit }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Indicador</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Área</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-900">Meta</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-900">Real</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-900">%</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Responsable</th>
            {onEdit && <th className="text-center py-3 px-4 font-semibold text-gray-900">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {indicators.map((indicator) => {
            const area = areas.find(a => a.id === indicator.area);
            const statusInfo = statusConfig[indicator.status];
            const StatusIcon = statusInfo.icon;
            const percentage = Math.round((indicator.actual / indicator.target) * 100);

            return (
              <tr key={indicator.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{indicator.name}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(indicator.measurementDate), 'dd/MM/yyyy')}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {area && (
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{area.code}</span>
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="font-medium text-gray-900">{indicator.target}%</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="font-medium text-gray-900">{indicator.actual}%</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={clsx(
                    'font-semibold',
                    percentage >= 100 ? 'text-green-600' : 
                    percentage >= 90 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {percentage}%
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className={clsx(
                    'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                    statusInfo.bg,
                    statusInfo.border,
                    statusInfo.color,
                    'border'
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusInfo.label}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{indicator.responsible}</span>
                  </div>
                </td>
                {onEdit && (
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onEdit(indicator)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
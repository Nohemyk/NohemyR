import React from 'react';
import { Indicator } from '../../../types';

interface ActivitiesReportChartProps {
  indicators: Indicator[];
}

export const ActivitiesReportChart: React.FC<ActivitiesReportChartProps> = ({ indicators }) => {
  const allActivities = indicators.flatMap(ind => 
    ind.activities.map(activity => ({
      ...activity,
      indicatorName: ind.name,
      area: ind.area
    }))
  );

  if (allActivities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No hay actividades para mostrar</p>
          <p className="text-gray-400 text-sm mt-2">Las actividades se generan al importar datos con actividades asociadas</p>
        </div>
      </div>
    );
  }

  // Actividades críticas (progreso < 50% o estado crítico)
  const criticalActivities = allActivities.filter(activity => 
    activity.progress < 50 || activity.status === 'pending'
  );

  return (
    <div className="h-full p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Actividades</h3>
          <p className="text-3xl font-bold text-blue-600">{allActivities.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Críticas</h3>
          <p className="text-3xl font-bold text-red-600">{criticalActivities.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Completadas</h3>
          <p className="text-3xl font-bold text-green-600">
            {allActivities.filter(a => a.status === 'completed').length}
          </p>
        </div>
      </div>

      {criticalActivities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Actividades Críticas</h4>
          <div className="space-y-3">
            {criticalActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{activity.name}</p>
                  <p className="text-sm text-gray-600">{activity.indicatorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{activity.progress}%</p>
                  <p className="text-xs text-gray-500">{activity.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
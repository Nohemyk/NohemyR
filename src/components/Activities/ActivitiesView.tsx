import React, { useState } from 'react';
import { Plus, Download, Calendar, User, CheckCircle, AlertTriangle, Clock, Edit, Trash2, Pause, SkipForward, XCircle } from 'lucide-react';
import { FilterBar } from '../Common/FilterBar';
import { ActivityForm } from './ActivityForm';
import { Indicator, FilterState, Activity } from '../../types';
import { areas } from '../../data/mockData';
import { exportActivitiesToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface ActivitiesViewProps {
  indicators: Indicator[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onIndicatorsChange: (indicators: Indicator[]) => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Pendiente'
  },
  in_progress: {
    icon: AlertTriangle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'En Curso'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Finalizada'
  },
  suspended: {
    icon: Pause,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Suspendida'
  },
  postponed: {
    icon: SkipForward,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    label: 'Aplazada'
  }
};

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  indicators,
  filters,
  onFiltersChange,
  onIndicatorsChange,
}) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();

  // Filter indicators based on user role
  const filteredIndicators = indicators.filter(indicator => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'area_manager' || user?.role === 'analyst') {
      return indicator.area === user.area;
    }
    return true;
  });

  // Extract all activities with indicator information
  const allActivities = filteredIndicators.flatMap(indicator => 
    indicator.activities.map(activity => ({
      ...activity,
      indicatorName: indicator.name,
      area: indicator.area
    }))
  );

  // Apply filters to activities - CORREGIDO para usar estados de actividades
  const filteredActivities = allActivities.filter(activity => {
    if (filters.area !== 'all' && activity.area !== filters.area) return false;
    if (filters.status !== 'all' && activity.status !== filters.status) return false; // Ahora usa estados de actividades
    if (filters.search && !activity.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleSaveActivity = (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('💾 Guardando actividad:', activityData);
    
    if (editingActivity) {
      // Update existing activity
      console.log('✏️ Actualizando actividad existente:', editingActivity.id);
      const updatedIndicators = indicators.map(indicator => ({
        ...indicator,
        activities: indicator.activities.map(activity =>
          activity.id === editingActivity.id
            ? {
                ...activity,
                ...activityData,
                updatedAt: new Date().toISOString(),
              }
            : activity
        ),
        updatedAt: indicator.activities.some(a => a.id === editingActivity.id) 
          ? new Date().toISOString() 
          : indicator.updatedAt
      }));
      
      onIndicatorsChange(updatedIndicators);
      console.log('✅ Actividad actualizada exitosamente');
    } else {
      // Create new activity - assign to first indicator of the same area
      console.log('➕ Creando nueva actividad');
      const targetIndicator = indicators.find(ind => ind.area === activityData.area);
      
      if (targetIndicator) {
        const newActivity: Activity = {
          ...activityData,
          id: `act-${Date.now()}`,
          indicatorId: targetIndicator.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const updatedIndicators = indicators.map(indicator =>
          indicator.id === targetIndicator.id
            ? {
                ...indicator,
                activities: [...indicator.activities, newActivity],
                updatedAt: new Date().toISOString(),
              }
            : indicator
        );
        
        onIndicatorsChange(updatedIndicators);
        console.log('✅ Nueva actividad creada exitosamente:', newActivity.id);
      } else {
        alert('No se encontró un indicador en el área seleccionada para asociar la actividad.');
        return;
      }
    }
    
    setShowForm(false);
    setEditingActivity(undefined);
  };

  const handleEditActivity = (activity: Activity) => {
    console.log('✏️ Iniciando edición de actividad:', activity.id);
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (window.confirm(`¿Está seguro de eliminar la actividad "${activity.name}"?`)) {
      console.log('🗑️ Eliminando actividad:', activity.id);
      const updatedIndicators = indicators.map(indicator => ({
        ...indicator,
        activities: indicator.activities.filter(a => a.id !== activity.id),
        updatedAt: indicator.activities.some(a => a.id === activity.id) 
          ? new Date().toISOString() 
          : indicator.updatedAt
      }));
      
      onIndicatorsChange(updatedIndicators);
      console.log('✅ Actividad eliminada exitosamente');
    }
  };

  const handleExportExcel = () => {
    exportActivitiesToExcel(filteredActivities, 'actividades');
  };

  const canCreateActivities = user?.role === 'admin' || user?.role === 'area_manager' || user?.role === 'analyst';
  const canEditActivities = user?.role === 'admin' || user?.role === 'area_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Actividades</h1>
          <p className="text-gray-600 mt-1">
            Administra y monitorea todas las actividades asociadas a indicadores
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {filteredActivities.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          )}
          {canCreateActivities && (
            <button
              onClick={() => {
                setEditingActivity(undefined);
                setShowForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Actividad</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters - CORREGIDO para mostrar estados de actividades */}
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        areas={areas}
        showActivityStates={true}
      />

      {/* Content */}
      {filteredActivities.length > 0 ? (
        <>
          {/* Results Summary - ACTUALIZADO con nuevos estados */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {filteredActivities.length} actividad{filteredActivities.length !== 1 ? 'es' : ''}
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                {filteredActivities.filter(a => a.status === 'pending').length} Pendientes
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                {filteredActivities.filter(a => a.status === 'in_progress').length} En Curso
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                {filteredActivities.filter(a => a.status === 'completed').length} Finalizadas
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                {filteredActivities.filter(a => a.status === 'suspended').length} Suspendidas
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                {filteredActivities.filter(a => a.status === 'postponed').length} Aplazadas
              </span>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actividad</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Indicador</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Área</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Progreso</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Fechas</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Responsable</th>
                      {canEditActivities && (
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredActivities.map((activity) => {
                      const area = areas.find(a => a.id === activity.area);
                      const statusInfo = statusConfig[activity.status];
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{activity.name}</p>
                              {activity.observations && (
                                <p className="text-sm text-gray-500 mt-1">{activity.observations}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-700">{activity.indicatorName}</p>
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
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-full bg-gray-200 rounded-full h-2 max-w-20">
                                <div
                                  className={clsx(
                                    'h-2 rounded-full transition-all',
                                    activity.progress >= 100 ? 'bg-green-500' :
                                    activity.progress >= 70 ? 'bg-blue-500' :
                                    activity.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  )}
                                  style={{ width: `${Math.min(100, activity.progress)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {activity.progress}%
                              </span>
                            </div>
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
                            <div className="text-sm space-y-1">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>Inicio: {new Date(activity.startDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>Fin: {new Date(activity.estimatedEndDate).toLocaleDateString()}</span>
                              </div>
                              {activity.actualEndDate && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  <span>Real: {new Date(activity.actualEndDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{activity.responsible}</span>
                            </div>
                          </td>
                          {canEditActivities && (
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleEditActivity(activity)}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Editar actividad"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(activity)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Eliminar actividad"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay actividades registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Las actividades se crean automáticamente al importar datos o se pueden crear manualmente.
            </p>
            <div className="flex justify-center space-x-4">
              {canCreateActivities && (
                <>
                  <button 
                    onClick={() => {
                      setEditingActivity(undefined);
                      setShowForm(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear Actividad
                  </button>
                  <button 
                    onClick={() => window.location.hash = '#import'}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Importar Datos
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onSave={handleSaveActivity}
          onCancel={() => {
            setShowForm(false);
            setEditingActivity(undefined);
          }}
        />
      )}
    </div>
  );
};
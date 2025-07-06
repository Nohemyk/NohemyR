import React, { useState } from 'react';
import { Plus, Download, Edit, Trash2 } from 'lucide-react';
import { FilterBar } from '../Common/FilterBar';
import { IndicatorForm } from './IndicatorForm';
import { Indicator, FilterState } from '../../types';
import { areas } from '../../data/mockData';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

interface IndicatorsViewProps {
  indicators: Indicator[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onIndicatorsChange: (indicators: Indicator[]) => void;
}

export const IndicatorsView: React.FC<IndicatorsViewProps> = ({
  indicators,
  filters,
  onFiltersChange,
  onIndicatorsChange,
}) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | undefined>();

  // Filter indicators based on user role and filters
  const filteredIndicators = indicators.filter(indicator => {
    // Role-based filtering
    if (user?.role !== 'admin') {
      if (user?.role === 'area_manager' || user?.role === 'analyst') {
        if (indicator.area !== user.area) return false;
      }
    }

    // Apply search and area filters
    if (filters.area !== 'all' && indicator.area !== filters.area) return false;
    if (filters.status !== 'all' && indicator.status !== filters.status) return false;
    if (filters.search && !indicator.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    return true;
  });

  const handleSaveIndicator = (indicatorData: Omit<Indicator, 'id' | 'activities' | 'createdAt' | 'updatedAt'>) => {
    console.log('💾 Guardando indicador:', indicatorData);
    
    if (editingIndicator) {
      // Update existing indicator - PRESERVE ACTIVITIES
      console.log('✏️ Actualizando indicador existente:', editingIndicator.id);
      const updatedIndicators = indicators.map(ind =>
        ind.id === editingIndicator.id
          ? {
              ...ind,
              ...indicatorData,
              activities: ind.activities, // PRESERVE existing activities
              updatedAt: new Date().toISOString(),
            }
          : ind
      );
      
      console.log('🔄 Llamando onIndicatorsChange con indicadores actualizados');
      onIndicatorsChange(updatedIndicators);
      
      // Force localStorage update
      setTimeout(() => {
        localStorage.setItem('systemIndicators', JSON.stringify(updatedIndicators));
        console.log('💾 Forzado guardado en localStorage');
      }, 100);
      
      console.log('✅ Indicador actualizado exitosamente');
    } else {
      // Create new indicator
      console.log('➕ Creando nuevo indicador');
      const newIndicator: Indicator = {
        ...indicatorData,
        id: `ind-${Date.now()}`,
        activities: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedIndicators = [...indicators, newIndicator];
      onIndicatorsChange(updatedIndicators);
      
      // Force localStorage update
      setTimeout(() => {
        localStorage.setItem('systemIndicators', JSON.stringify(updatedIndicators));
        console.log('💾 Forzado guardado en localStorage para nuevo indicador');
      }, 100);
      
      console.log('✅ Nuevo indicador creado exitosamente:', newIndicator.id);
    }
    
    setShowForm(false);
    setEditingIndicator(undefined);
  };

  const handleEditIndicator = (indicator: Indicator) => {
    console.log('✏️ Iniciando edición de indicador:', indicator.id, indicator);
    setEditingIndicator(indicator);
    setShowForm(true);
  };

  const handleDeleteIndicator = (indicator: Indicator) => {
    if (window.confirm(`¿Está seguro de eliminar el indicador "${indicator.name}"?`)) {
      console.log('🗑️ Eliminando indicador:', indicator.id);
      const updatedIndicators = indicators.filter(ind => ind.id !== indicator.id);
      onIndicatorsChange(updatedIndicators);
      
      // Force localStorage update
      setTimeout(() => {
        localStorage.setItem('systemIndicators', JSON.stringify(updatedIndicators));
        console.log('💾 Forzado guardado en localStorage después de eliminar');
      }, 100);
      
      console.log('✅ Indicador eliminado exitosamente');
    }
  };

  const handleExportPDF = () => {
    exportToPDF(filteredIndicators, 'Reporte de Indicadores');
  };

  const handleExportExcel = () => {
    exportToExcel(filteredIndicators, 'indicadores');
  };

  const canCreateIndicators = user?.role === 'admin' || user?.role === 'area_manager' || user?.role === 'analyst';
  const canEditIndicators = user?.role === 'admin' || user?.role === 'area_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Indicadores</h1>
          <p className="text-gray-600 mt-1">
            Administra y monitorea todos los indicadores de VP Tecnología
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {filteredIndicators.length > 0 && (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </>
          )}
          {canCreateIndicators && (
            <button
              onClick={() => {
                setEditingIndicator(undefined);
                setShowForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Indicador</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        areas={areas}
      />

      {/* Content */}
      {filteredIndicators.length > 0 ? (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {filteredIndicators.length} indicador{filteredIndicators.length !== 1 ? 'es' : ''}
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                {filteredIndicators.filter(i => i.status === 'achieved').length} Cumplidos
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                {filteredIndicators.filter(i => i.status === 'at_risk').length} En Riesgo
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                {filteredIndicators.filter(i => i.status === 'in_progress').length} En Progreso
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                {filteredIndicators.filter(i => i.status === 'critical').length} Críticos
              </span>
            </div>
          </div>

          {/* Enhanced Indicators Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
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
                      {canEditIndicators && (
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredIndicators.map((indicator) => {
                      const area = areas.find(a => a.id === indicator.area);
                      const percentage = Math.round((indicator.actual / indicator.target) * 100);

                      return (
                        <tr key={indicator.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{indicator.name}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span>{new Date(indicator.measurementDate).toLocaleDateString()}</span>
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
                            <span className={`font-semibold ${
                              indicator.status === 'in_progress' ? 'text-blue-600' :
                              percentage >= 100 ? 'text-green-600' : 
                              percentage >= 90 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {percentage}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              indicator.status === 'achieved' ? 'bg-green-100 text-green-800' :
                              indicator.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                              indicator.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {indicator.status === 'achieved' ? 'Cumplido' :
                               indicator.status === 'at_risk' ? 'En Riesgo' : 
                               indicator.status === 'in_progress' ? 'En Progreso' : 'Crítico'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700">{indicator.responsible}</span>
                          </td>
                          {canEditIndicators && (
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleEditIndicator(indicator)}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Editar indicador"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteIndicator(indicator)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Eliminar indicador"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay indicadores registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer indicador o importando datos desde un archivo.
            </p>
            <div className="flex justify-center space-x-4">
              {canCreateIndicators && (
                <>
                  <button 
                    onClick={() => {
                      setEditingIndicator(undefined);
                      setShowForm(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear Indicador
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
        <IndicatorForm
          indicator={editingIndicator}
          onSave={handleSaveIndicator}
          onCancel={() => {
            setShowForm(false);
            setEditingIndicator(undefined);
          }}
        />
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Plus, Download, AlertTriangle, Shield, Eye, Edit, Trash2 } from 'lucide-react';
import { FilterBar } from '../Common/FilterBar';
import { RiskForm } from './RiskForm';
import { Risk, FilterState } from '../../types';
import { areas } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface RisksViewProps {
  risks: Risk[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onRisksChange: (risks: Risk[]) => void;
}

const statusConfig = {
  active: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Activo'
  },
  monitoring: {
    icon: Eye,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Monitoreo'
  },
  mitigated: {
    icon: Shield,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Mitigado'
  }
};

const impactConfig = {
  alto: { color: 'text-red-600', bg: 'bg-red-100', label: 'Alto' },
  medio: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medio' },
  bajo: { color: 'text-green-600', bg: 'bg-green-100', label: 'Bajo' }
};

const probabilityConfig = {
  alta: { color: 'text-red-600', bg: 'bg-red-100', label: 'Alta' },
  media: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Media' },
  baja: { color: 'text-green-600', bg: 'bg-green-100', label: 'Baja' }
};

export const RisksView: React.FC<RisksViewProps> = ({
  risks,
  filters,
  onFiltersChange,
  onRisksChange,
}) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>();

  // Filter risks based on user role
  const filteredRisks = risks.filter(risk => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'area_manager' || user?.role === 'analyst') {
      return risk.area === user.area;
    }
    return true;
  }).filter(risk => {
    if (filters.area !== 'all' && risk.area !== filters.area) return false;
    if (filters.search && !risk.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleSaveRisk = (riskData: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('💾 Guardando riesgo:', riskData);
    
    if (editingRisk) {
      // Update existing risk
      console.log('✏️ Actualizando riesgo existente:', editingRisk.id);
      const updatedRisks = risks.map(risk =>
        risk.id === editingRisk.id
          ? {
              ...risk,
              ...riskData,
              updatedAt: new Date().toISOString(),
            }
          : risk
      );
      onRisksChange(updatedRisks);
      console.log('✅ Riesgo actualizado exitosamente');
    } else {
      // Create new risk
      console.log('➕ Creando nuevo riesgo');
      const newRisk: Risk = {
        ...riskData,
        id: `risk-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onRisksChange([...risks, newRisk]);
      console.log('✅ Nuevo riesgo creado exitosamente:', newRisk.id);
    }
    
    setShowForm(false);
    setEditingRisk(undefined);
  };

  const handleEditRisk = (risk: Risk) => {
    console.log('✏️ Iniciando edición de riesgo:', risk.id);
    setEditingRisk(risk);
    setShowForm(true);
  };

  const handleDeleteRisk = (risk: Risk) => {
    if (window.confirm(`¿Está seguro de eliminar el riesgo "${risk.name}"?`)) {
      console.log('🗑️ Eliminando riesgo:', risk.id);
      const updatedRisks = risks.filter(r => r.id !== risk.id);
      onRisksChange(updatedRisks);
      console.log('✅ Riesgo eliminado exitosamente');
    }
  };

  const handleExportExcel = () => {
    // Implementar exportación de riesgos
    alert('Exportando riesgos a Excel...');
  };

  const canCreateRisks = user?.role === 'admin' || user?.role === 'area_manager' || user?.role === 'analyst';
  const canEditRisks = user?.role === 'admin' || user?.role === 'area_manager';

  const getRiskLevel = (exposure: number) => {
    if (exposure >= 6) {
      return { level: 'Alto', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (exposure >= 4) {
      return { level: 'Medio', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { level: 'Bajo', color: 'text-green-600', bg: 'bg-green-100' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Riesgos</h1>
          <p className="text-gray-600 mt-1">
            Administra y monitorea todos los riesgos identificados en el sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {filteredRisks.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          )}
          {canCreateRisks && (
            <button
              onClick={() => {
                setEditingRisk(undefined);
                setShowForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Riesgo</span>
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
      {filteredRisks.length > 0 ? (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {filteredRisks.length} riesgo{filteredRisks.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                {filteredRisks.filter(r => r.status === 'active').length} Activos
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                {filteredRisks.filter(r => r.status === 'monitoring').length} En Monitoreo
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                {filteredRisks.filter(r => r.status === 'mitigated').length} Mitigados
              </span>
            </div>
          </div>

          {/* Risks Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Riesgo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Área</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Impacto</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Probabilidad</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Exposición</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Mitigación</th>
                      {canEditRisks && (
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRisks.map((risk) => {
                      const area = areas.find(a => a.id === risk.area);
                      const statusInfo = statusConfig[risk.status];
                      const StatusIcon = statusInfo.icon;
                      const impactInfo = impactConfig[risk.impact];
                      const probabilityInfo = probabilityConfig[risk.probability];
                      const riskLevel = getRiskLevel(risk.exposure);

                      return (
                        <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{risk.name}</p>
                              <p className="text-sm text-gray-500 capitalize">{risk.category}</p>
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
                            <div className={clsx(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              impactInfo.bg,
                              impactInfo.color
                            )}>
                              {impactInfo.label}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className={clsx(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              probabilityInfo.bg,
                              probabilityInfo.color
                            )}>
                              {probabilityInfo.label}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className={clsx(
                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                riskLevel.bg,
                                riskLevel.color
                              )}>
                                {riskLevel.level}
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{risk.exposure}/9</span>
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
                            <div>
                              <p className="text-sm text-gray-700 max-w-xs truncate" title={risk.mitigationPlan}>
                                {risk.mitigationPlan || 'Sin plan definido'}
                              </p>
                              <div className={`text-xs mt-1 ${
                                risk.mitigationStatus === 'completed' ? 'text-green-600' :
                                risk.mitigationStatus === 'in_progress' ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {risk.mitigationStatus === 'completed' ? 'Completado' :
                                 risk.mitigationStatus === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                              </div>
                            </div>
                          </td>
                          {canEditRisks && (
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleEditRisk(risk)}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Editar riesgo"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRisk(risk)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Eliminar riesgo"
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
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay riesgos registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Los riesgos se crean automáticamente al importar datos o se pueden crear manualmente.
            </p>
            <div className="flex justify-center space-x-4">
              {canCreateRisks && (
                <>
                  <button 
                    onClick={() => {
                      setEditingRisk(undefined);
                      setShowForm(true);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Crear Riesgo
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
        <RiskForm
          risk={editingRisk}
          onSave={handleSaveRisk}
          onCancel={() => {
            setShowForm(false);
            setEditingRisk(undefined);
          }}
        />
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Indicator } from '../../types';
import { areas } from '../../data/mockData';

interface IndicatorFormProps {
  indicator?: Indicator;
  onSave: (indicator: Omit<Indicator, 'id' | 'activities' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const IndicatorForm: React.FC<IndicatorFormProps> = ({
  indicator,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    area: 'quality',
    target: 0,
    actual: 0,
    measurementDate: new Date().toISOString().split('T')[0],
    responsible: '',
    status: 'at_risk' as const,
    observations: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data when indicator changes
  useEffect(() => {
    if (indicator) {
      console.log('📝 Cargando datos del indicador para edición:', indicator);
      setFormData({
        name: indicator.name,
        area: indicator.area,
        target: indicator.target,
        actual: indicator.actual,
        measurementDate: indicator.measurementDate,
        responsible: indicator.responsible,
        status: indicator.status,
        observations: indicator.observations,
      });
    } else {
      console.log('📝 Inicializando formulario para nuevo indicador');
      setFormData({
        name: '',
        area: 'quality',
        target: 0,
        actual: 0,
        measurementDate: new Date().toISOString().split('T')[0],
        responsible: '',
        status: 'at_risk' as const,
        observations: '',
      });
    }
  }, [indicator]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del indicador es requerido';
    }

    if (!formData.responsible.trim()) {
      newErrors.responsible = 'El responsable es requerido';
    }

    if (formData.target <= 0) {
      newErrors.target = 'La meta debe ser mayor a 0';
    }

    if (formData.actual < 0) {
      newErrors.actual = 'El valor real no puede ser negativo';
    }

    if (!formData.measurementDate) {
      newErrors.measurementDate = 'La fecha de medición es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Enviando formulario:', formData);
    
    if (validateForm()) {
      // Calculate status based on performance if not manually set to 'in_progress'
      const performance = (formData.actual / formData.target) * 100;
      let calculatedStatus = formData.status;
      
      // Only auto-calculate if not manually set to 'in_progress'
      if (formData.status !== 'in_progress') {
        if (performance >= 90) {
          calculatedStatus = 'achieved';
        } else if (performance >= 80) {
          calculatedStatus = 'at_risk';
        } else {
          calculatedStatus = 'critical';
        }
      }

      const finalData = {
        ...formData,
        status: calculatedStatus,
        name: formData.name.trim(),
        responsible: formData.responsible.trim(),
        observations: formData.observations.trim(),
      };

      console.log('✅ Datos finales a guardar:', finalData);
      onSave(finalData);
    } else {
      console.log('❌ Errores de validación:', errors);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {indicator ? 'Editar Indicador' : 'Nuevo Indicador'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Indicador *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Tiempo de Respuesta del Sistema"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área *
              </label>
              <select
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {areas.slice(1, -1).map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable *
              </label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.responsible ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre del responsable"
              />
              {errors.responsible && (
                <p className="mt-1 text-sm text-red-600">{errors.responsible}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta (%) *
              </label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) => handleInputChange('target', parseFloat(e.target.value) || 0)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.target ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="95"
                min="0"
                max="100"
                step="0.1"
              />
              {errors.target && (
                <p className="mt-1 text-sm text-red-600">{errors.target}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Real (%) *
              </label>
              <input
                type="number"
                value={formData.actual}
                onChange={(e) => handleInputChange('actual', parseFloat(e.target.value) || 0)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.actual ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="92"
                min="0"
                max="100"
                step="0.1"
              />
              {errors.actual && (
                <p className="mt-1 text-sm text-red-600">{errors.actual}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Medición *
              </label>
              <input
                type="date"
                value={formData.measurementDate}
                onChange={(e) => handleInputChange('measurementDate', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.measurementDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.measurementDate && (
                <p className="mt-1 text-sm text-red-600">{errors.measurementDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="achieved">Cumplido</option>
                <option value="at_risk">En Riesgo</option>
                <option value="critical">Crítico</option>
                <option value="in_progress">En Progreso</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                El estado se calculará automáticamente basado en el cumplimiento (excepto "En Progreso")
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Comentarios adicionales sobre el indicador..."
              />
            </div>
          </div>

          {/* Performance Preview */}
          {formData.target > 0 && formData.actual >= 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Vista Previa del Rendimiento</h4>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Cumplimiento: <span className="font-medium">{Math.round((formData.actual / formData.target) * 100)}%</span>
                </div>
                <div className={`text-sm font-medium ${
                  formData.status === 'in_progress' ? 'text-blue-600' :
                  (formData.actual / formData.target) * 100 >= 90 ? 'text-green-600' :
                  (formData.actual / formData.target) * 100 >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formData.status === 'in_progress' ? 'En Progreso' :
                   (formData.actual / formData.target) * 100 >= 90 ? 'Cumplido' :
                   (formData.actual / formData.target) * 100 >= 80 ? 'En Riesgo' : 'Crítico'}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{indicator ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
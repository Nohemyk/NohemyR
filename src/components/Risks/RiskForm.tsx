import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Risk } from '../../types';
import { areas } from '../../data/mockData';

interface RiskFormProps {
  risk?: Risk;
  onSave: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const RiskForm: React.FC<RiskFormProps> = ({
  risk,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    area: 'quality',
    category: 'operativo',
    impact: 'medio' as const,
    probability: 'media' as const,
    mitigationPlan: '',
    mitigationStatus: 'pending' as const,
    status: 'active' as const,
    responsible: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data when risk changes
  useEffect(() => {
    if (risk) {
      console.log('📝 Cargando datos del riesgo para edición:', risk);
      setFormData({
        name: risk.name,
        area: risk.area,
        category: risk.category,
        impact: risk.impact,
        probability: risk.probability,
        mitigationPlan: risk.mitigationPlan,
        mitigationStatus: risk.mitigationStatus,
        status: risk.status,
        responsible: risk.responsible,
      });
    } else {
      console.log('📝 Inicializando formulario para nuevo riesgo');
      setFormData({
        name: '',
        area: 'quality',
        category: 'operativo',
        impact: 'medio' as const,
        probability: 'media' as const,
        mitigationPlan: '',
        mitigationStatus: 'pending' as const,
        status: 'active' as const,
        responsible: '',
      });
    }
  }, [risk]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del riesgo es requerido';
    }

    if (!formData.responsible.trim()) {
      newErrors.responsible = 'El responsable es requerido';
    }

    if (!formData.mitigationPlan.trim()) {
      newErrors.mitigationPlan = 'El plan de mitigación es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateExposure = (impact: string, probability: string): number => {
    const impactValues = { bajo: 1, medio: 2, alto: 3 };
    const probabilityValues = { baja: 1, media: 2, alta: 3 };
    
    return impactValues[impact as keyof typeof impactValues] * 
           probabilityValues[probability as keyof typeof probabilityValues];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Enviando formulario de riesgo:', formData);
    
    if (validateForm()) {
      const exposure = calculateExposure(formData.impact, formData.probability);
      
      const finalData = {
        ...formData,
        exposure,
        name: formData.name.trim(),
        responsible: formData.responsible.trim(),
        mitigationPlan: formData.mitigationPlan.trim(),
      };

      console.log('✅ Datos finales del riesgo a guardar:', finalData);
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

  const exposure = calculateExposure(formData.impact, formData.probability);
  const exposureLevel = exposure >= 6 ? 'Alto' : exposure >= 4 ? 'Medio' : 'Bajo';
  const exposureColor = exposure >= 6 ? 'text-red-600' : exposure >= 4 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {risk ? 'Editar Riesgo' : 'Nuevo Riesgo'}
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
                Nombre del Riesgo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Falla en el sistema de respaldo"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {areas.slice(1, -1).map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="operativo">Operativo</option>
                <option value="tecnologico">Tecnológico</option>
                <option value="financiero">Financiero</option>
                <option value="regulatorio">Regulatorio</option>
                <option value="reputacional">Reputacional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impacto *
              </label>
              <select
                value={formData.impact}
                onChange={(e) => handleInputChange('impact', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Probabilidad *
              </label>
              <select
                value={formData.probability}
                onChange={(e) => handleInputChange('probability', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del Riesgo
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="active">Activo</option>
                <option value="monitoring">En Monitoreo</option>
                <option value="mitigated">Mitigado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Mitigación
              </label>
              <select
                value={formData.mitigationStatus}
                onChange={(e) => handleInputChange('mitigationStatus', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
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
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.responsible ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre del responsable"
              />
              {errors.responsible && (
                <p className="mt-1 text-sm text-red-600">{errors.responsible}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan de Mitigación *
              </label>
              <textarea
                value={formData.mitigationPlan}
                onChange={(e) => handleInputChange('mitigationPlan', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.mitigationPlan ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Describe las acciones para mitigar este riesgo..."
              />
              {errors.mitigationPlan && (
                <p className="mt-1 text-sm text-red-600">{errors.mitigationPlan}</p>
              )}
            </div>
          </div>

          {/* Risk Exposure Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Exposición al Riesgo</h4>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Puntuación: <span className="font-medium">{exposure}/9</span>
              </div>
              <div className={`text-sm font-medium ${exposureColor}`}>
                Nivel: {exposureLevel}
              </div>
              <div className="text-xs text-gray-500">
                (Impacto × Probabilidad)
              </div>
            </div>
          </div>

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
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{risk ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
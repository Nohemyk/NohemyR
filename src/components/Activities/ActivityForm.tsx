import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Activity } from '../../types';
import { areas } from '../../data/mockData';

interface ActivityFormProps {
  activity?: Activity;
  onSave: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  activity,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    indicatorId: '',
    area: 'quality',
    status: 'pending' as const,
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    estimatedEndDate: new Date().toISOString().split('T')[0],
    actualEndDate: '',
    responsible: '',
    observations: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data when activity changes
  useEffect(() => {
    if (activity) {
      console.log('📝 Cargando datos de la actividad para edición:', activity);
      setFormData({
        name: activity.name,
        indicatorId: activity.indicatorId,
        area: activity.area,
        status: activity.status,
        progress: activity.progress,
        startDate: activity.startDate,
        estimatedEndDate: activity.estimatedEndDate,
        actualEndDate: activity.actualEndDate || '',
        responsible: activity.responsible,
        observations: activity.observations,
      });
    } else {
      console.log('📝 Inicializando formulario para nueva actividad');
      setFormData({
        name: '',
        indicatorId: '',
        area: 'quality',
        status: 'pending' as const,
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        estimatedEndDate: new Date().toISOString().split('T')[0],
        actualEndDate: '',
        responsible: '',
        observations: '',
      });
    }
  }, [activity]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la actividad es requerido';
    }

    if (!formData.responsible.trim()) {
      newErrors.responsible = 'El responsable es requerido';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'El progreso debe estar entre 0 y 100';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }

    if (!formData.estimatedEndDate) {
      newErrors.estimatedEndDate = 'La fecha de fin estimada es requerida';
    }

    if (formData.startDate && formData.estimatedEndDate && formData.startDate > formData.estimatedEndDate) {
      newErrors.estimatedEndDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Enviando formulario de actividad:', formData);
    
    if (validateForm()) {
      const finalData = {
        ...formData,
        name: formData.name.trim(),
        responsible: formData.responsible.trim(),
        observations: formData.observations.trim(),
        actualEndDate: formData.actualEndDate || undefined,
      };

      console.log('✅ Datos finales de la actividad a guardar:', finalData);
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
            {activity ? 'Editar Actividad' : 'Nueva Actividad'}
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
                Nombre de la Actividad *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Implementación de nueva funcionalidad"
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
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Curso</option>
                <option value="completed">Finalizada</option>
                <option value="suspended">Suspendida</option>
                <option value="postponed">Aplazada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progreso (%) *
              </label>
              <input
                type="number"
                value={formData.progress}
                onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.progress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                max="100"
              />
              {errors.progress && (
                <p className="mt-1 text-sm text-red-600">{errors.progress}</p>
              )}
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
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin Estimada *
              </label>
              <input
                type="date"
                value={formData.estimatedEndDate}
                onChange={(e) => handleInputChange('estimatedEndDate', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.estimatedEndDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.estimatedEndDate && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedEndDate}</p>
              )}
            </div>

            {(formData.status === 'completed' || formData.status === 'suspended') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin Real
                </label>
                <input
                  type="date"
                  value={formData.actualEndDate}
                  onChange={(e) => handleInputChange('actualEndDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Comentarios adicionales sobre la actividad..."
              />
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{activity ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
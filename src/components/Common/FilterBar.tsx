import React from 'react';
import { Search, Filter, Calendar, BarChart3 } from 'lucide-react';
import { FilterState, Area } from '../../types';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  areas: Area[];
  showActivityStates?: boolean; // Nueva prop para mostrar estados de actividades
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  areas,
  showActivityStates = false,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={showActivityStates ? "Buscar actividades..." : "Buscar indicadores..."}
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Area Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filters.area}
            onChange={(e) => onFiltersChange({ ...filters, area: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter - Diferente para actividades vs indicadores */}
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {showActivityStates ? (
              // Estados específicos para actividades
              <>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Curso</option>
                <option value="completed">Finalizada</option>
                <option value="suspended">Suspendida</option>
                <option value="postponed">Aplazada</option>
              </>
            ) : (
              // Estados específicos para indicadores
              <>
                <option value="all">Todos los estados</option>
                <option value="achieved">Cumplidos</option>
                <option value="at_risk">En Riesgo</option>
                <option value="in_progress">En Progreso</option>
                <option value="critical">Críticos</option>
              </>
            )}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => onFiltersChange({
              ...filters,
              dateRange: { ...filters.dateRange, start: e.target.value }
            })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => onFiltersChange({
              ...filters,
              dateRange: { ...filters.dateRange, end: e.target.value }
            })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
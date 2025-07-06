import React from 'react';
import { 
  BarChart3, 
  Target, 
  Activity, 
  FileText, 
  ChevronRight,
  Building2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Upload,
  Shield,
  Clock
} from 'lucide-react';
import { Area, Indicator, Risk } from '../../types';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'indicators' | 'activities' | 'risks' | 'reports' | 'users' | 'import') => void;
  areas: Area[];
  selectedArea: string;
  onAreaChange: (areaId: string) => void;
  indicators?: Indicator[];
  risks?: Risk[];
}

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, roles: ['admin', 'area_manager', 'analyst', 'consultant'] },
  { id: 'indicators', name: 'Indicadores', icon: Target, roles: ['admin', 'area_manager', 'analyst', 'consultant'] },
  { id: 'activities', name: 'Actividades', icon: Activity, roles: ['admin', 'area_manager', 'analyst', 'consultant'] },
  { id: 'risks', name: 'Riesgos', icon: Shield, roles: ['admin', 'area_manager', 'analyst', 'consultant'] },
  { id: 'import', name: 'Importar Datos', icon: Upload, roles: ['admin', 'area_manager', 'analyst'] },
  { id: 'reports', name: 'Reportes', icon: FileText, roles: ['admin', 'area_manager', 'analyst', 'consultant'] },
  { id: 'users', name: 'Usuarios', icon: Users, roles: ['admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  areas,
  selectedArea,
  onAreaChange,
  indicators = [],
  risks = [],
}) => {
  const { user } = useAuth();

  const availableMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'consultant')
  );

  const availableAreas = user?.role === 'admin' 
    ? areas 
    : areas.filter(area => area.id === 'all' || area.id === user?.area);

  // Calcular estadísticas en tiempo real
  const stats = React.useMemo(() => {
    // Filtrar indicadores según el rol del usuario
    let filteredIndicators = indicators;
    if (user?.role !== 'admin') {
      if (user?.role === 'area_manager' || user?.role === 'analyst') {
        filteredIndicators = indicators.filter(indicator => indicator.area === user.area);
      }
    }

    // Filtrar riesgos según el rol del usuario
    let filteredRisks = risks;
    if (user?.role !== 'admin') {
      if (user?.role === 'area_manager' || user?.role === 'analyst') {
        filteredRisks = risks.filter(risk => risk.area === user.area);
      }
    }

    // Calcular estadísticas de indicadores
    const achieved = filteredIndicators.filter(i => i.status === 'achieved').length;
    const atRisk = filteredIndicators.filter(i => i.status === 'at_risk').length;
    const critical = filteredIndicators.filter(i => i.status === 'critical').length;
    const inProgress = filteredIndicators.filter(i => i.status === 'in_progress').length;

    // Calcular estadísticas de riesgos
    const activeRisks = filteredRisks.filter(r => r.status === 'active').length;

    return {
      achieved,
      atRisk,
      critical,
      inProgress,
      activeRisks,
      totalIndicators: filteredIndicators.length,
      totalRisks: filteredRisks.length
    };
  }, [indicators, risks, user]);

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Navigation Menu */}
        <nav className="space-y-2 mb-8">
          {availableMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                className={clsx(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Areas Filter */}
        {(currentView === 'dashboard' || currentView === 'indicators' || currentView === 'activities' || currentView === 'risks') && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Áreas
            </h3>
            <div className="space-y-1">
              {availableAreas.map((area) => {
                const isSelected = selectedArea === area.id;
                
                return (
                  <button
                    key={area.id}
                    onClick={() => onAreaChange(area.id)}
                    className={clsx(
                      'w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 text-left',
                      isSelected
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    )}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="text-sm font-medium truncate">{area.name}</span>
                    {isSelected && (
                      <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats - Actualizado con datos reales */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Estado General</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Cumplidos</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.achieved}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">En Progreso</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.inProgress}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">En Riesgo</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.atRisk}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">Críticos</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.critical}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Riesgos</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.activeRisks}</span>
            </div>
          </div>
          
          {/* Resumen total */}
          {stats.totalIndicators > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Total Indicadores:</span>
                  <span className="font-medium">{stats.totalIndicators}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Riesgos:</span>
                  <span className="font-medium">{stats.totalRisks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cumplimiento:</span>
                  <span className="font-medium">
                    {stats.totalIndicators > 0 ? Math.round((stats.achieved / stats.totalIndicators) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
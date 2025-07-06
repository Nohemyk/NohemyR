import React, { useState } from 'react';
import { Download, Calendar, BarChart3, FileText, PieChart, TrendingUp, Activity } from 'lucide-react';
import { Indicator, Risk } from '../../types';
import { areas } from '../../data/mockData';
import { exportToPDF, exportToExcel, generateExecutiveReport, generateAreaReport, exportRisksToExcel } from '../../utils/exportUtils';
import { ExecutiveReportChart } from './Charts/ExecutiveReportChart';
import { AreaReportChart } from './Charts/AreaReportChart';
import { TrendsAnalysisChart } from './Charts/TrendsAnalysisChart';
import { ActivitiesReportChart } from './Charts/ActivitiesReportChart';

interface ReportsViewProps {
  indicators: Indicator[];
  risks: Risk[];
  selectedArea: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  indicators,
  risks,
  selectedArea,
}) => {
  const [activeReport, setActiveReport] = useState<string>('executive');

  const reportTypes = [
    {
      id: 'executive',
      name: 'Reporte Ejecutivo',
      description: 'Resumen consolidado de todos los indicadores y KPIs',
      icon: BarChart3,
      color: 'bg-blue-500',
      format: ['PDF', 'Excel']
    },
    {
      id: 'area',
      name: 'Reporte por Área',
      description: 'Análisis detallado de indicadores por área específica',
      icon: PieChart,
      color: 'bg-green-500',
      format: ['PDF', 'Excel']
    },
    {
      id: 'trends',
      name: 'Análisis de Tendencias',
      description: 'Evolución histórica y proyecciones de rendimiento',
      icon: TrendingUp,
      color: 'bg-purple-500',
      format: ['PDF', 'Excel']
    },
    {
      id: 'activities',
      name: 'Reporte de Actividades',
      description: 'Estado y progreso de todas las actividades críticas',
      icon: Activity,
      color: 'bg-orange-500',
      format: ['PDF', 'Excel']
    }
  ];

  const handleDownload = async (reportType: string, format: string) => {
    try {
      console.log(`🎯 Generando reporte: ${reportType} en formato ${format}`);
      
      switch (reportType) {
        case 'executive':
          if (format === 'PDF') {
            await generateExecutiveReport(indicators, selectedArea, risks);
          } else {
            exportToExcel(indicators, 'reporte-ejecutivo');
          }
          break;
        case 'area':
          const areaIndicators = selectedArea === 'all' ? indicators : indicators.filter(i => i.area === selectedArea);
          if (format === 'PDF') {
            await generateAreaReport(areaIndicators, selectedArea, risks);
          } else {
            exportToExcel(areaIndicators, `reporte-area-${selectedArea}`);
          }
          break;
        case 'trends':
          if (format === 'PDF') {
            await exportToPDF(indicators, 'Análisis de Tendencias');
          } else {
            exportToExcel(indicators, 'analisis-tendencias');
          }
          break;
        case 'activities':
          const allActivities = indicators.flatMap(ind => ind.activities.map(act => ({ ...act, area: ind.area })));
          if (format === 'PDF') {
            await exportToPDF(indicators, 'Reporte de Actividades');
          } else {
            const { exportActivitiesToExcel } = require('../../utils/exportUtils');
            exportActivitiesToExcel(allActivities, 'reporte-actividades');
          }
          break;
      }
      
      console.log(`✅ Reporte ${reportType} generado exitosamente`);
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      alert('Error al generar el reporte. Por favor, intente nuevamente.');
    }
  };

  const renderReportChart = () => {
    switch (activeReport) {
      case 'executive':
        return <ExecutiveReportChart indicators={indicators} />;
      case 'area':
        return <AreaReportChart indicators={indicators} selectedArea={selectedArea} />;
      case 'trends':
        return <TrendsAnalysisChart indicators={indicators} />;
      case 'activities':
        return <ActivitiesReportChart indicators={indicators} />;
      default:
        return <ExecutiveReportChart indicators={indicators} />;
    }
  };

  const activeReportData = reportTypes.find(r => r.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Reportes</h1>
          <p className="text-gray-600 mt-1">
            Genera y visualiza reportes personalizados del sistema de indicadores
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Indicadores Totales</p>
              <p className="text-2xl font-bold text-gray-900">{indicators.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cumplimiento Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.length > 0 ? Math.round(indicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / indicators.length) : 0}%
              </p>
            </div>
            <PieChart className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Riesgo</p>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.filter(i => i.status === 'at_risk' || i.status === 'critical').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actividades</p>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.reduce((acc, ind) => acc + ind.activities.length, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Tipo de Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isActive = activeReport === report.id;
            
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${report.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{report.name}</h3>
                <p className="text-xs text-gray-600">{report.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {activeReportData?.name}
          </h2>
          <div className="flex items-center space-x-2">
            {activeReportData?.format.map((format) => (
              <button
                key={format}
                onClick={() => handleDownload(activeReport, format)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                disabled={indicators.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>Descargar {format}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="h-96 charts-container">
          {renderReportChart()}
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Constructor de Reportes Personalizados</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Area Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Mes actual</option>
              <option>Trimestre actual</option>
              <option>Año actual</option>
              <option>Personalizado</option>
            </select>
          </div>
          
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Detallado</option>
              <option>Resumen</option>
              <option>Solo gráficos</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => handleDownload('executive', 'PDF')}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={indicators.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Generar PDF</span>
          </button>
          <button
            onClick={() => handleDownload('executive', 'Excel')}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={indicators.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Generar Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
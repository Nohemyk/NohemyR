import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Indicator } from '../../../types';
import { areas } from '../../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ExecutiveReportChartProps {
  indicators: Indicator[];
}

export const ExecutiveReportChart: React.FC<ExecutiveReportChartProps> = ({ indicators }) => {
  if (indicators.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No hay datos para mostrar</p>
          <p className="text-gray-400 text-sm mt-2">Importe indicadores para generar gráficos</p>
        </div>
      </div>
    );
  }

  // Cumplimiento por área
  const areaPerformance = areas.slice(1, -1).map(area => {
    const areaIndicators = indicators.filter(ind => ind.area === area.id);
    const avgCompliance = areaIndicators.length > 0 
      ? areaIndicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / areaIndicators.length 
      : 0;
    
    return {
      area: area.name,
      compliance: avgCompliance,
      color: area.color
    };
  });

  // Estado de indicadores - INCLUYE IN_PROGRESS
  const statusCounts = indicators.reduce(
    (acc, indicator) => {
      acc[indicator.status]++;
      return acc;
    },
    { achieved: 0, at_risk: 0, critical: 0, in_progress: 0 }
  );

  const barData = {
    labels: areaPerformance.map(item => item.area),
    datasets: [
      {
        label: 'Cumplimiento (%)',
        data: areaPerformance.map(item => item.compliance),
        backgroundColor: areaPerformance.map(item => item.color),
        borderColor: areaPerformance.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Cumplidos', 'En Riesgo', 'Críticos', 'En Progreso'],
    datasets: [
      {
        data: [statusCounts.achieved, statusCounts.at_risk, statusCounts.critical, statusCounts.in_progress],
        backgroundColor: ['#059669', '#D97706', '#DC2626', '#2563EB'],
        borderColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
        borderWidth: 2,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Cumplimiento por Área (%)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribución por Estado',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="bg-gray-50 rounded-lg p-4">
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <Doughnut data={doughnutData} options={doughnutOptions} />
      </div>
    </div>
  );
};
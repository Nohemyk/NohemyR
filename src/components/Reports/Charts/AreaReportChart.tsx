import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Indicator } from '../../../types';
import { areas, generateHistoricalData } from '../../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface AreaReportChartProps {
  indicators: Indicator[];
  selectedArea: string;
}

export const AreaReportChart: React.FC<AreaReportChartProps> = ({ indicators, selectedArea }) => {
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

  const area = areas.find(a => a.id === selectedArea);
  const areaIndicators = selectedArea === 'all' ? indicators : indicators.filter(ind => ind.area === selectedArea);

  // Datos históricos para el área
  const historicalData = generateHistoricalData(selectedArea, 8);
  const labels = historicalData.map(d => d.month);

  // Indicadores individuales del área
  const indicatorData = {
    labels: areaIndicators.map(ind => ind.name.length > 15 ? ind.name.substring(0, 15) + '...' : ind.name),
    datasets: [
      {
        label: 'Meta',
        data: areaIndicators.map(ind => ind.target),
        backgroundColor: '#E5E7EB',
        borderColor: '#9CA3AF',
        borderWidth: 1,
      },
      {
        label: 'Real',
        data: areaIndicators.map(ind => ind.actual),
        backgroundColor: area?.color || '#6B7280',
        borderColor: area?.color || '#6B7280',
        borderWidth: 1,
      },
    ],
  };

  const trendData = {
    labels,
    datasets: [
      {
        label: `Tendencia ${area?.name || 'General'}`,
        data: historicalData.map(d => d.value),
        borderColor: area?.color || '#6B7280',
        backgroundColor: `${area?.color || '#6B7280'}20`,
        fill: true,
        tension: 0.4,
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
        text: `Indicadores - ${area?.name || 'Todas las Áreas'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución Histórica (Desde Abril 2025)',
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="bg-gray-50 rounded-lg p-4">
        <Bar data={indicatorData} options={barOptions} />
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <Line data={trendData} options={lineOptions} />
      </div>
    </div>
  );
};
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Indicator } from '../../../types';
import { areas, generateHistoricalData, SYSTEM_START_DATE } from '../../../data/mockData';
import { format, addMonths } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TrendsAnalysisChartProps {
  indicators: Indicator[];
}

export const TrendsAnalysisChart: React.FC<TrendsAnalysisChartProps> = ({ indicators }) => {
  if (indicators.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No hay datos para mostrar</p>
          <p className="text-gray-400 text-sm mt-2">Importe indicadores para generar análisis de tendencias</p>
        </div>
      </div>
    );
  }

  // Generar etiquetas desde abril 2025
  const currentDate = new Date();
  const monthsFromStart = Math.max(1, Math.floor((currentDate.getTime() - SYSTEM_START_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const labels = Array.from({ length: Math.min(monthsFromStart + 1, 12) }, (_, i) => 
    format(addMonths(SYSTEM_START_DATE, i), 'MMM yyyy')
  );

  // Datos de tendencia por área
  const trendData = {
    labels,
    datasets: areas.slice(1, -1).map((area) => {
      const historicalData = generateHistoricalData(area.id, labels.length);
      
      return {
        label: area.name,
        data: historicalData.map(d => d.value),
        borderColor: area.color,
        backgroundColor: `${area.color}20`,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: area.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      };
    }),
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      title: {
        display: true,
        text: 'Análisis de Tendencias Históricas',
        font: {
          size: 14,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="h-full">
      <Line data={trendData} options={trendOptions} />
    </div>
  );
};
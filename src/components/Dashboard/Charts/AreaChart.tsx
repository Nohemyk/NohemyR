import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Indicator } from '../../../types';
import { areas, generateHistoricalData, SYSTEM_START_DATE, hasSystemData } from '../../../data/mockData';
import { format, addMonths } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface AreaChartProps {
  indicators: Indicator[];
}

export const AreaChart: React.FC<AreaChartProps> = ({ indicators }) => {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  // Solo mostrar datos si hay indicadores en el sistema
  if (!hasSystemData() || indicators.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No hay datos históricos disponibles</p>
          <p className="text-gray-400 text-sm mt-2">
            Los datos históricos se generan automáticamente desde abril 2025 cuando se cargan indicadores
          </p>
        </div>
      </div>
    );
  }

  // Generar etiquetas desde abril 2025 hasta la fecha actual
  const currentDate = new Date();
  const monthsFromStart = Math.max(1, Math.floor((currentDate.getTime() - SYSTEM_START_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const actualMonths = Math.min(monthsFromStart + 1, 12);
  
  const labels = Array.from({ length: actualMonths }, (_, i) => 
    format(addMonths(SYSTEM_START_DATE, i), 'MMM yyyy')
  );

  console.log(`📊 Generando gráfico de área con ${actualMonths} meses desde abril 2025`);

  const data = {
    labels,
    datasets: areas.slice(1, -1).map((area, index) => {
      const areaIndicators = indicators.filter(ind => ind.area === area.id);
      
      // Solo generar datos históricos si hay indicadores en esta área
      const historicalData = areaIndicators.length > 0 
        ? generateHistoricalData(area.id, actualMonths)
        : [];
      
      return {
        label: area.name,
        data: historicalData.map(d => d.value),
        borderColor: area.color,
        backgroundColor: `${area.color}20`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: area.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }).filter(dataset => dataset.data.some(value => value > 0)), // Solo mostrar áreas con datos
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
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
            size: 11,
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
            size: 11,
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
    elements: {
      line: {
        borderWidth: 3,
      },
    },
  };

  return (
    <div className="h-64">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};
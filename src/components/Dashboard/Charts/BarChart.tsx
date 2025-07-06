import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Indicator } from '../../../types';
import { areas } from '../../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  indicators: Indicator[];
}

export const BarChart: React.FC<BarChartProps> = ({ indicators }) => {
  const data = {
    labels: indicators.map(ind => ind.name.length > 20 ? ind.name.substring(0, 20) + '...' : ind.name),
    datasets: [
      {
        label: 'Meta',
        data: indicators.map(ind => ind.target),
        backgroundColor: '#E5E7EB',
        borderColor: '#9CA3AF',
        borderWidth: 1,
      },
      {
        label: 'Real',
        data: indicators.map(ind => ind.actual),
        backgroundColor: indicators.map(ind => {
          const area = areas.find(a => a.id === ind.area);
          return area ? area.color : '#6B7280';
        }),
        borderColor: indicators.map(ind => {
          const area = areas.find(a => a.id === ind.area);
          return area ? area.color : '#6B7280';
        }),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};
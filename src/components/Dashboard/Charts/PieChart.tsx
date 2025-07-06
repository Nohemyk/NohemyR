import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Indicator } from '../../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  indicators: Indicator[];
}

export const PieChart: React.FC<PieChartProps> = ({ indicators }) => {
  const statusCounts = indicators.reduce(
    (acc, indicator) => {
      acc[indicator.status]++;
      return acc;
    },
    { achieved: 0, at_risk: 0, critical: 0, in_progress: 0 }
  );

  const data = {
    labels: ['Cumplidos', 'En Riesgo', 'Críticos', 'En Progreso'],
    datasets: [
      {
        data: [statusCounts.achieved, statusCounts.at_risk, statusCounts.critical, statusCounts.in_progress],
        backgroundColor: ['#059669', '#D97706', '#DC2626', '#2563EB'],
        borderColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
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
        },
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
    cutout: '60%',
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};
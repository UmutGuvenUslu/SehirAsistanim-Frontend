import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#4ade80",
  "#60a5fa",
  "#facc15",
  "#f87171",
  "#a78bfa",
  "#fb923c",
  "#3b82f6",
  "#22c55e",
];

export default function ComplaintPieChart({ data }) {
  // data: [{ name: string, amount: number }]
  const labels = data.map((item) => item.name);
  const amounts = data.map((item) => item.amount);

  const chartData = {
    labels,
    datasets: [
      {
        data: amounts,
        backgroundColor: labels.map(
          (_, i) => COLORS[i % COLORS.length]
        ),
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 30,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          font: { size: 14 },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}

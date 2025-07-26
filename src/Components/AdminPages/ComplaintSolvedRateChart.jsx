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
  "#22c55e",
  "#3b82f6",
  "#fbbf24",
  "#ef4444",
  "#a78bfa",
  "#fb923c",
];

export default function ComplaintSolvedRateChart({ data }) {
  // data: şikayetler, içinde durum ve tür var
  const distribution = Object.values(
    data.reduce((acc, curr) => {
      const key = curr.sikayetTuruAdi || "Diğer";
      if (!acc[key]) acc[key] = { name: key, resolved: 0, total: 0 };
      acc[key].total++;
      if (curr.durum === "Cozuldu") acc[key].resolved++;
      return acc;
    }, {})
  ).map((item) => ({
    name: item.name,
    amount: item.total ? Math.round((item.resolved / item.total) * 100) : 0,
  }));

  const labels = distribution.map((d) => d.name);
  const amounts = distribution.map((d) => d.amount);

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
        labels: { padding: 15, font: { size: 14 } },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: %${value}`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}

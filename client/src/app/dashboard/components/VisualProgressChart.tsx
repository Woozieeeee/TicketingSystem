"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface VisualProgressChartProps {
  chartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const VisualProgressChart: React.FC<VisualProgressChartProps> = ({
  chartData,
}) => {
  const router = useRouter();

  return (
    <div className="flex-1 p-6 flex flex-col min-h-[350px] w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 text-slate-600">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} />
          <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            Visual Progress
          </span>
        </div>
        <p className="text-[9px] font-bold text-slate-400 italic">
          Click a bar to filter results
        </p>
      </div>

      <div className="w-full h-[280px] relative min-w-0 block">
        <div className="absolute inset-0">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              onClick={(data) =>
                data &&
                router.push(`/tickets?filter=${data.activeLabel}`)
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                  fontWeight: 800,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                }}
                itemStyle={{ fontWeight: "bold" }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
                animationDuration={1000}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VisualProgressChart;
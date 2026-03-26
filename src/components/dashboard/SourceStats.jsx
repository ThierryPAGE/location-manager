import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const SOURCE_CONFIG = {
  airbnb: { label: "Airbnb", color: "#FF5A5F" },
  booking: { label: "Booking", color: "#003580" },
  leboncoin: { label: "Le Bon Coin", color: "#FF6E14" },
  site_loc_oleron: { label: "Site Loc Oléron", color: "#3b82f6" },
  direct: { label: "Direct", color: "#10b981" },
  other: { label: "Autre", color: "#6b7280" }
};

export default function SourceStats({ bookings }) {
  const sourceData = Object.entries(SOURCE_CONFIG).map(([key, config]) => {
    const count = bookings.filter(b => b.source === key).length;
    return {
      name: config.label,
      value: count,
      color: config.color
    };
  }).filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = sourceData.reduce((sum, d) => sum + d.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
          <p className="font-medium text-slate-900">{payload[0].name}</p>
          <p className="text-sm text-slate-600">
            {payload[0].value} réservation(s) ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Origine des demandes</CardTitle>
      </CardHeader>
      <CardContent>
        {sourceData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucune donnée disponible</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SOURCE_COLORS = {
  airbnb: '#FF5A5F',
  booking: '#003580',
  leboncoin: '#FF6E14',
  site_loc_oleron: '#3b82f6',
  direct: '#10b981',
  other: '#6b7280'
};

const SOURCE_LABELS = {
  airbnb: 'Airbnb',
  booking: 'Booking',
  leboncoin: 'Le Bon Coin',
  site_loc_oleron: 'Site Loc Oléron',
  direct: 'Direct',
  other: 'Autre'
};

export default function RevenueByProperty({ bookings, properties }) {
  const revenueData = properties.map((property) => {
    const propertyBookings = bookings.filter(
      b => b.property_id === property.id && 
      ['confirmed', 'deposit_paid', 'balance_paid', 'deposit_returned', 'completed'].includes(b.status)
    );
    
    const dataPoint = {
      name: property.name,
      total: 0
    };

    // Calculate revenue by source
    Object.keys(SOURCE_COLORS).forEach(source => {
      const sourceRevenue = propertyBookings
        .filter(b => b.source === source)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      if (sourceRevenue > 0) {
        dataPoint[source] = sourceRevenue;
        dataPoint.total += sourceRevenue;
      }
    });

    return dataPoint;
  }).filter(d => d.total > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
          <p className="font-medium text-slate-900 mb-2">{payload[0].payload.name}</p>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Total: {total.toLocaleString('fr-FR')} €
          </p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-600">{SOURCE_LABELS[entry.dataKey]}</span>
                </div>
                <span className="font-medium text-slate-900">
                  {entry.value.toLocaleString('fr-FR')} €
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Chiffre d'affaires par bien</CardTitle>
      </CardHeader>
      <CardContent>
        {revenueData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucune donnée de CA disponible</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} layout="vertical" margin={{ left: 20, right: 20, bottom: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `${v.toLocaleString('fr-FR')} €`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => SOURCE_LABELS[value]}
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="circle"
                />
                {Object.keys(SOURCE_COLORS).map((source) => (
                  <Bar 
                    key={source}
                    dataKey={source} 
                    stackId="revenue"
                    fill={SOURCE_COLORS[source]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home } from 'lucide-react';

const STATUS_CONFIG = {
  request: { label: "Demande", color: "bg-slate-100 text-slate-700", order: 1 },
  first_contact: { label: "1er contact", color: "bg-blue-100 text-blue-700", order: 2 },
  quote_sent: { label: "Devis envoyé", color: "bg-amber-100 text-amber-700", order: 3 },
  contract_sent: { label: "Contrat envoyé", color: "bg-purple-100 text-purple-700", order: 4 },
  confirmed: { label: "Confirmée", color: "bg-indigo-100 text-indigo-700", order: 5 },
  deposit_paid: { label: "Acompte payé", color: "bg-emerald-100 text-emerald-700", order: 6 },
  balance_paid: { label: "Solde payé", color: "bg-teal-100 text-teal-700", order: 7 },
  deposit_returned: { label: "Caution rendue", color: "bg-green-100 text-green-700", order: 8 },
  completed: { label: "Terminée", color: "bg-green-100 text-green-700", order: 9 },
  cancelled: { label: "Annulée", color: "bg-rose-100 text-rose-700", order: 10 }
};

const SOURCE_LABELS = {
  airbnb: "Airbnb",
  booking: "Booking",
  leboncoin: "Le Bon Coin",
  site_loc_oleron: "Site Loc Oléron",
  direct: "Direct",
  other: "Autre"
};

export default function BookingPipeline({ bookings, properties }) {
  const { data: personalBookings = [] } = useQuery({
    queryKey: ['personalBookings'],
    queryFn: () => base44.entities.PersonalBooking.list('check_in')
  });

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "Bien inconnu";
  };

  const activeBookings = bookings
    .filter(b => !['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

  // Merge and sort with personal bookings
  const allItems = [
    ...activeBookings.map(b => ({ ...b, _type: 'booking' })),
    ...personalBookings.map(pb => ({ ...pb, _type: 'personal' }))
  ].sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Pipeline des réservations</CardTitle>
      </CardHeader>
      <CardContent>
        {allItems.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucune réservation en cours</p>
        ) : (
          <div className="space-y-3">
            {allItems.map((item) => {
              if (item._type === 'personal') {
                return (
                  <div key={item.id} className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-orange-800 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Usage personnel
                      </span>
                      <Badge className="bg-orange-100 text-orange-700 border-0">Perso</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-orange-600">
                      <span>{getPropertyName(item.property_id)}</span>
                      <span>•</span>
                      <span>{format(new Date(item.check_in), 'dd MMM', { locale: fr })} - {format(new Date(item.check_out), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                    {item.notes && (
                      <div className="mt-2 text-sm text-orange-600 italic">{item.notes}</div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.id}
                  to={createPageUrl(`BookingDetail?id=${item.id}`)}
                  className="block"
                >
                  <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">
                        {item.guest_first_name} {item.guest_last_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{SOURCE_LABELS[item.source] || item.source_other}</span>
                        <Badge className={`${STATUS_CONFIG[item.status].color} border-0`}>
                          {STATUS_CONFIG[item.status].label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{getPropertyName(item.property_id)}</span>
                      <span>•</span>
                      <span>{format(new Date(item.check_in), 'dd MMM', { locale: fr })} - {format(new Date(item.check_out), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                    {item.total_amount > 0 && (
                      <div className="mt-2 text-sm font-medium text-slate-700">
                        {item.total_amount.toLocaleString('fr-FR')} €
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
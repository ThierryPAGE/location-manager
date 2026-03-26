import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  request: { label: "Demande", color: "bg-slate-100 text-slate-700" },
  first_contact: { label: "1er contact", color: "bg-blue-100 text-blue-700" },
  quote_sent: { label: "Devis envoyé", color: "bg-amber-100 text-amber-700" },
  contract_sent: { label: "Contrat envoyé", color: "bg-purple-100 text-purple-700" },
  confirmed: { label: "Confirmée", color: "bg-indigo-100 text-indigo-700" },
  deposit_paid: { label: "Acompte payé", color: "bg-emerald-100 text-emerald-700" },
  balance_paid: { label: "Solde payé", color: "bg-teal-100 text-teal-700" },
  deposit_returned: { label: "Caution rendue", color: "bg-green-100 text-green-700" },
  completed: { label: "Terminée", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée", color: "bg-rose-100 text-rose-700" }
};

const SOURCE_LABELS = {
  airbnb: "Airbnb",
  booking: "Booking",
  leboncoin: "Le Bon Coin",
  site_loc_oleron: "Site Loc Oléron",
  direct: "Direct",
  other: "Autre"
};

export default function Bookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('check_in')
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "—";
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.guest_first_name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.guest_last_name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.guest_email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || booking.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Réservations</h1>
            <p className="text-slate-500 mt-1">{bookings.length} réservation(s) au total</p>
          </div>
          <Link to={createPageUrl('NewBooking')}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle réservation
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Rechercher un locataire..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Toutes les origines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les origines</SelectItem>
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune réservation</h3>
              <p className="text-slate-500 text-center">Aucune réservation ne correspond à vos critères</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <Link key={booking.id} to={createPageUrl(`BookingDetail?id=${booking.id}`)}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900">
                            {booking.guest_first_name} {booking.guest_last_name}
                          </h3>
                          <Badge className={`${STATUS_CONFIG[booking.status]?.color} border-0`}>
                            {STATUS_CONFIG[booking.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span>{getPropertyName(booking.property_id)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(booking.check_in), 'dd MMM', { locale: fr })} - {format(new Date(booking.check_out), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span>•</span>
                          <span>{SOURCE_LABELS[booking.source] || booking.source_other}</span>
                          {booking.total_amount > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-slate-700">{booking.total_amount.toLocaleString('fr-FR')} €</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
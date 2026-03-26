import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Download, Euro, TrendingUp, Calendar, Filter } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Accounting() {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('paid');

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('check_in')
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const checkInDate = parseISO(booking.check_in);
      const dateMatch = isWithinInterval(checkInDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });

      const propertyMatch = propertyFilter === 'all' || booking.property_id === propertyFilter;
      
      let statusMatch = false;
      if (statusFilter === 'paid') {
        statusMatch = ['deposit_paid', 'balance_paid', 'deposit_returned', 'completed'].includes(booking.status);
      } else if (statusFilter === 'pending') {
        statusMatch = ['quote_sent', 'contract_sent'].includes(booking.status);
      } else {
        statusMatch = true;
      }

      return dateMatch && propertyMatch && statusMatch;
    });
  }, [bookings, startDate, endDate, propertyFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalPaid = filteredBookings.reduce((sum, b) => 
      sum + (b.deposit_paid || 0) + (b.balance_paid || 0), 0
    );
    const totalPending = filteredBookings
      .filter(b => ['quote_sent', 'contract_sent', 'confirmed'].includes(b.status))
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgNightlyRate = filteredBookings.length > 0
      ? filteredBookings.reduce((sum, b) => sum + (b.price_per_night || 0), 0) / filteredBookings.length
      : 0;
    const totalConciergeFees = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.concierge_fee) || 0), 0);
    const totalHostServiceFees = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.host_service_fee) || 0), 0);
    const totalFees = totalConciergeFees + totalHostServiceFees;
    const grossMargin = totalRevenue - totalFees;

    return { totalRevenue, totalPaid, totalPending, avgNightlyRate, totalConciergeFees, totalHostServiceFees, totalFees, grossMargin };
  }, [filteredBookings]);

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "—";
  };

  const exportToCSV = () => {
    const headers = [
      'Date arrivée',
      'Date départ',
      'Bien',
      'Locataire',
      'Nuits',
      'Loyer',
      'Ménage',
      'Taxe séjour',
      'Options',
      'Total',
      'Acompte reçu',
      'Solde reçu',
      'Conciergerie',
      'Frais hôte',
      'Marge brute',
      'Statut'
    ];

    const rows = filteredBookings.map(booking => [
      format(new Date(booking.check_in), 'dd/MM/yyyy'),
      format(new Date(booking.check_out), 'dd/MM/yyyy'),
      getPropertyName(booking.property_id),
      `${booking.guest_first_name} ${booking.guest_last_name}`,
      booking.num_nights || '',
      booking.subtotal_nights?.toFixed(2) || '0',
      booking.cleaning_fee?.toFixed(2) || '0',
      booking.tourist_tax_total?.toFixed(2) || '0',
      booking.options_total?.toFixed(2) || '0',
      booking.total_amount?.toFixed(2) || '0',
      (booking.deposit_paid || 0).toFixed(2),
      (booking.balance_paid || 0).toFixed(2),
      (booking.concierge_fee || 0).toFixed(2),
      (booking.host_service_fee || 0).toFixed(2),
      ((booking.total_amount || 0) - (parseFloat(booking.concierge_fee) || 0) - (parseFloat(booking.host_service_fee) || 0)).toFixed(2),
      booking.status
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-comptable-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Comptabilité</h1>
            <p className="text-slate-500 mt-1">Export et analyse des revenus</p>
          </div>
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter en CSV
          </Button>
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Date de début</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Bien</Label>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les biens</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut paiement</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="paid">Payées</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">CA Total</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats.totalRevenue.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Euro className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Frais totaux</p>
                  <p className="text-2xl font-bold text-rose-900 mt-1">
                    {stats.totalFees.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Conciergerie: {stats.totalConciergeFees.toLocaleString('fr-FR')} €<br/>
                    Frais hôte: {stats.totalHostServiceFees.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50">
                  <Euro className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Marge brute</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {stats.grossMargin.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.totalRevenue > 0 ? ((stats.grossMargin / stats.totalRevenue) * 100).toFixed(1) : 0}% du CA
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Encaissé</p>
                  <p className="text-2xl font-bold text-teal-900 mt-1">
                    {stats.totalPaid.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    En attente: {stats.totalPending.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-50">
                  <Calendar className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Détail des réservations ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dates</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead className="text-right">Nuits</TableHead>
                    <TableHead className="text-right">Loyer</TableHead>
                    <TableHead className="text-right">Charges</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Encaissé</TableHead>
                    <TableHead className="text-right">Conciergerie</TableHead>
                    <TableHead className="text-right">Frais hôte</TableHead>
                    <TableHead className="text-right">Marge brute</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map(booking => {
                    const totalPaid = (booking.deposit_paid || 0) + (booking.balance_paid || 0);
                    const charges = (booking.cleaning_fee || 0) + (booking.tourist_tax_total || 0) + (booking.options_total || 0);
                    const conciergeFee = parseFloat(booking.concierge_fee) || 0;
                    const hostServiceFee = parseFloat(booking.host_service_fee) || 0;
                    const grossMargin = (booking.total_amount || 0) - conciergeFee - hostServiceFee;
                    
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(booking.check_in), 'dd/MM/yyyy')}</div>
                            <div className="text-slate-500">{format(new Date(booking.check_out), 'dd/MM/yyyy')}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPropertyName(booking.property_id)}</TableCell>
                        <TableCell>{booking.guest_first_name} {booking.guest_last_name}</TableCell>
                        <TableCell className="text-right">{booking.num_nights}</TableCell>
                        <TableCell className="text-right">{booking.subtotal_nights?.toLocaleString('fr-FR')} €</TableCell>
                        <TableCell className="text-right">{charges.toLocaleString('fr-FR')} €</TableCell>
                        <TableCell className="text-right font-medium">{booking.total_amount?.toLocaleString('fr-FR')} €</TableCell>
                        <TableCell className="text-right">
                          <span className={totalPaid >= booking.total_amount ? 'text-green-600 font-medium' : 'text-amber-600'}>
                            {totalPaid.toLocaleString('fr-FR')} €
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {conciergeFee > 0 ? `${conciergeFee.toLocaleString('fr-FR')} €` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {hostServiceFee > 0 ? `${hostServiceFee.toLocaleString('fr-FR')} €` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-700">
                          {grossMargin.toLocaleString('fr-FR')} €
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
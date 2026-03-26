import React from 'react';
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Plus, Home, Calendar, Euro, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import BookingPipeline from '@/components/dashboard/BookingPipeline';
import RevenueByProperty from '@/components/dashboard/RevenueByProperty';
import SourceStats from '@/components/dashboard/SourceStats';
import BookingCalendar from '@/components/calendar/BookingCalendar';
import PersonalBookingManager from '@/components/dashboard/PersonalBookingManager';

export default function Dashboard() {
  const [showPersonalBookings, setShowPersonalBookings] = useState(false);

  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date')
  });

  const isLoading = loadingProperties || loadingBookings;

  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const totalRevenue = bookings
    .filter(b => ['confirmed', 'deposit_paid', 'balance_paid', 'deposit_returned', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  
  const forecastRevenue = bookings
    .filter(b => ['contract_sent', 'confirmed', 'deposit_paid', 'balance_paid', 'deposit_returned', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  
  const pendingPayments = bookings
    .filter(b => ['quote_sent', 'contract_sent', 'confirmed'].includes(b.status))
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-slate-500 mt-1">Gérez vos locations saisonnières</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPersonalBookings(true)} className="border-orange-300 text-orange-600 hover:bg-orange-50">
              <Home className="w-4 h-4 mr-2" />
              Dates perso
            </Button>
            <Link to={createPageUrl('NewBooking')}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle réservation
              </Button>
            </Link>
          </div>
          <PersonalBookingManager
            properties={properties}
            open={showPersonalBookings}
            onOpenChange={setShowPersonalBookings}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title="Biens actifs" 
                value={properties.length}
                icon={Home}
                color="blue"
              />
              <StatCard 
                title="Réservations en cours" 
                value={activeBookings.length}
                icon={Calendar}
                color="purple"
              />
              <StatCard 
                title="CA prévisionnel" 
                value={`${forecastRevenue.toLocaleString('fr-FR')} €`}
                subtitle="Contrats envoyés et confirmés"
                icon={TrendingUp}
                color="indigo"
              />
              <StatCard 
                title="Chiffre d'affaires" 
                value={`${totalRevenue.toLocaleString('fr-FR')} €`}
                subtitle="Réservations confirmées"
                icon={Euro}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <BookingPipeline bookings={bookings} properties={properties} />
              </div>
              <div>
                <SourceStats bookings={bookings} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <BookingCalendar bookings={bookings} properties={properties} />
              <RevenueByProperty bookings={bookings} properties={properties} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
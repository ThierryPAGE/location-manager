import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STATUS_COLORS = {
  request: "bg-slate-300",
  first_contact: "bg-blue-400",
  quote_sent: "bg-amber-400",
  contract_sent: "bg-purple-400",
  confirmed: "bg-indigo-400",
  deposit_paid: "bg-emerald-400",
  balance_paid: "bg-teal-400",
  deposit_returned: "bg-green-400",
  completed: "bg-green-500",
  cancelled: "bg-rose-400"
};

export default function BookingCalendar({ bookings, properties }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: personalBookings = [] } = useQuery({
    queryKey: ['personalBookings'],
    queryFn: () => base44.entities.PersonalBooking.list('check_in')
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getBookingsForDay = (day) => {
    const seriousStatuses = ['quote_sent', 'contract_sent', 'confirmed', 'deposit_paid', 'balance_paid', 'deposit_returned', 'completed'];
    return bookings.filter(booking => {
      if (!seriousStatuses.includes(booking.status)) return false;
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return isWithinInterval(day, { start: checkIn, end: checkOut }) || 
             isSameDay(day, checkIn) || 
             isSameDay(day, checkOut);
    });
  };

  const getPersonalBookingsForDay = (day) => {
    return personalBookings.filter(pb => {
      const checkIn = parseISO(pb.check_in);
      const checkOut = parseISO(pb.check_out);
      return isWithinInterval(day, { start: checkIn, end: checkOut }) ||
             isSameDay(day, checkIn) ||
             isSameDay(day, checkOut);
    });
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "";
  };

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Calendrier des réservations</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
          
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {days.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const dayPersonal = getPersonalBookingsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square p-1 rounded-lg border border-slate-100
                  ${isToday(day) ? 'bg-blue-50 border-blue-200' : 'bg-white'}
                  ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                `}
              >
                <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-slate-600'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-hidden max-h-12">
                  {dayPersonal.map((pb) => (
                    <div
                      key={pb.id}
                      className="text-[10px] px-1 py-0.5 rounded truncate text-white bg-orange-400"
                      title={`Usage perso - ${getPropertyName(pb.property_id)}${pb.notes ? ` - ${pb.notes}` : ''}`}
                    >
                      🏠 Perso
                    </div>
                  ))}
                  {dayBookings.slice(0, 2 - dayPersonal.length).map((booking) => (
                    <Link 
                      key={booking.id}
                      to={createPageUrl(`BookingDetail?id=${booking.id}`)}
                    >
                      <div 
                        className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${STATUS_COLORS[booking.status]}`}
                        title={`${booking.guest_last_name} - ${getPropertyName(booking.property_id)}`}
                      >
                        {booking.guest_last_name}
                      </div>
                    </Link>
                  ))}
                  {(dayBookings.length + dayPersonal.length) > 2 && (
                    <div className="text-[10px] text-slate-500 px-1">
                      +{dayBookings.length + dayPersonal.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span>Usage perso</span>
          </div>
          {['quote_sent', 'contract_sent', 'confirmed', 'deposit_paid', 'balance_paid', 'deposit_returned', 'completed'].map((status) => (
            <div key={status} className="flex items-center gap-1 text-xs text-slate-600">
              <div className={`w-3 h-3 rounded ${STATUS_COLORS[status]}`} />
              <span>
                {status === 'quote_sent' && 'Devis'}
                {status === 'contract_sent' && 'Contrat'}
                {status === 'confirmed' && 'Confirmée'}
                {status === 'deposit_paid' && 'Acompte'}
                {status === 'balance_paid' && 'Solde'}
                {status === 'deposit_returned' && 'Caution'}
                {status === 'completed' && 'Terminé'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
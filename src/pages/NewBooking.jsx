import React from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';

export default function NewBooking() {
  const navigate = useNavigate();

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const { data: options = [] } = useQuery({
    queryKey: ['options'],
    queryFn: () => base44.entities.Option.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: (data) => {
      navigate(createPageUrl(`BookingDetail?id=${data.id}`));
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(createPageUrl('Bookings'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Nouvelle réservation</h1>
            <p className="text-slate-500 mt-1">Créez une nouvelle demande de location</p>
          </div>
        </div>

        <BookingForm 
          properties={properties}
          options={options}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => navigate(createPageUrl('Bookings'))}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
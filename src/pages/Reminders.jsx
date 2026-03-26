import React, { useMemo } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, CheckCircle2, Calendar, Euro } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Reminders() {
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-check_in')
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ bookingId, type, emailContent }) => {
      const booking = bookings.find(b => b.id === bookingId);
      
      await base44.integrations.Core.SendEmail({
        to: booking.guest_email,
        subject: emailContent.subject,
        body: emailContent.body
      });

      const updateData = {};
      if (type === 'payment') updateData.payment_reminder_sent = true;
      if (type === 'arrival') updateData.arrival_reminder_sent = true;

      await base44.entities.Booking.update(bookingId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "—";
  };

  const needsPaymentReminder = useMemo(() => {
    const today = new Date();
    return bookings.filter(booking => {
      if (booking.status !== 'contract_sent') return false;
      if (booking.payment_reminder_sent) return false;
      
      const checkIn = parseISO(booking.check_in);
      const daysUntilArrival = differenceInDays(checkIn, today);
      
      return daysUntilArrival <= 20 && daysUntilArrival > 0;
    });
  }, [bookings]);

  const needsArrivalReminder = useMemo(() => {
    const today = new Date();
    return bookings.filter(booking => {
      if (!['deposit_paid', 'balance_paid'].includes(booking.status)) return false;
      if (booking.arrival_reminder_sent) return false;
      
      const checkIn = parseISO(booking.check_in);
      const daysUntilArrival = differenceInDays(checkIn, today);
      
      return daysUntilArrival <= 7 && daysUntilArrival > 0;
    });
  }, [bookings]);

  const sendPaymentReminder = async (booking) => {
    const property = properties.find(p => p.id === booking.property_id);
    const depositAmount = Math.round(booking.total_amount * 0.3 * 100) / 100;
    const balanceAmount = booking.total_amount - depositAmount;

    const emailContent = {
      subject: `Rappel - Solde de votre réservation`,
      body: `Bonjour ${booking.guest_first_name},

Nous espérons que vous êtes toujours aussi enthousiaste à l'idée de votre séjour chez nous !

📅 Votre arrivée est prévue le ${format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: fr })}

💰 Rappel de paiement :
Le solde de ${balanceAmount.toLocaleString('fr-FR')} € doit être réglé avant le ${format(new Date(parseISO(booking.check_in).getTime() - 15 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr })}.

Coordonnées bancaires : [À ajouter dans les paramètres]

Merci et à très bientôt !

Cordialement,
[Votre nom]`
    };

    await sendReminderMutation.mutateAsync({ 
      bookingId: booking.id, 
      type: 'payment', 
      emailContent 
    });
  };

  const sendArrivalReminder = async (booking) => {
    const property = properties.find(p => p.id === booking.property_id);

    const emailContent = {
      subject: `Informations pour votre arrivée - ${property?.name}`,
      body: `Bonjour ${booking.guest_first_name},

Votre séjour approche ! Nous sommes ravis de vous accueillir.

📍 ${property?.name}
${property?.address || ''}

📅 Arrivée : ${format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: fr })} à partir de 14h00
📅 Départ : ${format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: fr })} avant 11h00

🗝️ Accès :
[Informations d'accès au logement - À configurer dans les paramètres]

📋 N'oubliez pas :
- Votre pièce d'identité
- Le chèque de caution de ${booking.deposit_amount?.toLocaleString('fr-FR')} €
- Votre attestation d'assurance responsabilité civile

📞 Contact d'urgence : [Votre numéro]

Bon voyage et à très bientôt !

Cordialement,
[Votre nom]`
    };

    await sendReminderMutation.mutateAsync({ 
      bookingId: booking.id, 
      type: 'arrival', 
      emailContent 
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Rappels automatiques</h1>
          <p className="text-slate-500 mt-1">Gérez les rappels de paiement et d'arrivée</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-amber-600" />
                  Rappels de paiement
                </span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {needsPaymentReminder.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needsPaymentReminder.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>Aucun rappel de paiement à envoyer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {needsPaymentReminder.map(booking => {
                    const daysUntil = differenceInDays(parseISO(booking.check_in), new Date());
                    return (
                      <div key={booking.id} className="p-4 bg-amber-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {booking.guest_first_name} {booking.guest_last_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {getPropertyName(booking.property_id)}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            J-{daysUntil}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            <p>Arrivée : {format(parseISO(booking.check_in), 'dd MMM', { locale: fr })}</p>
                            <p>Solde : {(booking.total_amount - (booking.deposit_paid || 0)).toLocaleString('fr-FR')} €</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => sendPaymentReminder(booking)}
                            disabled={sendReminderMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Envoyer
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Infos d'arrivée
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {needsArrivalReminder.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needsArrivalReminder.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>Aucune info d'arrivée à envoyer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {needsArrivalReminder.map(booking => {
                    const daysUntil = differenceInDays(parseISO(booking.check_in), new Date());
                    return (
                      <div key={booking.id} className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {booking.guest_first_name} {booking.guest_last_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {getPropertyName(booking.property_id)}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            J-{daysUntil}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            <p>Arrivée : {format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: fr })}</p>
                            <p>{booking.num_guests} voyageur(s)</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => sendArrivalReminder(booking)}
                            disabled={sendReminderMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Envoyer
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Automatisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">Rappel de paiement</h4>
                <p className="text-sm text-slate-600">
                  Envoyé automatiquement 20 jours avant l'arrivée si le solde n'est pas encore payé
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <Bell className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">Informations d'arrivée</h4>
                <p className="text-sm text-slate-600">
                  Envoyé automatiquement 7 jours avant l'arrivée avec toutes les infos pratiques
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
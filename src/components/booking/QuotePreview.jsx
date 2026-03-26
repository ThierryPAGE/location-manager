import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';

export default function QuotePreview({ booking, property }) {
  const { data: owner } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  if (!booking || !property) return null;

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">DEVIS DE LOCATION</h1>
          <p className="text-slate-500 mt-1">N° {booking.id?.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm text-slate-500">
            Édité le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Propriétaire</h3>
            <p className="text-slate-600">{owner?.full_name || '[Nom du propriétaire]'}</p>
            <p className="text-slate-600">{owner?.owner_address || '[Adresse]'}</p>
            <p className="text-slate-600">
              {owner?.owner_postal_code && owner?.owner_city 
                ? `${owner.owner_postal_code} ${owner.owner_city}` 
                : '[Code postal et ville]'}
            </p>
            <p className="text-slate-600">{owner?.owner_phone || '[Téléphone]'}</p>
            <p className="text-slate-600">{owner?.email || '[Email]'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Locataire</h3>
            <p className="text-slate-600">{booking.guest_first_name} {booking.guest_last_name}</p>
            <p className="text-slate-600">{booking.guest_email}</p>
            <p className="text-slate-600">{booking.guest_phone}</p>
            <p className="text-slate-600">{booking.guest_address}</p>
          </div>
        </div>

        <div className="mb-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-3">Détails de la location</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Bien :</span>
              <span className="ml-2 text-slate-900">{property.name}</span>
            </div>
            <div>
              <span className="text-slate-500">Nombre de voyageurs :</span>
              <span className="ml-2 text-slate-900">{booking.num_guests}</span>
            </div>
            <div>
              <span className="text-slate-500">Arrivée :</span>
              <span className="ml-2 text-slate-900">{format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
            <div>
              <span className="text-slate-500">Départ :</span>
              <span className="ml-2 text-slate-900">{format(new Date(booking.check_out), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 text-slate-500 font-medium">Description</th>
              <th className="text-right py-3 text-slate-500 font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 text-slate-900">
                Location {booking.num_nights} nuit(s) × {booking.price_per_night?.toLocaleString('fr-FR')} €
              </td>
              <td className="text-right py-3 text-slate-900">
                {booking.subtotal_nights?.toLocaleString('fr-FR')} €
              </td>
            </tr>
            {booking.cleaning_fee > 0 && (
              <tr className="border-b border-slate-100">
                <td className="py-3 text-slate-900">Frais de ménage</td>
                <td className="text-right py-3 text-slate-900">{booking.cleaning_fee?.toLocaleString('fr-FR')} €</td>
              </tr>
            )}
            {booking.tourist_tax_total > 0 && (
              <tr className="border-b border-slate-100">
                <td className="py-3 text-slate-900">Taxe de séjour</td>
                <td className="text-right py-3 text-slate-900">{booking.tourist_tax_total?.toLocaleString('fr-FR')} €</td>
              </tr>
            )}
            {booking.selected_options?.map((opt, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 text-slate-900">{opt.option_name} {opt.quantity > 1 && `× ${opt.quantity}`}</td>
                <td className="text-right py-3 text-slate-900">{opt.total?.toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td className="py-4 font-bold text-lg text-slate-900">TOTAL</td>
              <td className="text-right py-4 font-bold text-lg text-slate-900">
                {booking.total_amount?.toLocaleString('fr-FR')} €
              </td>
            </tr>
          </tfoot>
        </table>

        {booking.deposit_amount > 0 && (
          <div className="p-4 bg-amber-50 rounded-lg mb-6">
            <p className="text-amber-800">
              <strong>Caution :</strong> {booking.deposit_amount?.toLocaleString('fr-FR')} € 
              (à verser à l'arrivée, restituée après état des lieux de sortie)
            </p>
          </div>
        )}

        <div className="text-sm text-slate-500 mt-8 pt-4 border-t">
          <p>Ce devis est valable 7 jours à compter de sa date d'émission.</p>
          <p className="mt-1">Un acompte de 30% sera demandé à la réservation.</p>
        </div>
      </CardContent>
    </Card>
  );
}
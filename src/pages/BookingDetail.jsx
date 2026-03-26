import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Pencil, Trash2, FileText, Download, Mail, 
  Phone, MapPin, Users, Calendar, Euro, CheckCircle2, PenTool, ListOrdered
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BookingForm from '@/components/booking/BookingForm';
import QuotePreview from '@/components/booking/QuotePreview';
import ContractGenerator from '@/components/booking/ContractGenerator';
import EmailSender from '@/components/booking/EmailSender';
import ElectronicSignature from '@/components/booking/ElectronicSignature';

const STATUS_CONFIG = {
  request: { label: "Demande", color: "bg-slate-100 text-slate-700", next: "first_contact" },
  first_contact: { label: "1er contact", color: "bg-blue-100 text-blue-700", next: "quote_sent" },
  quote_sent: { label: "Devis envoyé", color: "bg-amber-100 text-amber-700", next: "contract_sent" },
  contract_sent: { label: "Contrat envoyé", color: "bg-purple-100 text-purple-700", next: "confirmed" },
  confirmed: { label: "Confirmée", color: "bg-indigo-100 text-indigo-700", next: "deposit_paid" },
  deposit_paid: { label: "Acompte payé", color: "bg-emerald-100 text-emerald-700", next: "balance_paid" },
  balance_paid: { label: "Solde payé", color: "bg-teal-100 text-teal-700", next: "deposit_returned" },
  deposit_returned: { label: "Caution rendue", color: "bg-green-100 text-green-700", next: "completed" },
  completed: { label: "Terminée", color: "bg-green-100 text-green-700", next: null },
  cancelled: { label: "Annulée", color: "bg-rose-100 text-rose-700", next: null }
};

const NEXT_STATUS_LABELS = {
  first_contact: "Marquer 1er contact fait",
  quote_sent: "Marquer devis envoyé",
  contract_sent: "Marquer contrat envoyé",
  confirmed: "Confirmer réservation",
  deposit_paid: "Marquer acompte payé",
  balance_paid: "Marquer solde payé",
  deposit_returned: "Marquer caution rendue",
  completed: "Marquer terminée"
};

const SOURCE_LABELS = {
  airbnb: "Airbnb",
  booking: "Booking",
  leboncoin: "Le Bon Coin",
  site_loc_oleron: "Site Loc Oléron",
  direct: "Direct",
  other: "Autre"
};

export default function BookingDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailType, setEmailType] = useState('');
  const [showSignature, setShowSignature] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.list();
      return bookings.find(b => b.id === bookingId);
    },
    enabled: !!bookingId
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const { data: options = [] } = useQuery({
    queryKey: ['options'],
    queryFn: () => base44.entities.Option.list()
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ContractTemplate.list()
  });

  const property = properties.find(p => p.id === booking?.property_id);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.update(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      setIsEditing(false);
      setShowPaymentDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Booking.delete(bookingId),
    onSuccess: () => {
      navigate(createPageUrl('Bookings'));
    }
  });

  const handleStatusChange = (newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'quote_sent') {
      updates.quote_date = new Date().toISOString().split('T')[0];
    }
    if (newStatus === 'contract_sent') {
      updates.contract_date = new Date().toISOString().split('T')[0];
    }
    updateMutation.mutate(updates);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updates = {};
    if (paymentType === 'deposit') {
      updates.deposit_paid = (booking.deposit_paid || 0) + amount;
      if ((updates.deposit_paid) >= (booking.total_amount * 0.3)) {
        updates.status = 'deposit_paid';
      }
    } else if (paymentType === 'balance') {
      updates.balance_paid = (booking.balance_paid || 0) + amount;
      const totalPaid = (booking.deposit_paid || 0) + (updates.balance_paid);
      if (totalPaid >= booking.total_amount) {
        updates.status = 'balance_paid';
      }
    }
    updateMutation.mutate(updates);
    setPaymentAmount('');
  };

  const generateContractPDF = async (content) => {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un contrat de location en HTML bien formaté à partir du contenu suivant. 
      Utilise un style professionnel avec des marges réduites, une typographie claire et compacte.
      IMPORTANT: Le contrat doit tenir sur maximum 2 pages A4.
      - Utilise line-height: 1.3 pour réduire l'espacement entre les lignes
      - Marges: 15mm sur tous les côtés
      - Espacement minimal entre les sections (margin-bottom: 8px max)
      - Taille de police: 11pt pour le corps du texte, 14pt pour les titres
      - Pas de saut de page inutiles
      Le HTML doit être prêt à être imprimé ou converti en PDF.

      Contenu du contrat:
      ${content}`,
      response_json_schema: {
        type: "object",
        properties: {
          html_content: { type: "string" }
        }
      }
    });

    const blob = new Blob([response.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrat-${booking.guest_last_name}-${booking.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);

    updateMutation.mutate({ 
      status: 'contract_sent',
      contract_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleElectronicSign = async (signatureData) => {
    await updateMutation.mutateAsync({
      contract_signed: true,
      contract_signed_date: new Date().toISOString(),
      status: booking.status === 'contract_sent' ? 'deposit_paid' : booking.status
    });
    setShowSignature(false);
  };

  const handleEmailSuccess = (type) => {
    const updates = {};
    if (type === 'quote') {
      updates.quote_sent_by_email = true;
      if (booking.status === 'first_contact') {
        updates.status = 'quote_sent';
        updates.quote_date = new Date().toISOString().split('T')[0];
      }
    } else if (type === 'contract') {
      updates.contract_sent_by_email = true;
      if (booking.status === 'quote_sent') {
        updates.status = 'contract_sent';
        updates.contract_date = new Date().toISOString().split('T')[0];
      }
    }
    updateMutation.mutate(updates);
    setShowEmailDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="text-center">
          <p className="text-slate-500">Réservation non trouvée</p>
          <Button onClick={() => navigate(createPageUrl('Bookings'))} className="mt-4">
            Retour aux réservations
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Modifier la réservation</h1>
          </div>
          <BookingForm 
            booking={booking}
            properties={properties}
            options={options}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => setIsEditing(false)}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>
    );
  }

  const totalPaid = (booking.deposit_paid || 0) + (booking.balance_paid || 0);
  const remainingBalance = (booking.total_amount || 0) - totalPaid;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Bookings'))}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {booking.guest_first_name} {booking.guest_last_name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`${STATUS_CONFIG[booking.status]?.color} border-0`}>
                  {STATUS_CONFIG[booking.status]?.label}
                </Badge>
                <span className="text-slate-500">
                  {SOURCE_LABELS[booking.source] || booking.source_other}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button 
              variant="outline" 
              className="text-rose-500 hover:text-rose-600"
              onClick={() => {
                if (confirm('Supprimer cette réservation ?')) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Détails du séjour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Bien</p>
                    <p className="font-medium">{property?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Voyageurs</p>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      {booking.num_guests}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Arrivée</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(booking.check_in), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Départ</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(booking.check_out), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informations du locataire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.guest_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${booking.guest_email}`} className="text-blue-600 hover:underline">
                        {booking.guest_email}
                      </a>
                    </div>
                  )}
                  {booking.guest_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${booking.guest_phone}`} className="text-blue-600 hover:underline">
                        {booking.guest_phone}
                      </a>
                    </div>
                  )}
                  {booking.guest_address && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <span>{booking.guest_address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Tarification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{booking.num_nights} nuits × {booking.price_per_night?.toLocaleString('fr-FR')} €</span>
                  <span>{booking.subtotal_nights?.toLocaleString('fr-FR')} €</span>
                </div>
                {booking.cleaning_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frais de ménage</span>
                    <span>{booking.cleaning_fee?.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {booking.tourist_tax_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxe de séjour</span>
                    <span>{booking.tourist_tax_total?.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {booking.selected_options?.map((opt, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{opt.option_name}</span>
                    <span>{opt.total?.toLocaleString('fr-FR')} €</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{booking.total_amount?.toLocaleString('fr-FR')} €</span>
                </div>
                {booking.deposit_amount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600 pt-2">
                    <span>Caution</span>
                    <span>{booking.deposit_amount?.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Paiements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-600">Acompte reçu</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {(booking.deposit_paid || 0).toLocaleString('fr-FR')} €
                    </p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-sm text-teal-600">Solde reçu</p>
                    <p className="text-xl font-bold text-teal-700">
                      {(booking.balance_paid || 0).toLocaleString('fr-FR')} €
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-600">Reste à payer</p>
                    <p className="text-xl font-bold text-amber-700">
                      {remainingBalance.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { setPaymentType('deposit'); setShowPaymentDialog(true); }}
                    disabled={booking.status === 'cancelled'}
                  >
                    Enregistrer acompte
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => { setPaymentType('balance'); setShowPaymentDialog(true); }}
                    disabled={booking.status === 'cancelled'}
                  >
                    Enregistrer solde
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-slate-600 mb-2 block">Modifier le statut</Label>
                    <Select
                      value={booking.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG)
                          .filter(([key]) => key !== 'cancelled')
                          .map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowQuote(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir le devis
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => { setEmailType('quote'); setShowEmailDialog(true); }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer devis par email
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => { setEmailType('contract'); setShowEmailDialog(true); }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer contrat par email
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowSignature(true)}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Signature électronique
                </Button>

                {booking.status !== 'cancelled' && (
                  <Button 
                    variant="outline" 
                    className="w-full text-rose-500 hover:text-rose-600"
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    Annuler la réservation
                  </Button>
                )}
              </CardContent>
            </Card>

            <ContractGenerator 
              booking={booking}
              property={property}
              templates={templates}
              onGenerate={generateContractPDF}
            />

            {booking.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 whitespace-pre-wrap">{booking.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={showQuote} onOpenChange={setShowQuote}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu du devis</DialogTitle>
            </DialogHeader>
            <QuotePreview booking={booking} property={property} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowQuote(false)}>
                Fermer
              </Button>
              <Button onClick={() => {
                window.print();
              }}>
                <Download className="w-4 h-4 mr-2" />
                Imprimer / PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Enregistrer un {paymentType === 'deposit' ? 'acompte' : 'paiement de solde'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Montant (€)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handlePayment} disabled={updateMutation.isPending}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Envoyer un email</DialogTitle>
            </DialogHeader>
            <EmailSender 
              booking={booking}
              property={property}
              type={emailType}
              onSuccess={() => handleEmailSuccess(emailType)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showSignature} onOpenChange={setShowSignature}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Signature électronique du contrat</DialogTitle>
            </DialogHeader>
            <ElectronicSignature
              booking={booking}
              onSign={handleElectronicSign}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EmailSender({ booking, property, type, onSuccess }) {
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: owner } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const getEmailContent = () => {
    const depositAmount = Math.round(booking.total_amount * 0.3 * 100) / 100;
    const balanceAmount = booking.total_amount - depositAmount;

    const ownerSignature = owner ? `
${owner.full_name}
${owner.owner_address}
${owner.owner_postal_code} ${owner.owner_city}
Tél: ${owner.owner_phone}
Email: ${owner.email}
` : '[Votre nom et coordonnées]';

    if (type === 'quote') {
      return {
        subject: `Devis pour votre séjour - ${property?.name}`,
        body: `Bonjour ${booking.guest_first_name},

Merci pour votre demande de réservation !

Nous avons le plaisir de vous transmettre le devis pour votre séjour :

📍 Bien : ${property?.name}
📅 Du ${format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr })} au ${format(new Date(booking.check_out), 'dd MMMM yyyy', { locale: fr })}
👥 ${booking.num_guests} voyageur(s)
🌙 ${booking.num_nights} nuit(s)

💶 Tarif :
- Location : ${booking.subtotal_nights?.toLocaleString('fr-FR')} €
- Frais de ménage : ${booking.cleaning_fee?.toLocaleString('fr-FR')} €
- Taxe de séjour : ${booking.tourist_tax_total?.toLocaleString('fr-FR')} €
${booking.options_total > 0 ? `- Options : ${booking.options_total?.toLocaleString('fr-FR')} €\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
TOTAL : ${booking.total_amount?.toLocaleString('fr-FR')} €

💳 Modalités de paiement :
- Arrhes (30%) : ${depositAmount.toLocaleString('fr-FR')} € à la réservation
- Solde : ${balanceAmount.toLocaleString('fr-FR')} € à verser 15 jours avant l'arrivée

🔐 Caution : ${booking.deposit_amount?.toLocaleString('fr-FR')} € (chèque non encaissé, restitué après état des lieux)

Ce devis est valable 7 jours.

${customMessage ? `${customMessage}\n\n` : ''}Cordialement,

${ownerSignature}`
      };
    } else if (type === 'contract') {
      return {
        subject: `Contrat de location - ${property?.name}`,
        body: `Bonjour ${booking.guest_first_name},

Suite à votre réservation, veuillez trouver ci-joint le contrat de location pour votre séjour.

📍 ${property?.name}
📅 Du ${format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr })} au ${format(new Date(booking.check_out), 'dd MMMM yyyy', { locale: fr })}

Merci de nous retourner le contrat signé avec la mention "Lu et approuvé".

Pour rappel :
✅ Arrhes versées : ${depositAmount.toLocaleString('fr-FR')} €
⏰ Solde à régler avant le ${format(new Date(new Date(booking.check_in).getTime() - 15 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr })} : ${balanceAmount.toLocaleString('fr-FR')} €

Horaires :
• Arrivée : à partir de 14h00
• Départ : avant 11h00

${customMessage ? `${customMessage}\n\n` : ''}Nous restons à votre disposition pour toute question.

Cordialement,

${ownerSignature}`
      };
    } else if (type === 'payment_reminder') {
      return {
        subject: `Rappel - Solde de votre réservation`,
        body: `Bonjour ${booking.guest_first_name},

Nous espérons que vous êtes toujours aussi enthousiaste à l'idée de votre séjour chez nous !

📅 Votre arrivée est prévue le ${format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr })}

💰 Rappel de paiement :
Le solde de ${balanceAmount.toLocaleString('fr-FR')} € doit être réglé avant le ${format(new Date(new Date(booking.check_in).getTime() - 15 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr })}.

Coordonnées bancaires : [À ajouter]

${customMessage ? `${customMessage}\n\n` : ''}Merci et à très bientôt !

Cordialement,

${ownerSignature}`
      };
    } else if (type === 'arrival_reminder') {
      return {
        subject: `Informations pour votre arrivée - ${property?.name}`,
        body: `Bonjour ${booking.guest_first_name},

Votre séjour approche ! Nous sommes ravis de vous accueillir.

📍 ${property?.name}
📅 Arrivée : ${format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr })} à partir de 14h00
📅 Départ : ${format(new Date(booking.check_out), 'dd MMMM yyyy', { locale: fr })} avant 11h00

🗝️ Accès :
[Informations d'accès au logement]

📋 N'oubliez pas :
- Votre pièce d'identité
- Le chèque de caution de ${booking.deposit_amount?.toLocaleString('fr-FR')} €
- Votre attestation d'assurance responsabilité civile

📞 Contact d'urgence : ${owner?.owner_phone || '[Votre numéro]'}

${customMessage ? `${customMessage}\n\n` : ''}Bon voyage et à très bientôt !

Cordialement,

${ownerSignature}`
      };
    }
  };

  const handleSend = async () => {
    if (!booking.guest_email) {
      alert('Aucun email renseigné pour ce locataire');
      return;
    }

    setIsSending(true);
    try {
      const emailContent = getEmailContent();
      
      await base44.integrations.Core.SendEmail({
        to: booking.guest_email,
        subject: emailContent.subject,
        body: emailContent.body
      });

      setSent(true);
      setTimeout(() => setSent(false), 3000);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      alert('Erreur lors de l\'envoi : ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const emailContent = getEmailContent();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {type === 'quote' && 'Envoyer le devis par email'}
          {type === 'contract' && 'Envoyer le contrat par email'}
          {type === 'payment_reminder' && 'Envoyer un rappel de paiement'}
          {type === 'arrival_reminder' && 'Envoyer les infos d\'arrivée'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600 mb-1">À : {booking.guest_email || 'Email non renseigné'}</p>
          <p className="text-sm font-medium text-slate-900">{emailContent?.subject}</p>
        </div>

        <div>
          <label className="text-sm text-slate-600 mb-2 block">Message personnalisé (optionnel)</label>
          <Textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Ajoutez un message personnalisé..."
            rows={3}
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-xs text-slate-500 mb-2">Aperçu du message :</p>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
            {emailContent?.body}
          </pre>
        </div>

        <Button 
          onClick={handleSend} 
          disabled={isSending || !booking.guest_email || sent}
          className={`w-full ${sent ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {sent ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Email envoyé !
            </>
          ) : isSending ? (
            'Envoi en cours...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Envoyer l'email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ContractGenerator({ booking, property, templates, onGenerate }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const replaceVariables = (content) => {
    if (!content || !booking || !property) return content;

    // Calcul des arrhes (30% du total) et du solde
    const totalAmount = booking.total_amount || 0;
    const arrhesAmount = Math.round(totalAmount * 0.30 * 100) / 100;
    const soldeAmount = Math.round((totalAmount - arrhesAmount) * 100) / 100;

    const variables = {
      '{{PROPERTY_NAME}}': property.name || '',
      '{{PROPERTY_ADDRESS}}': property.address || '',
      '{{PROPERTY_CAPACITY}}': property.capacity || '',
      '{{PROPERTY_BEDROOMS}}': property.bedrooms || '',
      '{{GUEST_FIRST_NAME}}': booking.guest_first_name || '',
      '{{GUEST_LAST_NAME}}': booking.guest_last_name || '',
      '{{GUEST_EMAIL}}': booking.guest_email || '',
      '{{GUEST_PHONE}}': booking.guest_phone || '',
      '{{GUEST_ADDRESS}}': booking.guest_address || '',
      '{{NUM_GUESTS}}': booking.num_guests || '',
      '{{CHECK_IN}}': booking.check_in ? format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr }) : '',
      '{{CHECK_OUT}}': booking.check_out ? format(new Date(booking.check_out), 'dd MMMM yyyy', { locale: fr }) : '',
      '{{NUM_NIGHTS}}': booking.num_nights || '',
      '{{PRICE_PER_NIGHT}}': booking.price_per_night?.toLocaleString('fr-FR') || '',
      '{{SUBTOTAL_NIGHTS}}': booking.subtotal_nights?.toLocaleString('fr-FR') || '',
      '{{CLEANING_FEE}}': booking.cleaning_fee?.toLocaleString('fr-FR') || '0',
      '{{TOURIST_TAX}}': booking.tourist_tax_total?.toLocaleString('fr-FR') || '0',
      '{{OPTIONS_TOTAL}}': booking.options_total?.toLocaleString('fr-FR') || '0',
      '{{TOTAL_AMOUNT}}': booking.total_amount?.toLocaleString('fr-FR') || '',
      '{{DEPOSIT_AMOUNT}}': booking.deposit_amount?.toLocaleString('fr-FR') || '0',
      '{{ARRHES_AMOUNT}}': arrhesAmount.toLocaleString('fr-FR') || '0',
      '{{SOLDE_AMOUNT}}': soldeAmount.toLocaleString('fr-FR') || '0',
      '{{TODAY_DATE}}': format(new Date(), 'dd MMMM yyyy', { locale: fr }),
      '{{BOOKING_ID}}': booking.id?.slice(0, 8).toUpperCase() || ''
    };

    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(key, 'g'), value);
    });
    return result;
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setIsGenerating(true);
    const processedContent = replaceVariables(template.content);
    await onGenerate(processedContent);
    setIsGenerating(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Génération du contrat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-600 mb-2 block">Modèle de contrat</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un modèle" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={!selectedTemplate || isGenerating}
          className="w-full"
        >
          <FileDown className="w-4 h-4 mr-2" />
          {isGenerating ? 'Génération en cours...' : 'Générer le contrat PDF'}
        </Button>

        <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
          <p className="font-medium mb-1">Variables disponibles :</p>
          <p>{'{{PROPERTY_NAME}}, {{GUEST_FIRST_NAME}}, {{GUEST_LAST_NAME}}, {{CHECK_IN}}, {{CHECK_OUT}}, {{TOTAL_AMOUNT}}, {{DEPOSIT_AMOUNT}}, {{ARRHES_AMOUNT}} (30%), {{SOLDE_AMOUNT}} (70%), etc.'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
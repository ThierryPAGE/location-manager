import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";

const SOURCES = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking' },
  { value: 'leboncoin', label: 'Le Bon Coin' },
  { value: 'site_loc_oleron', label: 'Site Loc Oléron' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Autre' }
];

export default function BookingForm({ booking, properties, options, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    property_id: '',
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    guest_address: '',
    num_guests: 2,
    check_in: '',
    check_out: '',
    source: 'direct',
    source_other: '',
    selected_options: [],
    notes: '',
    manual_rental_amount: '',
    manual_tourist_tax: '',
    concierge_fee: '',
    host_service_fee: '',
    ...booking
  });

  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    if (formData.property_id) {
      const property = properties.find(p => p.id === formData.property_id);
      setSelectedProperty(property);
    }
  }, [formData.property_id, properties]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (option, checked) => {
    setFormData(prev => {
      const currentOptions = prev.selected_options || [];
      if (checked) {
        return {
          ...prev,
          selected_options: [...currentOptions, {
            option_id: option.id,
            option_name: option.name,
            quantity: 1,
            unit_price: option.price,
            total: option.price
          }]
        };
      } else {
        return {
          ...prev,
          selected_options: currentOptions.filter(o => o.option_id !== option.id)
        };
      }
    });
  };

  const handleOptionQuantityChange = (optionId, quantity) => {
    setFormData(prev => {
      const option = options.find(o => o.id === optionId);
      return {
        ...prev,
        selected_options: prev.selected_options.map(o => 
          o.option_id === optionId 
            ? { ...o, quantity, total: quantity * (option?.price || o.unit_price) }
            : o
        )
      };
    });
  };

  const calculatePricing = () => {
    if (!selectedProperty || !formData.check_in || !formData.check_out) {
      return null;
    }

    const numNights = differenceInDays(new Date(formData.check_out), new Date(formData.check_in));
    if (numNights <= 0) return null;

    const manualAmount = parseFloat(formData.manual_rental_amount) || 0;
    const subtotalNights = manualAmount;
    const pricePerNight = numNights > 0 ? subtotalNights / numNights : 0;
    const cleaningFee = selectedProperty.cleaning_fee || 0;
    const touristTax = parseFloat(formData.manual_tourist_tax) || 0;
    
    const optionsTotal = (formData.selected_options || []).reduce((sum, opt) => {
      const option = options.find(o => o.id === opt.option_id);
      if (!option) return sum + opt.total;
      
      let total = opt.quantity * option.price;
      if (option.price_type === 'per_night') {
        total = option.price * numNights;
      } else if (option.price_type === 'per_person') {
        total = option.price * (formData.num_guests || 1);
      } else if (option.price_type === 'per_person_per_night') {
        total = option.price * (formData.num_guests || 1) * numNights;
      }
      return sum + total;
    }, 0);

    const totalAmount = subtotalNights + cleaningFee + touristTax + optionsTotal;

    return {
      num_nights: numNights,
      price_per_night: pricePerNight,
      subtotal_nights: subtotalNights,
      cleaning_fee: cleaningFee,
      tourist_tax_total: touristTax,
      options_total: optionsTotal,
      total_amount: totalAmount,
      deposit_amount: selectedProperty.deposit_amount || 0
    };
  };

  const pricing = calculatePricing();

  const handleSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars
    const { manual_rental_amount, manual_tourist_tax, ...rest } = formData;
    const dataToSubmit = { ...rest, ...pricing };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Bien</Label>
            <Select value={formData.property_id} onValueChange={(v) => handleChange('property_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un bien" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Date d'arrivée</Label>
            <Input type="date" value={formData.check_in} onChange={(e) => handleChange('check_in', e.target.value)} required />
          </div>
          <div>
            <Label>Date de départ</Label>
            <Input type="date" value={formData.check_out} onChange={(e) => handleChange('check_out', e.target.value)} required />
          </div>
          
          <div>
            <Label>Nombre de voyageurs</Label>
            <Input type="number" min="1" value={formData.num_guests} onChange={(e) => handleChange('num_guests', parseInt(e.target.value))} />
          </div>

          <div>
            <Label>Montant de la location (€)</Label>
            <Input 
              type="number" 
              min="0" 
              step="0.01" 
              value={formData.manual_rental_amount} 
              onChange={(e) => handleChange('manual_rental_amount', e.target.value)}
              placeholder="Saisir le montant"
              required
            />
          </div>

          <div>
            <Label>Taxe de séjour (€)</Label>
            <Input 
              type="number" 
              min="0" 
              step="0.01" 
              value={formData.manual_tourist_tax} 
              onChange={(e) => handleChange('manual_tourist_tax', e.target.value)}
              placeholder="Saisir le montant"
            />
          </div>
          
          <div>
            <Label>Origine de la demande</Label>
            <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {formData.source === 'other' && (
            <div className="md:col-span-2">
              <Label>Préciser l'origine</Label>
              <Input value={formData.source_other} onChange={(e) => handleChange('source_other', e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Informations du locataire</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Prénom</Label>
            <Input value={formData.guest_first_name} onChange={(e) => handleChange('guest_first_name', e.target.value)} required />
          </div>
          <div>
            <Label>Nom</Label>
            <Input value={formData.guest_last_name} onChange={(e) => handleChange('guest_last_name', e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={formData.guest_email} onChange={(e) => handleChange('guest_email', e.target.value)} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={formData.guest_phone} onChange={(e) => handleChange('guest_phone', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Adresse</Label>
            <Textarea value={formData.guest_address} onChange={(e) => handleChange('guest_address', e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {options.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.filter(o => o.is_active !== false).map(option => {
              const isSelected = formData.selected_options?.some(o => o.option_id === option.id);
              const selectedOption = formData.selected_options?.find(o => o.option_id === option.id);
              
              return (
                <div key={option.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => handleOptionToggle(option, checked)}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{option.name}</p>
                      <p className="text-sm text-slate-500">
                        {option.price} € 
                        {option.price_type === 'per_night' && ' / nuit'}
                        {option.price_type === 'per_person' && ' / personne'}
                        {option.price_type === 'per_person_per_night' && ' / pers. / nuit'}
                      </p>
                    </div>
                  </div>
                  {isSelected && option.price_type === 'fixed' && (
                    <Input 
                      type="number" 
                      min="1" 
                      value={selectedOption?.quantity || 1}
                      onChange={(e) => handleOptionQuantityChange(option.id, parseInt(e.target.value))}
                      className="w-20"
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {pricing && (
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Récapitulatif tarifaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Location ({pricing.num_nights} nuits)</span>
              <span>{pricing.subtotal_nights.toLocaleString('fr-FR')} €</span>
            </div>
            {pricing.cleaning_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Frais de ménage</span>
                <span>{pricing.cleaning_fee.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {pricing.tourist_tax_total > 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxe de séjour</span>
                <span>{pricing.tourist_tax_total.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {pricing.options_total > 0 && (
              <div className="flex justify-between text-sm">
                <span>Options</span>
                <span>{pricing.options_total.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{pricing.total_amount.toLocaleString('fr-FR')} €</span>
            </div>
            {pricing.deposit_amount > 0 && (
              <div className="flex justify-between text-sm text-slate-600 pt-2">
                <span>Caution</span>
                <span>{pricing.deposit_amount.toLocaleString('fr-FR')} €</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Comptabilité interne</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Conciergerie (€)</Label>
            <Input 
              type="number" 
              min="0" 
              step="0.01" 
              value={formData.concierge_fee} 
              onChange={(e) => handleChange('concierge_fee', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Frais de service hôte (€)</Label>
            <Input 
              type="number" 
              min="0" 
              step="0.01" 
              value={formData.host_service_fee} 
              onChange={(e) => handleChange('host_service_fee', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Label>Notes internes</Label>
          <Textarea 
            value={formData.notes} 
            onChange={(e) => handleChange('notes', e.target.value)} 
            rows={3}
            placeholder="Notes pour votre usage personnel..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : booking?.id ? 'Mettre à jour' : 'Créer la réservation'}
        </Button>
      </div>
    </form>
  );
}
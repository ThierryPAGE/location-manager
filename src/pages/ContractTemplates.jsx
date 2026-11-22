import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, FileText, Copy } from 'lucide-react';
import ImageUploader from '@/components/contracts/ImageUploader';

// Template HTML conforme au modèle de contrat signé (PDF de référence).
// Les coordonnées bailleur et les clauses sont fixes ; seules les variables
// {{...}} sont substituées par ContractGenerator avant l'impression PDF.
const DEFAULT_TEMPLATE = `<html>
<head>
<meta charset="utf-8"/>
<style>
  body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.45;color:#000;margin:0;padding:0}
  .page{width:794px;padding:48px 60px;box-sizing:border-box;background:#fff}
  h1{font-size:14pt;text-align:center;text-transform:uppercase;letter-spacing:.05em;margin:0 0 18px}
  h2{font-size:11pt;text-transform:uppercase;margin:14px 0 4px;border-bottom:1px solid #000;padding-bottom:2px}
  p{margin:3px 0}
  .indent{margin-left:20px}
  .row{display:flex;justify-content:space-between;padding:1px 0}
  .total-row{font-weight:bold;border-top:1px solid #000;margin-top:4px;padding-top:4px}
  .rib{background:#f5f5f5;border:1px solid #ccc;padding:9px 14px;margin-top:8px;font-size:10pt}
  .sig-block{display:flex;justify-content:space-between;align-items:flex-start;margin-top:28px}
  .sig-col{text-align:center;width:46%}
  .sig-col img{max-width:220px;margin-top:4px}
  .sig-line{border-top:1px solid #000;width:80%;margin:60px auto 0}
</style>
</head>
<body>
<div class="page">

<h1>CONTRAT DE LOCATION SAISONNIÈRE</h1>

<p>Entre les soussignés :</p>

<h2>Le Bailleur</h2>
<p class="indent"><strong>Mme PINAULT Géraldine et Mr PAGE Thierry</strong></p>
<p class="indent">156 rue Oberkampf, 75011 PARIS</p>
<p class="indent">Ci-après dénommé « le Bailleur ».</p>

<h2>Le Preneur</h2>
<p class="indent"><strong>{{GUEST_FIRST_NAME}} {{GUEST_LAST_NAME}}</strong></p>
<p class="indent">{{GUEST_ADDRESS}}</p>
<p class="indent">Email : {{GUEST_EMAIL}}</p>
<p class="indent">Téléphone : {{GUEST_PHONE}}</p>
<p class="indent">Ci-après dénommé « le Preneur ».</p>

<p style="margin-top:10px">Il a été convenu ce qui suit :</p>

<h2>1. Objet du contrat</h2>
<p>Le Bailleur loue au Preneur, à titre de location saisonnière, la maison située au <strong>{{PROPERTY_ADDRESS}}</strong>.</p>
<p style="margin-top:6px"><strong>Description du bien :</strong></p>
<p><em>Maison principale</em></p>
<p class="indent">1 Salon · 1 Salle à manger · 1 Cuisine équipée · 3 Chambres · 2 Salles d'eau · Jardin privatif</p>
<p><em>Annexe</em></p>
<p class="indent">1 Petit salon · 2 Chambres · 1 Salle d'eau</p>
<p style="margin-top:4px">Capacité d'accueil : {{PROPERTY_CAPACITY}} personnes — Nombre de voyageurs : <strong>{{NUM_GUESTS}}</strong></p>

<h2>2. Durée de la location</h2>
<p>La présente location est consentie pour une durée de <strong>{{NUM_NIGHTS}} nuits</strong>, à compter du <strong>{{CHECK_IN}} à 14h00</strong> jusqu'au <strong>{{CHECK_OUT}} à 11h00</strong>.</p>

<h2>3. Montant du loyer et des charges</h2>
<div class="row"><span>Loyer ({{NUM_NIGHTS}} nuits × {{PRICE_PER_NIGHT}} €)</span><span>{{SUBTOTAL_NIGHTS}} €</span></div>
<div class="row"><span>Forfait ménage obligatoire</span><span>{{CLEANING_FEE}} €</span></div>
<div class="row"><span>Taxe de séjour</span><span>{{TOURIST_TAX}} €</span></div>
<div class="row"><span>Options</span><span>{{OPTIONS_TOTAL}} €</span></div>
<div class="row total-row"><span>Montant total à payer</span><span>{{TOTAL_AMOUNT}} €</span></div>
<p style="margin-top:6px">Arrhes à verser lors de la signature du présent contrat (30 %) : <strong>{{ARRHES_AMOUNT}} €</strong>.</p>

<h2>4. Conditions de paiement</h2>
<p>Le montant total devra être versé au plus tard 15 jours avant le début de la location par virement bancaire ou tout autre moyen convenu entre les parties.</p>
<p style="margin-top:4px"><strong>Solde à régler : {{TOTAL_AMOUNT}} – {{ARRHES_AMOUNT}} = {{SOLDE_AMOUNT}} €</strong></p>

<h2>5. Dépôt de garantie</h2>
<p>Un chèque de dépôt de garantie de <strong>{{DEPOSIT_AMOUNT}} €</strong> sera exigé lors de la remise des clefs et restitué au Preneur dans un délai maximum de 7 jours après la fin de la location, sous réserve d'état des lieux conforme.</p>

<h2>6. État des lieux</h2>
<p>Un état des lieux d'entrée et de sortie sera réalisé entre les parties par la Conciergerie Laura Gragan. Cet état des lieux conditionne la restitution du dépôt de garantie.</p>

<h2>7. Obligations du Preneur</h2>
<p class="indent">– à occuper les lieux paisiblement et à respecter le voisinage ;</p>
<p class="indent">– à restituer les lieux dans l'état initial (hors forfait ménage) ;</p>
<p class="indent">– à ne pas sous-louer le bien ;</p>
<p class="indent">– à signaler toute dégradation ou dysfonctionnement.</p>

<h2>8. Annulation</h2>
<p>En cas d'annulation par le Preneur moins de 15 jours avant le début de la location, le loyer restera acquis au Bailleur. Le forfait ménage et le dépôt de garantie seront remboursés.</p>

<h2>9. Assurance</h2>
<p>Le Preneur déclare être couvert par une assurance responsabilité civile pour toute la durée de la location.</p>

<h2>10. Signatures</h2>
<p>En signant le présent contrat, les parties reconnaissent avoir pris connaissance et accepté l'ensemble des clauses.</p>

<h2>11. RIB</h2>
<div class="rib">
  <p><strong>M PAGE THIERRY OU MLE PINAULT GERALDINE</strong></p>
  <p>BICS GENERAL LECLERC (00061) — IBAN : FR76 1020 7000 6104 1610 7865 801</p>
  <p>RIB : 10207 00061 04161078658 01 — BIC : CCBP FRPP MTG</p>
</div>

<p style="margin-top:16px">Fait à Paris, le {{TODAY_DATE}}</p>

<div class="sig-block">
  <div class="sig-col">
    <p><strong>Le Bailleur :</strong></p>
    <p style="font-size:9pt;font-style:italic;color:#555">Lu et approuvé</p>
    <img src="/signatures-bailleur.png" alt="Signatures bailleur" width="220" />
  </div>
  <div class="sig-col">
    <p><strong>Le Preneur :</strong></p>
    <p style="font-size:9pt;font-style:italic;color:#555">Lu et approuvé</p>
    <div class="sig-line"></div>
  </div>
</div>

</div>
</body>
</html>`;

export default function ContractTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    content: DEFAULT_TEMPLATE,
    is_default: false
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ContractTemplate.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContractTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      content: DEFAULT_TEMPLATE,
      is_default: false
    });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      content: template.content || DEFAULT_TEMPLATE,
      is_default: template.is_default || false
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (template) => {
    setFormData({
      name: `${template.name} (copie)`,
      content: template.content || DEFAULT_TEMPLATE,
      is_default: false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Modèles de contrat</h1>
            <p className="text-slate-500 mt-1">Gérez vos modèles de contrats de location</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau modèle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Nom du modèle</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Contrat standard"
                    required
                  />
                </div>
                <div>
                  <Label>Contenu du contrat</Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Utilisez les variables comme {'{{GUEST_FIRST_NAME}}'}, {'{{CHECK_IN}}'}, {'{{TOTAL_AMOUNT}}'}, {'{{ARRHES_AMOUNT}}'}, {'{{SOLDE_AMOUNT}}'}, etc.
                    Pour les images : {'<img src="URL" width="200" />'}
                  </p>
                  <Textarea 
                    value={formData.content} 
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={20}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                  />
                  <Label>Modèle par défaut</Label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTemplate ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun modèle</h3>
              <p className="text-slate-500 text-center mb-4">Créez votre premier modèle de contrat de location</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-slate-900">{template.name}</h3>
                      {template.is_default && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Par défaut</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-rose-500 hover:text-rose-600"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <ImageUploader />
        </div>

        <Card className="border-0 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Variables disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><code className="bg-slate-100 px-1 rounded">{'{{PROPERTY_NAME}}'}</code> - Nom du bien</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{PROPERTY_ADDRESS}}'}</code> - Adresse</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{PROPERTY_CAPACITY}}'}</code> - Capacité</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{PROPERTY_BEDROOMS}}'}</code> - Chambres</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{GUEST_FIRST_NAME}}'}</code> - Prénom locataire</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{GUEST_LAST_NAME}}'}</code> - Nom locataire</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{GUEST_EMAIL}}'}</code> - Email</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{GUEST_PHONE}}'}</code> - Téléphone</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{GUEST_ADDRESS}}'}</code> - Adresse locataire</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{NUM_GUESTS}}'}</code> - Nombre voyageurs</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{CHECK_IN}}'}</code> - Date arrivée</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{CHECK_OUT}}'}</code> - Date départ</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{NUM_NIGHTS}}'}</code> - Nombre de nuits</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{TOTAL_AMOUNT}}'}</code> - Montant total</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{ARRHES_AMOUNT}}'}</code> - Arrhes (30%)</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{SOLDE_AMOUNT}}'}</code> - Solde (70%)</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{DEPOSIT_AMOUNT}}'}</code> - Caution</div>
              <div><code className="bg-slate-100 px-1 rounded">{'{{TODAY_DATE}}'}</code> - Date du jour</div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 Insertion d'images</p>
              <p className="text-xs text-blue-700">
                Pour insérer une image (ex: signature), uploadez d'abord votre fichier et utilisez :<br/>
                <code className="bg-white px-1 rounded mt-1 inline-block">{'<img src="URL_DE_VOTRE_IMAGE" width="200" />'}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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

const DEFAULT_TEMPLATE = `CONTRAT DE LOCATION SAISONNIÈRE

Entre les soussignés :

Le propriétaire du bien {{PROPERTY_NAME}} situé au {{PROPERTY_ADDRESS}}

Et

{{GUEST_FIRST_NAME}} {{GUEST_LAST_NAME}}
{{GUEST_ADDRESS}}
Email : {{GUEST_EMAIL}}
Téléphone : {{GUEST_PHONE}}

Il a été convenu ce qui suit :

ARTICLE 1 - OBJET DU CONTRAT
Le propriétaire loue au locataire qui accepte, le logement meublé suivant :
{{PROPERTY_NAME}}
Capacité d'accueil : {{PROPERTY_CAPACITY}} personnes
Nombre de chambres : {{PROPERTY_BEDROOMS}}

ARTICLE 2 - DURÉE DE LA LOCATION
Du {{CHECK_IN}} au {{CHECK_OUT}}
Soit {{NUM_NIGHTS}} nuit(s)

Nombre de personnes prévues : {{NUM_GUESTS}}

ARTICLE 3 - PRIX DE LA LOCATION
Location : {{SUBTOTAL_NIGHTS}} €
Frais de ménage : {{CLEANING_FEE}} €
Taxe de séjour : {{TOURIST_TAX}} €
Options : {{OPTIONS_TOTAL}} €

TOTAL : {{TOTAL_AMOUNT}} €

ARTICLE 4 - DÉPÔT DE GARANTIE
Un dépôt de garantie de {{DEPOSIT_AMOUNT}} € sera versé à l'arrivée.
Il sera restitué en fin de séjour, déduction faite des éventuelles dégradations.

ARTICLE 5 - CONDITIONS DE PAIEMENT
- Acompte de 30% à la réservation
- Solde à verser à l'arrivée

Fait à ________________, le {{TODAY_DATE}}

Signature du propriétaire :          Signature du locataire :
`;

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
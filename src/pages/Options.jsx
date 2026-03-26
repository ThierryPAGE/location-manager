import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

const PRICE_TYPES = [
  { value: 'fixed', label: 'Prix fixe' },
  { value: 'per_night', label: 'Par nuit' },
  { value: 'per_person', label: 'Par personne' },
  { value: 'per_person_per_night', label: 'Par personne par nuit' }
];

export default function Options() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    price_type: 'fixed',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['options'],
    queryFn: () => base44.entities.Option.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Option.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Option.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Option.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      price_type: 'fixed',
      is_active: true
    });
    setEditingOption(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (option) => {
    setEditingOption(option);
    setFormData({
      name: option.name || '',
      description: option.description || '',
      price: option.price || 0,
      price_type: option.price_type || 'fixed',
      is_active: option.is_active !== false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getPriceTypeLabel = (type) => {
    return PRICE_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Options</h1>
            <p className="text-slate-500 mt-1">Gérez les options supplémentaires (draps, ménage, chauffage...)</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une option
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingOption ? 'Modifier l\'option' : 'Nouvelle option'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Nom de l'option</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Location de draps"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description optionnelle"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prix (€)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Type de tarification</Label>
                    <Select value={formData.price_type} onValueChange={(v) => setFormData({...formData, price_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label>Option active</Label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingOption ? 'Mettre à jour' : 'Créer'}
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
        ) : options.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune option</h3>
              <p className="text-slate-500 text-center mb-4">Ajoutez des options comme la location de draps, le ménage supplémentaire, etc.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {options.map((option) => (
              <Card key={option.id} className={`border-0 shadow-sm ${!option.is_active && 'opacity-50'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">{option.name}</h3>
                      {!option.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">Désactivée</span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">{option.price} €</span>
                      <span className="text-slate-400 ml-1">({getPriceTypeLabel(option.price_type)})</span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(option)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-rose-500 hover:text-rose-600"
                      onClick={() => deleteMutation.mutate(option.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
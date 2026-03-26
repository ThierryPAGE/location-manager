import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Home, Users, Bed, Euro } from 'lucide-react';

export default function Properties() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    capacity: 4,
    bedrooms: 2,
    base_price_per_night: 100,
    cleaning_fee: 50,
    tourist_tax_per_person: 1,
    deposit_amount: 500,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Property.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      capacity: 4,
      bedrooms: 2,
      base_price_per_night: 100,
      cleaning_fee: 50,
      tourist_tax_per_person: 1,
      deposit_amount: 500,
      is_active: true
    });
    setEditingProperty(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || '',
      address: property.address || '',
      description: property.description || '',
      capacity: property.capacity || 4,
      bedrooms: property.bedrooms || 2,
      base_price_per_night: property.base_price_per_night || 100,
      cleaning_fee: property.cleaning_fee || 0,
      tourist_tax_per_person: property.tourist_tax_per_person || 0,
      deposit_amount: property.deposit_amount || 0,
      is_active: property.is_active !== false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProperty) {
      updateMutation.mutate({ id: editingProperty.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mes biens</h1>
            <p className="text-slate-500 mt-1">Gérez vos propriétés en location</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un bien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProperty ? 'Modifier le bien' : 'Nouveau bien'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nom du bien</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Villa Les Pins"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adresse</Label>
                    <Textarea 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Capacité (personnes)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={formData.capacity} 
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Nombre de chambres</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={formData.bedrooms} 
                      onChange={(e) => setFormData({...formData, bedrooms: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Prix par nuit (€)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.base_price_per_night} 
                      onChange={(e) => setFormData({...formData, base_price_per_night: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Frais de ménage (€)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.cleaning_fee} 
                      onChange={(e) => setFormData({...formData, cleaning_fee: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Taxe de séjour / pers. / nuit (€)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.tourist_tax_per_person} 
                      onChange={(e) => setFormData({...formData, tourist_tax_per_person: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Montant caution (€)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.deposit_amount} 
                      onChange={(e) => setFormData({...formData, deposit_amount: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingProperty ? 'Mettre à jour' : 'Créer'}
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
        ) : properties.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Home className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun bien</h3>
              <p className="text-slate-500 text-center mb-4">Commencez par ajouter votre premier bien en location</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{property.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(property)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-rose-500 hover:text-rose-600"
                        onClick={() => deleteMutation.mutate(property.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {property.address && (
                    <p className="text-sm text-slate-500 mb-4">{property.address}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{property.capacity} pers.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span>{property.bedrooms} ch.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                      <Euro className="w-4 h-4 text-slate-400" />
                      <span>{property.base_price_per_night} € / nuit</span>
                    </div>
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
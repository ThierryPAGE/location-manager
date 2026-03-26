import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Save } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    owner_phone: '',
    owner_address: '',
    owner_postal_code: '',
    owner_city: ''
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        owner_phone: user.owner_phone || '',
        owner_address: user.owner_address || '',
        owner_postal_code: user.owner_postal_code || '',
        owner_city: user.owner_city || ''
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      alert('Informations mises à jour avec succès');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-slate-500 mt-1">Vos coordonnées pour les devis et contrats</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations du propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nom et prénom *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="owner_phone">Téléphone *</Label>
                <Input
                  id="owner_phone"
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div>
                <Label htmlFor="owner_address">Adresse *</Label>
                <Input
                  id="owner_address"
                  value={formData.owner_address}
                  onChange={(e) => setFormData({...formData, owner_address: e.target.value})}
                  placeholder="12 rue de la République"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner_postal_code">Code postal *</Label>
                  <Input
                    id="owner_postal_code"
                    value={formData.owner_postal_code}
                    onChange={(e) => setFormData({...formData, owner_postal_code: e.target.value})}
                    placeholder="75001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="owner_city">Ville *</Label>
                  <Input
                    id="owner_city"
                    value={formData.owner_city}
                    onChange={(e) => setFormData({...formData, owner_city: e.target.value})}
                    placeholder="Paris"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
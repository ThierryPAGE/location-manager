import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Home } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM = { property_id: '', check_in: '', check_out: '', notes: '' };

export default function PersonalBookingManager({ properties, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: personalBookings = [] } = useQuery({
    queryKey: ['personalBookings'],
    queryFn: () => base44.entities.PersonalBooking.list('check_in'),
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalBooking.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personalBookings'] }); resetForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonalBooking.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personalBookings'] }); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalBooking.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personalBookings'] })
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (pb) => {
    setEditing(pb);
    setForm({ property_id: pb.property_id, check_in: pb.check_in, check_out: pb.check_out, notes: pb.notes || '' });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getPropertyName = (id) => properties.find(p => p.id === id)?.name || '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-500" />
            Réservations personnelles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une période
            </Button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-4 bg-orange-50">
              <div>
                <Label>Bien</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un bien" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Arrivée</Label>
                  <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} required />
                </div>
                <div>
                  <Label>Départ</Label>
                  <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label>Notes (optionnel)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Ex: vacances, travaux..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {personalBookings.length === 0 && !showForm && (
              <p className="text-center text-slate-500 py-6">Aucune réservation personnelle</p>
            )}
            {personalBookings.map((pb) => (
              <div key={pb.id} className="flex items-center justify-between p-3 rounded-xl border bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-700 border-0">Usage perso</Badge>
                    <span className="font-medium text-sm">{getPropertyName(pb.property_id)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {format(new Date(pb.check_in), 'dd MMM yyyy', { locale: fr })} → {format(new Date(pb.check_out), 'dd MMM yyyy', { locale: fr })}
                  </p>
                  {pb.notes && <p className="text-xs text-slate-400 mt-0.5">{pb.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(pb)}>
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(pb.id)}>
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
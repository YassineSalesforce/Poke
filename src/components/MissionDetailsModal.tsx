import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Package, Euro, Clock, MapPin, Save, Phone, Mail } from 'lucide-react';

interface MissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: MissionDetails) => void;
  carrierName: string;
  route: string;
  ensemblesTaken?: string;
  initialData?: Partial<MissionDetails>;
}

export interface MissionDetails {
  merchandise: string;
  loadingDate: string;
  loadingTime: string;
  deliveryDate: string;
  deliveryTime: string;
  estimatedPrice: number;
  notes?: string;
  phone: string;
  email: string;
}

export function MissionDetailsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  carrierName, 
  route,
  ensemblesTaken,
  initialData 
}: MissionDetailsModalProps) {
  console.log('MissionDetailsModal rendered, isOpen:', isOpen);
  
  const [details, setDetails] = useState<MissionDetails>({
    merchandise: initialData?.merchandise || '',
    loadingDate: initialData?.loadingDate || '',
    loadingTime: initialData?.loadingTime || '08:00',
    deliveryDate: initialData?.deliveryDate || '',
    deliveryTime: initialData?.deliveryTime || '18:00',
    estimatedPrice: initialData?.estimatedPrice || 0,
    notes: initialData?.notes || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(details);
    onClose();
  };

  const handleInputChange = (field: keyof MissionDetails, value: string | number) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-orange-500" />
            Détails de la mission - {carrierName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Informations de la route
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm text-blue-700 font-medium">{route}</p>
              {ensemblesTaken && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">
                    {ensemblesTaken} ensemble{parseInt(ensemblesTaken) > 1 ? 's' : ''} pris
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Merchandise and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchandise" className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Type de marchandise *
              </Label>
              <Input
                id="merchandise"
                value={details.merchandise}
                onChange={(e) => handleInputChange('merchandise', e.target.value)}
                placeholder="Ex: Granulats, Ciment..."
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedPrice" className="text-sm font-medium flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Tarif estimé (€) *
              </Label>
              <Input
                id="estimatedPrice"
                type="number"
                value={details.estimatedPrice}
                onChange={(e) => handleInputChange('estimatedPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="rounded-lg"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Loading Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loadingDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de chargement *
              </Label>
              <Input
                id="loadingDate"
                type="date"
                value={details.loadingDate}
                onChange={(e) => handleInputChange('loadingDate', e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loadingTime" className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Heure de chargement *
              </Label>
              <Input
                id="loadingTime"
                type="time"
                value={details.loadingTime}
                onChange={(e) => handleInputChange('loadingTime', e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
          </div>

          {/* Delivery Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de livraison *
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                value={details.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryTime" className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Heure de livraison *
              </Label>
              <Input
                id="deliveryTime"
                type="time"
                value={details.deliveryTime}
                onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Numéro de téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={details.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ex: +33 6 12 34 56 78"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={details.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Ex: contact@transporteur.fr"
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes supplémentaires
            </Label>
            <Textarea
              id="notes"
              value={details.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Instructions spéciales, contacts sur site, etc."
              className="rounded-lg min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg h-11"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg h-11 transition-all hover:shadow-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder pour ce transporteur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

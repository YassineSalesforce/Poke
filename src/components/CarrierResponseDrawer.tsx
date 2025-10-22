import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Separator } from './ui/separator';

interface Carrier {
  id: string;
  name: string;
  route: string;
  vehicleType: string;
  score: number;
  confidence: number;
  capacity: number;
}

interface CarrierResponse {
  status: 'yes' | 'no' | 'pending';
  ensemblesTaken: number;
  comment: string;
}

interface CarrierResponseDrawerProps {
  carrier: Carrier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (carrierId: string, response: CarrierResponse) => void;
}

export function CarrierResponseDrawer({ carrier, isOpen, onClose, onSave }: CarrierResponseDrawerProps) {
  const [status, setStatus] = useState<'yes' | 'no' | 'pending'>('pending');
  const [ensemblesTaken, setEnsemblesTaken] = useState('');
  const [comment, setComment] = useState('');

  if (!carrier) return null;

  const handleSave = () => {
    onSave(carrier.id, {
      status,
      ensemblesTaken: parseInt(ensemblesTaken) || 0,
      comment,
    });
    // Reset form
    setStatus('pending');
    setEnsemblesTaken('');
    setComment('');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="fixed inset-y-0 right-0 mt-0 w-[500px] rounded-none">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle>Saisir le retour transporteur</DrawerTitle>
              <DrawerDescription>{carrier.name}</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Carrier Info Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Route</span>
              <span className="text-sm">{carrier.route}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Type de véhicule</span>
              <span className="text-sm">{carrier.vehicleType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Capacité possible</span>
              <span className="text-sm">{carrier.capacity} ensemble{carrier.capacity > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Score global</span>
              <span className="text-sm">⭐ {carrier.score}/10</span>
            </div>
          </div>

          <Separator />

          {/* Response Status */}
          <div className="space-y-3">
            <Label>Statut de réponse *</Label>
            <RadioGroup value={status} onValueChange={(value) => setStatus(value as 'yes' | 'no' | 'pending')}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
                <RadioGroupItem value="yes" id="yes" />
                <label
                  htmlFor="yes"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Oui – Accepte la mission</span>
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
                <RadioGroupItem value="no" id="no" />
                <label
                  htmlFor="no"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Non – Refuse la mission</span>
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors">
                <RadioGroupItem value="pending" id="pending" />
                <label
                  htmlFor="pending"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>En attente de réponse</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Ensembles Taken */}
          {status === 'yes' && (
            <div className="space-y-2">
              <Label htmlFor="ensembles">
                Nombre d'ensembles pris *
              </Label>
              <Input
                id="ensembles"
                type="number"
                value={ensemblesTaken}
                onChange={(e) => setEnsemblesTaken(e.target.value)}
                placeholder="Ex: 2"
                min="1"
                max={carrier.capacity}
                className="rounded-lg"
              />
              <p className="text-sm text-gray-500">
                Maximum disponible : {carrier.capacity} ensemble{carrier.capacity > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notes, conditions particulières, délais..."
              className="rounded-lg resize-none"
              rows={4}
            />
          </div>
        </div>

        <DrawerFooter className="border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={status === 'yes' && !ensemblesTaken}
            className="w-full rounded-lg h-11 transition-all hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: '#F6A20E', color: 'white' }}
          >
            Enregistrer le retour
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full rounded-lg h-11">
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

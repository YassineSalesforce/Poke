import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  X,
  Star,
  TrendingUp,
  Calendar,
  BanIcon,
  Plus,
  Package
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

interface Carrier {
  id: string;
  name: string;
  route: string;
  vehicleType: string;
  score: number;
  confidence: number;
  capacity: number;
  lastMission?: string;
  isAlternative?: boolean;
}

interface ContactCarrierDrawerProps {
  carrier: Carrier | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveReturn: (carrierId: string, data: ReturnData) => void;
  onDisableRoute: (carrierId: string) => void;
  onCreateRoute?: (carrierId: string) => void;
  remainingEnsembles: number;
  totalQuantity: number;
}

interface ReturnData {
  response: 'yes' | 'no' | 'pending';
  ensemblesTaken: string;
  ensemblesPrevisional: string;
  comment: string;
}

export function ContactCarrierDrawer({
  carrier,
  isOpen,
  onClose,
  onSaveReturn,
  onDisableRoute,
  onCreateRoute,
  remainingEnsembles,
  totalQuantity,
}: ContactCarrierDrawerProps) {
  const [response, setResponse] = useState<'yes' | 'no' | 'pending'>('pending');
  const [ensemblesTaken, setEnsemblesTaken] = useState('');
  const [ensemblesPrevisional, setEnsemblesPrevisional] = useState('');
  const [comment, setComment] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  useEffect(() => {
    if (isOpen && carrier) {
      // Reset form when drawer opens
      setResponse('pending');
      setEnsemblesTaken('');
      setEnsemblesPrevisional('');
      setComment('');
    }
  }, [isOpen, carrier]);

  const handleSaveReturn = () => {
    if (!carrier) return;

    // Validation
    if (response === 'yes' && !ensemblesTaken) {
      toast.error('Veuillez indiquer le nombre d\'ensembles pris');
      return;
    }

    if (response === 'pending' && ensemblesPrevisional && parseInt(ensemblesPrevisional) > remainingEnsembles) {
      toast.error('Le volume prévisionnel dépasse le reste à prendre');
      return;
    }

    onSaveReturn(carrier.id, {
      response,
      ensemblesTaken,
      ensemblesPrevisional,
      comment,
    });

    toast.success('Retour enregistré avec succès', {
      description: `${carrier.name} – ${response === 'yes' ? 'Confirmé' : response === 'no' ? 'Refusé' : 'En attente'}`,
      icon: '✅',
    });

    onClose();
  };

  const handleDisableRoute = () => {
    setShowDisableDialog(true);
  };

  const confirmDisableRoute = () => {
    if (!carrier) return;
    
    onDisableRoute(carrier.id);
    setShowDisableDialog(false);
    
    toast.success('Route désactivée avec succès', {
      description: 'Elle ne sera plus proposée dans les recherches futures',
      icon: '✅',
    });

    onClose();
  };

  const handleCreateRoute = () => {
    if (!carrier || !onCreateRoute) return;
    
    onCreateRoute(carrier.id);
    
    toast.success('Nouvelle route créée', {
      description: `Route officielle créée pour ${carrier.name}`,
      icon: '✅',
    });

    onClose();
  };

  if (!carrier) return null;

  // Calculer la couverture basée sur la quantité totale
  const coveragePercent = Math.round(((totalQuantity - remainingEnsembles) / totalQuantity) * 100);

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent className="fixed inset-y-0 right-0 mt-0 w-[600px] rounded-none">
          <DrawerHeader className="border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <DrawerTitle>Contact transporteur</DrawerTitle>
                <DrawerDescription className="mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{carrier.name}</span>
                    <span className="text-gray-400">–</span>
                    <span>{carrier.route}</span>
                    <span className="text-gray-400">–</span>
                    <span>{carrier.vehicleType}</span>
                  </div>
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="mb-4" style={{ color: '#2B3A55' }}>Informations générales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Type de véhicule</p>
                  <p className="text-sm">{carrier.vehicleType}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Capacité possible</p>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <p className="text-sm">{carrier.capacity} ensemble{carrier.capacity > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Score / Confiance</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" style={{ color: '#F6A20E' }} />
                      <span className="text-sm">{carrier.score}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{carrier.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Dernière mission commune</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <p className="text-sm">{carrier.lastMission || 'Il y a 12 jours'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Saisie du contact */}
            <div>
              <h3 className="mb-4" style={{ color: '#2B3A55' }}>Saisie du contact</h3>
              
              {/* Response Status */}
              <div className="space-y-2 mb-4">
                <Label>Statut de réponse</Label>
                <div className="flex gap-2">
                  <Button
                    variant={response === 'yes' ? 'default' : 'outline'}
                    onClick={() => setResponse('yes')}
                    className="flex-1 rounded-lg"
                    style={response === 'yes' ? { backgroundColor: '#4CAF50', color: 'white' } : {}}
                  >
                    ✅ Oui
                  </Button>
                  <Button
                    variant={response === 'no' ? 'default' : 'outline'}
                    onClick={() => setResponse('no')}
                    className="flex-1 rounded-lg"
                    style={response === 'no' ? { backgroundColor: '#EF4444', color: 'white' } : {}}
                  >
                    ❌ Non
                  </Button>
                  <Button
                    variant={response === 'pending' ? 'default' : 'outline'}
                    onClick={() => setResponse('pending')}
                    className="flex-1 rounded-lg"
                    style={response === 'pending' ? { backgroundColor: '#F59E0B', color: 'white' } : {}}
                  >
                    ⏳ En attente
                  </Button>
                </div>
              </div>

              {/* Ensembles Taken (if yes) */}
              {response === 'yes' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mb-4"
                >
                  <Label htmlFor="ensembles-taken">
                    Nombre d'ensembles pris <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ensembles-taken"
                    type="number"
                    value={ensemblesTaken}
                    onChange={(e) => setEnsemblesTaken(e.target.value)}
                    placeholder="Ex: 2"
                    className="rounded-lg"
                    min="1"
                    max={carrier.capacity}
                  />
                  <p className="text-sm text-gray-500">
                    Capacité maximale: {carrier.capacity} ensemble{carrier.capacity > 1 ? 's' : ''}
                  </p>
                </motion.div>
              )}

              {/* Ensembles Previsional (if pending) */}
              {response === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mb-4"
                >
                  <Label htmlFor="ensembles-previsional">Volume prévisionnel réservé</Label>
                  <Input
                    id="ensembles-previsional"
                    type="number"
                    value={ensemblesPrevisional}
                    onChange={(e) => setEnsemblesPrevisional(e.target.value)}
                    placeholder="Ex: 1"
                    className="rounded-lg bg-amber-50"
                    min="0"
                    max={remainingEnsembles}
                  />
                  <p className="text-sm text-gray-500">
                    Reste disponible: {remainingEnsembles} ensemble{remainingEnsembles > 1 ? 's' : ''}
                  </p>
                </motion.div>
              )}

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Commentaire</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ajoutez des remarques sur le contact..."
                  className="rounded-lg resize-none"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Maintenance de la route */}
            <div>
              <h3 className="mb-4" style={{ color: '#2B3A55' }}>Maintenance de la route</h3>
              <div className="space-y-3">
                {!carrier.isAlternative ? (
                  <Button
                    variant="outline"
                    onClick={handleDisableRoute}
                    className="w-full rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <BanIcon className="w-4 h-4 mr-2" />
                    Désactiver cette route
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCreateRoute}
                    className="w-full rounded-lg"
                    style={{ borderColor: '#F6A20E', color: '#F6A20E' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer route officielle
                  </Button>
                )}
                <p className="text-xs text-gray-500 text-center">
                  {!carrier.isAlternative 
                    ? 'La route ne sera plus proposée dans les recherches futures'
                    : 'Ajouter ce transporteur comme route officielle'}
                </p>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-gray-200 bg-gray-50">
            {/* Mission Summary */}
            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-gray-600">Reste à prendre</p>
                    <p style={{ color: '#F6A20E' }}>{remainingEnsembles} ensemble{remainingEnsembles > 1 ? 's' : ''}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div>
                    <p className="text-gray-600">Couverture</p>
                    <p style={{ color: '#4CAF50' }}>{coveragePercent}%</p>
                  </div>
                </div>
                <Badge style={{ backgroundColor: '#FFF3E0', color: '#F6A20E' }}>
                  Mission en cours
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <Button
              onClick={handleSaveReturn}
              className="w-full rounded-lg h-11"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Enregistrer le retour
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full rounded-lg h-11"
            >
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Disable Route Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <BanIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Désactiver cette route</DialogTitle>
            <DialogDescription className="text-center">
              <p className="mb-3">
                ⚠️ Vous êtes sur le point de désactiver cette route.
              </p>
              <p className="text-sm text-gray-600">
                Elle ne sera plus proposée dans les recherches futures.<br />
                Voulez-vous continuer ?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
              className="flex-1 rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDisableRoute}
              className="flex-1 rounded-lg"
              style={{ backgroundColor: '#EF4444', color: 'white' }}
            >
              Oui, désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

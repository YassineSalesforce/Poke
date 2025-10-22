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
import { Badge } from './ui/badge';
import { X, MapPin, Truck, Calendar, FileText, User } from 'lucide-react';
import { Separator } from './ui/separator';

interface Mission {
  id: string;
  date: string;
  origin: string;
  destination: string;
  vehicle: string;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
}

interface MissionDetailDrawerProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MissionDetailDrawer({ mission, isOpen, onClose }: MissionDetailDrawerProps) {
  if (!mission) return null;

  const getStatusBadge = (status: Mission['status']) => {
    const statusConfig = {
      completed: { label: 'Terminé', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      'in-progress': { label: 'En cours', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    };

    return statusConfig[status];
  };

  const statusConfig = getStatusBadge(mission.status);

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="fixed inset-y-0 right-0 mt-0 w-[500px] rounded-none">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle>Mission #{mission.id}</DrawerTitle>
              <DrawerDescription>Détails de la mission</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div>
            <Badge className={statusConfig.className + ' text-sm px-3 py-1'}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
              <Calendar className="w-5 h-5" style={{ color: '#2B3A55' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de la mission</p>
              <p>{mission.date}</p>
            </div>
          </div>

          <Separator />

          {/* Route */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
                <MapPin className="w-5 h-5" style={{ color: '#2B3A55' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Origine</p>
                <p>{mission.origin}</p>
                <p className="text-xs text-gray-400 mt-1">123 Rue de la Paix, 75001</p>
              </div>
            </div>

            <div className="flex items-start gap-3 ml-5 border-l-2 border-dashed border-gray-300 pl-8 py-2">
              <div className="text-sm text-gray-500">Distance: ~450 km • Durée: ~5h30</div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
                <MapPin className="w-5 h-5" style={{ color: '#F6A20E' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Destination</p>
                <p>{mission.destination}</p>
                <p className="text-xs text-gray-400 mt-1">456 Avenue du Commerce, 69001</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
              <Truck className="w-5 h-5" style={{ color: '#2B3A55' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Type de véhicule</p>
              <p>{mission.vehicle}</p>
              <p className="text-xs text-gray-400 mt-1">Charge utile: 24 tonnes</p>
            </div>
          </div>

          <Separator />

          {/* Carrier */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
              <User className="w-5 h-5" style={{ color: '#2B3A55' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transporteur</p>
              <p>Transport Express SA</p>
              <p className="text-xs text-gray-400 mt-1">Contact: +33 1 23 45 67 89</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm text-gray-700">Détails supplémentaires</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Poids</p>
                <p>18.5 tonnes</p>
              </div>
              <div>
                <p className="text-gray-500">Volume</p>
                <p>45 m³</p>
              </div>
              <div>
                <p className="text-gray-500">Palettes</p>
                <p>33 unités</p>
              </div>
              <div>
                <p className="text-gray-500">Prix</p>
                <p>1,250 €</p>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-gray-200">
          <Button
            className="w-full rounded-lg h-11 transition-all hover:shadow-lg"
            style={{ backgroundColor: '#F6A20E', color: 'white' }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Générer ordre de mission
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full rounded-lg h-11">
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

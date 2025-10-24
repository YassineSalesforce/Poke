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
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { X, Save } from 'lucide-react';
import { Separator } from './ui/separator';

interface RouteData {
  id?: string;
  carrierId: string;
  carrierName: string;
  originCountry: string;
  originRegion: string;
  originDepartment: string;
  originCity: string;
  destinationCountry: string;
  destinationRegion: string;
  destinationDepartment: string;
  destinationCity: string;
  vehicleType: string;
  isActive: boolean;
  lastUpdated?: string;
}

interface RouteDrawerProps {
  route: RouteData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (route: RouteData) => void;
}

export function RouteDrawer({ route, isOpen, onClose, onSave }: RouteDrawerProps) {
  const [formData, setFormData] = useState<RouteData>({
    carrierId: '',
    carrierName: '',
    originCountry: '',
    originRegion: '',
    originDepartment: '',
    originCity: '',
    destinationCountry: '',
    destinationRegion: '',
    destinationDepartment: '',
    destinationCity: '',
    vehicleType: '',
    isActive: true,
  });

  useEffect(() => {
    console.log('📝 RouteDrawer - Route reçue:', route);
    if (route) {
      console.log('✅ RouteDrawer - Mise à jour du formulaire avec:', route);
      setFormData(route);
    } else {
      // Reset form for new route
      console.log('🆕 RouteDrawer - Nouveau formulaire');
      setFormData({
        carrierId: '',
        carrierName: '',
        originCountry: '',
        originRegion: '',
        originDepartment: '',
        originCity: '',
        destinationCountry: '',
        destinationRegion: '',
        destinationDepartment: '',
        destinationCity: '',
        vehicleType: '',
        isActive: true,
      });
    }
  }, [route, isOpen]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const isFormValid = formData.carrierId && formData.originCity && formData.destinationCity && formData.vehicleType;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="fixed inset-y-0 right-0 mt-0 w-[600px] rounded-none">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle>
                {route?.id ? 'Modifier la route' : 'Créer une nouvelle route'}
              </DrawerTitle>
              <DrawerDescription>
                {route?.id ? 'Modifiez les informations de la route' : 'Ajoutez une nouvelle route transporteur'}
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
          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">
              Transporteur <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.carrierId}
              onValueChange={(value) => {
                const carriers = {
                  '1': 'TRANSARLE',
                  '2': 'CHEVALIER TRANSPORTS',
                  '3': '2BMOVED',
                  '4': 'LOGISTIQUE EXPRESS',
                  '5': 'TRANS EUROPA',
                };
                setFormData({ ...formData, carrierId: value, carrierName: carriers[value as keyof typeof carriers] || '' });
              }}
            >
              <SelectTrigger id="carrier" className="rounded-lg">
                <SelectValue placeholder="Sélectionner un transporteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">TRANSARLE</SelectItem>
                <SelectItem value="2">CHEVALIER TRANSPORTS</SelectItem>
                <SelectItem value="3">2BMOVED</SelectItem>
                <SelectItem value="4">LOGISTIQUE EXPRESS</SelectItem>
                <SelectItem value="5">TRANS EUROPA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Origin */}
          <div>
            <h3 className="mb-4" style={{ color: '#2B3A55' }}>Origine</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin-country">Pays</Label>
                  <Select 
                    value={formData.originCountry}
                    onValueChange={(value) => setFormData({ ...formData, originCountry: value })}
                  >
                    <SelectTrigger id="origin-country" className="rounded-lg">
                      <SelectValue placeholder="Pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="ES">Espagne</SelectItem>
                      <SelectItem value="DE">Allemagne</SelectItem>
                      <SelectItem value="IT">Italie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin-region">Région</Label>
                  <Input
                    id="origin-region"
                    value={formData.originRegion}
                    onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })}
                    placeholder="Ex: Nouvelle-Aquitaine"
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin-department">Département</Label>
                  <Input
                    id="origin-department"
                    value={formData.originDepartment}
                    onChange={(e) => setFormData({ ...formData, originDepartment: e.target.value })}
                    placeholder="Ex: 33"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin-city">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="origin-city"
                    value={formData.originCity}
                    onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                    placeholder="Ex: Bordeaux"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Destination */}
          <div>
            <h3 className="mb-4" style={{ color: '#2B3A55' }}>Destination</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dest-country">Pays</Label>
                  <Select 
                    value={formData.destinationCountry}
                    onValueChange={(value) => setFormData({ ...formData, destinationCountry: value })}
                  >
                    <SelectTrigger id="dest-country" className="rounded-lg">
                      <SelectValue placeholder="Pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="ES">Espagne</SelectItem>
                      <SelectItem value="DE">Allemagne</SelectItem>
                      <SelectItem value="IT">Italie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dest-region">Région</Label>
                  <Input
                    id="dest-region"
                    value={formData.destinationRegion}
                    onChange={(e) => setFormData({ ...formData, destinationRegion: e.target.value })}
                    placeholder="Ex: Communauté de Madrid"
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dest-department">Département / Province</Label>
                  <Input
                    id="dest-department"
                    value={formData.destinationDepartment}
                    onChange={(e) => setFormData({ ...formData, destinationDepartment: e.target.value })}
                    placeholder="Ex: ES13"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dest-city">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dest-city"
                    value={formData.destinationCity}
                    onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                    placeholder="Ex: Madrid"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">
              Type de véhicule <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.vehicleType}
              onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
            >
              <SelectTrigger id="vehicle" className="rounded-lg">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Benne">🚛 Benne</SelectItem>
                <SelectItem value="Tautliner">🚚 Tautliner</SelectItem>
                <SelectItem value="Plateau">📦 Plateau</SelectItem>
                <SelectItem value="Frigo">❄️ Frigo</SelectItem>
                <SelectItem value="Semi-remorque">🚛 Semi-remorque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="status">Statut de la route</Label>
              <p className="text-sm text-gray-500">
                {formData.isActive ? 'Route active et visible' : 'Route désactivée'}
              </p>
            </div>
            <Switch
              id="status"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          {route?.lastUpdated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Dernière mise à jour : {route.lastUpdated}
              </p>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full rounded-lg h-11 transition-all hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: isFormValid ? '#F6A20E' : '#ccc', color: 'white' }}
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full rounded-lg h-11">
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

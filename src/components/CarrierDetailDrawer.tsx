import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  X,
  Save,
  Trash2,
  Plus,
  Edit,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Truck,
  Users,
  Route as RouteIcon,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
}

interface RouteData {
  id: string;
  origin: string;
  destination: string;
  vehicleType: string;
  status: 'active' | 'temporarily-closed' | 'closed';
  closurePeriods: ClosurePeriod[];
}

interface ClosurePeriod {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  active: boolean;
}

interface Carrier {
  id: string;
  name: string;
  status: 'active' | 'temporarily-closed' | 'closed';
  openingDate: string;
  closingDate?: string;
  routesCount: number;
  contactsCount: number;
  siret?: string;
  activity?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CarrierDetailDrawerProps {
  carrier: Carrier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (carrier: Carrier) => void;
  onDelete: (carrierId: string) => void;
}

export function CarrierDetailDrawer({
  carrier,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: CarrierDetailDrawerProps) {
  const [formData, setFormData] = useState<Carrier | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [closurePeriods, setClosurePeriods] = useState<ClosurePeriod[]>([]);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [newClosurePeriod, setNewClosurePeriod] = useState<Partial<ClosurePeriod>>({});

  useEffect(() => {
    if (carrier) {
      setFormData(carrier);
      
      // Load mock contacts
      if (carrier.id === '1') {
        setContacts([
          { id: '1', firstName: 'Marc', lastName: 'Dupont', role: 'Gérant', phone: '06 45 33 12 09', email: 'marc@transarle.fr' },
          { id: '2', firstName: 'Claire', lastName: 'Lefèvre', role: 'Exploitante', phone: '06 22 45 76 09', email: 'claire@transarle.fr' },
          { id: '3', firstName: 'Nicolas', lastName: 'Lambert', role: 'Administratif', phone: '05 56 92 74 10', email: 'admin@transarle.fr' },
        ]);
      } else {
        setContacts([
          { id: '1', firstName: 'Jean', lastName: 'Martin', role: 'Gérant', phone: '06 12 34 56 78', email: 'contact@carrier.fr' },
        ]);
      }

      // Load mock routes
      setRoutes([
        { 
          id: '1', 
          origin: 'FR33 – Gironde', 
          destination: 'ES13 – Madrid', 
          vehicleType: 'Benne', 
          status: 'active',
          closurePeriods: [
            { id: '1', startDate: '01/08/2025', endDate: '31/08/2025', reason: 'Maintenance infrastructure', active: true }
          ]
        },
        { 
          id: '2', 
          origin: 'FR49 – Maine-et-Loire', 
          destination: 'FR69 – Rhône', 
          vehicleType: 'Tautliner', 
          status: 'temporarily-closed',
          closurePeriods: [
            { id: '1', startDate: '15/01/2025', endDate: '28/02/2025', reason: 'Travaux routiers', active: true }
          ]
        },
      ]);

      // Load mock closure periods
      setClosurePeriods([
        { id: '1', startDate: '15/07/2025', endDate: '30/08/2025', reason: 'Congés d\'été', active: true },
        { id: '2', startDate: '20/12/2025', endDate: '05/01/2026', reason: 'Fêtes de fin d\'année', active: true },
      ]);
    }
  }, [carrier]);

  const handleSave = () => {
    if (!formData) return;
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (!carrier) return;
    onDelete(carrier.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const handleAddContact = () => {
    setEditingContact({
      id: `contact-${Date.now()}`,
      firstName: '',
      lastName: '',
      role: 'Exploitant',
      phone: '',
      email: '',
    });
    setShowContactDialog(true);
  };

  const handleSaveContact = () => {
    if (!editingContact) return;
    
    const existing = contacts.find(c => c.id === editingContact.id);
    if (existing) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? editingContact : c));
    } else {
      setContacts(prev => [...prev, editingContact]);
    }
    
    setShowContactDialog(false);
    setEditingContact(null);
    toast.success('Contact enregistré', { icon: '✅' });
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    toast.success('Contact supprimé', { icon: '🗑️' });
  };

  const handleAddClosurePeriod = () => {
    setNewClosurePeriod({
      id: `closure-${Date.now()}`,
      startDate: '',
      endDate: '',
      reason: '',
      active: true,
    });
    setShowClosureDialog(true);
  };

  const handleSaveClosurePeriod = () => {
    if (!newClosurePeriod.startDate || !newClosurePeriod.endDate) {
      toast.error('Veuillez remplir les dates');
      return;
    }

    setClosurePeriods(prev => [...prev, newClosurePeriod as ClosurePeriod]);
    setShowClosureDialog(false);
    setNewClosurePeriod({});
    toast.success('Période ajoutée', { icon: '🟢' });
  };

  const handleDeleteClosurePeriod = (periodId: string) => {
    setClosurePeriods(prev => prev.filter(p => p.id !== periodId));
    toast.success('Période supprimée', { icon: '🗑️' });
  };

  const handleMarkTemporarilyClosed = () => {
    if (!formData) return;
    
    setFormData({ ...formData, status: 'temporarily-closed' });
    toast.success('Statut modifié', {
      description: 'Transporteur marqué comme fermé temporairement',
      icon: '🟠',
    });
  };

  if (!carrier || !formData) return null;

  const isNewCarrier = carrier.id.startsWith('new-');

  const getStatusConfig = (status: Carrier['status']) => {
    switch (status) {
      case 'active':
        return { label: 'Actif', color: 'bg-green-100 text-green-700', icon: '🟢' };
      case 'temporarily-closed':
        return { label: 'Fermé temporairement', color: 'bg-amber-100 text-amber-700', icon: '🟠' };
      case 'closed':
        return { label: 'Fermé', color: 'bg-red-100 text-red-700', icon: '🔴' };
    }
  };

  const statusConfig = getStatusConfig(formData.status);

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent 
          className="fixed inset-y-0 right-0 mt-0 rounded-none flex flex-col" 
          style={{ width: '1200px', maxWidth: '1200px' }}
        >
          <DrawerHeader className="border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DrawerTitle className="flex items-center gap-3">
                  {isNewCarrier ? 'Nouveau transporteur' : formData.name}
                  <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                    <span>{statusConfig.icon}</span>
                    <span className="text-xs">{statusConfig.label}</span>
                  </Badge>
                </DrawerTitle>
                <DrawerDescription className="mt-2">
                  {isNewCarrier ? 'Renseignez les informations du nouveau transporteur' : 'Gérez les informations, contacts et routes'}
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
            {/* Section 1: Informations générales */}
            <div>
              <h3 className="mb-4 flex items-center gap-2" style={{ color: '#2B3A55' }}>
                <Truck className="w-5 h-5" />
                Informations générales
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'entreprise <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: TRANSARLE"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET / Numéro interne</Label>
                  <Input
                    id="siret"
                    value={formData.siret || ''}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    placeholder="123 456 789 00012"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity">Type d'activité</Label>
                  <Input
                    id="activity"
                    value={formData.activity || ''}
                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="Benne, Tautliner, Plateau..."
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">🟢 Actif</SelectItem>
                      <SelectItem value="temporarily-closed">🟠 Fermé temporairement</SelectItem>
                      <SelectItem value="closed">🔴 Fermé définitivement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email principal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@transporteur.fr"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone principal</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05 56 12 34 56"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Adresse du siège</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="12 rue du Port, 33000 Bordeaux"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opening-date">Date d'ouverture globale</Label>
                  <Input
                    id="opening-date"
                    value={formData.openingDate}
                    onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                    placeholder="01/01/2024"
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Closure Periods */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label>Périodes de fermeture</Label>
                  <Button
                    onClick={handleAddClosurePeriod}
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    style={{ borderColor: '#F6A20E', color: '#F6A20E' }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter une période
                  </Button>
                </div>
                
                {closurePeriods.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                    Aucune période de fermeture
                  </p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-600">Début</th>
                          <th className="text-left px-3 py-2 text-gray-600">Fin</th>
                          <th className="text-left px-3 py-2 text-gray-600">Motif</th>
                          <th className="text-left px-3 py-2 text-gray-600">Actif</th>
                          <th className="text-right px-3 py-2 text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {closurePeriods.map((period) => (
                          <tr key={period.id} className="border-t border-gray-200">
                            <td className="px-3 py-2">{period.startDate}</td>
                            <td className="px-3 py-2">{period.endDate}</td>
                            <td className="px-3 py-2">{period.reason}</td>
                            <td className="px-3 py-2">{period.active ? '✅' : '⏸️'}</td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                onClick={() => handleDeleteClosurePeriod(period.id)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 2: Contacts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2" style={{ color: '#2B3A55' }}>
                  <Users className="w-5 h-5" />
                  Contacts associés
                </h3>
                <Button
                  onClick={handleAddContact}
                  size="sm"
                  className="rounded-lg"
                  style={{ backgroundColor: '#F6A20E', color: 'white' }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter un contact
                </Button>
              </div>

              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Aucun contact enregistré
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-600">Nom</th>
                        <th className="text-left px-3 py-2 text-gray-600">Prénom</th>
                        <th className="text-left px-3 py-2 text-gray-600">Rôle</th>
                        <th className="text-left px-3 py-2 text-gray-600">Téléphone</th>
                        <th className="text-left px-3 py-2 text-gray-600">Email</th>
                        <th className="text-right px-3 py-2 text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="border-t border-gray-200">
                          <td className="px-3 py-2">{contact.lastName}</td>
                          <td className="px-3 py-2">{contact.firstName}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">{contact.role}</Badge>
                          </td>
                          <td className="px-3 py-2">{contact.phone}</td>
                          <td className="px-3 py-2">{contact.email}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                onClick={() => {
                                  setEditingContact(contact);
                                  setShowContactDialog(true);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-blue-50"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteContact(contact.id)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Separator />

            {/* Section 3: Routes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2" style={{ color: '#2B3A55' }}>
                  <RouteIcon className="w-5 h-5" />
                  Routes associées
                </h3>
                <Button
                  size="sm"
                  className="rounded-lg"
                  style={{ backgroundColor: '#F6A20E', color: 'white' }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter une route
                </Button>
              </div>

              {routes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Aucune route enregistrée
                </p>
              ) : (
                <div className="space-y-3">
                  {routes.map((route) => {
                    const routeStatus = getStatusConfig(route.status);
                    
                    return (
                      <div key={route.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{route.origin} → {route.destination}</span>
                              <Badge className={`${routeStatus.color} text-xs`}>
                                {routeStatus.icon} {routeStatus.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">Type: {route.vehicleType} • {route.closurePeriods.length} période(s) de fermeture</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-blue-50">
                              <Edit className="w-3 h-3 mr-1" />
                              Modifier
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                        
                        {route.closurePeriods.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-xs text-amber-900 mb-2">Périodes de fermeture spécifiques:</p>
                            {route.closurePeriods.map((period) => (
                              <div key={period.id} className="text-xs text-amber-800 flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>{period.startDate} → {period.endDate} – {period.reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="mb-3" style={{ color: '#2B3A55' }}>Récapitulatif</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Routes actives</p>
                  <p className="text-green-700">{routes.filter(r => r.status === 'active').length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Nombre de contacts</p>
                  <p style={{ color: '#2B3A55' }}>{contacts.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Prochaine fermeture</p>
                  <p className="text-amber-700">{closurePeriods[0]?.startDate || 'Aucune'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Statut global</p>
                  <Badge className={`${statusConfig.color} text-xs w-fit`}>
                    {statusConfig.icon} {statusConfig.label}
                  </Badge>
                </div>
              </div>
              
              {formData.status === 'active' && (
                <Button
                  onClick={handleMarkTemporarilyClosed}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 rounded-lg border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  🟠 Marquer comme fermé temporairement
                </Button>
              )}
            </div>
          </div>

          <DrawerFooter className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                className="flex-1 rounded-lg h-11"
                style={{ backgroundColor: '#F6A20E', color: 'white' }}
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 rounded-lg h-11"
              >
                Fermer
              </Button>
              {!isNewCarrier && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="outline"
                  className="rounded-lg h-11 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Supprimer ce transporteur</DialogTitle>
            <DialogDescription className="text-center">
              <p className="mb-3">
                ⚠️ Cette action est irréversible.
              </p>
              <p className="text-sm text-gray-600">
                Toutes les routes et contacts associés seront également supprimés.<br />
                Voulez-vous continuer ?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 rounded-lg"
              style={{ backgroundColor: '#EF4444', color: 'white' }}
            >
              Oui, supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact?.firstName ? 'Modifier le contact' : 'Ajouter un contact'}</DialogTitle>
            <DialogDescription>
              Renseignez les informations du contact
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={editingContact.lastName}
                    onChange={(e) => setEditingContact({ ...editingContact, lastName: e.target.value })}
                    placeholder="Dupont"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={editingContact.firstName}
                    onChange={(e) => setEditingContact({ ...editingContact, firstName: e.target.value })}
                    placeholder="Marc"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={editingContact.role} onValueChange={(value) => setEditingContact({ ...editingContact, role: value })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gérant">Gérant</SelectItem>
                    <SelectItem value="Exploitant">Exploitant</SelectItem>
                    <SelectItem value="Administratif">Administratif</SelectItem>
                    <SelectItem value="Comptable">Comptable</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={editingContact.phone}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingContact.email}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  placeholder="contact@transporteur.fr"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContactDialog(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveContact}
              className="rounded-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closure Period Dialog */}
      <Dialog open={showClosureDialog} onOpenChange={setShowClosureDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une période de fermeture</DialogTitle>
            <DialogDescription>
              Définissez les dates et le motif de fermeture
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={newClosurePeriod.startDate}
                  onChange={(e) => setNewClosurePeriod({ ...newClosurePeriod, startDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={newClosurePeriod.endDate}
                  onChange={(e) => setNewClosurePeriod({ ...newClosurePeriod, endDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Input
                value={newClosurePeriod.reason || ''}
                onChange={(e) => setNewClosurePeriod({ ...newClosurePeriod, reason: e.target.value })}
                placeholder="Ex: Congés d'été"
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClosureDialog(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveClosurePeriod}
              className="rounded-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

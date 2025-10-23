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
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  X,
  Save,
  Edit,
  Plus,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface UnavailabilityPeriod {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface HistoryNote {
  id: string;
  date: string;
  content: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
  internalComment?: string;
  isPrimary: boolean;
  isAvailable: boolean;
  unavailabilityPeriods: UnavailabilityPeriod[];
  preferredChannels: {
    phone: boolean;
    email: boolean;
    sms: boolean;
  };
  historyNotes: HistoryNote[];
}

interface CarrierInfo {
  name: string;
  route?: string;
  vehicleType?: string;
}

interface ContactDetailDrawerProps {
  contact: Contact | null;
  carrier: CarrierInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  onSetAsPrimary?: (contactId: string) => void;
}

export function ContactDetailDrawer({
  contact,
  carrier,
  isOpen,
  onClose,
  onSave,
  onSetAsPrimary,
}: ContactDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Contact | null>(null);
  const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [newUnavailability, setNewUnavailability] = useState<Partial<UnavailabilityPeriod>>({});
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (contact) {
      setFormData(contact);
      setIsEditing(false);
    }
  }, [contact]);

  const handleSave = () => {
    if (!formData) return;

    // Check if primary status changed
    if (formData.isPrimary && !contact?.isPrimary && onSetAsPrimary) {
      setShowPrimaryWarning(true);
      return;
    }

    onSave(formData);
    setIsEditing(false);
    
    toast.success('Contact mis à jour avec succès', {
      icon: '✅',
    });

    // Auto-close after 1 second
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const confirmPrimaryChange = () => {
    if (!formData) return;
    
    if (onSetAsPrimary) {
      onSetAsPrimary(formData.id);
    }
    
    onSave(formData);
    setShowPrimaryWarning(false);
    setIsEditing(false);
    
    toast.success('Nouveau contact principal défini', {
      icon: '🟢',
    });

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleAddUnavailability = () => {
    if (!newUnavailability.startDate || !newUnavailability.endDate) {
      toast.error('Veuillez remplir les dates');
      return;
    }

    const period: UnavailabilityPeriod = {
      id: `unavail-${Date.now()}`,
      startDate: newUnavailability.startDate!,
      endDate: newUnavailability.endDate!,
      reason: newUnavailability.reason || 'Non spécifié',
    };

    setFormData(prev => prev ? {
      ...prev,
      unavailabilityPeriods: [...prev.unavailabilityPeriods, period],
      isAvailable: false,
    } : null);

    setShowUnavailabilityDialog(false);
    setNewUnavailability({});
    
    toast.success('Fermeture temporaire enregistrée', {
      icon: '🟠',
    });
  };

  const handleDeleteUnavailability = (periodId: string) => {
    setFormData(prev => {
      if (!prev) return null;
      const filtered = prev.unavailabilityPeriods.filter(p => p.id !== periodId);
      return {
        ...prev,
        unavailabilityPeriods: filtered,
        isAvailable: filtered.length === 0,
      };
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Veuillez saisir une note');
      return;
    }

    const note: HistoryNote = {
      id: `note-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR'),
      content: newNote,
    };

    setFormData(prev => prev ? {
      ...prev,
      historyNotes: [note, ...prev.historyNotes],
    } : null);

    setShowNoteDialog(false);
    setNewNote('');
    
    toast.success('Note ajoutée', {
      icon: '✅',
    });
  };

  if (!contact || !formData) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isCurrentlyUnavailable = formData.unavailabilityPeriods.some(period => {
    const today = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return today >= start && today <= end;
  });

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent className="fixed inset-y-0 right-0 mt-0 w-[700px] rounded-none flex flex-col">
          <DrawerHeader className="border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar */}
                <Avatar className="w-14 h-14">
                  <AvatarFallback style={{ backgroundColor: '#2B3A55', color: 'white' }}>
                    {getInitials(formData.firstName, formData.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DrawerTitle>Fiche contact transporteur</DrawerTitle>
                    {formData.isPrimary && (
                      <Badge style={{ backgroundColor: '#F6A20E', color: 'white' }} className="text-xs">
                        Principal
                      </Badge>
                    )}
                    {!formData.isPrimary && (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                        Secondaire
                      </Badge>
                    )}
                    {isCurrentlyUnavailable && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        Indispo actuelle
                      </Badge>
                    )}
                  </div>
                  <DrawerDescription>
                    {carrier && (
                      <span>
                        {carrier.name}
                        {carrier.route && ` – ${carrier.route}`}
                        {carrier.vehicleType && ` (${carrier.vehicleType})`}
                      </span>
                    )}
                  </DrawerDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700">Mode édition</Badge>
                )}
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Informations principales */}
            <div>
              <h3 className="mb-4 flex items-center gap-2" style={{ color: '#2B3A55' }}>
                <User className="w-5 h-5" />
                Informations principales
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gérant">Gérant</SelectItem>
                      <SelectItem value="Exploitant">Exploitant</SelectItem>
                      <SelectItem value="Administratif">Administratif</SelectItem>
                      <SelectItem value="Comptable">Comptable</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="rounded-lg pl-10"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="rounded-lg pl-10"
                        placeholder="contact@transporteur.fr"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Commentaire interne (optionnel)</Label>
                  <Textarea
                    id="comment"
                    value={formData.internalComment || ''}
                    onChange={(e) => setFormData({ ...formData, internalComment: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Notes internes sur ce contact..."
                    className="rounded-lg resize-none"
                    rows={2}
                  />
                </div>

                {/* Primary Contact Checkbox */}
                {isEditing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="isPrimary"
                        checked={formData.isPrimary}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked as boolean })}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor="isPrimary"
                          className="text-sm cursor-pointer"
                        >
                          Définir comme contact principal pour ce transporteur
                        </label>
                        {formData.isPrimary && !contact.isPrimary && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-xs text-amber-700"
                          >
                            ⚠️ Ce contact remplacera l'actuel contact principal dans les futures recherches.
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 2: Disponibilités */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2" style={{ color: '#2B3A55' }}>
                  <Calendar className="w-5 h-5" />
                  Disponibilités
                </h3>
                {isEditing && (
                  <Button
                    onClick={() => setShowUnavailabilityDialog(true)}
                    size="sm"
                    className="rounded-lg"
                    style={{ backgroundColor: '#F6A20E', color: 'white' }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter une période
                  </Button>
                )}
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut actuel</span>
                  <div className="flex items-center gap-2">
                    {formData.isAvailable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">🟢 Disponible</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700">🔴 Indisponible temporairement</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Unavailability Periods */}
              {formData.unavailabilityPeriods.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                  Aucune période d'indisponibilité
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-600">Début</th>
                        <th className="text-left px-3 py-2 text-gray-600">Fin</th>
                        <th className="text-left px-3 py-2 text-gray-600">Motif</th>
                        {isEditing && <th className="text-right px-3 py-2 text-gray-600"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.unavailabilityPeriods.map((period) => {
                        const isActive = new Date() >= new Date(period.startDate) && new Date() <= new Date(period.endDate);
                        
                        return (
                          <tr key={period.id} className={`border-t border-gray-200 ${isActive ? 'bg-red-50' : ''}`}>
                            <td className="px-3 py-2">{period.startDate}</td>
                            <td className="px-3 py-2">{period.endDate}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {period.reason}
                                {isActive && (
                                  <Badge className="bg-red-100 text-red-700 text-xs">En cours</Badge>
                                )}
                              </div>
                            </td>
                            {isEditing && (
                              <td className="px-3 py-2 text-right">
                                <Button
                                  onClick={() => handleDeleteUnavailability(period.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Separator />

            {/* Section 3: Communication */}
            <div>
              <h3 className="mb-4 flex items-center gap-2" style={{ color: '#2B3A55' }}>
                <MessageSquare className="w-5 h-5" />
                Communication
              </h3>

              {/* Preferred Channels */}
              <div className="space-y-3 mb-6">
                <Label>Canaux favoris</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="channel-phone"
                      checked={formData.preferredChannels.phone}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        preferredChannels: { ...formData.preferredChannels, phone: checked as boolean }
                      })}
                      disabled={!isEditing}
                    />
                    <label htmlFor="channel-phone" className="text-sm cursor-pointer">
                      ☎️ Téléphone
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="channel-email"
                      checked={formData.preferredChannels.email}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        preferredChannels: { ...formData.preferredChannels, email: checked as boolean }
                      })}
                      disabled={!isEditing}
                    />
                    <label htmlFor="channel-email" className="text-sm cursor-pointer">
                      📧 Email
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="channel-sms"
                      checked={formData.preferredChannels.sms}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        preferredChannels: { ...formData.preferredChannels, sms: checked as boolean }
                      })}
                      disabled={!isEditing}
                    />
                    <label htmlFor="channel-sms" className="text-sm cursor-pointer">
                      💬 SMS
                    </label>
                  </div>
                </div>
              </div>

              {/* History Notes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Notes d'historique interne</Label>
                  {isEditing && (
                    <Button
                      onClick={() => setShowNoteDialog(true)}
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter une note
                    </Button>
                  )}
                </div>

                {formData.historyNotes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                    Aucune note d'historique
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.historyNotes.slice(0, 3).map((note) => (
                      <div key={note.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs text-blue-600">{note.date}</span>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                      </div>
                    ))}
                    {formData.historyNotes.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        + {formData.historyNotes.length - 3} autre(s) note(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    className="flex-1 rounded-lg h-11"
                    style={{ backgroundColor: '#F6A20E', color: 'white' }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </Button>
                  <Button
                    onClick={() => {
                      setFormData(contact);
                      setIsEditing(false);
                    }}
                    variant="outline"
                    className="flex-1 rounded-lg h-11"
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full rounded-lg h-11"
                >
                  Fermer
                </Button>
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Unavailability Dialog */}
      <Dialog open={showUnavailabilityDialog} onOpenChange={setShowUnavailabilityDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une période d'indisponibilité</DialogTitle>
            <DialogDescription>
              Définissez les dates et le motif d'indisponibilité du contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={newUnavailability.startDate || ''}
                  onChange={(e) => setNewUnavailability({ ...newUnavailability, startDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={newUnavailability.endDate || ''}
                  onChange={(e) => setNewUnavailability({ ...newUnavailability, endDate: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Select
                value={newUnavailability.reason}
                onValueChange={(value) => setNewUnavailability({ ...newUnavailability, reason: value })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Sélectionner un motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Congés">Congés</SelectItem>
                  <SelectItem value="Arrêt maladie">Arrêt maladie</SelectItem>
                  <SelectItem value="Formation">Formation</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnavailabilityDialog(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddUnavailability}
              className="rounded-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
            <DialogDescription>
              Enregistrez une note sur l'interaction avec ce contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ex: Appelé pour mission FR33→ES13 (refusé)"
                className="rounded-lg resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false);
                setNewNote('');
              }}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddNote}
              className="rounded-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Primary Warning Dialog */}
      <Dialog open={showPrimaryWarning} onOpenChange={setShowPrimaryWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Nouveau contact principal</DialogTitle>
            <DialogDescription className="text-center">
              <p className="mb-3">
                Ce contact remplacera l'actuel contact principal dans les futures recherches.
              </p>
              <p className="text-sm text-gray-600">
                Voulez-vous continuer ?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPrimaryWarning(false)}
              className="flex-1 rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={confirmPrimaryChange}
              className="flex-1 rounded-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Oui, confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Search,
  Plus,
  Eye,
  Edit,
  ArrowLeft,
  LogOut,
  Loader2
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { CarrierDetailDrawer } from './CarrierDetailDrawer';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { CarrierService, Carrier } from '../services/CarrierService';

interface CarrierManagementProps {
  onBackToDashboard: () => void;
  onLogout: () => void;
}

export function CarrierManagement({ onBackToDashboard, onLogout }: CarrierManagementProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les transporteurs depuis l'API
  useEffect(() => {
    const loadCarriers = async () => {
      try {
        setIsLoading(true);
        const carriersData = await CarrierService.getAllCarriers();
        setCarriers(carriersData);
      } catch (error) {
        console.error('Erreur lors du chargement des transporteurs:', error);
        toast.error('Erreur lors du chargement des transporteurs');
      } finally {
        setIsLoading(false);
      }
    };

    loadCarriers();
  }, []);

  const filteredCarriers = carriers.filter(carrier =>
    carrier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewCarrier = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsDrawerOpen(true);
  };

  const handleAddCarrier = () => {
    setSelectedCarrier(null); // null pour créer un nouveau transporteur
    setIsDrawerOpen(true);
  };

  const handleSaveCarrier = async (carrierData: Carrier) => {
    try {
      if (carrierData._id) {
        // Mise à jour d'un transporteur existant
        const updatedCarrier = await CarrierService.updateCarrier(carrierData._id, carrierData);
        setCarriers(prev => prev.map(c => c._id === carrierData._id ? updatedCarrier : c));
        toast.success('Transporteur mis à jour avec succès');
      } else {
        // Création d'un nouveau transporteur
        const newCarrier = await CarrierService.createCarrier(carrierData);
        setCarriers(prev => [newCarrier, ...prev]);
        toast.success('Transporteur créé avec succès');
      }
      setIsDrawerOpen(false); // Fermer le drawer après sauvegarde
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du transporteur');
    }
  };

  const handleDeleteCarrier = async (carrierId: string) => {
    try {
      await CarrierService.deleteCarrier(carrierId);
      setCarriers(prev => prev.filter(c => c._id !== carrierId));
      toast.success('Transporteur supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du transporteur');
    }
  };

  const getStatusConfig = (status: Carrier['status']) => {
    switch (status) {
      case 'actif':
        return { label: 'Actif', color: 'bg-green-100 text-green-700', icon: '🟢' };
      case 'ferme_temporairement':
        return { label: 'Fermé temporairement', color: 'bg-amber-100 text-amber-700', icon: '🟠' };
      case 'ferme_definitivement':
        return { label: 'Fermé définitivement', color: 'bg-red-100 text-red-700', icon: '🔴' };
      default:
        return { label: 'Inconnu', color: 'bg-gray-100 text-gray-700', icon: '⚪' };
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F5F7' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4" style={{ backgroundColor: 'black' }}>
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between gap-8 mb-4">
            {/* Logo Affréteur IA */}
            <div className="flex items-center gap-3">
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onBackToDashboard();
                }}
                className="transition-all duration-300 hover:scale-105"
                style={{ 
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: 'white',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Affréteur IA
              </a>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un transporteur..."
                className="pl-10 bg-gray-50 border-gray-200 rounded-lg h-11"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleAddCarrier}
                className="rounded-lg h-11 px-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: '#F6A20E', color: 'white' }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Ajouter un transporteur
              </Button>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                  <AvatarFallback style={{ backgroundColor: '#2B3A55', color: 'white' }}>
                    {user?.firstName?.[0] || 'J'}{user?.lastName?.[0] || 'D'}
                  </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex flex-col cursor-pointer">
                      <span className="text-sm font-medium" style={{ color: 'white' }}>
                        {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBackToDashboard}
                  className="cursor-pointer hover:underline"
                  style={{ color: 'white' }}
                >
                  Administration
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage style={{ color: 'white' }}>Transporteurs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Stats Summary */}
          <div className="flex gap-4">
            <Card className="shadow-sm border-gray-200 flex-1">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Total transporteurs</p>
                <p className="text-2xl" style={{ color: '#2B3A55' }}>{carriers.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200 flex-1">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Actifs</p>
                <p className="text-2xl text-green-700">{carriers.filter(c => c.status === 'actif').length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200 flex-1">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Fermés temporairement</p>
                <p className="text-2xl text-amber-700">{carriers.filter(c => c.status === 'ferme_temporairement').length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200 flex-1">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Routes totales</p>
                <p className="text-2xl" style={{ color: '#2B3A55' }}>{carriers.reduce((sum, c) => sum + c.routes.length, 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Table */}
          <Card className="shadow-md border-gray-200">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Chargement des transporteurs...</span>
                </div>
              ) : (
                <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Transporteur</div>
                  <div className="text-sm text-gray-600">Statut</div>
                  <div className="text-sm text-gray-600">Date ouverture</div>
                  <div className="text-sm text-gray-600">Date fermeture</div>
                  <div className="text-sm text-gray-600">Nb de routes</div>
                  <div className="text-sm text-gray-600">Nb de contacts</div>
                  <div className="text-sm text-gray-600">Actions</div>
                </div>

                {/* Table Rows */}
                <AnimatePresence mode="popLayout">
                  {filteredCarriers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>Aucun transporteur trouvé</p>
                    </div>
                  ) : (
                    filteredCarriers.map((carrier, index) => {
                      const statusConfig = getStatusConfig(carrier.status);
                      
                      return (
                        <motion.div
                          key={carrier._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.03 }}
                          className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          {/* Carrier Name */}
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{carrier.name}</span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center">
                            <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                              <span>{statusConfig.icon}</span>
                              <span className="text-xs">{statusConfig.label}</span>
                            </Badge>
                          </div>

                          {/* Opening Date */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">{carrier.openingDate ? new Date(carrier.openingDate).toLocaleDateString('fr-FR') : '–'}</span>
                          </div>

                          {/* Closing Date */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {carrier.closurePeriods && carrier.closurePeriods.length > 0 
                                ? new Date(carrier.closurePeriods[carrier.closurePeriods.length - 1].endDate).toLocaleDateString('fr-FR')
                                : '–'
                              }
                            </span>
                          </div>

                          {/* Routes Count */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">{carrier.routes.length}</span>
                          </div>

                          {/* Contacts Count */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">{carrier.contacts.length}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleViewCarrier(carrier)}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs rounded-lg hover:bg-blue-50"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                            <Button
                              onClick={() => handleViewCarrier(carrier)}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs rounded-lg hover:bg-orange-50"
                              style={{ color: '#F6A20E' }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

            {/* Back Button Footer */}
      <footer className="border-t border-gray-200 bg-white px-8 py-4">
        <div className="max-w-[1600px] mx-auto">
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </footer>

      {/* Carrier Detail Drawer */}
      <CarrierDetailDrawer
        carrier={selectedCarrier}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveCarrier}
        onDelete={handleDeleteCarrier}
      />
    </div>
  );
}

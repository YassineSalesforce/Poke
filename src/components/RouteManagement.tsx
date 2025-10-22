import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Search,
  Plus,
  Edit,
  Lock,
  Unlock,
  Trash2,
  MapPin,
  Truck,
  Filter,
  RotateCcw,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { RouteDrawer } from './RouteDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { TransporterRouteService } from '../services/TransporterRouteService';

interface RouteManagementProps {
  onBackToDashboard: () => void;
}

interface RouteData {
  id: string;
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
  createdAt: string;
  lastUpdated?: string;
}

interface SuggestedRoute {
  id: string;
  carrierName: string;
  route: string;
  frequency: number;
  vehicleType: string;
  originDepartment: string;
  destinationDepartment: string;
}

export function RouteManagement({ onBackToDashboard }: RouteManagementProps) {
  // Chaque utilisateur commence avec aucune route - il doit les créer lui-même
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = 'user-1'; // TODO: Récupérer l'ID utilisateur depuis le contexte d'authentification

  // Charger les routes de l'utilisateur depuis la base de données
  useEffect(() => {
    const loadRoutes = async () => {
      setLoading(true);
      try {
        const userRoutes = await TransporterRouteService.getRoutesByUser(userId);
        console.log('Routes chargées depuis la base:', userRoutes);
        
        // Convertir les routes de la base au format RouteData
        const formattedRoutes = userRoutes.map(route => ({
          id: route._id || '',
          carrierId: route.carrierId,
          carrierName: route.carrierName,
          originCountry: route.originCountry,
          originRegion: route.originRegion,
          originDepartment: route.originDepartment,
          originCity: route.originCity,
          destinationCountry: route.destinationCountry,
          destinationRegion: route.destinationRegion,
          destinationDepartment: route.destinationDepartment,
          destinationCity: route.destinationCity,
          vehicleType: route.vehicleType,
          isActive: route.isActive,
          createdAt: new Date(route.createdAt).toLocaleDateString('fr-FR'),
          lastUpdated: route.updatedAt ? new Date(route.updatedAt).toLocaleDateString('fr-FR') + ' ' + new Date(route.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
        }));
        
        setRoutes(formattedRoutes);
      } catch (error) {
        console.error('Erreur lors du chargement des routes:', error);
        toast.error('Erreur lors du chargement des routes');
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const [suggestedRoutes] = useState<SuggestedRoute[]>([
    {
      id: 'sug1',
      carrierName: '2BMOVED',
      route: 'FR33 – Gironde → FR13 – Bouches-du-Rhône',
      frequency: 12,
      vehicleType: 'Benne',
      originDepartment: '33',
      destinationDepartment: '13',
    },
    {
      id: 'sug2',
      carrierName: 'TRANSARLE',
      route: 'FR49 – Maine-et-Loire → FR64 – Pyrénées-Atlantiques',
      frequency: 8,
      vehicleType: 'Tautliner',
      originDepartment: '49',
      destinationDepartment: '64',
    },
    {
      id: 'sug3',
      carrierName: 'LOGISTIQUE EXPRESS',
      route: 'FR69 – Rhône → FR06 – Alpes-Maritimes',
      frequency: 6,
      vehicleType: 'Plateau',
      originDepartment: '69',
      destinationDepartment: '06',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddRoute = () => {
    setSelectedRoute(null);
    setIsDrawerOpen(true);
  };

  const handleEditRoute = (route: RouteData) => {
    setSelectedRoute(route);
    setIsDrawerOpen(true);
  };

  const handleSaveRoute = async (routeData: RouteData) => {
    try {
      if (routeData.id) {
        // Update existing route in database
        await TransporterRouteService.updateRoute(routeData.id, {
          carrierId: routeData.carrierId,
          carrierName: routeData.carrierName,
          originCountry: routeData.originCountry,
          originRegion: routeData.originRegion,
          originDepartment: routeData.originDepartment,
          originCity: routeData.originCity,
          destinationCountry: routeData.destinationCountry,
          destinationRegion: routeData.destinationRegion,
          destinationDepartment: routeData.destinationDepartment,
          destinationCity: routeData.destinationCity,
          vehicleType: routeData.vehicleType,
          isActive: routeData.isActive,
        });
        
        // Update local state
        setRoutes(prev => prev.map(r => 
          r.id === routeData.id 
            ? { ...routeData, lastUpdated: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
            : r
        ));
        
        toast.success('Route modifiée avec succès', {
          description: `${routeData.carrierName} – ${routeData.originCity} → ${routeData.destinationCity}`,
        });
      } else {
        // Add new route to database
        const savedRoute = await TransporterRouteService.createRoute({
          userId: userId,
          carrierId: routeData.carrierId,
          carrierName: routeData.carrierName,
          originCountry: routeData.originCountry,
          originRegion: routeData.originRegion,
          originDepartment: routeData.originDepartment,
          originCity: routeData.originCity,
          destinationCountry: routeData.destinationCountry,
          destinationRegion: routeData.destinationRegion,
          destinationDepartment: routeData.destinationDepartment,
          destinationCity: routeData.destinationCity,
          vehicleType: routeData.vehicleType,
          isActive: routeData.isActive,
        });
        
        // Add to local state
        const newRoute = {
          id: savedRoute._id || '',
          carrierId: savedRoute.carrierId,
          carrierName: savedRoute.carrierName,
          originCountry: savedRoute.originCountry,
          originRegion: savedRoute.originRegion,
          originDepartment: savedRoute.originDepartment,
          originCity: savedRoute.originCity,
          destinationCountry: savedRoute.destinationCountry,
          destinationRegion: savedRoute.destinationRegion,
          destinationDepartment: savedRoute.destinationDepartment,
          destinationCity: savedRoute.destinationCity,
          vehicleType: savedRoute.vehicleType,
          isActive: savedRoute.isActive,
          createdAt: new Date(savedRoute.createdAt).toLocaleDateString('fr-FR'),
        };
        
        setRoutes(prev => [...prev, newRoute]);
        
        toast.success('Route créée avec succès', {
          description: `${routeData.carrierName} – ${routeData.originCity} → ${routeData.destinationCity}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la route:', error);
      toast.error('Erreur lors de la sauvegarde de la route');
    }
  };

  const handleToggleStatus = async (routeId: string) => {
    try {
      const route = routes.find(r => r.id === routeId);
      if (!route) return;
      
      const newStatus = !route.isActive;
      
      // Update in database
      await TransporterRouteService.updateRoute(routeId, {
        isActive: newStatus,
      });
      
      // Update local state
      setRoutes(prev => prev.map(r => {
        if (r.id === routeId) {
          toast.success(newStatus ? 'Route réactivée' : 'Route désactivée', {
            description: `${r.carrierName} – ${r.originCity} → ${r.destinationCity}`,
          });
          return { ...r, isActive: newStatus };
        }
        return r;
      }));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      const route = routes.find(r => r.id === routeId);
      if (!route) return;
      
      // Delete from database
      await TransporterRouteService.deleteRoute(routeId);
      
      // Update local state
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      
      toast.success('Route supprimée', {
        description: `${route.carrierName} – ${route.originCity} → ${route.destinationCity}`,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddSuggestedRoute = (suggested: SuggestedRoute) => {
    // Create a new route from suggestion
    const newRoute: RouteData = {
      id: Date.now().toString(),
      carrierId: suggested.carrierName === 'TRANSARLE' ? '1' : suggested.carrierName === 'CHEVALIER TRANSPORTS' ? '2' : '3',
      carrierName: suggested.carrierName,
      originCountry: 'FR',
      originRegion: '',
      originDepartment: suggested.originDepartment,
      originCity: '',
      destinationCountry: 'FR',
      destinationRegion: '',
      destinationDepartment: suggested.destinationDepartment,
      destinationCity: '',
      vehicleType: suggested.vehicleType,
      isActive: true,
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    
    setRoutes(prev => [...prev, newRoute]);
    toast.success('Route ajoutée depuis les suggestions', {
      description: `${suggested.carrierName} – ${suggested.route}`,
      icon: <CheckCircle className="w-4 h-4" />,
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setVehicleFilter('all');
    setStatusFilter('all');
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = searchQuery === '' || 
      route.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.destinationCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.vehicleType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVehicle = vehicleFilter === 'all' || route.vehicleType === vehicleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && route.isActive) ||
      (statusFilter === 'inactive' && !route.isActive);

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F5F7' }}>
      {/* Header */}
      <header className="px-8 py-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Logo officiel */}
            <div className="flex items-center gap-3">
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onBackToDashboard) {
                    onBackToDashboard();
                  }
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
                TransportHub
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onBackToDashboard}
                className="rounded-lg h-11 px-6"
              >
                Retour au tableau de bord
              </Button>
              <Button
                onClick={handleAddRoute}
                className="rounded-lg h-11 px-6 transition-all hover:shadow-lg"
                style={{ backgroundColor: '#F6A20E', color: 'white' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une route
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Administration</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Routes transporteurs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Title */}
          <div>
            <h1 className="mb-2" style={{ color: '#2B3A55' }}>Gestion des routes transporteurs</h1>
            <p className="text-gray-600">
              Visualisez, activez/désactivez, modifiez ou ajoutez de nouvelles routes
            </p>
          </div>

          {/* Filters & Search */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher un transporteur ou une route (origine, destination, véhicule…)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-lg h-11"
                  />
                </div>

                {/* Vehicle Filter */}
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-48 rounded-lg h-11">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <SelectValue placeholder="Type de véhicule" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les véhicules</SelectItem>
                    <SelectItem value="Benne">Benne</SelectItem>
                    <SelectItem value="Tautliner">Tautliner</SelectItem>
                    <SelectItem value="Plateau">Plateau</SelectItem>
                    <SelectItem value="Frigo">Frigo</SelectItem>
                    <SelectItem value="Semi-remorque">Semi-remorque</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 rounded-lg h-11">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Statut" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>

                {/* Reset */}
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="rounded-lg h-11 px-4"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Routes Table */}
          <Card className="shadow-md border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_2fr_1.5fr_1fr_1.5fr_auto] gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Transporteur</div>
                  <div className="text-sm text-gray-600">Origine</div>
                  <div className="text-sm text-gray-600">Destination</div>
                  <div className="text-sm text-gray-600">Type véhicule</div>
                  <div className="text-sm text-gray-600">Statut</div>
                  <div className="text-sm text-gray-600">Date de création</div>
                  <div className="text-sm text-gray-600">Actions</div>
                </div>

                {/* Table Rows */}
                <AnimatePresence mode="popLayout">
                  {filteredRoutes.map((route, index) => (
                    <motion.div
                      key={route.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="grid grid-cols-[2fr_2fr_2fr_1.5fr_1fr_1.5fr_auto] gap-4 px-4 py-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                      onClick={() => handleEditRoute(route)}
                    >
                      {/* Carrier */}
                      <div className="flex items-center">
                        <span className="text-sm">{route.carrierName}</span>
                      </div>

                      {/* Origin */}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: '#2B3A55' }} />
                        <div>
                          <p className="text-sm">{route.originCity}</p>
                          <p className="text-xs text-gray-500">{route.originCountry}{route.originDepartment}</p>
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: '#F6A20E' }} />
                        <div>
                          <p className="text-sm">{route.destinationCity}</p>
                          <p className="text-xs text-gray-500">{route.destinationCountry}{route.destinationDepartment}</p>
                        </div>
                      </div>

                      {/* Vehicle Type */}
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{route.vehicleType}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        <Badge className={`${route.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} flex items-center gap-1`}>
                          <span>{route.isActive ? '🟢' : '🔴'}</span>
                          <span className="text-xs">{route.isActive ? 'Actif' : 'Inactif'}</span>
                        </Badge>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">{route.createdAt}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRoute(route);
                          }}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(route.id);
                          }}
                          className="h-8 w-8"
                        >
                          {route.isActive ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                        {!route.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoute(route.id);
                            }}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredRoutes.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Aucune route trouvée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Routes */}
          <Card className="shadow-md border-blue-200 bg-blue-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" style={{ color: '#2B3A55' }} />
                <h2 style={{ color: '#2B3A55' }}>Routes suggérées à créer</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Routes potentiellement intéressantes basées sur l'historique de missions
              </p>

              <div className="space-y-2">
                {/* Suggested Table Header */}
                <div className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_auto] gap-4 px-4 py-3 bg-white rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600">Transporteur</div>
                  <div className="text-sm text-gray-600">Route détectée</div>
                  <div className="text-sm text-gray-600">Fréquence</div>
                  <div className="text-sm text-gray-600">Type véhicule</div>
                  <div className="text-sm text-gray-600">Action</div>
                </div>

                {/* Suggested Rows */}
                {suggestedRoutes.map((suggested, index) => (
                  <motion.div
                    key={suggested.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_auto] gap-4 px-4 py-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center">
                      <span className="text-sm">{suggested.carrierName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{suggested.route}</span>
                    </div>

                    <div className="flex items-center">
                      <Badge className="bg-blue-100 text-blue-700">
                        {suggested.frequency} missions récentes
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{suggested.vehicleType}</span>
                    </div>

                    <div className="flex items-center">
                      <Button
                        size="sm"
                        onClick={() => handleAddSuggestedRoute(suggested)}
                        className="rounded-lg"
                        style={{ backgroundColor: '#F6A20E', color: 'white' }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Route Drawer */}
      <RouteDrawer
        route={selectedRoute}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRoute(null);
        }}
        onSave={handleSaveRoute}
      />
    </div>
  );
}

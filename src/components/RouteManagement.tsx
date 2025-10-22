import { useState } from 'react';
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
  const [routes, setRoutes] = useState<RouteData[]>([
    {
      id: '1',
      carrierId: '1',
      carrierName: 'TRANSARLE',
      originCountry: 'FR',
      originRegion: 'Nouvelle-Aquitaine',
      originDepartment: '33',
      originCity: 'Bordeaux',
      destinationCountry: 'ES',
      destinationRegion: 'Communauté de Madrid',
      destinationDepartment: 'ES13',
      destinationCity: 'Madrid',
      vehicleType: 'Benne',
      isActive: true,
      createdAt: '12/03/2024',
      lastUpdated: '18/10/2025 14h30',
    },
    {
      id: '2',
      carrierId: '2',
      carrierName: 'CHEVALIER TRANSPORTS',
      originCountry: 'FR',
      originRegion: 'Pays de la Loire',
      originDepartment: '49',
      originCity: 'Angers',
      destinationCountry: 'FR',
      destinationRegion: 'Provence-Alpes-Côte d\'Azur',
      destinationDepartment: '84',
      destinationCity: 'Avignon',
      vehicleType: 'Tautliner',
      isActive: true,
      createdAt: '09/02/2025',
    },
    {
      id: '3',
      carrierId: '3',
      carrierName: '2BMOVED',
      originCountry: 'FR',
      originRegion: 'Auvergne-Rhône-Alpes',
      originDepartment: '38',
      originCity: 'Grenoble',
      destinationCountry: 'FR',
      destinationRegion: 'Occitanie',
      destinationDepartment: '30',
      destinationCity: 'Nîmes',
      vehicleType: 'Plateau',
      isActive: false,
      createdAt: '05/05/2023',
      lastUpdated: '12/09/2024 09h15',
    },
    {
      id: '4',
      carrierId: '4',
      carrierName: 'LOGISTIQUE EXPRESS',
      originCountry: 'FR',
      originRegion: 'Nouvelle-Aquitaine',
      originDepartment: '33',
      originCity: 'Bordeaux',
      destinationCountry: 'ES',
      destinationRegion: 'Catalogne',
      destinationDepartment: 'ES08',
      destinationCity: 'Barcelone',
      vehicleType: 'Frigo',
      isActive: true,
      createdAt: '15/01/2025',
    },
  ]);

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

  const handleSaveRoute = (routeData: RouteData) => {
    if (routeData.id) {
      // Update existing route
      setRoutes(prev => prev.map(r => 
        r.id === routeData.id 
          ? { ...routeData, lastUpdated: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
          : r
      ));
      toast.success('Route modifiée avec succès', {
        description: `${routeData.carrierName} – ${routeData.originCity} → ${routeData.destinationCity}`,
      });
    } else {
      // Add new route
      const newRoute = {
        ...routeData,
        id: Date.now().toString(),
        createdAt: new Date().toLocaleDateString('fr-FR'),
      };
      setRoutes(prev => [...prev, newRoute]);
      toast.success('Route créée avec succès', {
        description: `${routeData.carrierName} – ${routeData.originCity} → ${routeData.destinationCity}`,
      });
    }
  };

  const handleToggleStatus = (routeId: string) => {
    setRoutes(prev => prev.map(route => {
      if (route.id === routeId) {
        const newStatus = !route.isActive;
        toast.success(newStatus ? 'Route réactivée' : 'Route désactivée', {
          description: `${route.carrierName} – ${route.originCity} → ${route.destinationCity}`,
        });
        return { ...route, isActive: newStatus };
      }
      return route;
    }));
  };

  const handleDeleteRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      toast.success('Route supprimée', {
        description: `${route.carrierName} – ${route.originCity} → ${route.destinationCity}`,
      });
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
                href="/" 
                className="transition-all duration-300 hover:scale-105"
                style={{ 
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: 'white',
                  textDecoration: 'none'
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
                <BreadcrumbLink 
                  onClick={onBackToDashboard}
                  className="cursor-pointer hover:underline"
                  style={{ color: '#2B3A55' }}
                >
                  Administration
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Routes transporteurs</BreadcrumbPage>
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
                    <Button
                      onClick={handleResetFilters}
                      variant="outline"
                      className="mt-4 rounded-lg"
                    >
                      Réinitialiser les filtres
                    </Button>
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

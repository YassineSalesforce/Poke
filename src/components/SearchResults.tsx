import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Truck, 
  Phone,
  ArrowRight,
  TrendingUp,
  Star
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { ContactCarrierDrawer } from './ContactCarrierDrawer';
import { toast } from 'sonner';
import { TransporterService, TransporterData, SearchCriteria } from '../services/TransporterService';
import { MissionService, AlternativeTransporter } from '../services/MissionService';
import { TransporterContactService } from '../services/TransporterContactService';

interface SearchResultsProps {
  onBack: () => void;
  onBackToDashboard?: () => void;
  onNext?: () => void;
  onCreateRoute?: (carrier: string, route: string) => void;
  searchCriteria?: any; // Critères de recherche depuis SearchForm
}

interface Carrier {
  id: string;
  name: string;
  route: string;
  vehicleType: string;
  score: number;
  confidence: number;
  capacity: number;
  isTopRecommended?: boolean;
  status: 'yes' | 'pending' | 'no' | '';
  routeDisabled?: boolean;
  ensemblesTaken?: number;
  ensemblesPrevisional?: number;
  comment?: string;
  lastMission?: string;
}

interface AlternativeCarrier {
  id: string;
  name: string;
  route: string;
  confidence: number;
  vehicleType: string;
  score: number;
  capacity: number;
  isAlternative: boolean;
  status: string;
  lastMission: string;
}

export function SearchResults({ onBack, onBackToDashboard, onNext, onCreateRoute, searchCriteria }: SearchResultsProps) {
  console.log('🔍 SearchResults reçu searchCriteria:', searchCriteria);
  
  const extractCityAndPostalCode = (fullAddress: string) => {
    // Si pas d'adresse, retourner une valeur par défaut
    if (!fullAddress) return 'Adresse non définie';
    
    // Extraire la ville et le code postal de l'adresse complète
    const parts = fullAddress.split(',');
    if (parts.length >= 1) {
      const cityPart = parts[0].trim();
      // Si la ville contient un code postal (ex: "Bordeaux 33000"), on l'extrait
      const cityMatch = cityPart.match(/^(.+?)\s+(\d{5})$/);
      if (cityMatch) {
        return `${cityMatch[1]} ${cityMatch[2]}`;
      }
      // Si on trouve juste la ville sans code postal
      if (cityPart.length > 0) {
        return cityPart;
      }
    }
    // Si on ne peut pas extraire proprement, afficher l'adresse complète
    return fullAddress;
  };
  const [carriers, setCarriers] = useState<Carrier[]>([
    {
      id: '1',
      name: 'TRANSARLE',
      route: 'FR33 → ES13',
      vehicleType: 'Benne',
      score: 9.2,
      confidence: 92,
      capacity: 2,
      isTopRecommended: true,
      status: '',
      lastMission: 'Il y a 12 jours',
    },
    {
      id: '2',
      name: 'CHEVALIER TRANSPORTS',
      route: 'FR33 → ES13',
      vehicleType: 'Benne',
      score: 8.8,
      confidence: 87,
      capacity: 1,
      isTopRecommended: true,
      status: '',
      lastMission: 'Il y a 8 jours',
    },
    {
      id: '3',
      name: '2BMOVED',
      route: 'FR33 → ES10',
      vehicleType: 'Benne',
      score: 8.2,
      confidence: 79,
      capacity: 3,
      isTopRecommended: true,
      status: '',
      lastMission: 'Il y a 20 jours',
    },
    {
      id: '4',
      name: 'LOGISTIQUE EXPRESS',
      route: 'FR33 → ES13',
      vehicleType: 'Benne',
      score: 7.8,
      confidence: 75,
      capacity: 2,
      status: '',
      lastMission: 'Il y a 15 jours',
    },
    {
      id: '5',
      name: 'TRANS EUROPA',
      route: 'FR33 → ES28',
      vehicleType: 'Benne',
      score: 7.5,
      confidence: 72,
      capacity: 1,
      status: '',
      lastMission: 'Il y a 30 jours',
    },
  ]);

  const [alternativeCarriers] = useState<AlternativeCarrier[]>([
    {
      id: 'alt1',
      name: 'BORDEAUX FRET',
      route: 'Gironde → Espagne',
      confidence: 68,
      vehicleType: 'Benne',
      score: 7.2,
      capacity: 2,
      isAlternative: true,
    },
    {
      id: 'alt2',
      name: 'IBERIA TRANSPORT',
      route: 'Nouvelle-Aquitaine → Madrid',
      confidence: 65,
      vehicleType: 'Benne',
      score: 7.0,
      capacity: 1,
      isAlternative: true,
    },
    {
      id: 'alt3',
      name: 'FRANCE CARGO',
      route: 'FR33 → Péninsule Ibérique',
      confidence: 62,
      vehicleType: 'Benne',
      score: 6.8,
      capacity: 3,
      isAlternative: true,
    },
  ]);
  
  const totalEnsembles = 5;
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | AlternativeCarrier | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [transporters, setTransporters] = useState<TransporterData[]>([]);
  const [alternativeTransporters, setAlternativeTransporters] = useState<AlternativeTransporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les transporteurs correspondants depuis Excel
  useEffect(() => {
    const loadTransporters = async () => {
      setIsLoading(true);
      try {
        // Charger les données depuis Excel
        await TransporterService.loadTransporters();
        
        // Si on a des critères de recherche, chercher les transporteurs correspondants
        if (searchCriteria) {
          const criteria: SearchCriteria = {
            depart: searchCriteria.depart || '',
            arrivee: searchCriteria.arrivee || '',
            typeVehicule: searchCriteria.typeVehicule || '',
            quantite: searchCriteria.quantite || 1
          };
          
          const matchingTransporters = TransporterService.searchTransporters(criteria);
          setTransporters(matchingTransporters);
          
          // Charger les transporteurs alternatifs basés sur les missions
          const alternatives = await MissionService.findAlternativeTransporters(
            searchCriteria.depart, 
            searchCriteria.arrivee
          );
          console.log(`🔄 ${alternatives.length} transporteurs alternatifs trouvés`);
          setAlternativeTransporters(alternatives);
        } else {
          // Sinon, charger tous les transporteurs
          setTransporters(TransporterService.getAllTransporters());
        }
      } catch (error) {
        console.error('Erreur lors du chargement des transporteurs:', error);
        toast.error('Erreur lors du chargement des transporteurs');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransporters();
  }, [searchCriteria]);

  const calculateRemaining = () => {
    const totalQuantity = searchCriteria?.quantite || totalEnsembles;
    
    // Calculer les ensembles confirmés (statut 'occupe' = confirmé)
    const confirmedTaken = transporters
      .filter(t => t.statut === 'occupe')
      .reduce((sum, t) => sum + t.capacite, 0);
    
    // Calculer les ensembles en attente (statut 'en_attente')
    const preReservedTotal = transporters
      .filter(t => t.statut === 'en_attente')
      .reduce((sum, t) => sum + t.capacite, 0);
    
    const remaining = totalQuantity - confirmedTaken - preReservedTotal;
    
    console.log('🧮 Calcul remaining:', {
      totalQuantity,
      confirmedTaken,
      preReservedTotal,
      remaining,
      transportersWithStatus: transporters.filter(t => t.statut !== 'disponible').length
    });
    
    return remaining;
  };

  const remainingEnsembles = calculateRemaining();
  const totalQuantity = searchCriteria?.quantite || totalEnsembles;
  const coverageRate = ((totalQuantity - remainingEnsembles) / totalQuantity) * 100;

  const handleContactCarrier = (carrier: Carrier | AlternativeCarrier | TransporterData) => {
    // Si c'est un TransporterData, le convertir en Carrier
    if ('nom' in carrier && 'zoneDepart' in carrier) {
      const transporterData = carrier as TransporterData;
      const convertedCarrier: Carrier = {
        id: transporterData.id,
        name: transporterData.nom,
        route: `${transporterData.zoneDepart} → ${transporterData.zoneArrivee}`,
        vehicleType: transporterData.typeVehicule,
        score: transporterData.note,
        confidence: Math.round(transporterData.note * 10), // Convertir en pourcentage
        capacity: transporterData.capacite,
        lastMission: transporterData.derniereMission,
        isAlternative: false
      };
      setSelectedCarrier(convertedCarrier);
    } else {
      setSelectedCarrier(carrier);
    }
    setIsDrawerOpen(true);
  };

  const handleContactAlternativeTransporter = (transporter: AlternativeTransporter) => {
    // Convertir AlternativeTransporter en Carrier pour le drawer
    const carrier: AlternativeCarrier = {
      id: transporter.organisation,
      name: transporter.organisation,
      route: `${transporter.depart} → ${transporter.arrivee}`,
      confidence: transporter.confiance,
      vehicleType: 'Tous types', // Transporteur alternatif = tous types de véhicules
      score: transporter.confiance / 10, // Convertir en score sur 10
      capacity: transporter.nombreMissions, // Utiliser le nombre de missions comme capacité
      isAlternative: true, // Marquer comme transporteur alternatif
      status: '',
      lastMission: transporter.dernierMission
    };
    
    setSelectedCarrier(carrier);
    setIsDrawerOpen(true);
  };

  const handleSaveReturn = async (carrierId: string, data: any) => {
    console.log('💾 handleSaveReturn appelé avec:', { carrierId, data });
    
    // Sauvegarder le contact transporteur dans la base de données
    if (searchCriteria?.searchId) {
      try {
        const transporter = transporters.find(t => t.id === carrierId);
        if (transporter) {
          await TransporterContactService.saveContact({
            searchId: searchCriteria.searchId,
            userId: 'user-1',
            transporterId: carrierId,
            transporterName: transporter.nom,
            route: `${transporter.zoneDepart} → ${transporter.zoneArrivee}`,
            vehicleType: transporter.typeVehicule,
            status: data.response,
            volume: data.response === 'yes' ? parseInt(data.ensemblesTaken) : 
                   data.response === 'pending' ? parseInt(data.ensemblesPrevisional) : 0,
            comment: data.comment,
          });
          console.log('✅ Contact transporteur sauvegardé:', carrierId);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du contact:', error);
      }
    }
    
    // Mettre à jour la liste carriers
    setCarriers(prev => prev.map(c => {
      if (c.id === carrierId) {
        return {
          ...c,
          status: data.response,
          ensemblesTaken: data.response === 'yes' ? parseInt(data.ensemblesTaken) : undefined,
          ensemblesPrevisional: data.response === 'pending' ? parseInt(data.ensemblesPrevisional) : undefined,
          comment: data.comment,
        };
      }
      return c;
    }));
    
    // Mettre à jour la liste transporters pour synchroniser l'affichage
    setTransporters(prev => prev.map(t => {
      if (t.id === carrierId) {
        return {
          ...t,
          statut: data.response === 'yes' ? 'occupe' : 
                 data.response === 'pending' ? 'en_attente' : 
                 'indisponible',
          capacite: data.response === 'yes' ? parseInt(data.ensemblesTaken) : 
                   data.response === 'pending' ? parseInt(data.ensemblesPrevisional) : 
                   t.capacite
        };
      }
      return t;
    }));
  };

  const handleDisableRoute = (carrierId: string) => {
    setCarriers(prev => prev.map(c => 
      c.id === carrierId ? { ...c, routeDisabled: true } : c
    ));
  };

  const handleCreateRoute = (carrierId: string) => {
    const carrier = alternativeCarriers.find(c => c.id === carrierId);
    if (carrier) {
      // Add to main carriers list
      const newCarrier: Carrier = {
        id: `new-${Date.now()}`,
        name: carrier.name,
        route: carrier.route,
        vehicleType: carrier.vehicleType,
        score: carrier.score,
        confidence: carrier.confidence,
        capacity: carrier.capacity,
        status: '',
        lastMission: 'Nouvelle route',
      };
      setCarriers(prev => [...prev, newCarrier]);
    }
  };

  const getStatusConfig = (status: Carrier['status'], ensemblesTaken?: number, ensemblesPrevisional?: number) => {
    if (status === 'yes' && ensemblesTaken) {
      return { label: `Confirmé – ${ensemblesTaken}`, color: 'bg-green-100 text-green-700', icon: '✅' };
    }
    if (status === 'pending' && ensemblesPrevisional) {
      return { label: `Pré-réservé – ${ensemblesPrevisional}`, color: 'bg-amber-100 text-amber-700', icon: '⏳' };
    }
    if (status === 'pending') {
      return { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: '⏳' };
    }
    if (status === 'no') {
      return { label: 'Refusé', color: 'bg-red-100 text-red-700', icon: '❌' };
    }
    return { label: 'Non contacté', color: 'bg-gray-100 text-gray-700', icon: '⚪' };
  };

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
                onClick={onBack}
                className="rounded-lg h-11 px-6"
              >
                Retour au formulaire
              </Button>
              {coverageRate >= 100 ? (
                <Button
                  onClick={onNext}
                  className="rounded-lg h-11 px-6 transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#F6A20E', color: 'white' }}
                >
                  Saisir les retours
                </Button>
              ) : (
                <Button
                  disabled
                  className="rounded-lg h-11 px-6 opacity-50 cursor-not-allowed"
                  style={{ backgroundColor: '#F6A20E', color: 'white' }}
                >
                  Saisir les retours ({coverageRate}%)
                </Button>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBackToDashboard || (() => window.location.reload())}
                  className="cursor-pointer hover:underline"
                  style={{ color: 'white' }}
                >
                  Tableau de bord
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBack}
                  className="cursor-pointer hover:underline text-white"
                >
                  Nouvelle recherche
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Résultats</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Summary Banner */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Route */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: '#2B3A55' }} />
                      <span className="text-sm">
                        {searchCriteria?.departAdresse ? 
                          extractCityAndPostalCode(searchCriteria.departAdresse) : 
                          (searchCriteria?.depart || 'FR33')
                        }
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: '#F6A20E' }} />
                      <span className="text-sm">
                        {searchCriteria?.arriveeAdresse ? 
                          extractCityAndPostalCode(searchCriteria.arriveeAdresse) : 
                          (searchCriteria?.arrivee || 'ES13')
                        }
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div className="flex items-center gap-2 pl-8 border-l border-gray-200">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <span>{searchCriteria?.typeVehicule || 'Benne'}</span>
                  </div>

                  {/* Total */}
                  <div className="pl-8 border-l border-gray-200">
                    <p className="text-sm text-gray-600">Quantité totale</p>
                    <p>{searchCriteria?.quantite || totalEnsembles} ensembles</p>
                  </div>

                  {/* Remaining */}
                  <div className="pl-8 border-l border-gray-200">
                    <p className="text-sm text-gray-600">Reste à prendre</p>
                    <motion.div 
                      key={remainingEnsembles}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span style={{ color: remainingEnsembles > 0 ? '#F6A20E' : '#4CAF50' }}>
                        {remainingEnsembles} ensemble{remainingEnsembles > 1 ? 's' : ''}
                      </span>
                      <Badge style={{ backgroundColor: remainingEnsembles > 0 ? '#FFF3E0' : '#E8F5E9', color: remainingEnsembles > 0 ? '#F6A20E' : '#4CAF50' }}>
                        {remainingEnsembles > 0 ? 'En cours' : 'Complet'}
                      </Badge>
                    </motion.div>
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#E0E0E0"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#F6A20E"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - coverageRate / 100)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm" style={{ color: '#2B3A55' }}>{Math.round(coverageRate)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Couvert</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Title */}
          <div>
            <h1 className="mb-2" style={{ color: '#2B3A55' }}>Transporteurs correspondants</h1>
            <p className="text-gray-600">
              {isLoading ? 'Chargement des transporteurs...' : `${transporters.length} transporteurs trouvés`}
            </p>
          </div>

          {/* Carriers Table */}
          <Card className="shadow-md border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Transporteur</div>
                  <div className="text-sm text-gray-600">Route</div>
                  <div className="text-sm text-gray-600">Score</div>
                  <div className="text-sm text-gray-600">Confiance</div>
                  <div className="text-sm text-gray-600">Capacité possible</div>
                  <div className="text-sm text-gray-600">Statut</div>
                  <div className="text-sm text-gray-600">Action</div>
                </div>

                {/* Table Rows */}
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">Chargement des transporteurs...</div>
                    </div>
                  ) : transporters.map((transporter, index) => {
                    const isTopRecommended = index < 3; // Top 3 recommandés
                    
                    return (
                      <motion.div
                        key={transporter.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-4 rounded-lg border hover:bg-gray-50 transition-all ${
                          isTopRecommended ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'
                        }`}
                      >
                        {/* Carrier Name */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{transporter.nom}</span>
                          {isTopRecommended && (
                            <Badge style={{ backgroundColor: '#FFF3E0', color: '#F6A20E' }} className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Top {index + 1}
                            </Badge>
                          )}
                        </div>

                        {/* Route */}
                        <div className="flex items-center">
                          <span className="text-sm">{transporter.zoneDepart} → {transporter.zoneArrivee}</span>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" style={{ color: '#F6A20E' }} />
                          <span className="text-sm">{transporter.note}</span>
                        </div>

                        {/* Confidence */}
                        <div className="flex items-center">
                          <span className="text-sm">{Math.round(transporter.note * 10)}%</span>
                        </div>

                        {/* Capacity */}
                        <div className="flex items-center">
                          <span className="text-sm">{transporter.capacite} ensemble{transporter.capacite > 1 ? 's' : ''}</span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center">
                          <Badge className={`${
                            transporter.statut === 'disponible' ? 'bg-gray-100 text-gray-700' :
                            transporter.statut === 'occupe' ? 'bg-green-100 text-green-700' :
                            transporter.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          } flex items-center gap-1`}>
                            <span>{transporter.statut === 'disponible' ? '📞' : 
                                   transporter.statut === 'occupe' ? '✅' : 
                                   transporter.statut === 'en_attente' ? '⏳' : '❌'}</span>
                            <span className="text-xs">
                              {transporter.statut === 'disponible' ? 'Non contacté' :
                               transporter.statut === 'occupe' ? `Confirmé – ${transporter.capacite}` :
                               transporter.statut === 'en_attente' ? `En attente – ${transporter.capacite}` : 'Indisponible'}
                            </span>
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center">
                          <Button
                            onClick={() => handleContactCarrier(transporter)}
                            size="sm"
                            className="h-8 px-4 text-xs rounded-lg transition-all hover:shadow-md"
                            style={{ backgroundColor: '#F6A20E', color: 'white' }}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Contacter
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Carriers */}
          <Card className="shadow-md border-blue-200 bg-blue-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" style={{ color: '#2B3A55' }} />
                <h2 style={{ color: '#2B3A55' }}>Transporteurs alternatifs (routes proches)</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Routes similaires par départements – Contactez-les pour créer une route officielle
              </p>

              <div className="space-y-3">
                {alternativeTransporters.map((transporter, index) => (
                  <motion.div
                    key={`${transporter.organisation}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium">{transporter.organisation}</p>
                          <p className="text-xs text-gray-500">
                            {transporter.depart} → {transporter.arrivee}
                          </p>
                          <p className="text-xs text-gray-400">
                            {transporter.nombreMissions} mission{transporter.nombreMissions > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          Confiance: {Math.round(transporter.confiance)}%
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleContactAlternativeTransporter(transporter)}
                        className="rounded-lg"
                        style={{ backgroundColor: '#F6A20E', color: 'white' }}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Contacter
                      </Button>
                    </div>
                  </motion.div>
                ))}
                
                {alternativeTransporters.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Aucun transporteur alternatif trouvé pour cette route</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Contact Carrier Drawer */}
      <ContactCarrierDrawer
        carrier={selectedCarrier as any}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaveReturn={handleSaveReturn}
        onDisableRoute={handleDisableRoute}
        onCreateRoute={handleCreateRoute}
        remainingEnsembles={remainingEnsembles}
        totalQuantity={totalQuantity}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  MapPin, 
  Truck, 
  ArrowRight,
  CheckCircle2,
  PartyPopper,
  AlertTriangle,
  Package,
  FileText,
  CheckCircle,
  Clock,
  Heart,
  Star
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Alert, AlertDescription } from './ui/alert';
import { TransporterContactService } from '../services/TransporterContactService';
import { MissionDetailsModal, MissionDetails } from './MissionDetailsModal';
import { MissionDetailsService, MissionDetailsData } from '../services/MissionDetailsService';
import { TransporterFavoriteService } from '../services/TransporterFavoriteService';

interface CarrierReturnsEntryProps {
  onBack: () => void;
  onBackToDashboard?: () => void;
  onNext?: (carrierReturns: CarrierReturn[]) => void;
  searchCriteria?: any;
  searchId?: string;
}

interface CarrierReturn {
  id: string;
  name: string;
  route: string;
  response: 'yes' | 'no' | 'pending';
  ensemblesTaken: string;
  ensemblesPrevisional: string;
  comment: string;
  validated: boolean;
}

export function CarrierReturnsEntry({ onBack, onBackToDashboard, onNext, searchCriteria, searchId }: CarrierReturnsEntryProps) {
  const totalEnsembles = searchCriteria?.quantite || 5;
  
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour le modal de détails de mission par transporteur
  const [showMissionDetailsModal, setShowMissionDetailsModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [carrierMissionDetails, setCarrierMissionDetails] = useState({});
  const [savedCarriers, setSavedCarriers] = useState(new Set());
  
  // États pour les favoris
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);

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

  // Charger les favoris
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userFavorites = await TransporterFavoriteService.getFavorites('user-1');
        const favoriteIds = new Set(userFavorites.map(fav => fav.transporterId));
        setFavorites(favoriteIds);
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
      }
    };

    loadFavorites();
  }, []);

  // Charger les contacts depuis la base de données
  useEffect(() => {
    const loadContacts = async () => {
      console.log('🔍 CarrierReturnsEntry - Chargement des contacts:', { searchId, searchCriteria });
      
      if (!searchId) {
        console.log('❌ CarrierReturnsEntry - Pas de searchId fourni');
        setLoading(false);
        return;
      }

      try {
        console.log('📡 CarrierReturnsEntry - Appel API pour searchId:', searchId);
        const contacts = await TransporterContactService.getContactsBySearch(searchId);
        console.log('📊 CarrierReturnsEntry - Contacts reçus:', contacts);
        
        // Convertir les contacts en format CarrierReturn
        const convertedCarriers: CarrierReturn[] = contacts.map(contact => ({
          id: contact.transporterId,
          name: contact.transporterName,
          route: contact.route,
          response: contact.status,
          ensemblesTaken: contact.status === 'yes' ? contact.volume.toString() : '',
          ensemblesPrevisional: contact.status === 'pending' ? contact.volume.toString() : '',
          comment: contact.comment || '',
          validated: contact.status === 'yes'
        }));

        console.log('🔄 CarrierReturnsEntry - Carriers convertis:', convertedCarriers);
        setCarriers(convertedCarriers);

        // Charger les détails de mission existants
        try {
          console.log('📡 CarrierReturnsEntry - Chargement des détails de mission pour searchId:', searchId);
          const missionDetails = await MissionDetailsService.getMissionDetailsBySearchId(searchId);
          console.log('📊 CarrierReturnsEntry - Détails de mission reçus:', missionDetails);
          
          // Convertir les détails en format local
          const detailsMap = {};
          const savedIds = new Set();
          
          missionDetails.forEach(detail => {
            detailsMap[detail.transporterId] = {
              merchandise: detail.merchandise,
              loadingDate: detail.loadingDate,
              loadingTime: detail.loadingTime,
              deliveryDate: detail.deliveryDate,
              deliveryTime: detail.deliveryTime,
              estimatedPrice: detail.estimatedPrice,
              notes: detail.notes,
            };
            savedIds.add(detail.transporterId);
          });
          
          setCarrierMissionDetails(detailsMap);
          setSavedCarriers(savedIds);
          console.log('✅ CarrierReturnsEntry - Détails de mission chargés:', { detailsMap, savedIds });
        } catch (error) {
          console.error('❌ CarrierReturnsEntry - Erreur lors du chargement des détails de mission:', error);
        }
      } catch (error) {
        console.error('❌ CarrierReturnsEntry - Erreur lors du chargement des contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [searchId]);

  const calculateRemaining = () => {
    const confirmed = carriers
      .filter(c => c.response === 'yes')
      .reduce((sum, c) => sum + parseInt(c.ensemblesTaken || '0'), 0);
    
    const previsional = carriers
      .filter(c => c.response === 'pending')
      .reduce((sum, c) => sum + parseInt(c.ensemblesPrevisional || '0'), 0);
    
    return totalEnsembles - confirmed - previsional;
  };

  const remainingEnsembles = calculateRemaining();
  
  const getTotalConfirmed = () => {
    return carriers
      .filter(c => c.response === 'yes')
      .reduce((sum, c) => sum + parseInt(c.ensemblesTaken || '0'), 0);
  };

  const getTotalPrevisional = () => {
    return carriers
      .filter(c => c.response === 'pending')
      .reduce((sum, c) => sum + parseInt(c.ensemblesPrevisional || '0'), 0);
  };

  const totalConfirmed = getTotalConfirmed();
  const totalPrevisional = getTotalPrevisional();
  const totalAllocated = totalConfirmed + totalPrevisional;
  const isOverbooked = totalAllocated > totalEnsembles;
  const isComplete = totalAllocated === totalEnsembles;
  
  // Vérifier si tous les transporteurs sont confirmés (pas de pré-réservés)
  const isFullyConfirmed = isComplete && totalPrevisional === 0;
  
  // Vérifier si tous les transporteurs confirmés ont rempli leur formulaire
  const areAllFormsCompleted = () => {
    const confirmedCarriers = carriers.filter(carrier => carrier.response === 'yes' && carrier.ensemblesTaken);
    return confirmedCarriers.every(carrier => savedCarriers.has(carrier.id));
  };

  const updateCarrier = async (id: string, field: keyof CarrierReturn, value: any) => {
    setCarriers(prev => prev.map(carrier => {
      if (carrier.id === id) {
        const updated = { ...carrier, [field]: value };
        
        // If response changes to "no", clear previsional
        if (field === 'response' && value === 'no') {
          updated.ensemblesPrevisional = '';
          updated.ensemblesTaken = '';
          updated.validated = false;
        }
        
        // If response changes to "yes", clear previsional
        if (field === 'response' && value === 'yes') {
          updated.ensemblesPrevisional = '';
        }
        
        // If response changes from "pending" to "no", free up previsional
        if (field === 'response' && value === 'no' && carrier.response === 'pending') {
          updated.ensemblesPrevisional = '';
        }
        
        // Auto-validate if response is yes and ensembles are set
        if (field === 'response' && value === 'yes' && updated.ensemblesTaken) {
          updated.validated = true;
        } else if (field === 'ensemblesTaken' && updated.response === 'yes' && value) {
          updated.validated = true;
        }
        
        // Sauvegarder automatiquement en base de données
        saveCarrierToDatabase(updated);
        
        return updated;
      }
      return carrier;
    }));
  };

  // Fonctions pour gérer les favoris
  const handleToggleFavorite = async (carrier: CarrierReturn) => {
    if (favoritesLoading) return;
    
    setFavoritesLoading(true);
    try {
      const isFavorite = favorites.has(carrier.id);
      
      if (isFavorite) {
        // Retirer des favoris
        await TransporterFavoriteService.removeFromFavorites('user-1', carrier.id);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(carrier.id);
          return newFavorites;
        });
      } else {
        // Ajouter aux favoris
        await TransporterFavoriteService.addToFavorites('user-1', carrier.id, carrier.name);
        setFavorites(prev => new Set(prev).add(carrier.id));
        
        // Si le transporteur est validé (status "yes"), incrémenter les missions réussies
        if (carrier.response === 'yes') {
          try {
            await TransporterFavoriteService.incrementSuccessfulMissions('user-1', carrier.id);
          } catch (error) {
            console.error('Erreur lors de l\'incrémentation des missions réussies:', error);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Fonction pour sauvegarder les changements en base de données
  const saveCarrierToDatabase = async (carrier: CarrierReturn) => {
    if (!searchId) return;
    
    try {
      console.log('💾 Sauvegarde automatique du transporteur:', carrier.name, carrier);
      
      // Préparer les données pour l'API
      const contactData = {
        searchId: searchId,
        userId: 'user-1', // TODO: Récupérer l'ID utilisateur depuis le contexte d'auth
        transporterId: carrier.id,
        transporterName: carrier.name,
        route: carrier.route,
        vehicleType: searchCriteria?.typeVehicule || 'Tous',
        status: carrier.response,
        volume: carrier.response === 'yes' ? parseInt(carrier.ensemblesTaken || '0') : 
                carrier.response === 'pending' ? parseInt(carrier.ensemblesPrevisional || '0') : 0,
        comment: carrier.comment,
      };

      // Sauvegarder via l'API (créera ou mettra à jour automatiquement)
      await TransporterContactService.saveContact(contactData);
      console.log('✅ Transporteur sauvegardé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du transporteur:', error);
    }
  };

  const coverageRate = (totalAllocated / totalEnsembles) * 100;

  const getStatusConfig = (carrier: CarrierReturn) => {
    if (carrier.response === 'yes' && carrier.validated) {
      return { label: 'Confirmé', color: 'bg-green-100 text-green-700', icon: '🟢' };
    }
    if (carrier.response === 'pending' && carrier.ensemblesPrevisional) {
      return { label: 'Pré-réservé', color: 'bg-amber-100 text-amber-700', icon: '🟠' };
    }
    if (carrier.response === 'pending') {
      return { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: '⚪' };
    }
    if (carrier.response === 'no') {
      return { label: 'Refusé', color: 'bg-red-100 text-red-700', icon: '🔴' };
    }
    return { label: 'En cours', color: 'bg-gray-100 text-gray-700', icon: '⚪' };
  };

  // Fonctions pour gérer le modal de détails de mission
  const handleOpenMissionDetails = (carrier: CarrierReturn) => {
    console.log('Opening mission details for carrier:', carrier.name);
    setSelectedCarrier(carrier);
    setShowMissionDetailsModal(true);
  };

  const handleSaveMissionDetails = async (details: MissionDetails) => {
    if (selectedCarrier && searchId) {
      try {
        console.log('Saving mission details for carrier:', selectedCarrier.name, details);
        
        const missionData: MissionDetailsData = {
          searchId: searchId,
          userId: 'user-1', // TODO: Récupérer l'ID utilisateur depuis le contexte d'auth
          transporterId: selectedCarrier.id,
          transporterName: selectedCarrier.name,
          route: selectedCarrier.route,
          ensemblesTaken: selectedCarrier.ensemblesTaken,
          merchandise: details.merchandise,
          loadingDate: details.loadingDate,
          loadingTime: details.loadingTime,
          deliveryDate: details.deliveryDate,
          deliveryTime: details.deliveryTime,
          estimatedPrice: details.estimatedPrice,
          notes: details.notes,
        };

        // Sauvegarder en base de données
        await MissionDetailsService.saveMissionDetails(missionData);
        
        // Mettre à jour l'état local
        setCarrierMissionDetails(prev => ({
          ...prev,
          [selectedCarrier.id]: details
        }));
        
        // Marquer le transporteur comme sauvegardé
        setSavedCarriers(prev => new Set([...prev, selectedCarrier.id]));
        
        setShowMissionDetailsModal(false);
        setSelectedCarrier(null);
        
        console.log('Mission details saved successfully');
      } catch (error) {
        console.error('Error saving mission details:', error);
        // TODO: Afficher une notification d'erreur à l'utilisateur
      }
    }
  };

  const getRowBackground = (carrier: CarrierReturn) => {
    if (carrier.response === 'yes' && carrier.validated) {
      return 'bg-green-50/50 border-green-200';
    }
    return 'bg-white border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des contacts transporteurs...</p>
        </div>
      </div>
    );
  }

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
                Retour aux résultats
              </Button>
              <Button
                onClick={() => onNext && onNext(carriers)}
                disabled={isOverbooked || !isFullyConfirmed || !areAllFormsCompleted()}
                className="rounded-lg h-11 px-6 transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: (isOverbooked || !isFullyConfirmed || !areAllFormsCompleted()) ? '#ccc' : '#F6A20E', color: 'white' }}
              >
                Générer ordres de mission
              </Button>
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
                  Résultats
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Saisie des retours</BreadcrumbPage>
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
                      <span>{extractCityAndPostalCode(searchCriteria?.departAdresse || 'Bordeaux')}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: '#F6A20E' }} />
                      <span>{extractCityAndPostalCode(searchCriteria?.arriveeAdresse || 'Laval')}</span>
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div className="flex items-center gap-2 pl-8 border-l border-gray-200">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <span>{searchCriteria?.typeVehicule || 'Tous'}</span>
                  </div>

                  {/* Total */}
                  <div className="pl-8 border-l border-gray-200">
                    <p className="text-sm text-gray-600">Quantité totale</p>
                    <p>{totalEnsembles} ensembles</p>
                  </div>

                  {/* Allocation Summary */}
                  <div className="pl-8 border-l border-gray-200">
                    <p className="text-sm text-gray-600">Attribution</p>
                    <div className="flex items-center gap-2">
                      <span className="text-green-700">{totalConfirmed} confirmé{totalConfirmed > 1 ? 's' : ''}</span>
                      {totalPrevisional > 0 && (
                        <>
                          <span className="text-gray-400">+</span>
                          <span className="text-amber-700">{totalPrevisional} pré-réservé{totalPrevisional > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
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
                        {Math.max(0, remainingEnsembles)} ensemble{remainingEnsembles > 1 ? 's' : ''}
                      </span>
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
                        stroke={isOverbooked ? '#EF4444' : '#F6A20E'}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(coverageRate, 100) / 100)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm" style={{ color: isOverbooked ? '#EF4444' : '#2B3A55' }}>
                        {Math.round(coverageRate)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{isOverbooked ? 'Surbooking' : 'Couvert'}</p>
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
            <h1 className="mb-2" style={{ color: '#2B3A55' }}>Saisie des retours transporteurs</h1>
            <p className="text-gray-600">
              Enregistrez les réponses définitives et confirmez les volumes réels
            </p>
          </div>

          {/* Overbooking Alert */}
          <AnimatePresence>
            {isOverbooked && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert className="bg-red-50 border-red-300">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="text-red-900">
                      ⚠️ Surbooking détecté : vous avez attribué {totalAllocated} ensemble(s) pour une demande de {totalEnsembles}.
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Vérifiez les quantités avant de générer les ordres de mission.
                    </p>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete Banner */}
          <AnimatePresence>
            {isComplete && !isOverbooked && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {isFullyConfirmed ? (
                  // Tous les transporteurs sont confirmés
                  <Alert className="bg-green-50 border-green-300">
                    <PartyPopper className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <p className="text-green-900">
                        🎉 Mission complète – Vous pouvez générer les ordres de mission
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  // Il y a des pré-réservés
                  <Alert className="bg-yellow-50 border-yellow-300">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <p className="text-yellow-900">
                        ⏳ Vous avez couvert la totalité de votre quantité demandée en attente de validation
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Carriers Table */}
          <Card className="shadow-md border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1.5fr_1.2fr_1fr_1fr_2fr_1fr] gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Transporteur</div>
                  <div className="text-sm text-gray-600">Route</div>
                  <div className="text-sm text-gray-600">Réponse</div>
                  <div className="text-sm text-gray-600">Nb ensembles pris</div>
                  <div className="text-sm text-gray-600">Nb prévisionnel</div>
                  <div className="text-sm text-gray-600">Commentaire</div>
                  <div className="text-sm text-gray-600">Statut</div>
                </div>

                {/* Table Rows */}
                {carriers.map((carrier, index) => {
                  const statusConfig = getStatusConfig(carrier);
                  
                  return (
                    <motion.div
                      key={carrier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`grid grid-cols-[2fr_1.5fr_1.2fr_1fr_1fr_2fr_1fr] gap-4 px-4 py-4 rounded-lg border transition-all ${getRowBackground(carrier)}`}
                    >
                      {/* Carrier Name */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{carrier.name}</span>
                        <button
                          onClick={() => handleToggleFavorite(carrier)}
                          disabled={favoritesLoading}
                          className={`p-1 rounded-full transition-all hover:scale-110 ${
                            favorites.has(carrier.id) 
                              ? 'text-yellow-400 hover:text-yellow-300' 
                              : 'text-gray-400 hover:text-yellow-400'
                          } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={favorites.has(carrier.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          <Star 
                            size={16} 
                            fill={favorites.has(carrier.id) ? '#fbbf24' : 'none'}
                            stroke={favorites.has(carrier.id) ? '#fbbf24' : '#9ca3af'}
                            className={favorites.has(carrier.id) ? 'text-yellow-400' : 'text-gray-400'}
                          />
                        </button>
                      </div>

                      {/* Route */}
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">{carrier.route}</span>
                      </div>

                      {/* Response */}
                      <div className="flex items-center">
                        <Select 
                          value={carrier.response} 
                          onValueChange={(value) => updateCarrier(carrier.id, 'response', value)}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">✅ Oui</SelectItem>
                            <SelectItem value="pending">⏳ En attente</SelectItem>
                            <SelectItem value="no">❌ Non</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ensembles Taken */}
                      <div className="flex items-center">
                        {carrier.response === 'yes' ? (
                          <Input
                            type="number"
                            value={carrier.ensemblesTaken}
                            onChange={(e) => updateCarrier(carrier.id, 'ensemblesTaken', e.target.value)}
                            placeholder="0"
                            className="h-9 rounded-lg text-sm"
                            min="0"
                          />
                        ) : (
                          <span className="text-sm text-gray-400">–</span>
                        )}
                      </div>

                      {/* Ensembles Previsional */}
                      <div className="flex items-center">
                        {carrier.response === 'pending' ? (
                          <Input
                            type="number"
                            value={carrier.ensemblesPrevisional}
                            onChange={(e) => updateCarrier(carrier.id, 'ensemblesPrevisional', e.target.value)}
                            placeholder="0"
                            className="h-9 rounded-lg text-sm bg-amber-50"
                            min="0"
                          />
                        ) : (
                          <span className="text-sm text-gray-400">–</span>
                        )}
                      </div>

                      {/* Comment */}
                      <div className="flex items-center">
                        <Input
                          value={carrier.comment}
                          onChange={(e) => updateCarrier(carrier.id, 'comment', e.target.value)}
                          placeholder="Commentaire..."
                          className="h-9 rounded-lg text-sm"
                        />
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <motion.div
                          key={`${carrier.response}-${carrier.validated}`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                            <span>{statusConfig.icon}</span>
                            <span className="text-xs">{statusConfig.label}</span>
                          </Badge>
                        </motion.div>
                        
                        {/* Bouton détails mission pour les transporteurs confirmés */}
                        {carrier.response === 'yes' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMissionDetails(carrier)}
                            className={`h-7 w-7 p-0 rounded-full transition-all ${
                              savedCarriers.has(carrier.id)
                                ? 'bg-green-50 border-green-300 hover:bg-green-100'
                                : 'hover:bg-orange-50 hover:border-orange-300'
                            }`}
                            title={
                              savedCarriers.has(carrier.id)
                                ? "Détails sauvegardés - Cliquer pour modifier"
                                : "Formulaire de détails de la mission"
                            }
                          >
                            {savedCarriers.has(carrier.id) ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <FileText className="w-3 h-3 text-orange-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Micro-feedbacks */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  {totalConfirmed} confirmé{totalConfirmed > 1 ? 's' : ''}
                </span>
              </div>
              {totalPrevisional > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-600">
                    {totalPrevisional} pré-réservé{totalPrevisional > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: '#F6A20E' }} />
                <span className="text-sm text-gray-600">
                  {Math.max(0, remainingEnsembles)} restant{remainingEnsembles > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {isComplete && !isOverbooked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-700"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Mission prête à finaliser</span>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de détails de mission pour le transporteur sélectionné */}
      {selectedCarrier && (
        <MissionDetailsModal
          isOpen={showMissionDetailsModal}
          onClose={() => {
            console.log('Closing modal');
            setShowMissionDetailsModal(false);
            setSelectedCarrier(null);
          }}
          onSave={handleSaveMissionDetails}
          carrierName={selectedCarrier.name}
          route={selectedCarrier.route}
          ensemblesTaken={selectedCarrier.ensemblesTaken}
          initialData={carrierMissionDetails[selectedCarrier.id] || {
            merchandise: 'Granulats',
            loadingDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            loadingTime: '08:00',
            deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTime: '18:00',
            estimatedPrice: 1200,
          }}
        />
      )}
    </div>
  );
}

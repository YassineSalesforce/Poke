import React, { useState, useEffect } from 'react';
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
import { TransporterRouteService } from '../services/TransporterRouteService';

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
  isAlternative?: boolean; // Ajouter le champ manquant
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
  
  const totalTonnes = 5;
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | AlternativeCarrier | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [transporters, setTransporters] = useState<TransporterData[]>([]);
  const [alternativeTransporters, setAlternativeTransporters] = useState<AlternativeTransporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les transporteurs correspondants depuis Excel
  useEffect(() => {
    const loadTransporters = async () => {
      setIsLoading(true);
      console.log('🔄 SearchResults - Chargement des transporteurs avec searchCriteria:', searchCriteria);
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
          
          let matchingTransporters = TransporterService.searchTransporters(criteria);
          
          // Charger les contacts depuis la base de données pour appliquer les statuts
          console.log('🔍 SearchResults - searchId disponible:', searchCriteria.searchId);
          if (searchCriteria.searchId) {
            try {
              console.log('📡 SearchResults - Chargement des contacts pour searchId:', searchCriteria.searchId);
              const contacts = await TransporterContactService.getContactsBySearch(searchCriteria.searchId);
              console.log('📊 Contacts chargés pour les transporteurs correspondants:', contacts);
              
              // Appliquer les contacts aux transporteurs correspondants
              matchingTransporters = matchingTransporters.map(transporter => {
                const contact = contacts.find(c => c.transporterId === transporter.id && !c.isAlternative);
                if (contact) {
                  return {
                    ...transporter,
                    status: contact.status,
                    ensemblesTaken: contact.status === 'yes' ? contact.volume : 0,
                    ensemblesPrevisional: contact.status === 'pending' ? contact.volume : 0,
                    comment: contact.comment || ''
                  };
                }
                return transporter;
              });
            } catch (error) {
              console.error('❌ Erreur lors du chargement des contacts pour les transporteurs correspondants:', error);
            }
          }
          
          // Si on a des contacts mis à jour en plus (pour compatibilité), les appliquer aussi
          if (searchCriteria.updatedContacts && searchCriteria.updatedContacts.length > 0) {
            console.log('🔄 Application des contacts mis à jour supplémentaires aux transporteurs:', searchCriteria.updatedContacts);
            
            matchingTransporters = matchingTransporters.map(transporter => {
              const updatedContact = searchCriteria.updatedContacts.find((contact: any) => 
                contact.transporterId === transporter.id
              );
              
              if (updatedContact) {
                return {
                  ...transporter,
                  status: updatedContact.status,
                  ensemblesTaken: updatedContact.status === 'yes' ? updatedContact.volume : 0,
                  ensemblesPrevisional: updatedContact.status === 'pending' ? updatedContact.volume : 0,
                  comment: updatedContact.comment || ''
                };
              }
              
              return transporter;
            });
          }
          
          setTransporters(matchingTransporters);
          
          // Charger les transporteurs alternatifs basés sur les missions
          const alternatives = await MissionService.findAlternativeTransporters(
            searchCriteria.depart, 
            searchCriteria.arrivee
          );
          console.log(`🔄 ${alternatives.length} transporteurs alternatifs trouvés`);
          
          // Charger les contacts depuis la base de données pour appliquer les statuts
          let updatedAlternatives = alternatives;
          console.log('🔍 SearchResults - Chargement contacts alternatifs pour searchId:', searchCriteria.searchId);
          if (searchCriteria.searchId) {
            try {
              const contacts = await TransporterContactService.getContactsBySearch(searchCriteria.searchId);
              console.log('📊 Contacts chargés pour les transporteurs alternatifs:', contacts);
              
              // Filtrer uniquement les contacts alternatifs
              const alternativeContacts = contacts.filter(c => c.isAlternative);
              console.log('🔍 Contacts alternatifs trouvés:', alternativeContacts.length);
              
              // Appliquer les contacts aux transporteurs alternatifs
              updatedAlternatives = alternatives.map(alternative => {
                const contact = alternativeContacts.find(c => c.transporterId === alternative.organisation);
                if (contact) {
                  console.log(`✅ Contact trouvé pour "${alternative.organisation}":`, contact.status);
                  return {
                    ...alternative,
                    status: contact.status,
                    ensemblesTaken: contact.status === 'yes' ? contact.volume : 0,
                    ensemblesPrevisional: contact.status === 'pending' ? contact.volume : 0,
                    comment: contact.comment || ''
                  };
                }
                return alternative;
              });
              
              const updatedCount = updatedAlternatives.filter(alt => alt.status).length;
              console.log(`✅ ${updatedCount} transporteurs alternatifs mis à jour avec leurs statuts`);
            } catch (error) {
              console.error('❌ Erreur lors du chargement des contacts pour les transporteurs alternatifs:', error);
            }
          }
          
          setAlternativeTransporters(updatedAlternatives);
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
    const totalQuantity = searchCriteria?.quantite || totalTonnes;
    
    // Calculer les ensembles confirmés des transporteurs correspondants
    const confirmedTakenTransporters = transporters
      .filter(t => t.status === 'yes' || t.statut === 'occupe')
      .reduce((sum, t) => sum + (t.ensemblesTaken || (t.statut === 'occupe' ? t.capacite : 0)), 0);
    
    // Calculer les ensembles confirmés des transporteurs alternatifs
    const confirmedTakenAlternatives = alternativeTransporters
      .filter(at => at.status === 'yes')
      .reduce((sum, at) => sum + (at.ensemblesTaken || 0), 0);
    
    const confirmedTaken = confirmedTakenTransporters + confirmedTakenAlternatives;
    
    // Calculer les ensembles en attente des transporteurs correspondants
    const preReservedTransporters = transporters
      .filter(t => t.status === 'pending' || t.statut === 'en_attente')
      .reduce((sum, t) => sum + (t.ensemblesPrevisional || (t.statut === 'en_attente' ? t.capacite : 0)), 0);
    
    // Calculer les ensembles en attente des transporteurs alternatifs
    const preReservedAlternatives = alternativeTransporters
      .filter(at => at.status === 'pending')
      .reduce((sum, at) => sum + (at.ensemblesPrevisional || 0), 0);
    
    const preReservedTotal = preReservedTransporters + preReservedAlternatives;
    
    const remaining = totalQuantity - confirmedTaken - preReservedTotal;
    
    console.log('🧮 Calcul remaining:', {
      totalQuantity,
      confirmedTakenTransporters,
      confirmedTakenAlternatives,
      confirmedTaken,
      preReservedTransporters,
      preReservedAlternatives,
      preReservedTotal,
      remaining,
      transportersWithStatus: transporters.filter(t => (t.status && t.status !== '') || t.statut !== 'disponible').length,
      alternativesWithStatus: alternativeTransporters.filter(at => at.status && at.status !== '').length,
      transporters: transporters.map(t => ({
        id: t.id,
        name: t.nom,
        status: t.status,
        statut: t.statut,
        ensemblesTaken: t.ensemblesTaken,
        capacite: t.capacite
      })),
      alternatives: alternativeTransporters.map(at => ({
        id: at.organisation,
        name: at.organisation,
        status: at.status,
        ensemblesTaken: at.ensemblesTaken,
        ensemblesPrevisional: at.ensemblesPrevisional
      }))
    });
    
    return remaining;
  };

  const remainingEnsembles = calculateRemaining();
  const totalQuantity = searchCriteria?.quantite || totalTonnes;
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
        status: transporterData.status || '',
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
        // Chercher d'abord dans les transporteurs correspondants
        let transporter = transporters.find(t => t.id === carrierId);
        
        // Si pas trouvé, chercher dans les transporteurs alternatifs
        if (!transporter) {
          const alternativeTransporter = alternativeTransporters.find(at => at.organisation === carrierId);
          if (alternativeTransporter) {
            // Créer un objet transporter temporaire pour la sauvegarde
            transporter = {
              id: alternativeTransporter.organisation,
              nom: alternativeTransporter.organisation,
              zoneDepart: alternativeTransporter.departCode,
              zoneArrivee: alternativeTransporter.arriveeCode,
              typeVehicule: 'Tous types',
              capacite: alternativeTransporter.nombreMissions,
              note: alternativeTransporter.confiance / 10,
              derniereMission: alternativeTransporter.dernierMission,
              statut: 'disponible' as const,
              contact: {
                nom: `Contact ${alternativeTransporter.organisation}`,
                telephone: 'N/A',
                email: 'N/A'
              },
              specialites: [],
              tarif: 0,
              distance: 0
            };
          }
        }
        
        if (transporter) {
          // Déterminer si c'est un transporteur alternatif
          const isAlternative = !transporters.find(t => t.id === carrierId);
          
          await TransporterContactService.saveContact({
            searchId: searchCriteria.searchId,
            userId: searchCriteria?.userId || 'user-1',
            transporterId: carrierId,
            transporterName: transporter.nom,
            route: `${transporter.zoneDepart} → ${transporter.zoneArrivee}`,
            vehicleType: transporter.typeVehicule,
            status: data.response,
            volume: data.response === 'yes' ? parseInt(data.ensemblesTaken) : 
                   data.response === 'pending' ? parseInt(data.ensemblesPrevisional) : 0,
            comment: data.comment,
            isAlternative: isAlternative, // Marquer comme transporteur alternatif
          });
          console.log('✅ Contact transporteur sauvegardé:', carrierId, isAlternative ? '(alternatif)' : '(correspondant)');
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
    
    // Mettre à jour aussi la liste des transporteurs alternatifs si c'est un transporteur alternatif
    setAlternativeTransporters(prev => prev.map(at => {
      if (at.organisation === carrierId) {
        return {
          ...at,
          status: data.response,
          ensemblesTaken: data.response === 'yes' ? parseInt(data.ensemblesTaken) : 0,
          ensemblesPrevisional: data.response === 'pending' ? parseInt(data.ensemblesPrevisional) : 0,
          comment: data.comment,
        };
      }
      return at;
    }));
    
    setTransporters(prev => prev.map(t => {
      if (t.id === carrierId) {
        return {
          ...t,
          status: data.response,
          ensemblesTaken: data.response === 'yes' ? parseInt(data.ensemblesTaken) : 0,
          ensemblesPrevisional: data.response === 'pending' ? parseInt(data.ensemblesPrevisional) : 0,
          comment: data.comment,
          // Garder aussi l'ancien système pour compatibilité
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
    
    // Fermer le drawer et afficher un message de confirmation
    setIsDrawerOpen(false);
    toast.success('Contact transporteur enregistré avec succès');
  };

  const handleDisableRoute = (carrierId: string) => {
    setCarriers(prev => prev.map(c => 
      c.id === carrierId ? { ...c, routeDisabled: true } : c
    ));
  };

  const handleCreateRoute = async (carrierId: string) => {
    try {
      // Trouver le transporteur alternatif
      const alternativeTransporter = alternativeTransporters.find(at => at.organisation === carrierId);
      
      if (!alternativeTransporter) {
        toast.error('Transporteur non trouvé');
        return;
      }

      // Chercher les informations de région et véhicule depuis les données JSON
      let originRegion = 'Non spécifiée';
      let destinationRegion = 'Non spécifiée';
      let vehicleType = 'Tous types';
      
      try {
        const response = await fetch('/src/data/liste-mission-transport.json');
        const missionsData = await response.json();
        
        // Trouver une mission correspondante pour ce transporteur et cette route
        const mission = missionsData.find((m: any) => 
          m['Transporteur'] === alternativeTransporter.organisation &&
          m['Département Chargement'] === alternativeTransporter.departCode &&
          m['Département livraison'] === alternativeTransporter.arriveeCode
        );
        
        if (mission) {
          originRegion = mission['Région chargement'] || 'Non spécifiée';
          destinationRegion = mission['Région livraison'] || 'Non spécifiée';
          vehicleType = mission['Vehicule'] || 'Tous types';
          console.log('📦 Données récupérées:', { originRegion, destinationRegion, vehicleType });
        } else {
          console.log('⚠️ Aucune mission trouvée pour récupérer les données');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
      }

      // Extraire les informations de la route
      const originCountry = alternativeTransporter.paysDepart;
      const originDepartment = alternativeTransporter.departCode;
      const originCity = alternativeTransporter.depart;
      const destinationCountry = alternativeTransporter.paysArrivee;
      const destinationDepartment = alternativeTransporter.arriveeCode;
      const destinationCity = alternativeTransporter.arrivee;

      // Créer la route dans la base de données
      const savedRoute = await TransporterRouteService.createRoute({
        userId: searchCriteria?.userId || 'user-1',
        carrierId: alternativeTransporter.organisation,
        carrierName: alternativeTransporter.organisation,
        originCountry: originCountry,
        originRegion: originRegion,
        originDepartment: originDepartment,
        originCity: originCity,
        destinationCountry: destinationCountry,
        destinationRegion: destinationRegion,
        destinationDepartment: destinationDepartment,
        destinationCity: destinationCity,
        vehicleType: vehicleType,
        isActive: true,
      });

      console.log('✅ Route créée dans la base de données:', savedRoute);

      toast.success('Route officielle créée', {
        description: `${alternativeTransporter.organisation} – ${originCity} → ${destinationCity}`,
        icon: '✅',
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la route:', error);
      toast.error('Erreur lors de la création de la route');
    }
  };

  const getStatusConfig = (status: Carrier['status'], ensemblesTaken?: number, ensemblesPrevisional?: number, statut?: string, capacite?: number) => {
    // Utiliser le nouveau statut en priorité, sinon l'ancien
    const actualStatus = status || (statut === 'occupe' ? 'yes' : statut === 'en_attente' ? 'pending' : statut === 'indisponible' ? 'no' : '');
    const actualEnsemblesTaken = ensemblesTaken || (statut === 'occupe' ? capacite : 0);
    const actualEnsemblesPrevisional = ensemblesPrevisional || (statut === 'en_attente' ? capacite : 0);
    
    if (actualStatus === 'yes' && actualEnsemblesTaken) {
      return { label: `Confirmé – ${actualEnsemblesTaken}`, color: 'bg-green-100 text-green-700', icon: '✅' };
    }
    if (actualStatus === 'pending' && actualEnsemblesPrevisional) {
      return { label: `Pré-réservé – ${actualEnsemblesPrevisional}`, color: 'bg-amber-100 text-amber-700', icon: '⏳' };
    }
    if (actualStatus === 'pending') {
      return { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: '⏳' };
    }
    if (actualStatus === 'no') {
      return { label: 'Refusé', color: 'bg-red-100 text-red-700', icon: '❌' };
    }
    return { label: 'Non contacté', color: 'bg-gray-100 text-gray-700', icon: '⚪' };
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F5F7' }}>
      <header className="px-8 py-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
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

      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
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
                    <p>{searchCriteria?.quantite || totalTonnes} tonne{searchCriteria?.quantite || totalTonnes > 1 ? 's' : ''}</p>
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
                        {remainingEnsembles} tonne{remainingEnsembles > 1 ? 's' : ''}
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
                          {(() => {
                            const statusConfig = getStatusConfig(
                              transporter.status, 
                              transporter.ensemblesTaken, 
                              transporter.ensemblesPrevisional,
                              transporter.statut,
                              transporter.capacite
                            );
                            return (
                              <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                                <span>{statusConfig.icon}</span>
                                <span className="text-xs">{statusConfig.label}</span>
                              </Badge>
                            );
                          })()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center">
                          <Button
                            onClick={() => handleContactCarrier(transporter)}
                            size="sm"
                            disabled={(transporter.status && transporter.status !== '') || transporter.statut !== 'disponible'}
                            className={`h-8 px-4 text-xs rounded-lg transition-all hover:shadow-md ${
                              (transporter.status && transporter.status !== '') || transporter.statut !== 'disponible'
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                            }`}
                            style={{ 
                              backgroundColor: (transporter.status && transporter.status !== '') || transporter.statut !== 'disponible' ? '#ccc' : '#F6A20E', 
                              color: 'white' 
                            }}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {(transporter.status && transporter.status !== '') || transporter.statut !== 'disponible' ? 'Contacté' : 'Contacter'}
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
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            Confiance: {Math.round(transporter.confiance)}%
                          </Badge>
                           {transporter.status && transporter.status !== '' && (() => {
                             let label = '';
                             let icon = '';
                             let color = '';
                             
                             if (transporter.status === 'yes') {
                               label = transporter.ensemblesTaken ? `Accepté – ${transporter.ensemblesTaken}` : 'Accepté';
                               icon = '✅';
                               color = 'bg-green-100 text-green-700';
                             } else if (transporter.status === 'pending') {
                               label = transporter.ensemblesPrevisional ? `Pré-réservé – ${transporter.ensemblesPrevisional}` : 'Pré-réservé';
                               icon = '⏳';
                               color = 'bg-amber-100 text-amber-700';
                             } else if (transporter.status === 'no') {
                               label = 'Refusé';
                               icon = '❌';
                               color = 'bg-red-100 text-red-700';
                             } else {
                               label = 'Inconnu';
                               icon = '❓';
                               color = 'bg-gray-100 text-gray-700';
                             }
                             
                             return (
                               <Badge className={`${color} text-xs`}>
                                 <span>{icon}</span>
                                 <span className="ml-1">{label}</span>
                               </Badge>
                             );
                           })()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleContactAlternativeTransporter(transporter)}
                        disabled={transporter.status && transporter.status !== ''}
                        className={`rounded-lg transition-all ${
                          transporter.status && transporter.status !== '' 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:shadow-md'
                        }`}
                        style={{ 
                          backgroundColor: transporter.status && transporter.status !== '' ? '#ccc' : '#F6A20E', 
                          color: 'white' 
                        }}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        {transporter.status && transporter.status !== '' ? 'Contacté' : 'Contacter'}
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

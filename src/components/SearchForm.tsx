import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Truck, 
  Package2,
  AlertTriangle,
  Lightbulb,
  Target,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Alert, AlertDescription } from './ui/alert';
import { GeocodingInput } from './GeocodingInput';
import { GeocodingResult } from '../services/GeocodingService';
import { UserSearchService } from '../services/UserSearchService';

interface SearchFormProps {
  onBack: () => void;
  onSearch?: (criteria: any) => void;
  showBackButton?: boolean;
  onLogout: () => void;
  userId?: string;
}

export function SearchForm({ onBack, onSearch, showBackButton = true, onLogout, userId }: SearchFormProps) {
  const { user } = useAuth();
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [originGeocodeResult, setOriginGeocodeResult] = useState<GeocodingResult | null>(null);
  const [destinationGeocodeResult, setDestinationGeocodeResult] = useState<GeocodingResult | null>(null);
  const [vehicleType, setVehicleType] = useState('');
  const [merchandiseType, setMerchandiseType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('tonnes');
  const [constraints, setConstraints] = useState({
    adr: false,
    temp: false,
    covered: false,
  });
  const [comments, setComments] = useState('');
  const [progress, setProgress] = useState(0);

  const handleLogout = () => {
    onLogout();
  };
  const [showIncoherentAlert, setShowIncoherentAlert] = useState(false);
  const [canForceSubmit, setCanForceSubmit] = useState(false);

  // Detect location precision
  const detectPrecision = (input: string) => {
    if (!input) return null;
    
    // Simple detection logic
    if (input.match(/^\d{1,5}\s+/)) {
      // Contains street number
      return { type: 'Adresse complète', details: input };
    } else if (input.match(/\(\d{2,3}\)/)) {
      // Contains department code in parentheses
      const match = input.match(/([\w\s-]+)\s*\((\d{2,3})\)/);
      if (match) {
        return { type: 'Ville', details: `${match[1]}, ${match[2]}, FR` };
      }
    } else if (input.match(/\d{2}/)) {
      // Just department number
      return { type: 'Département', details: `${input}, FR` };
    }
    return { type: 'Ville', details: `${input}, FR` };
  };

  const originPrecision = detectPrecision(originInput);
  const destPrecision = detectPrecision(destinationInput);

  // Calculate estimated ensembles
  const calculateEnsembles = () => {
    if (!quantity) return 0;
    const q = parseFloat(quantity);
    if (unit === 'tonnes') {
      return Math.ceil(q / 27); // 27 tonnes par ensemble
    } else if (unit === 'palettes') {
      return Math.ceil(q / 33); // 33 palettes par ensemble
    } else {
      return Math.ceil(q / 80); // 80 m3 par ensemble
    }
  };

  // Check for incoherent data
  useEffect(() => {
    if (!originInput || !destinationInput || !vehicleType || !quantity) {
      setShowIncoherentAlert(false);
      return;
    }

    // Simple incoherence checks
    const q = parseFloat(quantity);
    const isTooShort = originInput.toLowerCase().includes('bordeaux') && destinationInput.toLowerCase().includes('bordeaux');
    const isTooSmall = q < 1;
    const isIncompatible = vehicleType === 'Frigo' && merchandiseType === 'construction';

    if (isTooShort || isTooSmall || isIncompatible) {
      setShowIncoherentAlert(true);
    } else {
      setShowIncoherentAlert(false);
    }
  }, [originInput, destinationInput, vehicleType, quantity, merchandiseType]);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const totalFields = 5;

    if (originInput) completed++;
    if (destinationInput) completed++;
    if (vehicleType) completed++;
    if (merchandiseType) completed++;
    if (quantity) completed++;

    setProgress((completed / totalFields) * 100);
  }, [originInput, destinationInput, vehicleType, merchandiseType, quantity]);

  const isFormValid = originInput && destinationInput && vehicleType && quantity;
  const canSubmit = isFormValid && (!showIncoherentAlert || canForceSubmit);

  const handleSearchClick = async () => {
    if (!canSubmit || !onSearch) return;
    
    const criteria = {
      depart: originGeocodeResult?.zoneCode || originInput,
      arrivee: destinationGeocodeResult?.zoneCode || destinationInput,
      typeVehicule: vehicleType,
      quantite: quantity ? parseInt(quantity) : 1,
      // Ajouter les adresses complètes pour l'affichage
      departAdresse: originInput,
      arriveeAdresse: destinationInput
    };
    
    console.log('🔍 SearchForm - Critères envoyés:', criteria);
    
    // Sauvegarder la recherche dans la base de données
    let savedSearchId = null;
    try {
      const savedSearch = await UserSearchService.saveSearch({
        userId: userId || 'user-1', // Utiliser l'ID utilisateur passé en props
        depart: criteria.depart,
        arrivee: criteria.arrivee,
        departAdresse: criteria.departAdresse,
        arriveeAdresse: criteria.arriveeAdresse,
        typeVehicule: criteria.typeVehicule,
        quantite: criteria.quantite,
      });
      savedSearchId = savedSearch._id;
      console.log('✅ Recherche sauvegardée dans la base de données:', savedSearchId);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      // Continuer même si la sauvegarde échoue
    }
    
    // Ajouter l'ID de la recherche aux critères
    const criteriaWithSearchId = {
      ...criteria,
      searchId: savedSearchId
    };
    
    onSearch(criteriaWithSearchId);
  };

  const getSummary = () => {
    if (!originInput && !destinationInput) return 'Renseignez votre demande, le système trouvera les transporteurs les plus adaptés';
    
    const parts = [];
    if (originInput) {
      const origin = originPrecision?.type === 'Ville' ? originInput.split('(')[0].trim() : originInput;
      parts.push(origin);
    }
    if (destinationInput) {
      const dest = destPrecision?.type === 'Ville' ? destinationInput.split('(')[0].trim() : destinationInput;
      parts.push(dest);
    }
    if (parts.length === 2) parts.splice(1, 0, '→');
    if (vehicleType) parts.push(`– ${vehicleType}`);
    if (quantity) {
      const ensembles = calculateEnsembles();
      parts.push(`– ${ensembles} ensemble${ensembles > 1 ? 's' : ''} estimé${ensembles > 1 ? 's' : ''}`);
    }
    
    return parts.join(' ') || 'Renseignez votre demande';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F5F7' }}>
      {/* Header */}
      <header className="px-8 py-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Logo officiel */}
            <div className="flex items-center gap-3">
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onBack) {
                    onBack();
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
                Affréteur IA
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="rounded-lg h-11 px-6"
                >
                  Annuler
                </Button>
              )}
              <Button
                disabled={!canSubmit}
                onClick={handleSearchClick}
                className="rounded-lg h-11 px-6 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: canSubmit ? '#F6A20E' : '#ccc', color: 'white' }}
              >
                Lancer la recherche
              </Button>

              {/* Profil utilisateur */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} />
                  <AvatarFallback style={{ backgroundColor: '#2B3A55', color: 'white' }}>
                    {user?.firstName?.[0] || 'J'}{user?.lastName?.[0] || 'D'}
                  </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex flex-col cursor-pointer">
                      <span className="text-sm font-medium" style={{ color: 'white' }}>
                        {user ? `${user.firstName || 'Jean'} ${user.lastName || 'Dupont'}` : 'Utilisateur'}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
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
              {showBackButton && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={onBack}
                      className="cursor-pointer hover:underline"
                      style={{ color: 'white' }}
                    >
                      Tableau de bord
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage style={{ color: 'white' }}>Nouvelle recherche</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto pb-40">
        <div className="max-w-[1400px] mx-auto">
          {/* Title section */}
          <div className="mb-8">
            <h1 className="mb-2" style={{ color: '#2B3A55' }}>Définissez votre besoin de transport</h1>
            <p className="text-gray-600">
              {getSummary()}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progression du formulaire</span>
              <span className="text-sm" style={{ color: '#F6A20E' }}>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Main Form Card */}
          <Card className="shadow-md rounded-xl border-gray-200">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-12">
                {/* Left Column - Location */}
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 flex items-center gap-2" style={{ color: '#2B3A55' }}>
                      <MapPin className="w-5 h-5" />
                      Origine & Destination
                    </h3>

                    {/* Origin */}
                    <GeocodingInput
                      id="origin"
                      label="Origine du transport 📍"
                      placeholder="Ex: Bordeaux, 12 rue du Port Bordeaux, ou Gironde (33)"
                      value={originInput}
                      onChange={setOriginInput}
                      onGeocodeResult={setOriginGeocodeResult}
                      className="mb-6"
                    />

                    {/* Destination */}
                    <GeocodingInput
                      id="destination"
                      label="Destination du transport 🎯"
                      placeholder="Ex: Madrid, Madrid (ES13), ou Communauté de Madrid"
                      value={destinationInput}
                      onChange={setDestinationInput}
                      onGeocodeResult={setDestinationGeocodeResult}
                    />
                  </div>

                  {/* Visual Route Preview */}
                  {originInput && destinationInput && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-6 border border-gray-200"
                    >
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2B3A55' }}>
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm mt-2 text-center">{originInput.split('(')[0].trim()}</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-1 flex-1 bg-gradient-to-r from-blue-300 to-orange-300 rounded-full" />
                          <Target className="w-8 h-8 mx-2" style={{ color: '#F6A20E' }} />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F6A20E' }}>
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm mt-2 text-center">{destinationInput.split('(')[0].trim()}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Column - Technical Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 flex items-center gap-2" style={{ color: '#2B3A55' }}>
                      <Truck className="w-5 h-5" />
                      Détails techniques
                    </h3>

                    {/* Vehicle Type */}
                    <div className="space-y-2 mb-6">
                      <Label htmlFor="vehicle">
                        Type de véhicule <span className="text-red-500">*</span>
                      </Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger id="vehicle" className="rounded-lg">
                          <SelectValue placeholder="Sélectionner un type de véhicule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tous">🚛 Tous les véhicules</SelectItem>
                          <SelectItem value="Benne">🚛 Benne</SelectItem>
                          <SelectItem value="Tautliner">🚚 Tautliner</SelectItem>
                          <SelectItem value="Plateau">📦 Plateau</SelectItem>
                          <SelectItem value="Frigo">❄️ Frigo</SelectItem>
                          <SelectItem value="Semi-remorque">🚛 Semi-remorque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Merchandise Type */}
                    <div className="space-y-2 mb-6">
                      <Label htmlFor="merchandise">Type de marchandise</Label>
                      <Input
                        id="merchandise"
                        value={merchandiseType}
                        onChange={(e) => setMerchandiseType(e.target.value)}
                        placeholder="Ex: Granulats, Équipements, Alimentaire..."
                        className="rounded-lg"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2 mb-2">
                      <Label htmlFor="quantity">
                        Quantité à transporter <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Ex: 135"
                          className="rounded-lg flex-1"
                        />
                        <Select value={unit} onValueChange={setUnit}>
                          <SelectTrigger className="rounded-lg w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tonnes">Tonnes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {quantity && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-gray-600 flex items-center gap-1"
                        >
                          <Lightbulb className="w-4 h-4" style={{ color: '#F6A20E' }} />
                          Estimation : {calculateEnsembles()} ensemble{calculateEnsembles() > 1 ? 's' : ''} minimum nécessaire{calculateEnsembles() > 1 ? 's' : ''}
                        </motion.p>
                      )}
                    </div>

                    {/* Special Constraints */}
                    <div className="space-y-3 mb-6 mt-6">
                      <Label>Contraintes spéciales</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="adr" 
                            checked={constraints.adr}
                            onCheckedChange={(checked) => setConstraints({ ...constraints, adr: checked as boolean })}
                          />
                          <label htmlFor="adr" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Transport ADR (matières dangereuses)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="temp" 
                            checked={constraints.temp}
                            onCheckedChange={(checked) => setConstraints({ ...constraints, temp: checked as boolean })}
                          />
                          <label htmlFor="temp" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Température dirigée
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="covered" 
                            checked={constraints.covered}
                            onCheckedChange={(checked) => setConstraints({ ...constraints, covered: checked as boolean })}
                          />
                          <label htmlFor="covered" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Bâché / Couvert
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-2">
                      <Label htmlFor="comments">Commentaires ou remarques</Label>
                      <Textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Ajoutez des informations complémentaires..."
                        className="rounded-lg resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coherence Alert */}
          <AnimatePresence>
            {showIncoherentAlert && !canForceSubmit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6"
              >
                <Alert className="bg-amber-50 border-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-900">
                        ⚠️ Ce besoin semble incohérent. Vérifiez vos données avant de lancer la recherche.
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Le trajet, la quantité ou la compatibilité marchandise/véhicule présentent une anomalie.
                      </p>
                    </div>
                    <Button
                      onClick={() => setCanForceSubmit(true)}
                      variant="outline"
                      className="ml-4 border-amber-400 hover:bg-amber-100"
                    >
                      Continuer malgré tout
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Footer Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-8 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between">
            {/* Summary */}
            <div className="flex items-center gap-6">
              {originInput && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: '#2B3A55' }} />
                  <span className="text-sm">{originInput.split('(')[0].trim()}</span>
                </div>
              )}
              {originInput && destinationInput && (
                <span className="text-gray-400">→</span>
              )}
              {destinationInput && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: '#F6A20E' }} />
                  <span className="text-sm">{destinationInput.split('(')[0].trim()}</span>
                </div>
              )}
              {vehicleType && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{vehicleType}</span>
                  </div>
                </>
              )}
              {quantity && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-2">
                    <Package2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{quantity} {unit}</span>
                    <Badge style={{ backgroundColor: '#F6A20E', color: 'white' }}>
                      {calculateEnsembles()} ensemble{calculateEnsembles() > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <Button
              disabled={!canSubmit}
              onClick={handleSearchClick}
              className="rounded-lg h-11 px-8 transition-all hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: canSubmit ? '#F6A20E' : '#ccc', color: 'white' }}
            >
              Lancer la recherche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

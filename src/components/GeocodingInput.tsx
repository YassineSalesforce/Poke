import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Search, Check, AlertCircle, Loader2 } from 'lucide-react';
import { GeocodingService, GeocodingResult } from '../services/GeocodingService';

interface GeocodingInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onGeocodeResult?: (result: GeocodingResult) => void;
  className?: string;
}

export function GeocodingInput({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange, 
  onGeocodeResult,
  className = ""
}: GeocodingInputProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<GeocodingResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Géocoder l'adresse quand elle change
  useEffect(() => {
    if (!value || value.length < 3) {
      setGeocodeResult(null);
      setShowDetails(false);
      setError(null);
      return;
    }

    // Si c'est une sélection manuelle, ne pas géocoder
    if (isManualSelection) {
      setIsManualSelection(false);
      return;
    }

    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Nouveau timeout pour éviter trop de requêtes
    timeoutRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      setError(null);
      
      try {
        // Géocoder l'adresse
        const result = await GeocodingService.geocodeAddress(value);
        setGeocodeResult(result);
        
        // Notifier le parent du résultat
        onGeocodeResult?.(result);
        
        // Si l'adresse est complète, montrer les détails
        if (GeocodingService.isCompleteAddress(result)) {
          setShowDetails(true);
        } else {
          setShowDetails(false);
        }
      } catch (err) {
        setError('Erreur lors de l\'analyse de l\'adresse');
        console.error('Erreur de géocodage:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800); // Délai de 800ms pour éviter trop de requêtes

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onGeocodeResult, isManualSelection]);

  // Générer des suggestions
  useEffect(() => {
    if (value && value.length >= 3) {
      const fetchSuggestions = async () => {
        try {
          const newSuggestions = await GeocodingService.getSuggestions(value);
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);
        } catch (err) {
          console.error('Erreur lors de la récupération des suggestions:', err);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      };

      fetchSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    setIsManualSelection(true);
    onChange(suggestion.formattedAddress);
    setGeocodeResult(suggestion);
    onGeocodeResult?.(suggestion);
    setShowSuggestions(false);
    setShowDetails(true);
    setError(null);
  };

  const getStatusIcon = () => {
    if (isAnalyzing) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    if (error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (geocodeResult && GeocodingService.isCompleteAddress(geocodeResult)) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    
    return <MapPin className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (isAnalyzing) return 'border-blue-300';
    if (error) return 'border-red-300';
    if (geocodeResult && GeocodingService.isCompleteAddress(geocodeResult)) return 'border-green-300';
    return 'border-gray-300';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-gray-700">
        {label}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
          
          <Input
            ref={inputRef}
            id={id}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            className={`pl-14 h-12 ${getStatusColor()} focus:border-orange-500 focus:ring-orange-500`}
          />
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.city}-${suggestion.country}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {suggestion.city || suggestion.formattedAddress.split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {suggestion.region && suggestion.region !== suggestion.city ? `${suggestion.region}, ` : ''}
                      {suggestion.country}
                      {suggestion.postalCode && ` (${suggestion.postalCode})`}
                    </div>
                    {suggestion.zoneCode && (
                      <div className="text-xs text-blue-600 font-mono">
                        {suggestion.zoneCode}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(suggestion.confidence)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Détails de géocodage */}
        {showDetails && geocodeResult && GeocodingService.isCompleteAddress(geocodeResult) && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">
                  Adresse analysée avec succès
                </div>
                <div className="text-xs text-green-700 mt-1 space-y-1">
                  <div><strong>Pays:</strong> {geocodeResult.country}</div>
                  {geocodeResult.region && <div><strong>Région:</strong> {geocodeResult.region}</div>}
                  {geocodeResult.city && <div><strong>Ville:</strong> {geocodeResult.city}</div>}
                  {geocodeResult.postalCode && <div><strong>Code postal:</strong> {geocodeResult.postalCode}</div>}
                  {geocodeResult.zoneCode && <div><strong>Code zone:</strong> {geocodeResult.zoneCode}</div>}
                  <div><strong>Confiance:</strong> 
                    <span className={`ml-1 ${GeocodingService.getConfidenceColor(geocodeResult.confidence)}`}>
                      {GeocodingService.getConfidenceLevel(geocodeResult.confidence)} ({Math.round(geocodeResult.confidence)}%)
                    </span>
                  </div>
                  {geocodeResult.latitude && geocodeResult.longitude && (
                    <div><strong>Coordonnées:</strong> {geocodeResult.latitude.toFixed(4)}, {geocodeResult.longitude.toFixed(4)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message d'analyse en cours */}
        {isAnalyzing && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <div className="text-sm text-blue-800">
                Analyse de l'adresse en cours...
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <div className="text-sm text-red-800">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Message d'avertissement si l'adresse n'est pas reconnue */}
        {!isAnalyzing && !error && value && value.length >= 3 && geocodeResult && !GeocodingService.isCompleteAddress(geocodeResult) && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                Adresse partiellement reconnue. Confiance: {Math.round(geocodeResult.confidence)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

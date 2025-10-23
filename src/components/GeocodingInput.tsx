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
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualSelectionRef = useRef<boolean>(false);

  useEffect(() => {
    if (!value || value.length < 3) {
      setGeocodeResult(null);
      setShowDetails(false);
      setError(null);
      setShowSuggestions(false);
      return;
    }

    if (showSuggestions) {
      return;
    }

    if (isManualSelectionRef.current) {
      isManualSelectionRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      setError(null);
      
      try {
        const result = await GeocodingService.geocodeAddress(value);
        setGeocodeResult(result);
        
        onGeocodeResult?.(result);
        
        if (result.city && result.country) {
          setShowDetails(true);
        }
      } catch (err) {
        setError('Erreur lors de l\'analyse de l\'adresse');
        console.error('Erreur de géocodage:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000); 

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onGeocodeResult, showSuggestions]);

  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const newSuggestions = await GeocodingService.getSuggestions(value);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
      } catch (err) {
        console.error('Erreur lors de la récupération des suggestions:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); 

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

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
    setShowSuggestions(false);
    setSuggestions([]);
    
    isManualSelectionRef.current = true;
    
    setGeocodeResult(suggestion);
    setShowDetails(true);
    setError(null);
    
    onGeocodeResult?.(suggestion);
    
    onChange(suggestion.formattedAddress);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
              }, 200);
            }}
            className={`pl-14 h-12 ${getStatusColor()} focus:border-orange-500 focus:ring-orange-500`}
          />
        </div>

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
        {showDetails && geocodeResult && geocodeResult.city && geocodeResult.country && (
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
      </div>
    </div>
  );
}

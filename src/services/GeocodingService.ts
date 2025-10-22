// Service de géocodage utilisant l'API Nominatim d'OpenStreetMap
export interface GeocodingResult {
  country: string;
  region: string;
  city: string;
  postalCode: string;
  zoneCode: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export class GeocodingService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly REVERSE_GEOCODE_URL = `${this.NOMINATIM_BASE_URL}/reverse`;
  private static readonly SEARCH_URL = `${this.NOMINATIM_BASE_URL}/search`;

  // Mapping des codes de pays vers les codes de zones de transport
  private static readonly COUNTRY_TO_ZONE_MAPPING: { [key: string]: string } = {
    'fr': 'FR',
    'es': 'ES',
    'de': 'DE',
    'it': 'IT',
    'be': 'BE',
    'nl': 'NL',
    'ch': 'CH',
    'at': 'AT',
    'lu': 'LU',
    'pt': 'PT',
    'gb': 'UK',
    'dk': 'DK',
    'se': 'SE',
    'fi': 'FI',
    'pl': 'PL',
    'cz': 'CZ',
    'hu': 'HU',
    'ro': 'RO',
    'si': 'SI',
    'sk': 'SK',
    'lt': 'LT',
    'lv': 'LV',
    'gr': 'GR'
  };

  // Mapping des régions françaises vers les codes de départements
  private static readonly FRENCH_REGION_TO_DEPARTMENT: { [key: string]: string[] } = {
    'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
    'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
    'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
    'Bretagne': ['22', '29', '35', '56'],
    'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
    'Corse': ['2A', '2B'],
    'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
    'Hauts-de-France': ['02', '59', '60', '62', '80'],
    'Normandie': ['14', '27', '50', '61', '76'],
    'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
    'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
    'Pays de la Loire': ['44', '49', '53', '72', '85'],
    'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84'],
    'Guadeloupe': ['971'],
    'Martinique': ['972'],
    'Guyane': ['973'],
    'La Réunion': ['974'],
    'Mayotte': ['976']
  };

  /**
   * Géocode une adresse en utilisant l'API Nominatim
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!address || address.trim() === '') {
      return this.getDefaultResult();
    }

    try {
      const results = await this.searchAddress(address);
      
      if (results.length === 0) {
        return this.getDefaultResult();
      }

      // Prendre le premier résultat (le plus pertinent)
      const result = results[0];
      return this.convertNominatimToGeocodingResult(result);
    } catch (error) {
      console.error('Erreur lors du géocodage:', error);
      return this.getDefaultResult();
    }
  }

  /**
   * Recherche une adresse via l'API Nominatim
   */
  private static async searchAddress(query: string): Promise<NominatimResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '10',
      countrycodes: 'fr,es,de,it,be,nl,ch,at,lu,pt,gb,dk,se,fi,pl,cz,hu,ro,si,sk,lt,lv,gr',
      'accept-language': 'fr,en',
      dedupe: '1', // Éviter les doublons
      bounded: '0', // Ne pas limiter à une zone géographique
      polygon_geojson: '0' // Pas besoin de géométrie complexe
    });

    const response = await fetch(`${this.SEARCH_URL}?${params}`, {
      headers: {
        'User-Agent': 'TransportHub/1.0 (Transport Management System)'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API Nominatim: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Convertit un résultat Nominatim en GeocodingResult
   */
  private static convertNominatimToGeocodingResult(result: NominatimResult): GeocodingResult {
    const address = result.address || {};
    
    // Extraire les informations de base
    const country = address.country || '';
    const countryCode = address.country_code?.toLowerCase() || '';
    const region = address.state || address.region || '';
    const city = address.city || address.town || address.village || address.municipality || '';
    const postalCode = address.postcode || '';
    
    // Générer le code de zone
    const zoneCode = this.generateZoneCode(countryCode, region, city, postalCode);
    
    // Calculer la confiance basée sur l'importance et la précision
    const confidence = Math.min(100, Math.max(0, (result.importance || 0) * 100));
    
    return {
      country,
      region,
      city,
      postalCode,
      zoneCode,
      formattedAddress: this.generateConciseAddress(city, region, country, zoneCode),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      confidence
    };
  }

  /**
   * Génère une adresse concise avec seulement : ville, région, pays, code de zone
   */
  private static generateConciseAddress(city: string, region: string, country: string, zoneCode: string): string {
    const parts = [];
    
    // Ajouter la ville
    if (city) {
      parts.push(city);
    }
    
    // Ajouter la région (seulement si différente de la ville)
    if (region && region !== city) {
      parts.push(region);
    }
    
    // Ajouter le pays
    if (country) {
      parts.push(country);
    }
    
    // Ajouter le code de zone
    if (zoneCode) {
      parts.push(`(${zoneCode})`);
    }
    
    return parts.join(', ');
  }

  /**
   * Génère un code de zone basé sur les informations géographiques
   */
  private static generateZoneCode(countryCode: string, region: string, city: string, postalCode: string): string {
    const baseCountryCode = this.COUNTRY_TO_ZONE_MAPPING[countryCode] || countryCode.toUpperCase();
    
    // Pour la France, utiliser les codes de départements
    if (countryCode === 'fr' && postalCode) {
      const departmentCode = postalCode.substring(0, 2);
      
      // Vérifier si le code postal semble correct
      if (this.isValidFrenchPostalCode(departmentCode)) {
        return `FR${departmentCode}`;
      }
    }
    
    // Pour la France sans code postal valide, essayer de deviner par la ville
    if (countryCode === 'fr' && city) {
      const cityDepartmentCode = this.getDepartmentCodeByCity(city);
      if (cityDepartmentCode) {
        return `FR${cityDepartmentCode}`;
      }
    }
    
    // Pour la France sans code postal, essayer de deviner par la région
    if (countryCode === 'fr' && region) {
      for (const [regionName, departments] of Object.entries(this.FRENCH_REGION_TO_DEPARTMENT)) {
        if (region.toLowerCase().includes(regionName.toLowerCase())) {
          return `FR${departments[0]}`;
        }
      }
    }
    
    // Pour les autres pays, utiliser le code pays + ville
    if (city) {
      // Mapping spécial pour certaines villes importantes
      const specialCityMappings: { [key: string]: string } = {
        'barcelona': '09',  // Barcelone → ES09
        'madrid': '13',     // Madrid → ES13
        'valencia': '46',   // Valence → ES46
        'seville': '41',    // Séville → ES41
        'bilbao': '48',     // Bilbao → ES48
        'zaragoza': '50',   // Saragosse → ES50
        'malaga': '29',     // Malaga → ES29
        'murcia': '30',     // Murcie → ES30
        'palma': '07',      // Palma → ES07
        'las palmas': '35', // Las Palmas → ES35
      };
      
      const cityLower = city.toLowerCase();
      if (specialCityMappings[cityLower]) {
        return `${baseCountryCode}${specialCityMappings[cityLower]}`;
      }
      
      // Sinon, utiliser les 3 premières lettres
      const cityCode = city.substring(0, 3).toUpperCase();
      return `${baseCountryCode}${cityCode}`;
    }
    
    return baseCountryCode;
  }

  /**
   * Vérifie si un code postal français semble valide
   */
  private static isValidFrenchPostalCode(departmentCode: string): boolean {
    const validDepartments = [
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
      '11', '12', '13', '14', '15', '16', '17', '18', '19', '2A', '2B',
      '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
      '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
      '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
      '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
      '71', '72', '73', '74', '75', '76', '77', '78', '79', '80',
      '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
      '91', '92', '93', '94', '95', '971', '972', '973', '974', '976'
    ];
    return validDepartments.includes(departmentCode);
  }

  /**
   * Obtient le code département par le nom de la ville
   */
  private static getDepartmentCodeByCity(city: string): string | null {
    const cityToDepartment: { [key: string]: string } = {
      'bordeaux': '33',
      'paris': '75',
      'lyon': '69',
      'marseille': '13',
      'toulouse': '31',
      'nice': '06',
      'nantes': '44',
      'strasbourg': '67',
      'montpellier': '34',
      'lille': '59',
      'rennes': '35',
      'reims': '51',
      'saint-étienne': '42',
      'le havre': '76',
      'toulon': '83',
      'grenoble': '38',
      'dijon': '21',
      'angers': '49',
      'nîmes': '30',
      'villeurbanne': '69',
      'saint-denis': '93',
      'le mans': '72',
      'aix-en-provence': '13',
      'clermont-ferrand': '63',
      'brest': '29',
      'tours': '37',
      'limoges': '87',
      'amiens': '80',
      'annecy': '74',
      'perpignan': '66',
      'boulogne-billancourt': '92',
      'orléans': '45',
      'mulhouse': '68',
      'rouen': '76',
      'caen': '14',
      'nancy': '54',
      'saint-pierre': '974',
      'argenteuil': '95',
      'roubaix': '59',
      'tourcoing': '59',
      'nantes': '44',
      'montreuil': '93',
      'avignon': '84',
      'nanterre': '92',
      'créteil': '94',
      'dunkerque': '59',
      'poitiers': '86',
      'asnières-sur-seine': '92',
      'versailles': '78',
      'courbevoie': '92',
      'vitry-sur-seine': '94',
      'colombes': '92',
      'aulnay-sous-bois': '93',
      'la rochelle': '17',
      'champigny-sur-marne': '94',
      'rueil-malmaison': '92',
      'boulogne-sur-mer': '62',
      'pessac': '33',
      'saint-maur-des-fossés': '94',
      'calais': '62',
      'issy-les-moulineaux': '92',
      'lévigné': '59',
      'noisy-le-grand': '93',
      'sevran': '93',
      'cergy': '95',
      'pantin': '93',
      'levallois-perret': '92',
      'troyes': '10',
      'antoine': '92',
      'neuilly-sur-seine': '92',
      'clichy': '92',
      'pierrefitte-sur-seine': '93',
      'châlons-en-champagne': '51',
      'saint-ouen': '93',
      'corbeil-essonnes': '91',
      'bayonne': '64',
      'bourges': '18',
      'cannes': '06',
      'colmar': '68',
      'digne-les-bains': '04',
      'draguignan': '83',
      'évreux': '27',
      'foix': '09',
      'gap': '05',
      'lons-le-saunier': '39',
      'mâcon': '71',
      'mende': '48',
      'nevers': '58',
      'pau': '64',
      'privas': '07',
      'saint-brieuc': '22',
      'tarbes': '65',
      'tulle': '19',
      'vesoul': '70'
    };
    
    const normalizedCity = city.toLowerCase().trim();
    return cityToDepartment[normalizedCity] || null;
  }

  /**
   * Obtient des suggestions d'adresses en temps réel
   */
  static async getSuggestions(input: string): Promise<GeocodingResult[]> {
    if (!input || input.length < 3) {
      return [];
    }

    try {
      const results = await this.searchAddress(input);
      const uniqueResults = this.removeDuplicateSuggestions(results);
      return uniqueResults.map(result => this.convertNominatimToGeocodingResult(result));
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      return [];
    }
  }

  /**
   * Supprime les suggestions en double basées sur la ville et le pays
   */
  private static removeDuplicateSuggestions(results: NominatimResult[]): NominatimResult[] {
    const seen = new Set<string>();
    const uniqueResults: NominatimResult[] = [];

    for (const result of results) {
      const address = result.address || {};
      const city = address.city || address.town || address.village || '';
      const country = address.country || '';
      const key = `${city}-${country}`.toLowerCase();

      if (!seen.has(key) && city && country) {
        seen.add(key);
        uniqueResults.push(result);
      }
    }

    return uniqueResults.slice(0, 5); // Limiter à 5 suggestions uniques
  }

  /**
   * Géocode inversé : coordonnées -> adresse
   */
  static async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'fr,en'
      });

      const response = await fetch(`${this.REVERSE_GEOCODE_URL}?${params}`, {
        headers: {
          'User-Agent': 'TransportHub/1.0 (Transport Management System)'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API Nominatim: ${response.status}`);
      }

      const result: NominatimResult = await response.json();
      return this.convertNominatimToGeocodingResult(result);
    } catch (error) {
      console.error('Erreur lors du géocodage inversé:', error);
      return this.getDefaultResult();
    }
  }

  /**
   * Valide si une adresse est complète et fiable
   */
  static isCompleteAddress(result: GeocodingResult): boolean {
    return !!(result.country && result.city && result.confidence > 30);
  }

  /**
   * Retourne un résultat par défaut
   */
  private static getDefaultResult(): GeocodingResult {
    return {
      country: '',
      region: '',
      city: '',
      postalCode: '',
      zoneCode: '',
      formattedAddress: '',
      confidence: 0
    };
  }

  /**
   * Formate l'adresse pour l'affichage
   */
  static formatAddressForDisplay(result: GeocodingResult): string {
    const parts = [];
    
    if (result.city) parts.push(result.city);
    if (result.postalCode) parts.push(result.postalCode);
    if (result.region) parts.push(result.region);
    if (result.country) parts.push(result.country);
    
    return parts.join(', ');
  }

  /**
   * Obtient le niveau de confiance sous forme de texte
   */
  static getConfidenceLevel(confidence: number): string {
    if (confidence >= 80) return 'Très élevée';
    if (confidence >= 60) return 'Élevée';
    if (confidence >= 40) return 'Moyenne';
    if (confidence >= 20) return 'Faible';
    return 'Très faible';
  }

  /**
   * Obtient la couleur du niveau de confiance
   */
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-blue-600';
    if (confidence >= 40) return 'text-yellow-600';
    if (confidence >= 20) return 'text-orange-600';
    return 'text-red-600';
  }
}

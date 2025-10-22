// Service pour gérer les données des transporteurs depuis le fichier Excel
export interface TransporterData {
  id: string;
  nom: string;
  zoneDepart: string;
  zoneArrivee: string;
  typeVehicule: string;
  capacite: number;
  note: number;
  derniereMission: string;
  statut: 'disponible' | 'occupe' | 'indisponible';
  contact: {
    nom: string;
    telephone: string;
    email: string;
  };
  specialites: string[];
  tarif: number;
  distance: number;
}

export interface SearchCriteria {
  depart: string;
  arrivee: string;
  typeVehicule: string;
  quantite?: number;
}

export class TransporterService {
  private static transporters: TransporterData[] = [];

  /**
   * Charge les données depuis le fichier JSON généré depuis Excel
   */
  static async loadTransporters(): Promise<void> {
    try {
      const response = await fetch('/src/data/zones-de-fret-complet.json');
      const data = await response.json();
      
      // Convertir les données Excel en format TransporterData
      this.transporters = data.map((item: any, index: number) => ({
        id: `transporter-${index + 1}`,
        nom: item['Transporteur'] || `Transporteur ${index + 1}`,
        zoneDepart: item['Départ'] || '',
        zoneArrivee: item['Arrivée'] || '',
        typeVehicule: item['Type véhicule'] || 'Benne',
        capacite: this.estimateCapacity(item['Type véhicule']),
        note: this.calculateNote(item),
        derniereMission: this.formatDate(item['Date']),
        statut: this.determineStatus(item),
        contact: {
          nom: `Contact ${item['Transporteur']}`,
          telephone: this.generatePhone(),
          email: this.generateEmail(item['Transporteur'])
        },
        specialites: this.generateSpecialites(item['Type véhicule']),
        tarif: this.estimateTarif(item['Type véhicule']),
        distance: this.calculateDistance(item['Départ'], item['Arrivée'])
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des transporteurs:', error);
      // Données de fallback
      this.transporters = this.getFallbackData();
    }
  }

  /**
   * Recherche les transporteurs correspondants aux critères
   */
  static searchTransporters(criteria: SearchCriteria): TransporterData[] {
    if (this.transporters.length === 0) {
      this.loadTransporters();
    }

    const { depart, arrivee, typeVehicule } = criteria;
    const allMatches: TransporterData[] = [];

    // 1. CORRESPONDANCE EXACTE : FR33 → ES09
    const exactMatches = this.transporters.filter(transporter => {
      const departMatch = this.matchZone(transporter.zoneDepart, depart);
      const arriveeMatch = this.matchZone(transporter.zoneArrivee, arrivee);
      const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
      
      return departMatch && arriveeMatch && vehiculeMatch;
    });
    
    console.log(`🔍 Recherche exacte ${depart} → ${arrivee} (${typeVehicule}):`, exactMatches.length, 'résultats');
    console.log('📊 Critères reçus:', { depart, arrivee, typeVehicule });
    allMatches.push(...exactMatches);

    // 2. FRXX → ES09 (pays départ → destination exacte)
    const departCountry = this.extractCountryCode(depart);
    if (departCountry) {
      const countryToExactMatches = this.transporters.filter(transporter => {
        const departMatch = transporter.zoneDepart === `${departCountry}XX`;
        const arriveeMatch = this.matchZone(transporter.zoneArrivee, arrivee);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        return departMatch && arriveeMatch && vehiculeMatch;
      });
      
      if (countryToExactMatches.length > 0) {
        // Prendre le plus récent
        const sorted = countryToExactMatches.sort((a, b) => {
          const dateA = this.parseDateFromString(a.derniereMission);
          const dateB = this.parseDateFromString(b.derniereMission);
          if (dateA && dateB) return dateB.getTime() - dateA.getTime();
          return 0;
        });
        allMatches.push(sorted[0]);
      }
    }

    // 3. FR33 → ESXX (départ exact → pays arrivée)
    const arriveeCountry = this.extractCountryCode(arrivee);
    if (arriveeCountry) {
      const exactToCountryMatches = this.transporters.filter(transporter => {
        const departMatch = this.matchZone(transporter.zoneDepart, depart);
        const arriveeMatch = transporter.zoneArrivee === `${arriveeCountry}XX`;
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        return departMatch && arriveeMatch && vehiculeMatch;
      });
      
      if (exactToCountryMatches.length > 0) {
        // Prendre le plus récent
        const sorted = exactToCountryMatches.sort((a, b) => {
          const dateA = this.parseDateFromString(a.derniereMission);
          const dateB = this.parseDateFromString(b.derniereMission);
          if (dateA && dateB) return dateB.getTime() - dateA.getTime();
          return 0;
        });
        allMatches.push(sorted[0]);
      }
    }

    // Retourner tous les résultats
    return this.rankTransporters(allMatches, criteria);
  }

  /**
   * Trouve des exemples génériques du même pays (le plus récent de chaque type)
   * Exemple : Bordeaux → Avignon → trouve FRXX → FR84 ET FR33 → FRXX (le plus récent de chaque)
   */
  private static findGenericSameCountryMatch(criteria: SearchCriteria): TransporterData[] {
    const { depart, arrivee, typeVehicule } = criteria;
    
    const departCountry = this.extractCountryCode(depart);
    const arriveeCountry = this.extractCountryCode(arrivee);
    
    // Si même pays (ex: FR33 → FR84)
    if (departCountry && arriveeCountry && departCountry === arriveeCountry) {
      const matches: TransporterData[] = [];
      
      // 1. Chercher FRXX → FR84 (FRXX littéral vers Avignon)
      const genericArriveeMatches = this.transporters.filter(transporter => {
        const departMatch = transporter.zoneDepart === 'FRXX';
        const arriveeMatch = this.matchZone(transporter.zoneArrivee, arrivee);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        // Exclure les correspondances exactes déjà trouvées
        const isExactMatch = this.matchZone(transporter.zoneDepart, depart) && 
                             this.matchZone(transporter.zoneArrivee, arrivee);
        
        return departMatch && arriveeMatch && vehiculeMatch && !isExactMatch;
      });
      
      // 2. Chercher FR33 → FRXX (Bordeaux vers FRXX littéral)
      const genericDepartMatches = this.transporters.filter(transporter => {
        const departMatch = this.matchZone(transporter.zoneDepart, depart);
        const arriveeMatch = transporter.zoneArrivee === 'FRXX';
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        // Exclure les correspondances exactes déjà trouvées
        const isExactMatch = this.matchZone(transporter.zoneDepart, depart) && 
                             this.matchZone(transporter.zoneArrivee, arrivee);
        
        return departMatch && arriveeMatch && vehiculeMatch && !isExactMatch;
      });
      
      // Prendre le plus récent de chaque type
      let bestArriveeMatch: TransporterData | null = null;
      let bestDepartMatch: TransporterData | null = null;
      
      if (genericArriveeMatches.length > 0) {
        // Trier par date et prendre le plus récent FRXX → FR84
        const sortedArrivee = genericArriveeMatches.sort((a, b) => {
          const dateA = this.parseDateFromString(a.derniereMission);
          const dateB = this.parseDateFromString(b.derniereMission);
          
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        bestArriveeMatch = sortedArrivee[0];
      }
      
      if (genericDepartMatches.length > 0) {
        // Trier par date et prendre le plus récent FR33 → FRXX
        const sortedDepart = genericDepartMatches.sort((a, b) => {
          const dateA = this.parseDateFromString(a.derniereMission);
          const dateB = this.parseDateFromString(b.derniereMission);
          
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        bestDepartMatch = sortedDepart[0];
      }
      
      // Ajouter les deux meilleurs matches
      if (bestArriveeMatch) matches.push(bestArriveeMatch);
      if (bestDepartMatch) matches.push(bestDepartMatch);
      
      if (matches.length > 0) {
        return matches; // Retourner les deux (ou un seul si l'autre n'existe pas)
      }
    }
    
    return [];
  }

  /**
   * Recherche élargie : trouve seulement 3 variantes de trajets
   * Exemple : Bordeaux → Madrid → cherche 1 FRXX → ES13, 1 FR33 → ESXX, 1 FRXX → ESXX
   */
  private static findExpandedMatches(criteria: SearchCriteria): TransporterData[] {
    const { depart, arrivee, typeVehicule } = criteria;
    const matches: TransporterData[] = [];

    const departCountry = this.extractCountryCode(depart);
    const arriveeCountry = this.extractCountryCode(arrivee);
    
    if (departCountry && arriveeCountry) {
      // 1. Chercher UN transporteur FRXX → ES09 (FRXX vers destination exacte)
      const genericDepartMatches = this.transporters.filter(transporter => {
        const departMatch = transporter.zoneDepart === 'FRXX' && 
                           this.matchZone(transporter.zoneArrivee, arrivee);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        return departMatch && vehiculeMatch;
      });
      
      if (genericDepartMatches.length > 0) {
        // Si "Tous" est sélectionné, prendre tous les transporteurs, sinon seulement le premier
        if (typeVehicule.toLowerCase() === 'tous') {
          matches.push(...genericDepartMatches);
        } else {
          matches.push(genericDepartMatches[0]);
        }
      }

      // 2. Chercher des transporteurs FR33 → ESXX (départ exact vers ESXX)
      // Mais privilégier les destinations proches de la recherche
      const genericArriveeMatches = this.transporters.filter(transporter => {
        const arriveeMatch = transporter.zoneArrivee.startsWith(arriveeCountry) && 
                             this.matchZone(transporter.zoneDepart, depart);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        return arriveeMatch && vehiculeMatch;
      });
      
      if (genericArriveeMatches.length > 0) {
        // Si "Tous" est sélectionné, prendre tous les transporteurs mais les trier par pertinence
        if (typeVehicule.toLowerCase() === 'tous') {
          // Trier par pertinence : destinations exactes d'abord, puis par date
          const sortedMatches = genericArriveeMatches.sort((a, b) => {
            // Priorité aux destinations exactes
            const aExact = this.matchZone(a.zoneArrivee, arrivee);
            const bExact = this.matchZone(b.zoneArrivee, arrivee);
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Si même niveau de correspondance, trier par date
            const dateA = this.parseDateFromString(a.derniereMission);
            const dateB = this.parseDateFromString(b.derniereMission);
            
            if (dateA && dateB) {
              return dateB.getTime() - dateA.getTime();
            }
            
            return 0;
          });
          
          // Limiter à 10 résultats pour éviter la surcharge
          matches.push(...sortedMatches.slice(0, 10));
        } else {
          matches.push(genericArriveeMatches[0]);
        }
      }
    }

    return matches;
  }

  /**
   * Extrait le code pays d'une zone (ex: FR33 → FR)
   */
  private static extractCountryCode(zone: string): string | null {
    if (!zone) return null;
    
    // Codes pays européens
    const countryCodes = ['FR', 'ES', 'DE', 'IT', 'BE', 'NL', 'CH', 'AT', 'LU', 'PT', 'UK', 'DK', 'SE', 'FI', 'PL', 'CZ', 'HU', 'RO', 'SI', 'SK', 'LT', 'LV', 'GR'];
    
    for (const code of countryCodes) {
      if (zone.startsWith(code)) {
        return code;
      }
    }
    
    return null;
  }

  /**
   * Vérifie si deux zones sont similaires (même pays ou zones proches)
   */
  private static isSimilarZone(zone1: string, zone2: string): boolean {
    if (!zone1 || !zone2) return false;
    
    // Zones identiques
    if (zone1.toLowerCase() === zone2.toLowerCase()) return true;
    
    // Même pays
    const country1 = this.extractCountryCode(zone1);
    const country2 = this.extractCountryCode(zone2);
    if (country1 && country2 && country1 === country2) return true;
    
    return false;
  }

  /**
   * Vérifie si une zone correspond à la recherche
   */
  private static matchZone(transporterZone: string, searchZone: string): boolean {
    if (!transporterZone || !searchZone) return false;
    
    const transporterZoneLower = transporterZone.toLowerCase();
    const searchZoneLower = searchZone.toLowerCase();
    
    // Correspondance exacte uniquement
    return transporterZoneLower === searchZoneLower;
  }

  /**
   * Vérifie si le type de véhicule correspond
   */
  private static matchVehicleType(transporterType: string, searchType: string): boolean {
    if (!transporterType || !searchType) return true; // Si pas spécifié, accepter
    
    // Si "Tous" est sélectionné, accepter tous les types
    if (searchType.toLowerCase() === 'tous') return true;
    
    const transporterTypeLower = transporterType.toLowerCase();
    const searchTypeLower = searchType.toLowerCase();
    
    return transporterTypeLower === searchTypeLower || 
           transporterTypeLower.includes(searchTypeLower) ||
           searchTypeLower.includes(transporterTypeLower);
  }

  /**
   * Classe les transporteurs par pertinence
   */
  private static rankTransporters(transporters: TransporterData[], criteria: SearchCriteria): TransporterData[] {
    // D'abord trier par score de correspondance et date
    const sortedTransporters = transporters.sort((a, b) => {
      // Score de correspondance exacte
      const scoreA = this.calculateMatchScore(a, criteria);
      const scoreB = this.calculateMatchScore(b, criteria);
      
      // Si même score, trier par date (plus récent en premier)
      if (scoreA === scoreB) {
        const dateA = this.parseDateFromString(a.derniereMission);
        const dateB = this.parseDateFromString(b.derniereMission);
        
        if (dateA && dateB) {
          return dateB.getTime() - dateA.getTime(); // Plus récent en premier
        }
        
        return b.note - a.note;
      }
      
      return scoreB - scoreA;
    });
    
    // Ensuite appliquer le système de score décroissant basé sur la position
    return this.applyPositionScore(sortedTransporters);
  }

  /**
   * Applique un score décroissant basé sur la position dans la liste
   */
  private static applyPositionScore(transporters: TransporterData[]): TransporterData[] {
    return transporters.map((transporter, index) => {
      let positionScore: number;
      
      if (index === 0) {
        positionScore = 9.0; // Top 1
      } else if (index === 1) {
        positionScore = 8.0; // Top 2
      } else if (index === 2) {
        positionScore = 7.6; // Top 3
      } else if (index < 10) {
        // Top 4-10 : décroissance de 7.0 à 6.0
        positionScore = 7.0 - (index - 3) * 0.15;
      } else {
        // Reste : décroissance de 5.5 à 3.0
        positionScore = Math.max(3.0, 5.5 - (index - 10) * 0.2);
      }
      
      return {
        ...transporter,
        note: positionScore
      };
    });
  }

  /**
   * Parse une date depuis une chaîne de caractères (format DD/MM/YYYY)
   */
  private static parseDateFromString(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      // Si c'est déjà au format DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      
      // Si c'est un texte comme "Il y a 5 jours", "Aujourd'hui", etc.
      const now = new Date();
      
      if (dateString.includes('Aujourd\'hui')) {
        return now;
      }
      
      if (dateString.includes('Hier')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }
      
      if (dateString.includes('Il y a')) {
        const match = dateString.match(/Il y a (\d+) jour/);
        if (match) {
          const days = parseInt(match[1]);
          const pastDate = new Date(now);
          pastDate.setDate(pastDate.getDate() - days);
          return pastDate;
        }
        
        const weekMatch = dateString.match(/Il y a (\d+) semaine/);
        if (weekMatch) {
          const weeks = parseInt(weekMatch[1]);
          const pastDate = new Date(now);
          pastDate.setDate(pastDate.getDate() - (weeks * 7));
          return pastDate;
        }
        
        const monthMatch = dateString.match(/Il y a (\d+) mois/);
        if (monthMatch) {
          const months = parseInt(monthMatch[1]);
          const pastDate = new Date(now);
          pastDate.setMonth(pastDate.getMonth() - months);
          return pastDate;
        }
        
        const yearMatch = dateString.match(/Il y a (\d+) an/);
        if (yearMatch) {
          const years = parseInt(yearMatch[1]);
          const pastDate = new Date(now);
          pastDate.setFullYear(pastDate.getFullYear() - years);
          return pastDate;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur parsing date:', error, 'Date:', dateString);
      return null;
    }
  }

  /**
   * Calcule le score de correspondance
   */
  private static calculateMatchScore(transporter: TransporterData, criteria: SearchCriteria): number {
    let score = 0;
    
    // Score de base par la note
    score += transporter.note * 10;
    
    // Bonus pour correspondance exacte des zones
    if (transporter.zoneDepart.toLowerCase() === criteria.depart.toLowerCase()) {
      score += 50;
    }
    if (transporter.zoneArrivee.toLowerCase() === criteria.arrivee.toLowerCase()) {
      score += 50;
    }
    
    // Bonus pour correspondance exacte du type de véhicule
    if (transporter.typeVehicule.toLowerCase() === criteria.typeVehicule.toLowerCase()) {
      score += 30;
    }
    
    // Bonus pour statut disponible
    if (transporter.statut === 'disponible') {
      score += 20;
    }
    
    // Malus pour distance (plus c'est loin, moins c'est bon)
    score -= transporter.distance * 0.1;
    
    return score;
  }

  /**
   * Détermine le statut du transporteur
   */
  private static determineStatus(item: any): 'disponible' | 'occupe' | 'indisponible' {
    // Pour l'instant, tous les transporteurs sont disponibles
    // On pourrait ajouter une logique basée sur la date ou d'autres critères
    return 'disponible';
  }

  /**
   * Estime la capacité basée sur le type de véhicule
   */
  private static estimateCapacity(typeVehicule: string): number {
    const type = typeVehicule?.toLowerCase() || '';
    if (type.includes('tautliner') || type.includes('remorque')) return 2;
    if (type.includes('benne') || type.includes('camion')) return 1;
    if (type.includes('plateau')) return 3;
    return 1; // Par défaut
  }

  /**
   * Calcule une note basée sur les données disponibles
   */
  private static calculateNote(item: any): number {
    // Note de base
    let note = 7.0;
    
    // Bonus pour transporteur avec numéro Carlo
    if (item['N° Carlo']) {
      note += 1.0;
    }
    
    // Bonus pour routes populaires
    const depart = item['Départ']?.toLowerCase() || '';
    const arrivee = item['Arrivée']?.toLowerCase() || '';
    if (depart.includes('fr') && arrivee.includes('es')) {
      note += 0.5; // Route France-Espagne populaire
    }
    
    // Limiter entre 5 et 10
    return Math.min(10, Math.max(5, note));
  }

  /**
   * Formate la date au format DD/MM/YYYY en texte lisible
   */
  private static formatDate(dateString: string): string {
    if (!dateString) return 'Il y a 15 jours';
    
    try {
      // Parser la date au format DD/MM/YYYY
      const [day, month, year] = dateString.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Il y a 15 jours';
      }
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Aujourd\'hui';
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
      if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
      return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Erreur conversion date:', error, 'Date:', dateString);
      return 'Il y a 15 jours';
    }
  }

  /**
   * Génère un numéro de téléphone
   */
  private static generatePhone(): string {
    const prefixes = ['01', '02', '03', '04', '05', '06', '07'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 90000000) + 10000000;
    return `${prefix} ${number.toString().slice(0, 2)} ${number.toString().slice(2, 4)} ${number.toString().slice(4, 6)} ${number.toString().slice(6, 8)}`;
  }

  /**
   * Génère un email basé sur le nom du transporteur
   */
  private static generateEmail(nomTransporteur: string): string {
    const cleanName = nomTransporteur?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'transporteur';
    return `contact@${cleanName}.com`;
  }

  /**
   * Génère des spécialités basées sur le type de véhicule
   */
  private static generateSpecialites(typeVehicule: string): string[] {
    const type = typeVehicule?.toLowerCase() || '';
    const specialites = [];
    
    if (type.includes('tautliner')) {
      specialites.push('Transport express', 'Livraison rapide');
    } else if (type.includes('benne')) {
      specialites.push('Transport sécurisé', 'Chargement rapide');
    } else if (type.includes('plateau')) {
      specialites.push('Transport lourd', 'Équipements spéciaux');
    } else {
      specialites.push('Transport général');
    }
    
    return specialites;
  }

  /**
   * Estime le tarif basé sur le type de véhicule
   */
  private static estimateTarif(typeVehicule: string): number {
    const type = typeVehicule?.toLowerCase() || '';
    if (type.includes('tautliner')) return 2000;
    if (type.includes('benne')) return 1500;
    if (type.includes('plateau')) return 2500;
    return 1500; // Par défaut
  }

  /**
   * Calcule la distance approximative entre deux zones
   */
  private static calculateDistance(zoneDepart: string, zoneArrivee: string): number {
    // Vérifier que les paramètres existent
    if (!zoneDepart || !zoneArrivee) {
      return 300; // Distance par défaut
    }
    
    // Distance approximative basée sur les codes de zones
    const distances: { [key: string]: { [key: string]: number } } = {
      'FR33': { 'ES13': 500, 'FR75': 600, 'FR69': 400, 'FR84': 400 },
      'FR75': { 'FR33': 600, 'FR69': 500, 'ES13': 1000, 'FR84': 600 },
      'FR69': { 'FR33': 400, 'FR75': 500, 'IT': 300 },
      'ES13': { 'FR33': 500, 'FR75': 1000, 'ES28': 300 },
      'FR84': { 'FR33': 400, 'FR75': 600, 'ES13': 300 }
    };
    
    const depart = zoneDepart.substring(0, 4);
    const arrivee = zoneArrivee.substring(0, 4);
    
    return distances[depart]?.[arrivee] || 300; // Distance par défaut
  }

  /**
   * Données de fallback si le chargement échoue
   */
  private static getFallbackData(): TransporterData[] {
    return [
      {
        id: 'fallback-1',
        nom: 'TRANSARLE',
        zoneDepart: 'FR33',
        zoneArrivee: 'ES13',
        typeVehicule: 'Benne',
        capacite: 2,
        note: 9.2,
        derniereMission: 'Il y a 12 jours',
        statut: 'disponible',
        contact: {
          nom: 'Jean Dupont',
          telephone: '01 23 45 67 89',
          email: 'contact@transarle.com'
        },
        specialites: ['Transport express', 'Livraison rapide'],
        tarif: 1800,
        distance: 500
      },
      {
        id: 'fallback-2',
        nom: 'CHEVALIER TRANSPORTS',
        zoneDepart: 'FR33',
        zoneArrivee: 'ES13',
        typeVehicule: 'Benne',
        capacite: 1,
        note: 8.8,
        derniereMission: 'Il y a 8 jours',
        statut: 'disponible',
        contact: {
          nom: 'Marie Martin',
          telephone: '01 23 45 67 90',
          email: 'contact@chevalier.com'
        },
        specialites: ['Transport sécurisé'],
        tarif: 1650,
        distance: 500
      }
    ];
  }

  /**
   * Obtient tous les transporteurs
   */
  static getAllTransporters(): TransporterData[] {
    return this.transporters;
  }

  /**
   * Obtient un transporteur par ID
   */
  static getTransporterById(id: string): TransporterData | undefined {
    return this.transporters.find(t => t.id === id);
  }
}

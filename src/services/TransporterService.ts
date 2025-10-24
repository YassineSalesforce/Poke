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
  status?: 'yes' | 'pending' | 'no' | ''; 
  ensemblesTaken?: number; 
  ensemblesPrevisional?: number; 
  comment?: string; 
  refusalCount?: number; 
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


  static async loadTransporters(): Promise<void> {
    try {
      const response = await fetch('/src/data/zones-de-fret-complet.json');
      const data = await response.json();
      
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


  static searchTransporters(criteria: SearchCriteria): TransporterData[] {
    if (this.transporters.length === 0) {
      this.loadTransporters();
    }

    const { depart, arrivee, typeVehicule } = criteria;
    const allMatches: TransporterData[] = [];

    const exactMatches = this.transporters.filter(transporter => {
      const departMatch = this.matchZone(transporter.zoneDepart, depart);
      const arriveeMatch = this.matchZone(transporter.zoneArrivee, arrivee);
      const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
      
      return departMatch && arriveeMatch && vehiculeMatch;
    });
    
    console.log(`🔍 Recherche exacte ${depart} → ${arrivee} (${typeVehicule}):`, exactMatches.length, 'résultats');
    console.log('📊 Critères reçus:', { depart, arrivee, typeVehicule });
    allMatches.push(...exactMatches);

    const departCountry = this.extractCountryCode(depart);
    if (departCountry) {
      const countryToExactMatches = this.transporters.filter(transporter => {
        const departMatch = transporter.zoneDepart === `${departCountry}XX`;
        const arriveeMatch = this.matchZone(transporter.zoneArrivee, arrivee);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        return departMatch && arriveeMatch && vehiculeMatch;
      });
      
      if (countryToExactMatches.length > 0) {
        const sorted = countryToExactMatches.sort((a, b) => {
          const dateA = this.parseDateFromString(a.derniereMission);
          const dateB = this.parseDateFromString(b.derniereMission);
          if (dateA && dateB) return dateB.getTime() - dateA.getTime();
          return 0;
        });
        allMatches.push(sorted[0]);
      }
    }

    const arriveeCountry = this.extractCountryCode(arrivee);
    if (arriveeCountry) {
      const exactToCountryMatches = this.transporters.filter(transporter => {
        const departMatch = this.matchZone(transporter.zoneDepart, depart);
        const arriveeMatch = transporter.zoneArrivee === `${arriveeCountry}XX`;
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        return departMatch && arriveeMatch && vehiculeMatch;
      });
      
      if (exactToCountryMatches.length > 0) {
        const sorted = exactToCountryMatches.sort((a, b) => {
          const dateA = this.parseDateFromString(a.derniereMission);
          const dateB = this.parseDateFromString(b.derniereMission);
          if (dateA && dateB) return dateB.getTime() - dateA.getTime();
          return 0;
        });
        allMatches.push(sorted[0]);
      }
    }

    return this.rankTransporters(allMatches, criteria);
  }


  private static findGenericSameCountryMatch(criteria: SearchCriteria): TransporterData[] {
    const { depart, arrivee, typeVehicule } = criteria;
    
    const departCountry = this.extractCountryCode(depart);
    const arriveeCountry = this.extractCountryCode(arrivee);
    
    if (departCountry && arriveeCountry && departCountry === arriveeCountry) {
      const matches: TransporterData[] = [];
      
      const genericArriveeMatches = this.transporters.filter(transporter => {
        const departMatch = transporter.zoneDepart === 'FRXX';
        const arriveeMatch = this.matchZone(transporter.zoneArrivee, arrivee);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        const isExactMatch = this.matchZone(transporter.zoneDepart, depart) && 
                             this.matchZone(transporter.zoneArrivee, arrivee);
        
        return departMatch && arriveeMatch && vehiculeMatch && !isExactMatch;
      });
      
      const genericDepartMatches = this.transporters.filter(transporter => {
        const departMatch = this.matchZone(transporter.zoneDepart, depart);
        const arriveeMatch = transporter.zoneArrivee === 'FRXX';
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        
        const isExactMatch = this.matchZone(transporter.zoneDepart, depart) && 
                             this.matchZone(transporter.zoneArrivee, arrivee);
        
        return departMatch && arriveeMatch && vehiculeMatch && !isExactMatch;
      });
      
      let bestArriveeMatch: TransporterData | null = null;
      let bestDepartMatch: TransporterData | null = null;
      
      if (genericArriveeMatches.length > 0) {
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
      
      if (bestArriveeMatch) matches.push(bestArriveeMatch);
      if (bestDepartMatch) matches.push(bestDepartMatch);
      
      if (matches.length > 0) {
        return matches; 
      }
    }
    
    return [];
  }


  private static findExpandedMatches(criteria: SearchCriteria): TransporterData[] {
    const { depart, arrivee, typeVehicule } = criteria;
    const matches: TransporterData[] = [];

    const departCountry = this.extractCountryCode(depart);
    const arriveeCountry = this.extractCountryCode(arrivee);
    
    if (departCountry && arriveeCountry) {
      const genericDepartMatches = this.transporters.filter(transporter => {
        const departMatch = transporter.zoneDepart === 'FRXX' && 
                           this.matchZone(transporter.zoneArrivee, arrivee);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        return departMatch && vehiculeMatch;
      });
      
      if (genericDepartMatches.length > 0) {
        if (typeVehicule.toLowerCase() === 'tous') {
          matches.push(...genericDepartMatches);
        } else {
          matches.push(genericDepartMatches[0]);
        }
      }

      const genericArriveeMatches = this.transporters.filter(transporter => {
        const arriveeMatch = transporter.zoneArrivee.startsWith(arriveeCountry) && 
                             this.matchZone(transporter.zoneDepart, depart);
        const vehiculeMatch = this.matchVehicleType(transporter.typeVehicule, typeVehicule);
        return arriveeMatch && vehiculeMatch;
      });
      
      if (genericArriveeMatches.length > 0) {
        if (typeVehicule.toLowerCase() === 'tous') {
          const sortedMatches = genericArriveeMatches.sort((a, b) => {
            const aExact = this.matchZone(a.zoneArrivee, arrivee);
            const bExact = this.matchZone(b.zoneArrivee, arrivee);
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            const dateA = this.parseDateFromString(a.derniereMission);
            const dateB = this.parseDateFromString(b.derniereMission);
            
            if (dateA && dateB) {
              return dateB.getTime() - dateA.getTime();
            }
            
            return 0;
          });
          
          matches.push(...sortedMatches.slice(0, 10));
        } else {
          matches.push(genericArriveeMatches[0]);
        }
      }
    }

    return matches;
  }


  private static extractCountryCode(zone: string): string | null {
    if (!zone) return null;
    
    const countryCodes = ['FR', 'ES', 'DE', 'IT', 'BE', 'NL', 'CH', 'AT', 'LU', 'PT', 'UK', 'DK', 'SE', 'FI', 'PL', 'CZ', 'HU', 'RO', 'SI', 'SK', 'LT', 'LV', 'GR'];
    
    for (const code of countryCodes) {
      if (zone.startsWith(code)) {
        return code;
      }
    }
    
    return null;
  }

  
  private static isSimilarZone(zone1: string, zone2: string): boolean {
    if (!zone1 || !zone2) return false;
    
    if (zone1.toLowerCase() === zone2.toLowerCase()) return true;
    
    const country1 = this.extractCountryCode(zone1);
    const country2 = this.extractCountryCode(zone2);
    if (country1 && country2 && country1 === country2) return true;
    
    return false;
  }

 
  private static matchZone(transporterZone: string, searchZone: string): boolean {
    if (!transporterZone || !searchZone) return false;
    
    const transporterZoneLower = transporterZone.toLowerCase();
    const searchZoneLower = searchZone.toLowerCase();
    
    return transporterZoneLower === searchZoneLower;
  }

  
  private static matchVehicleType(transporterType: string, searchType: string): boolean {
    if (!transporterType || !searchType) return true; 
    
    if (searchType.toLowerCase() === 'tous') return true;
    
    const transporterTypeLower = transporterType.toLowerCase();
    const searchTypeLower = searchType.toLowerCase();
    
    return transporterTypeLower === searchTypeLower || 
           transporterTypeLower.includes(searchTypeLower) ||
           searchTypeLower.includes(transporterTypeLower);
  }

 
  private static rankTransporters(transporters: TransporterData[], criteria: SearchCriteria): TransporterData[] {
    const sortedTransporters = transporters.sort((a, b) => {
      const scoreA = this.calculateMatchScore(a, criteria);
      const scoreB = this.calculateMatchScore(b, criteria);
      
      if (scoreA === scoreB) {
        const dateA = this.parseDateFromString(a.derniereMission);
        const dateB = this.parseDateFromString(b.derniereMission);
        
        if (dateA && dateB) {
          return dateB.getTime() - dateA.getTime(); 
        }
        
        return b.note - a.note;
      }
      
      return scoreB - scoreA;
    });
    
    return this.applyPositionScore(sortedTransporters);
  }

  
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

  
  private static parseDateFromString(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      
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


  private static calculateMatchScore(transporter: TransporterData, criteria: SearchCriteria): number {
    let score = 0;
    
    score += transporter.note * 10;
    
    if (transporter.zoneDepart.toLowerCase() === criteria.depart.toLowerCase()) {
      score += 50;
    }
    if (transporter.zoneArrivee.toLowerCase() === criteria.arrivee.toLowerCase()) {
      score += 50;
    }
    
    if (transporter.typeVehicule.toLowerCase() === criteria.typeVehicule.toLowerCase()) {
      score += 30;
    }
    
    if (transporter.statut === 'disponible') {
      score += 20;
    }
    
    score -= transporter.distance * 0.1;
    
    return score;
  }

 
  private static determineStatus(item: any): 'disponible' | 'occupe' | 'indisponible' {
    return 'disponible';
  }

 
  private static estimateCapacity(typeVehicule: string): number {
    const type = typeVehicule?.toLowerCase() || '';
    if (type.includes('tautliner') || type.includes('remorque')) return 2;
    if (type.includes('benne') || type.includes('camion')) return 1;
    if (type.includes('plateau')) return 3;
    return 1; // Par défaut
  }


  private static calculateNote(item: any): number {
    let note = 7.0;
    
    if (item['N° Carlo']) {
      note += 1.0;
    }
    
    const depart = item['Départ']?.toLowerCase() || '';
    const arrivee = item['Arrivée']?.toLowerCase() || '';
    if (depart.includes('fr') && arrivee.includes('es')) {
      note += 0.5; 
    }
    
    return Math.min(10, Math.max(5, note));
  }

 
  private static formatDate(dateString: string): string {
    if (!dateString) return 'Il y a 15 jours';
    
    try {
      const [day, month, year] = dateString.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
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

 
  private static generatePhone(): string {
    const prefixes = ['01', '02', '03', '04', '05', '06', '07'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 90000000) + 10000000;
    return `${prefix} ${number.toString().slice(0, 2)} ${number.toString().slice(2, 4)} ${number.toString().slice(4, 6)} ${number.toString().slice(6, 8)}`;
  }

  
  private static generateEmail(nomTransporteur: string): string {
    const cleanName = nomTransporteur?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'transporteur';
    return `contact@${cleanName}.com`;
  }

 
  private static generateSpecialites(typeVehicule: string): string[] {
    const type = typeVehicule?.toLowerCase() || '';
    
    if (type.includes('tautliner')) {
      return ['Transport express', 'Livraison rapide'];
    } else if (type.includes('benne')) {
      return ['Transport sécurisé', 'Chargement rapide'];
    } else if (type.includes('plateau')) {
      return ['Transport lourd', 'Équipements spéciaux'];
    } else {
      return ['Transport général'];
    }
  }


  private static estimateTarif(typeVehicule: string): number {
    const type = typeVehicule?.toLowerCase() || '';
    if (type.includes('tautliner')) return 2000;
    if (type.includes('benne')) return 1500;
    if (type.includes('plateau')) return 2500;
    return 1500; // Par défaut
  }

 
  private static calculateDistance(zoneDepart: string, zoneArrivee: string): number {
    if (!zoneDepart || !zoneArrivee) {
      return 300; // Distance par défaut
    }
    
    const distances: { [key: string]: { [key: string]: number } } = {
      'FR33': { 'ES13': 500, 'FR75': 600, 'FR69': 400, 'FR84': 400 },
      'FR75': { 'FR33': 600, 'FR69': 500, 'ES13': 1000, 'FR84': 600 },
      'FR69': { 'FR33': 400, 'FR75': 500, 'IT': 300 },
      'ES13': { 'FR33': 500, 'FR75': 1000, 'ES28': 300 },
      'FR84': { 'FR33': 400, 'FR75': 600, 'ES13': 300 }
    };
    
    const depart = zoneDepart.substring(0, 4);
    const arrivee = zoneArrivee.substring(0, 4);
    
    return distances[depart]?.[arrivee] || 300; 
  }


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

 
  static getAllTransporters(): TransporterData[] {
    return this.transporters;
  }

 
  static getTransporterById(id: string): TransporterData | undefined {
    return this.transporters.find(t => t.id === id);
  }
}

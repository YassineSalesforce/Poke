export interface MissionData {
  organisation: string;
  dateChargement: string;
  transporteur: string;
  permanent: string;
  activite: string;
  vehicule: string;
  paysChargement: string;
  departementChargement: string;
  regionChargement: string;
  cpChargement: string;
  villeChargement: string;
  dateLivraison: string;
  partenaireLivraison: string;
  paysLivraison: string;
  regionLivraison: string;
  departementLivraison: string;
  cpLivraison: string;
  villeLivraison: string;
  km: number;
  tonnes: number;
  idLivraison: string;
}

export interface AlternativeTransporter {
  organisation: string;
  depart: string;
  arrivee: string;
  departCode: string;
  arriveeCode: string;
  paysDepart: string;
  paysArrivee: string;
  nombreMissions: number;
  confiance: number;
  dernierMission: string;
  status?: 'yes' | 'pending' | 'no' | '';
  ensemblesTaken?: number;
  ensemblesPrevisional?: number;
  comment?: string;
}

export class MissionService {
  private static missions: MissionData[] = [];

  /**
   * Charge les missions depuis le fichier JSON
   */
  static async loadMissions(): Promise<void> {
    try {
      const response = await fetch('/src/data/liste-mission-transport.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const missionsData = await response.json();
      this.missions = missionsData.map((mission: any) => ({
        organisation: mission['Transporteur'] || '',
        dateChargement: mission['Date de chargement'] || '',
        transporteur: mission['Transporteur'] || '',
        permanent: mission['Permanent'] || '',
        activite: mission['Activité'] || '',
        vehicule: mission['Vehicule'] || '',
        paysChargement: mission['Pays chargement'] || '',
        departementChargement: mission['Département Chargement'] || '',
        regionChargement: mission['Région chargement'] || '',
        cpChargement: mission['CP chargement'] || '',
        villeChargement: mission['Ville chargement'] || '',
        dateLivraison: mission['Date de livraison'] || '',
        partenaireLivraison: mission['Partenaire livraison'] || '',
        paysLivraison: mission['Pays livraison'] || '',
        regionLivraison: mission['Région livraison'] || '',
        departementLivraison: mission['Département livraison'] || '',
        cpLivraison: mission['CP livraison'] || '',
        villeLivraison: mission['Ville livraison'] || '',
        km: parseFloat(mission['Km(E)']) || 0,
        tonnes: parseFloat(mission['Tonnes(E)']) || 0,
        idLivraison: mission['ID Livraison'] || ''
      }));
      
      console.log(`📊 ${this.missions.length} missions chargées`);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      this.missions = [];
    }
  }

  /**
   * Recherche des transporteurs alternatifs basés sur les missions
   */
  static async findAlternativeTransporters(departCode: string, arriveeCode: string): Promise<AlternativeTransporter[]> {
    if (this.missions.length === 0) {
      await this.loadMissions();
    }

    const departCountry = this.extractCountryCode(departCode);
    const departDepartment = this.extractDepartmentCode(departCode);
    const arriveeCountry = this.extractCountryCode(arriveeCode);
    const arriveeDepartment = this.extractDepartmentCode(arriveeCode);

    console.log(`🔍 Recherche alternatives: ${departCode} (${departCountry}${departDepartment}) → ${arriveeCode} (${arriveeCountry}${arriveeDepartment})`);
    console.log(`📊 Total missions chargées: ${this.missions.length}`);

    // Filtrer les missions correspondantes
    const matchingMissions = this.missions.filter(mission => {
      const departMatch = mission.paysChargement === departCountry && 
                         mission.departementChargement.toString() === departDepartment;
      const arriveeMatch = mission.paysLivraison === arriveeCountry && 
                          mission.departementLivraison.toString() === arriveeDepartment;
      
      return departMatch && arriveeMatch;
    });

    console.log(`📋 ${matchingMissions.length} missions trouvées`);
    
    // Debug: afficher quelques exemples de missions
    if (matchingMissions.length > 0) {
      console.log('📝 Exemples de missions trouvées:', matchingMissions.slice(0, 3));
    } else {
      console.log('❌ Aucune mission trouvée. Vérification des critères...');
      console.log(`Départ recherché: ${departCountry} + ${departDepartment}`);
      console.log(`Arrivée recherchée: ${arriveeCountry} + ${arriveeDepartment}`);
      
      // Vérifier ce qui existe dans les données
      const sampleMissions = this.missions.slice(0, 5);
      console.log('📋 Exemples de missions dans les données:', sampleMissions.map(m => ({
        paysChargement: m.paysChargement,
        departementChargement: m.departementChargement,
        paysLivraison: m.paysLivraison,
        departementLivraison: m.departementLivraison
      })));
    }

    // Grouper par organisation et calculer les statistiques
    const organisationStats = new Map<string, {
      missions: MissionData[];
      nombreMissions: number;
      dernierMission: string;
      confiance: number;
    }>();

    matchingMissions.forEach(mission => {
      const org = mission.organisation;
      if (!organisationStats.has(org)) {
        organisationStats.set(org, {
          missions: [],
          nombreMissions: 0,
          dernierMission: '',
          confiance: 0
        });
      }

      const stats = organisationStats.get(org)!;
      stats.missions.push(mission);
      stats.nombreMissions++;

      // Garder la date la plus récente
      if (!stats.dernierMission || mission.dateChargement > stats.dernierMission) {
        stats.dernierMission = mission.dateChargement;
      }
    });

    // Calculer la confiance basée sur le nombre de missions
    organisationStats.forEach((stats, org) => {
      // Confiance basée sur le nombre de missions (plus de missions = plus de confiance)
      if (stats.nombreMissions >= 10) {
        stats.confiance = 90 + Math.min(10, stats.nombreMissions - 10);
      } else if (stats.nombreMissions >= 5) {
        stats.confiance = 70 + (stats.nombreMissions - 5) * 4;
      } else if (stats.nombreMissions >= 2) {
        stats.confiance = 50 + (stats.nombreMissions - 2) * 6.67;
      } else {
        stats.confiance = 30;
      }
    });

    // Convertir en AlternativeTransporter et trier par confiance
    const alternatives: AlternativeTransporter[] = Array.from(organisationStats.entries()).map(([org, stats]) => {
      const firstMission = stats.missions[0];
      return {
        organisation: org,
        depart: `${firstMission.villeChargement} (${firstMission.departementChargement})`,
        arrivee: `${firstMission.villeLivraison} (${firstMission.departementLivraison})`,
        departCode: `${firstMission.paysChargement}${firstMission.departementChargement}`,
        arriveeCode: `${firstMission.paysLivraison}${firstMission.departementLivraison}`,
        paysDepart: firstMission.paysChargement,
        paysArrivee: firstMission.paysLivraison,
        nombreMissions: stats.nombreMissions,
        confiance: Math.min(100, stats.confiance),
        dernierMission: stats.dernierMission
      };
    });

    // Trier par confiance décroissante
    return alternatives.sort((a, b) => b.confiance - a.confiance);
  }

  /**
   * Extrait le code pays d'une zone (ex: FR33 → FR)
   */
  private static extractCountryCode(zoneCode: string): string {
    if (!zoneCode) return '';
    
    // Corriger les codes de pays pour correspondre aux données Excel
    if (zoneCode.startsWith('FR')) return 'F'; // France = "F"
    if (zoneCode.startsWith('ES')) return 'E'; // Espagne = "E"
    if (zoneCode.startsWith('DE')) return 'D'; // Allemagne = "D"
    if (zoneCode.startsWith('IT')) return 'I'; // Italie = "I"
    if (zoneCode.startsWith('BE')) return 'B'; // Belgique = "B"
    if (zoneCode.startsWith('AT')) return 'A'; // Autriche = "A"
    if (zoneCode.startsWith('HU')) return 'H'; // Hongrie = "H"
    if (zoneCode.startsWith('LU')) return 'L'; // Luxembourg = "L"
    if (zoneCode.startsWith('PT')) return 'P'; // Portugal = "P"
    if (zoneCode.startsWith('SE')) return 'S'; // Suède = "S"
    
    // Pour les autres pays
    const match = zoneCode.match(/^([A-Z]{2})/);
    return match ? match[1] : zoneCode.substring(0, 2);
  }

  /**
   * Extrait le code département d'une zone (ex: FR33 → 33)
   */
  private static extractDepartmentCode(zoneCode: string): string {
    if (!zoneCode) return '';
    
    // Pour les codes français (FR33, FR84, etc.)
    if (zoneCode.startsWith('FR')) {
      return zoneCode.substring(2);
    }
    
    // Pour les autres pays, retourner le reste du code
    return zoneCode.substring(2);
  }
}

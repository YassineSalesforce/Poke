export interface UserSearch {
  _id: string;
  userId: string;
  depart: string;
  arrivee: string;
  departAdresse: string;
  arriveeAdresse: string;
  typeVehicule: string;
  quantite: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchWithStatus extends UserSearch {
  status: 'completed' | 'in-progress' | 'pending';
  progressPercentage: number;
  confirmedVolume: number;
  pendingVolume: number;
  remainingVolume: number;
}

export class UserSearchHistoryService {
  private static readonly API_BASE = 'http://localhost:5001/api';

  static async getUserSearches(userId: string): Promise<UserSearch[]> {
    try {
      // Demander toutes les recherches sans limite
      const response = await fetch(`${this.API_BASE}/user-searches/${userId}?limit=1000`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des recherches:', error);
      return [];
    }
  }

  static async getSearchWithStatus(search: UserSearch): Promise<SearchWithStatus | null> {
    try {
      // Récupérer les contacts liés à cette recherche
      const contactsResponse = await fetch(`${this.API_BASE}/transporter-contacts/${search._id}`);
      if (!contactsResponse.ok) {
        // Si pas de contacts, retourner la recherche avec statut par défaut
        return {
          ...search,
          status: 'pending',
          progressPercentage: 0,
          confirmedVolume: 0,
          pendingVolume: 0,
          remainingVolume: search.quantite
        };
      }
      const contacts = await contactsResponse.json();

      // Récupérer les détails de mission pour vérifier si tous les formulaires sont remplis
      const missionDetailsResponse = await fetch(`${this.API_BASE}/mission-details/${search._id}`);
      const missionDetails = missionDetailsResponse.ok ? await missionDetailsResponse.json() : [];

      // Calculer les volumes
      const confirmedVolume = contacts
        .filter((c: any) => c.status === 'yes')
        .reduce((sum: number, c: any) => sum + c.volume, 0);

      const pendingVolume = contacts
        .filter((c: any) => c.status === 'pending')
        .reduce((sum: number, c: any) => sum + c.volume, 0);

      const remainingVolume = search.quantite - confirmedVolume - pendingVolume;
      const progressPercentage = Math.round(((confirmedVolume + pendingVolume) / search.quantite) * 100);

      // Vérifier si tous les transporteurs confirmés ont rempli leur formulaire
      const confirmedCarriers = contacts.filter((c: any) => c.status === 'yes' && c.volume > 0);
      const carriersWithForms = missionDetails.map((detail: any) => detail.transporterId);
      const allFormsCompleted = confirmedCarriers.every((carrier: any) => 
        carriersWithForms.includes(carrier.transporterId)
      );

      // Déterminer le statut selon la nouvelle logique
      let status: 'completed' | 'in-progress' | 'pending';
      
      if (progressPercentage >= 100 && allFormsCompleted && pendingVolume === 0) {
        // Terminé : 100% couvert + tous confirmés + tous formulaires remplis
        status = 'completed';
      } else if (progressPercentage >= 100 && (pendingVolume > 0 || !allFormsCompleted)) {
        // En attente de terminaison : 100% couvert mais avec pré-réservés ou formulaires manquants
        status = 'in-progress';
      } else if (confirmedVolume > 0 || pendingVolume > 0) {
        // En cours : du volume alloué mais pas 100%
        status = 'in-progress';
      } else {
        // En attente : aucun volume alloué
        status = 'pending';
      }

      return {
        ...search,
        status,
        progressPercentage,
        confirmedVolume,
        pendingVolume,
        remainingVolume
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de recherche:', error);
      return {
        ...search,
        status: 'pending',
        progressPercentage: 0,
        confirmedVolume: 0,
        pendingVolume: 0,
        remainingVolume: search.quantite
      };
    }
  }

  static async getRecentSearchesWithStatus(userId: string, limit: number = 5): Promise<SearchWithStatus[]> {
    try {
      const searches = await this.getUserSearches(userId);
      
      // Trier par date de création (plus récent en premier)
      const sortedSearches = searches
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      // Récupérer le statut pour chaque recherche
      const searchesWithStatus = await Promise.all(
        sortedSearches.map(search => this.getSearchWithStatus(search))
      );

      return searchesWithStatus.filter((search): search is SearchWithStatus => search !== null);
    } catch (error) {
      console.error('Erreur lors de la récupération des recherches récentes:', error);
      return [];
    }
  }

  static async getUserSearchHistory(userId: string): Promise<SearchWithStatus[]> {
    try {
      const searches = await this.getUserSearches(userId);
      
      // Récupérer le statut pour chaque recherche
      const searchesWithStatus = await Promise.all(
        searches.map(search => this.getSearchWithStatus(search))
      );

      return searchesWithStatus.filter((search): search is SearchWithStatus => search !== null);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des recherches:', error);
      return [];
    }
  }

  static async getTransporterContacts(searchId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-contacts/${searchId}`);
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts transporteurs:', error);
      return [];
    }
  }

  static async deleteSearchHistory(searchId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/user-searches/${searchId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la recherche:', error);
      throw error;
    }
  }
}

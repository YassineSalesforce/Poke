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
      const response = await fetch(`${this.API_BASE}/user-searches/${userId}`);
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

      // Calculer les volumes
      const confirmedVolume = contacts
        .filter((c: any) => c.status === 'yes')
        .reduce((sum: number, c: any) => sum + c.volume, 0);

      const pendingVolume = contacts
        .filter((c: any) => c.status === 'pending')
        .reduce((sum: number, c: any) => sum + c.volume, 0);

      const remainingVolume = search.quantite - confirmedVolume - pendingVolume;
      const progressPercentage = Math.round(((confirmedVolume + pendingVolume) / search.quantite) * 100);

      // Déterminer le statut
      let status: 'completed' | 'in-progress' | 'pending';
      if (progressPercentage >= 100) {
        status = 'completed';
      } else if (confirmedVolume > 0 || pendingVolume > 0) {
        status = 'in-progress';
      } else {
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
}

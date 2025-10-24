export interface UserSearch {
  _id?: string;
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

export class UserSearchService {
  private static readonly API_BASE = 'http://localhost:5001/api';


  static async saveSearch(searchData: Omit<UserSearch, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserSearch> {
    try {
      const response = await fetch(`${this.API_BASE}/user-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recherche:', error);
      throw error;
    }
  }


  static async getRecentSearches(userId: string, limit: number = 5): Promise<UserSearch[]> {
    try {
      const response = await fetch(`${this.API_BASE}/user-searches/${userId}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des recherches:', error);
      return [];
    }
  }


  static async deleteSearch(searchId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/user-searches/${searchId}`, {
        method: 'DELETE',
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

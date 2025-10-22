export interface TransporterFavorite {
  _id?: string;
  userId: string;
  transporterId: string;
  transporterName: string;
  successfulMissions: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TransporterFavoriteService {
  private static readonly API_BASE = 'http://localhost:5001/api';

  static async addToFavorites(userId: string, transporterId: string, transporterName: string): Promise<TransporterFavorite> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          transporterId,
          transporterName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  static async removeFromFavorites(userId: string, transporterId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-favorites/${userId}/${transporterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  static async getFavorites(userId: string): Promise<TransporterFavorite[]> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-favorites/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  static async incrementSuccessfulMissions(userId: string, transporterId: string): Promise<TransporterFavorite> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-favorites/${userId}/${transporterId}/increment`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error incrementing successful missions:', error);
      throw error;
    }
  }

  static async isFavorite(userId: string, transporterId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId);
      return favorites.some(fav => fav.transporterId === transporterId);
    } catch (error) {
      console.error('Error checking if favorite:', error);
      return false;
    }
  }
}

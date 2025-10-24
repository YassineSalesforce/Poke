export interface TransporterRoute {
  _id?: string;
  userId: string;
  carrierId: string;
  carrierName: string;
  originCountry: string;
  originRegion: string;
  originDepartment: string;
  originCity: string;
  destinationCountry: string;
  destinationRegion: string;
  destinationDepartment: string;
  destinationCity: string;
  vehicleType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TransporterRouteService {
  private static readonly API_BASE = 'http://localhost:5001/api';

  
  static async createRoute(routeData: Omit<TransporterRoute, '_id' | 'createdAt' | 'updatedAt'>): Promise<TransporterRoute> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la route:', error);
      throw error;
    }
  }

 
  static async getRoutesByUser(userId: string): Promise<TransporterRoute[]> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-routes/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des routes:', error);
      return [];
    }
  }


  static async updateRoute(id: string, routeData: Partial<TransporterRoute>): Promise<TransporterRoute> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-routes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la route:', error);
      throw error;
    }
  }

  
  static async deleteRoute(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-routes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la route:', error);
      throw error;
    }
  }
}


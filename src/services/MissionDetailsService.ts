const API_BASE_URL = 'http://localhost:5001/api';

export interface MissionDetailsData {
  searchId: string;
  userId: string;
  transporterId: string;
  transporterName: string;
  route: string;
  ensemblesTaken: string;
  merchandise: string;
  loadingDate: string;
  loadingTime: string;
  deliveryDate: string;
  deliveryTime: string;
  estimatedPrice: number;
  notes?: string;
}

export interface MissionDetailsResponse {
  _id: string;
  searchId: string;
  userId: string;
  transporterId: string;
  transporterName: string;
  route: string;
  ensemblesTaken: string;
  merchandise: string;
  loadingDate: string;
  loadingTime: string;
  deliveryDate: string;
  deliveryTime: string;
  estimatedPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class MissionDetailsService {
  // Sauvegarder les détails de mission
  static async saveMissionDetails(data: MissionDetailsData): Promise<MissionDetailsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/mission-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des détails de mission:', error);
      throw error;
    }
  }

  // Récupérer tous les détails de mission pour une recherche
  static async getMissionDetailsBySearchId(searchId: string): Promise<MissionDetailsResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/mission-details/${searchId}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de mission:', error);
      throw error;
    }
  }

  // Récupérer les détails de mission pour un transporteur spécifique
  static async getMissionDetailsByTransporter(searchId: string, transporterId: string): Promise<MissionDetailsResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/mission-details/${searchId}/${transporterId}`);

      if (response.status === 404) {
        return null; // Aucun détail trouvé
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de mission:', error);
      throw error;
    }
  }
}

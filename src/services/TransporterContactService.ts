export interface TransporterContact {
  _id?: string;
  searchId: string;
  userId: string;
  transporterId: string;
  transporterName: string;
  route: string;
  vehicleType: string;
  status: 'yes' | 'pending' | 'no';
  volume: number;
  comment?: string;
  isAlternative?: boolean; // Nouveau champ pour identifier les transporteurs alternatifs
  createdAt: Date;
  updatedAt: Date;
}

export class TransporterContactService {
  private static readonly API_BASE = 'http://localhost:5001/api';

  /**
   * Sauvegarde un contact transporteur
   */
  static async saveContact(contactData: Omit<TransporterContact, '_id' | 'createdAt' | 'updatedAt'>): Promise<TransporterContact> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contact:', error);
      throw error;
    }
  }

  /**
   * Récupère les contacts d'une recherche
   */
  static async getContactsBySearch(searchId: string): Promise<TransporterContact[]> {
    try {
      const response = await fetch(`${this.API_BASE}/transporter-contacts/${searchId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
      return [];
    }
  }
}

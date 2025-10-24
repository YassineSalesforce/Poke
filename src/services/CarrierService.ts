// Service pour gérer les transporteurs
const API_BASE_URL = 'http://localhost:5001/api';

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  internalComment?: string;
  unavailabilityPeriods?: Array<{
    startDate: Date;
    endDate: Date;
    reason: string;
  }>;
  preferredChannels?: Array<{
    channel: string;
    preference: string;
  }>;
  historyNotes?: Array<{
    date: Date;
    note: string;
    author: string;
  }>;
}

export interface RouteData {
  departure: string;
  arrival: string;
  distance: number;
  estimatedTime: number;
  isActive: boolean;
}

export interface ClosurePeriod {
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface Carrier {
  _id?: string;
  userId: string;
  name: string;
  siret?: string;
  activity?: string;
  status: 'actif' | 'ferme_temporairement' | 'ferme_definitivement';
  email?: string;
  phone?: string;
  address?: string;
  openingDate: Date;
  contacts: Contact[];
  routes: RouteData[];
  closurePeriods: ClosurePeriod[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CarrierResponse {
  _id: string;
  userId: string;
  name: string;
  siret?: string;
  activity?: string;
  status: 'actif' | 'ferme_temporairement' | 'ferme_definitivement';
  email?: string;
  phone?: string;
  address?: string;
  openingDate: string;
  contacts: Contact[];
  routes: RouteData[];
  closurePeriods: ClosurePeriod[];
  createdAt: string;
  updatedAt: string;
}

export class CarrierService {
  static async getAllCarriers(userId: string): Promise<Carrier[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/carriers?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des transporteurs');
      }
      const carriers: CarrierResponse[] = await response.json();
      
      return carriers.map(carrier => ({
        ...carrier,
        openingDate: new Date(carrier.openingDate),
        createdAt: new Date(carrier.createdAt),
        updatedAt: new Date(carrier.updatedAt)
      }));
    } catch (error) {
      console.error('Erreur CarrierService.getAllCarriers:', error);
      throw error;
    }
  }

  static async getCarrierById(id: string): Promise<Carrier> {
    try {
      const response = await fetch(`${API_BASE_URL}/carriers/${id}`);
      if (!response.ok) {
        throw new Error('Transporteur non trouvé');
      }
      const carrier: CarrierResponse = await response.json();
      
      return {
        ...carrier,
        openingDate: new Date(carrier.openingDate),
        createdAt: new Date(carrier.createdAt),
        updatedAt: new Date(carrier.updatedAt)
      };
    } catch (error) {
      console.error('Erreur CarrierService.getCarrierById:', error);
      throw error;
    }
  }

  static async createCarrier(carrierData: Omit<Carrier, '_id' | 'createdAt' | 'updatedAt'>): Promise<Carrier> {
    try {
      const response = await fetch(`${API_BASE_URL}/carriers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carrierData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du transporteur');
      }

      const carrier: CarrierResponse = await response.json();
      
      return {
        ...carrier,
        openingDate: new Date(carrier.openingDate),
        createdAt: new Date(carrier.createdAt),
        updatedAt: new Date(carrier.updatedAt)
      };
    } catch (error) {
      console.error('Erreur CarrierService.createCarrier:', error);
      throw error;
    }
  }

  static async updateCarrier(id: string, carrierData: Partial<Carrier>): Promise<Carrier> {
    try {
      const response = await fetch(`${API_BASE_URL}/carriers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carrierData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du transporteur');
      }

      const carrier: CarrierResponse = await response.json();
      
      return {
        ...carrier,
        openingDate: new Date(carrier.openingDate),
        createdAt: new Date(carrier.createdAt),
        updatedAt: new Date(carrier.updatedAt)
      };
    } catch (error) {
      console.error('Erreur CarrierService.updateCarrier:', error);
      throw error;
    }
  }

  static async deleteCarrier(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/carriers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du transporteur');
      }
    } catch (error) {
      console.error('Erreur CarrierService.deleteCarrier:', error);
      throw error;
    }
  }
}

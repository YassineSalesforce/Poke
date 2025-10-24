export class TransporterRefusalService {
  private static readonly API_BASE = 'http://localhost:5001/api';

  
  static async getRefusalCount(userId: string, transporterId: string): Promise<number> {
    try {
      const url = `${this.API_BASE}/transporter-refusals/${userId}/${transporterId}`;
      console.log(`🔍 Appel API refus pour transporteur ${transporterId}:`, url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`❌ Réponse non OK pour ${transporterId}:`, response.status);
        return 0;
      }
      const data = await response.json();
      console.log(`✅ Refus pour ${transporterId}:`, data.refusalCount);
      return data.refusalCount || 0;
    } catch (error) {
      console.error('Erreur lors de la récupération des refus:', error);
      return 0;
    }
  }

  
  static async getRefusalCounts(userId: string, transporterIds: string[]): Promise<Map<string, number>> {
    const refusalMap = new Map<string, number>();
    
    const promises = transporterIds.map(async (id) => {
      const count = await this.getRefusalCount(userId, id);
      refusalMap.set(id, count);
    });
    
    await Promise.all(promises);
    return refusalMap;
  }
}


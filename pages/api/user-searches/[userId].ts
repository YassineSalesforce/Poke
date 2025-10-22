import { NextApiRequest, NextApiResponse } from 'next';
import { getUserSearchesCollection } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const collection = await getUserSearchesCollection();
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    switch (req.method) {
      case 'GET':
        const { limit = '5' } = req.query;
        const searches = await collection
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit as string))
          .toArray();
        
        res.status(200).json(searches);
        break;

      case 'DELETE':
        const { searchId } = req.query;
        if (!searchId) {
          return res.status(400).json({ error: 'searchId requis' });
        }
        
        await collection.deleteOne({ _id: searchId });
        res.status(200).json({ message: 'Recherche supprimée' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erreur API user-searches/[userId]:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

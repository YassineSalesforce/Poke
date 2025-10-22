import { NextApiRequest, NextApiResponse } from 'next';
import { getUserSearchesCollection, UserSearchDocument } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const collection = await getUserSearchesCollection();

    switch (req.method) {
      case 'POST':
        return handlePost(req, res, collection);
      case 'GET':
        return handleGet(req, res, collection);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erreur API user-searches:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, collection: any) {
  const searchData: Omit<UserSearchDocument, '_id'> = {
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(searchData);
  
  res.status(201).json({
    _id: result.insertedId,
    ...searchData,
  });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, collection: any) {
  const { userId, limit = '5' } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId requis' });
  }

  const searches = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string))
    .toArray();

  res.status(200).json(searches);
}

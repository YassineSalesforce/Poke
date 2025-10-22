import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yassinezouitni_db_user:TXwNCRpuO3BXvEiC@poke.gyfcvnm.mongodb.net/dashboard-auth?retryWrites=true&w=majority&appName=poke';
const DB_NAME = 'dashboard-auth';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log('✅ Connecté à MongoDB');
    return { client, db };
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    throw error;
  }
}

export async function getUserSearchesCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('user_searches');
}

// Interface pour les recherches utilisateur
export interface UserSearchDocument {
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

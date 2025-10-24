const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Connexion à MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yassinezouitni_db_user:TXwNCRpuO3BXvEiC@poke.gyfcvnm.mongodb.net/dashboard-auth?retryWrites=true&w=majority&appName=poke';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'affreteur' },
  company: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const userSearchSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  depart: { type: String, required: true },
  arrivee: { type: String, required: true },
  departAdresse: { type: String, required: true },
  arriveeAdresse: { type: String, required: true },
  typeVehicule: { type: String, required: true },
  quantite: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSearch = mongoose.model('UserSearch', userSearchSchema);

const transporterContactSchema = new mongoose.Schema({
  searchId: { type: String, required: true }, // ID de la recherche liée
  userId: { type: String, required: true },
  transporterId: { type: String, required: true },
  transporterName: { type: String, required: true },
  route: { type: String, required: true },
  vehicleType: { type: String, required: true },
  status: { type: String, enum: ['yes', 'pending', 'no'], required: true },
  volume: { type: Number, required: true },
  comment: { type: String },
  isAlternative: { type: Boolean, default: false }, // Champ pour identifier les transporteurs alternatifs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TransporterContact = mongoose.model('TransporterContact', transporterContactSchema);

const missionDetailsSchema = new mongoose.Schema({
  searchId: { type: String, required: true }, // ID de la recherche liée
  userId: { type: String, required: true },
  transporterId: { type: String, required: true },
  transporterName: { type: String, required: true },
  route: { type: String, required: true },
  ensemblesTaken: { type: String, required: true },
  merchandise: { type: String, required: true },
  loadingDate: { type: String, required: true },
  loadingTime: { type: String, required: true },
  deliveryDate: { type: String, required: true },
  deliveryTime: { type: String, required: true },
  estimatedPrice: { type: Number, required: true },
  notes: { type: String },
  phone: { type: String },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MissionDetails = mongoose.model('MissionDetails', missionDetailsSchema);

const carrierSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  siret: { type: String },
  activity: { type: String },
  status: { type: String, enum: ['actif', 'ferme_temporairement', 'ferme_definitivement'], default: 'actif' },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  openingDate: { type: Date, default: Date.now },
  contacts: [{
    name: { type: String },
    role: { type: String },
    phone: { type: String },
    email: { type: String },
    isPrimary: { type: Boolean, default: false },
    internalComment: { type: String },
    unavailabilityPeriods: [{
      startDate: { type: Date },
      endDate: { type: Date },
      reason: { type: String }
    }],
    preferredChannels: [{
      channel: { type: String },
      preference: { type: String }
    }],
    historyNotes: [{
      date: { type: Date, default: Date.now },
      note: { type: String },
      author: { type: String }
    }]
  }],
  routes: [{
    departure: { type: String },
    arrival: { type: String },
    distance: { type: Number },
    estimatedTime: { type: Number },
    isActive: { type: Boolean, default: true },
    carrierId: { type: String },
    carrierName: { type: String },
    origin: { type: String },
    destination: { type: String },
    originCountry: { type: String },
    originRegion: { type: String },
    originDepartment: { type: String },
    originCity: { type: String },
    destinationCountry: { type: String },
    destinationRegion: { type: String },
    destinationDepartment: { type: String },
    destinationCity: { type: String },
    vehicleType: { type: String },
    status: { type: String },
    closurePeriods: [{ type: mongoose.Schema.Types.Mixed }],
    lastUpdated: { type: Date }
  }],
  closurePeriods: [{
    startDate: { type: Date },
    endDate: { type: Date },
    reason: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Carrier = mongoose.model('Carrier', carrierSchema);

const transporterFavoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  transporterId: { type: String, required: true },
  transporterName: { type: String, required: true },
  successfulMissions: { type: Number, default: 0 }, // Nombre de missions réussies
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TransporterFavorite = mongoose.model('TransporterFavorite', transporterFavoriteSchema);

const transporterRouteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  carrierId: { type: String, required: true },
  carrierName: { type: String, required: true },
  originCountry: { type: String, default: '' },
  originRegion: { type: String, default: '' },
  originDepartment: { type: String, default: '' },
  originCity: { type: String, default: '' },
  destinationCountry: { type: String, default: '' },
  destinationRegion: { type: String, default: '' },
  destinationDepartment: { type: String, default: '' },
  destinationCity: { type: String, default: '' },
  vehicleType: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TransporterRoute = mongoose.model('TransporterRoute', transporterRouteSchema, 'transporter_routes');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};


app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, company, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company,
      phone
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/user-searches', async (req, res) => {
  try {
    const searchData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userSearch = new UserSearch(searchData);
    await userSearch.save();

    res.status(201).json(userSearch);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recherche:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/user-searches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    const searches = await UserSearch
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    res.json(searches);
  } catch (error) {
    console.error('Erreur lors de la récupération des recherches:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/user-searches/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    console.log('🗑️ Suppression de la recherche avec ID:', searchId);
    
    const deletedSearch = await UserSearch.findByIdAndDelete(searchId);
    
    if (!deletedSearch) {
      console.log('❌ Recherche non trouvée:', searchId);
      return res.status(404).json({ message: 'Recherche non trouvée' });
    }
    
    console.log('✅ Recherche supprimée avec succès:', deletedSearch);
    res.json({ message: 'Recherche supprimée' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la recherche:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/transporter-contacts', async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingContact = await TransporterContact.findOne({
      searchId: contactData.searchId,
      transporterId: contactData.transporterId
    });

    if (existingContact) {
      const updatedContact = await TransporterContact.findByIdAndUpdate(
        existingContact._id,
        { ...contactData, updatedAt: new Date() },
        { new: true }
      );
      res.json(updatedContact);
    } else {
      const transporterContact = new TransporterContact(contactData);
      await transporterContact.save();
      res.status(201).json(transporterContact);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du contact:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/transporter-refusals/:userId/:transporterId', async (req, res) => {
  try {
    const { userId, transporterId } = req.params;
    console.log(`🔍 Comptage de TOUS les refus pour userId: ${userId}, transporterId: ${transporterId}`);
    
    const refusalCount = await TransporterContact.countDocuments({
      userId: userId,
      transporterId: transporterId,
      status: 'no'
    });
    
    console.log(`✅ Total de refus trouvés: ${refusalCount} pour transporteur ${transporterId} et utilisateur ${userId}`);
    
    const sampleRefusals = await TransporterContact.find({
      userId: userId,
      transporterId: transporterId,
      status: 'no'
    }).limit(3).select('searchId createdAt transporterName');
    
    console.log(`📋 Exemples de refus:`, sampleRefusals);
    
    res.json({ transporterId, refusalCount });
  } catch (error) {
    console.error('Erreur lors du comptage des refus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/transporter-contacts/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;

    const contacts = await TransporterContact
      .find({ searchId })
      .sort({ createdAt: -1 })
      .exec();

    res.json(contacts);
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/mission-details', async (req, res) => {
  try {
    const missionData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingDetails = await MissionDetails.findOne({
      searchId: missionData.searchId,
      transporterId: missionData.transporterId
    });

    if (existingDetails) {
      const updatedDetails = await MissionDetails.findByIdAndUpdate(
        existingDetails._id,
        { ...missionData, updatedAt: new Date() },
        { new: true }
      );
      res.json(updatedDetails);
    } else {
      const missionDetails = new MissionDetails(missionData);
      await missionDetails.save();
      res.status(201).json(missionDetails);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des détails de mission:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/mission-details/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;

    const missionDetails = await MissionDetails
      .find({ searchId })
      .sort({ createdAt: -1 })
      .exec();

    res.json(missionDetails);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de mission:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/mission-details/:searchId/:transporterId', async (req, res) => {
  try {
    const { searchId, transporterId } = req.params;

    const missionDetails = await MissionDetails.findOne({
      searchId,
      transporterId
    });

    if (!missionDetails) {
      return res.status(404).json({ message: 'Détails de mission non trouvés' });
    }

    res.json(missionDetails);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de mission:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/transporter-favorites', async (req, res) => {
  try {
    const { userId, transporterId, transporterName } = req.body;

    const existingFavorite = await TransporterFavorite.findOne({
      userId,
      transporterId
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Transporteur déjà en favori' });
    }

    const favorite = new TransporterFavorite({
      userId,
      transporterId,
      transporterName,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du favori:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/transporter-favorites/:userId/:transporterId', async (req, res) => {
  try {
    const { userId, transporterId } = req.params;

    const deletedFavorite = await TransporterFavorite.findOneAndDelete({
      userId,
      transporterId
    });

    if (!deletedFavorite) {
      return res.status(404).json({ message: 'Favori non trouvé' });
    }

    res.json({ message: 'Favori supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/transporter-favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const favorites = await TransporterFavorite
      .find({ userId })
      .sort({ successfulMissions: -1, createdAt: -1 })
      .exec();

    res.json(favorites);
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/transporter-favorites/:userId/:transporterId/increment', async (req, res) => {
  try {
    const { userId, transporterId } = req.params;

    const favorite = await TransporterFavorite.findOneAndUpdate(
      { userId, transporterId },
      { 
        $inc: { successfulMissions: 1 },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!favorite) {
      return res.status(404).json({ message: 'Favori non trouvé' });
    }

    res.json(favorite);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des missions réussies:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


app.post('/api/transporter-routes', async (req, res) => {
  try {
    const routeData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const route = new TransporterRoute(routeData);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    console.error('Erreur lors de la création de la route:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/transporter-routes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const routes = await TransporterRoute
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    res.json(routes);
  } catch (error) {
    console.error('Erreur lors de la récupération des routes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/transporter-routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const route = await TransporterRoute.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!route) {
      return res.status(404).json({ message: 'Route non trouvée' });
    }

    res.json(route);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la route:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/transporter-routes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const route = await TransporterRoute.findByIdAndDelete(id);

    if (!route) {
      return res.status(404).json({ message: 'Route non trouvée' });
    }

    res.json({ message: 'Route supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la route:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/carriers', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId est requis' });
    }
    
    const carriers = await Carrier.find({ userId }).sort({ createdAt: -1 });
    res.json(carriers);
  } catch (error) {
    console.error('Erreur lors de la récupération des transporteurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/carriers/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findById(req.params.id);
    if (!carrier) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    res.json(carrier);
  } catch (error) {
    console.error('Erreur lors de la récupération du transporteur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

async function syncCarrierRoutes(carrier) {
  try {
    if (!carrier.routes || carrier.routes.length === 0) {
      return;
    }

    console.log(`🔄 Synchronisation de ${carrier.routes.length} routes pour le transporteur ${carrier.name}`);
    
    for (const route of carrier.routes) {
      const routeData = {
        userId: carrier.userId,
        carrierId: carrier._id.toString(),
        carrierName: carrier.name,
        originCountry: route.originCountry || '',
        originRegion: route.originRegion || '',
        originDepartment: route.originDepartment || '',
        originCity: route.originCity || '',
        destinationCountry: route.destinationCountry || '',
        destinationRegion: route.destinationRegion || '',
        destinationDepartment: route.destinationDepartment || '',
        destinationCity: route.destinationCity || '',
        vehicleType: route.vehicleType || '',
        isActive: route.isActive !== false,
        createdAt: route.createdAt || new Date(),
        updatedAt: new Date()
      };

      const existingRoute = await TransporterRoute.findOne({
        carrierId: routeData.carrierId,
        originDepartment: routeData.originDepartment,
        originCity: routeData.originCity,
        destinationDepartment: routeData.destinationDepartment,
        destinationCity: routeData.destinationCity
      });

      if (existingRoute) {
        await TransporterRoute.findByIdAndUpdate(existingRoute._id, routeData);
        console.log(`✅ Route mise à jour: ${routeData.originCity} → ${routeData.destinationCity}`);
      } else {
        const newRoute = new TransporterRoute(routeData);
        await newRoute.save();
        console.log(`✅ Nouvelle route créée: ${routeData.originCity} → ${routeData.destinationCity}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des routes:', error);
  }
}

app.post('/api/carriers', async (req, res) => {
  try {
    const carrierData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const carrier = new Carrier(carrierData);
    await carrier.save();
    
    await syncCarrierRoutes(carrier);
    
    console.log('✅ Nouveau transporteur créé:', carrier.name);
    res.status(201).json(carrier);
  } catch (error) {
    console.error('Erreur lors de la création du transporteur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/carriers/:id', async (req, res) => {
  try {
    const carrierData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const carrier = await Carrier.findByIdAndUpdate(
      req.params.id, 
      carrierData, 
      { new: true, runValidators: true }
    );
    
    if (!carrier) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    
    await syncCarrierRoutes(carrier);
    
    console.log('✅ Transporteur mis à jour:', carrier.name);
    res.json(carrier);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du transporteur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/carriers/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findByIdAndDelete(req.params.id);
    if (!carrier) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    
    console.log('✅ Transporteur supprimé:', carrier.name);
    res.json({ message: 'Transporteur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du transporteur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend fonctionne correctement!' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

# Dashboard Interface Design avec Authentification MongoDB

## 🚀 Fonctionnalités

- **Authentification complète** : Inscription et connexion des utilisateurs
- **Base de données MongoDB** : Stockage sécurisé des informations utilisateur
- **Interface moderne** : Dashboard avec informations personnalisées
- **Gestion des sessions** : Tokens JWT pour la sécurité

## 📋 Prérequis

- Node.js (version 16 ou plus récente)
- MongoDB (installé via Homebrew)
- npm ou yarn

## 🛠️ Installation et Configuration

### 1. Backend (Serveur API)

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Démarrer MongoDB
brew services start mongodb/brew/mongodb-community

# Démarrer le serveur backend
npm run dev
```

Le backend sera accessible sur `http://localhost:5000`

### 2. Frontend (Interface utilisateur)

```bash
# Dans le dossier racine du projet
npm install

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

## 🔐 Utilisation de l'Authentification

### Inscription d'un nouvel utilisateur

1. Cliquez sur "Commencer" depuis la page d'accueil
2. Vous serez redirigé vers la page d'authentification
3. Cliquez sur "Créer un compte"
4. Remplissez le formulaire d'inscription :
   - Prénom et nom
   - Email (unique)
   - Mot de passe (minimum 6 caractères)
   - Entreprise (optionnel)
   - Téléphone (optionnel)

### Connexion

1. Sur la page d'authentification, saisissez votre email et mot de passe
2. Cliquez sur "Se connecter"
3. Vous serez automatiquement redirigé vers le dashboard

### Déconnexion

1. Dans le header du dashboard, cliquez sur votre nom
2. Sélectionnez "Se déconnecter" dans le menu déroulant

## 🎯 Fonctionnalités du Dashboard

Une fois connecté, vous verrez :

- **Votre nom et rôle** affichés dans le header (au lieu de "Jean Dupont Affréteur")
- **Avatar personnalisé** généré automatiquement
- **Accès complet** à toutes les fonctionnalités du dashboard
- **Session persistante** : vous restez connecté même après fermeture du navigateur

## 🔧 API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `GET /api/auth/profile` - Récupération du profil utilisateur (nécessite un token)

### Test

- `GET /api/test` - Test de fonctionnement du serveur

## 🗄️ Structure de la Base de Données

### Collection Users

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashé),
  role: String (default: 'affreteur'),
  company: String (optionnel),
  phone: String (optionnel),
  createdAt: Date
}
```

## 🔒 Sécurité

- **Mots de passe hashés** avec bcryptjs
- **Tokens JWT** pour l'authentification
- **Validation des données** côté serveur
- **Protection des routes** avec middleware d'authentification

## 🚨 Dépannage

### Problèmes courants

1. **MongoDB ne démarre pas** :
   ```bash
   brew services restart mongodb/brew/mongodb-community
   ```

2. **Erreur de connexion au backend** :
   - Vérifiez que le serveur backend est démarré sur le port 5000
   - Vérifiez que MongoDB est en cours d'exécution

3. **Erreur d'authentification** :
   - Vérifiez que l'email n'existe pas déjà lors de l'inscription
   - Vérifiez que le mot de passe fait au moins 6 caractères

## 📝 Notes de Développement

- Le système utilise React Context pour la gestion de l'état d'authentification
- Les tokens JWT sont stockés dans le localStorage
- Le backend utilise Express.js avec Mongoose pour MongoDB
- L'interface utilise Tailwind CSS et Radix UI pour les composants

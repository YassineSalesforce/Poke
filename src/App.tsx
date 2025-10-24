import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { RecentHistory } from './components/RecentHistory';
import { AlertsCard } from './components/AlertsCard';
import { FavoritesCard } from './components/FavoritesCard';
import { SearchForm } from './components/SearchForm';
import { SearchResults } from './components/SearchResults';
import { CarrierReturnsEntry } from './components/CarrierReturnsEntry';
import { MissionOrders } from './components/MissionOrders';
import { RouteManagement } from './components/RouteManagement';
import { CarrierManagement } from './components/CarrierManagement';
import { ProcessOverview } from './components/ProcessOverview';
import { TransporterContactService } from './services/TransporterContactService';
import { ExternalLink, Route, X } from 'lucide-react';
import { Toaster } from './components/ui/sonner';


type Screen = 'landing' | 'dashboard' | 'search-form' | 'search-results' | 'carrier-returns' | 'mission-orders' | 'route-management' | 'carrier-management' | 'process-overview';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<any>(null);
  const [carrierReturns, setCarrierReturns] = useState<any[]>([]);

  React.useEffect(() => {
    if (isAuthenticated && showLogin) {
      setShowLogin(false);
      setCurrentScreen('dashboard');
    }
  }, [isAuthenticated, showLogin]);

  const handleStartApp = () => {
    if (isAuthenticated) {
      setCurrentScreen('dashboard');
    } else {
      setShowLogin(true);
      setIsLoginMode(true);
    }
  };

  const handleSwitchToRegister = () => {
    setIsLoginMode(false);
  };

  const handleSwitchToLogin = () => {
    setIsLoginMode(true);
  };

  const handleCloseModal = () => {
    setShowLogin(false);
    setIsLoginMode(true);
  };

  const handleNewSearch = () => {
    setCurrentScreen('search-form');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleSearchSubmit = (criteria?: any) => {
    console.log('🚀 App.tsx - handleSearchSubmit appelé avec:', criteria);
    const criteriaWithUserId = {
      ...criteria,
      userId: user?.id
    };
    setSearchCriteria(criteriaWithUserId); 
    console.log('💾 searchCriteria sauvegardé:', criteriaWithUserId);
    setHasSearched(true);
    setCurrentScreen('search-results');
    console.log('📱 Navigation vers search-results');
  };

  const handleBackToForm = () => {
    setCurrentScreen('search-form');
  };

  const handleGoToCarrierReturns = () => {
    setCurrentScreen('carrier-returns');
  };

  const handleBackToResults = async () => {
    if (searchCriteria?.searchId) {
      try {
        const updatedContacts = await TransporterContactService.getContactsBySearch(searchCriteria.searchId);
        
        const updatedCarrierReturns = updatedContacts.map(contact => ({
          id: contact.transporterId,
          name: contact.transporterName,
          route: contact.route,
          response: contact.status,
          ensemblesTaken: contact.status === 'yes' ? contact.volume.toString() : '',
          ensemblesPrevisional: contact.status === 'pending' ? contact.volume.toString() : '',
          comment: contact.comment || '',
          validated: contact.status === 'yes'
        }));
        
        setCarrierReturns(updatedCarrierReturns);
        
        setSearchCriteria(prev => ({
          ...prev,
          updatedContacts: updatedContacts
        }));
        
        console.log('🔄 Données mises à jour pour les résultats:', updatedContacts);
      } catch (error) {
        console.error('❌ Erreur lors du rechargement des données:', error);
      }
    }
    
    setCurrentScreen('search-results');
  };

  const handleGoToMissionOrders = (returnsData?: any[]) => {
    if (returnsData) {
      setCarrierReturns(returnsData);
    }
    setCurrentScreen('mission-orders');
  };

  const handleBackToCarrierReturns = () => {
    setCurrentScreen('carrier-returns');
  };

  const handleGoToRouteManagement = () => {
    setCurrentScreen('route-management');
  };

  const handleGoToCarrierManagement = () => {
    setCurrentScreen('carrier-management');
  };

  const handleGoToProcessOverview = () => {
    setCurrentScreen('process-overview');
  };

  const handleNavigateFromProcess = (step: number) => {
    switch (step) {
      case 1:
        setCurrentScreen('search-form');
        break;
      case 2:
        setCurrentScreen('search-results');
        break;
      case 3:
        setCurrentScreen('carrier-returns');
        break;
      case 4:
        setCurrentScreen('mission-orders');
        break;
      case 5:
        setCurrentScreen('route-management');
        break;
    }
  };

  const handleSearchClick = (search: any) => {
    setSearchCriteria({
      depart: search.depart,
      arrivee: search.arrivee,
      departAdresse: search.departAdresse,
      arriveeAdresse: search.arriveeAdresse,
      typeVehicule: search.typeVehicule,
      quantite: search.quantite,
      searchId: search._id
    });
    
    setCurrentScreen('carrier-returns');
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('landing');
    setSearchCriteria(null);
    setCarrierReturns([]);
    setHasSearched(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 animate-spin" style={{ backgroundColor: '#2B3A55' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && currentScreen !== 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 animate-spin" style={{ backgroundColor: '#2B3A55' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F5F7' }}>
      <Toaster position="top-right" />
      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LandingPage onStart={handleStartApp} />
          </motion.div>
        )}

        {currentScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen"
          >
            <Header onNewSearch={handleNewSearch} onManageRoutes={handleGoToRouteManagement} onManageCarriers={handleGoToCarrierManagement} onDashboard={handleBackToDashboard} onLogout={handleLogout} />

            {/* Main Content */}
            <main className="flex-1 p-8">
              <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <StatsCard userId={user?.id} />
                    <RecentHistory userId={user?.id || ''} onSearchClick={handleSearchClick} />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <AlertsCard userId={user?.id} />
                    <FavoritesCard userId={user?.id} />
                  </div>
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white px-8 py-4">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Dernière mise à jour : 20/10/2025 10h15
                </p>
                <div className="flex items-center gap-4">
                  {/* Main Content<button
                    onClick={handleGoToProcessOverview}
                    className="text-sm flex items-center gap-1 hover:underline transition-colors"
                    style={{ color: '#2B3A55' }}
                  >
                    Vue globale du processus
                    <ExternalLink className="w-3 h-3" />
                  </button> */}
                </div>
              </div>
            </footer>
          </motion.div>
        )}

        {currentScreen === 'search-form' && (
          <motion.div
            key="search-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SearchForm onBack={handleBackToDashboard} onSearch={handleSearchSubmit} showBackButton={true} userId={user?.id} onLogout={handleLogout} />
          </motion.div>
        )}

        {currentScreen === 'search-results' && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            <SearchResults 
              onBack={handleBackToForm} 
              onBackToDashboard={handleBackToDashboard}
              onNext={handleGoToCarrierReturns} 
              searchCriteria={searchCriteria}
              onLogout={handleLogout}
            />
            {console.log('📤 App.tsx - Passage de searchCriteria à SearchResults:', searchCriteria)}
          </motion.div>
        )}

        {currentScreen === 'carrier-returns' && (
          <motion.div
            key="carrier-returns"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            <CarrierReturnsEntry 
              onBack={handleBackToResults} 
              onBackToDashboard={handleBackToDashboard}
              onNext={handleGoToMissionOrders}
              searchCriteria={searchCriteria}
              searchId={searchCriteria?.searchId}
              onLogout={handleLogout}
              userId={user?.id}
            />
          </motion.div>
        )}

        {currentScreen === 'mission-orders' && (
          <motion.div
            key="mission-orders"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            <MissionOrders 
              onBack={handleBackToCarrierReturns} 
              onBackToDashboard={handleBackToDashboard}
              searchCriteria={searchCriteria}
              carrierReturns={carrierReturns}
              searchId={searchCriteria?.searchId}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {currentScreen === 'route-management' && (
          <motion.div
            key="route-management"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RouteManagement onBackToDashboard={handleBackToDashboard} onLogout={handleLogout} />
          </motion.div>
        )}

        {currentScreen === 'carrier-management' && (
          <motion.div
            key="carrier-management"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CarrierManagement onBackToDashboard={handleBackToDashboard} onLogout={handleLogout} />
          </motion.div>
        )}

        {currentScreen === 'process-overview' && (
          <motion.div
            key="process-overview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <ProcessOverview 
              onBackToDashboard={handleBackToDashboard} 
              onStartNewMission={handleNewSearch}
              onNavigateToStep={handleNavigateFromProcess}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>


      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowLogin(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 size-10 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                style={{
                  borderRadius: '50%'
                }}
              >
                <X className="size-5 text-gray-600" />
              </button>
              {isLoginMode ? (
                <LoginForm 
                  onClose={handleCloseModal} 
                  onSwitchToRegister={handleSwitchToRegister}
                />
              ) : (
                <RegisterForm 
                  onClose={handleCloseModal} 
                  onSwitchToLogin={handleSwitchToLogin}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

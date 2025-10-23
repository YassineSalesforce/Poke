import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserSearchHistoryService, SearchWithStatus } from '../services/UserSearchHistoryService';

interface RecentHistoryProps {
  userId: string;
  onSearchClick: (search: SearchWithStatus) => void;
}

export function RecentHistory({ userId, onSearchClick }: RecentHistoryProps) {
  const [searches, setSearches] = useState<SearchWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSearches, setTotalSearches] = useState(0);
  
  const itemsPerPage = 5; // Nombre d'éléments par page

  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        console.log('🔄 Chargement des recherches récentes pour userId:', userId);
        
        // Charger toutes les recherches pour calculer le total
        const allSearches = await UserSearchHistoryService.getUserSearchHistory(userId);
        setTotalSearches(allSearches.length);
        setTotalPages(Math.ceil(allSearches.length / itemsPerPage));
        
        // Charger seulement les recherches de la page courante
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageSearches = allSearches.slice(startIndex, endIndex);
        
        console.log('🔍 DEBUG PAGINATION:');
        console.log('- Total recherches:', allSearches.length);
        console.log('- Items par page:', itemsPerPage);
        console.log('- Page courante:', currentPage);
        console.log('- Start index:', startIndex);
        console.log('- End index:', endIndex);
        console.log('- Recherches de la page:', pageSearches.length);
        console.log('- Recherches récupérées:', pageSearches);
        
        setSearches(pageSearches);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des recherches récentes:', error);
        setSearches([]);
        setTotalSearches(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadRecentSearches();
  }, [userId, currentPage]);

  const getStatusBadge = (status: SearchWithStatus['status']) => {
    const statusConfig = {
      completed: { label: 'Terminé', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      'in-progress': { label: 'En cours', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
    };

    return statusConfig[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const extractCityAndPostalCode = (fullAddress: string) => {
    // Si pas d'adresse, retourner une valeur par défaut
    if (!fullAddress) return 'Adresse non définie';
    
    // Extraire la ville et le code postal de l'adresse complète
    const parts = fullAddress.split(',');
    if (parts.length >= 1) {
      const cityPart = parts[0].trim();
      // Si la ville contient un code postal (ex: "Bordeaux 33000"), on l'extrait
      const cityMatch = cityPart.match(/^(.+?)\s+(\d{5})$/);
      if (cityMatch) {
        return `${cityMatch[1]} ${cityMatch[2]}`;
      }
      if (cityPart.length > 0) {
        return cityPart;
      }
    }
    return fullAddress;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    
    // Toujours afficher toutes les pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle>Historique récent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (searches.length === 0) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle>Historique récent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Aucune recherche récente</p>
            <p className="text-sm">Commencez une nouvelle recherche pour voir l'historique</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle>Historique récent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {searches.map((search) => {
            const statusConfig = getStatusBadge(search.status);
            return (
              <div
                key={search._id}
                onClick={() => onSearchClick(search)}
                className="grid grid-cols-[100px_1fr_150px_120px] gap-4 items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm border border-transparent hover:border-gray-200"
              >
                <span className="text-sm text-gray-600">{formatDate(search.createdAt.toString())}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{extractCityAndPostalCode(search.departAdresse)}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{extractCityAndPostalCode(search.arriveeAdresse)}</span>
                </div>
                <span className="text-sm text-gray-600">{search.typeVehicule}</span>
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              </div>
            );
          })}
        </div>
        
        {/* Barre de pagination avec flèches */}
        {totalSearches > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            {/* Informations sur la pagination */}
            <div className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages} • {totalSearches} recherche{totalSearches > 1 ? 's' : ''} 
            </div>
            
            {/* Contrôles de pagination */}
            <div className="flex items-center gap-2">
              {/* Flèche gauche */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              
              {/* Indicateur de pages */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              {/* Flèche droite */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

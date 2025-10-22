import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import { UserSearchHistoryService, SearchWithStatus } from '../services/UserSearchHistoryService';

interface RecentHistoryProps {
  userId: string;
  onSearchClick: (search: SearchWithStatus) => void;
}

export function RecentHistory({ userId, onSearchClick }: RecentHistoryProps) {
  const [searches, setSearches] = useState<SearchWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        console.log('🔄 Chargement des recherches récentes pour userId:', userId);
        const recentSearches = await UserSearchHistoryService.getRecentSearchesWithStatus(userId, 5);
        console.log('📊 Recherches récupérées:', recentSearches);
        setSearches(recentSearches);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des recherches récentes:', error);
        // En cas d'erreur, on met un tableau vide pour éviter le crash
        setSearches([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentSearches();
  }, [userId]);

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
      // Si on trouve juste la ville sans code postal
      if (cityPart.length > 0) {
        return cityPart;
      }
    }
    // Si on ne peut pas extraire proprement, afficher l'adresse complète
    return fullAddress;
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
      </CardContent>
    </Card>
  );
}

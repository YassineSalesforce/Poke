import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Star, Truck, Heart } from 'lucide-react';
import { TransporterFavoriteService, TransporterFavorite } from '../services/TransporterFavoriteService';
import { toast } from 'sonner';

interface FavoritesCardProps {
  userId?: string;
}

export function FavoritesCard({ userId }: FavoritesCardProps) {
  const [favorites, setFavorites] = useState<TransporterFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      const effectiveUserId = userId || 'user-1';
      console.log('🌟 Chargement des favoris pour userId:', effectiveUserId);
      
      const userFavorites = await TransporterFavoriteService.getFavorites(effectiveUserId);
      console.log('✅ Favoris chargés:', userFavorites.length, 'favoris trouvés');
      console.log('📋 Liste des favoris:', userFavorites);
      
      setFavorites(userFavorites);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (transporterId: string, transporterName: string, e: any) => {
    e.stopPropagation();
    console.log('🗑️ Suppression du favori:', transporterId);
    
    try {
      const effectiveUserId = userId || 'user-1';
      await TransporterFavoriteService.removeFromFavorites(effectiveUserId, transporterId);
      console.log('✅ Favori supprimé avec succès');
      
      toast.success(`${transporterName} retiré des favoris`, { icon: '⭐' });
      
      await loadFavorites();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du favori:', error);
      toast.error('Erreur lors de la suppression du favori');
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle>Favoris</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun transporteur favori</p>
            <p className="text-xs text-gray-400 mt-1">Cliquez sur ⭐ pour ajouter des favoris</p>
          </div>
        ) : (
          favorites.map((favorite) => (
            <div
              key={favorite._id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-200 group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F4F5F7' }}
              >
                <Truck className="w-5 h-5" style={{ color: '#2B3A55' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  <span className="text-sm font-medium">{favorite.transporterName}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {favorite.successfulMissions} mission{favorite.successfulMissions > 1 ? 's' : ''} réussie{favorite.successfulMissions > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={(e) => handleRemoveFavorite(favorite.transporterId, favorite.transporterName, e)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 hover:bg-amber-50 rounded hover:scale-110 hover:shadow-lg hover:shadow-amber-200"
                title="Retirer des favoris"
              >
                <Star className="w-5 h-5 fill-amber-400 stroke-amber-400 hover:fill-amber-500 hover:stroke-amber-500 transition-colors" />
              </button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

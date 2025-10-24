import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Package, Weight } from 'lucide-react';
import { UserSearchHistoryService, SearchWithStatus } from '../services/UserSearchHistoryService';

interface StatsCardProps {
  userId?: string;
}

export function StatsCard({ userId }: StatsCardProps) {
  const [stats, setStats] = useState({
    successRate: '82 %',
    missionsInProgress: '0',
    volumeTransported: '0 t'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const currentUserId = userId || 'user-1'; // Utiliser l'ID utilisateur passé en props
        const searches = await UserSearchHistoryService.getRecentSearchesWithStatus(currentUserId, 10);
        
        const completedSearches = searches.filter(search => search.status === 'completed');
        const totalVolume = completedSearches.reduce((sum, search) => sum + search.quantite, 0);
        
        let totalMissions = 0;
        let searchesWithTop3Success = 0;
        let totalSearchesWithContacts = 0;
        
        for (const search of completedSearches) {
          try {
            const contacts = await UserSearchHistoryService.getTransporterContacts(search._id);
            
            if (contacts.length > 0) {
              totalSearchesWithContacts++;
              
              const validatedContacts = contacts.filter(contact => contact.status === 'yes');
              totalMissions += validatedContacts.length;
              
              const top3Contacts = contacts
                .filter(contact => !contact.isAlternative) 
                .slice(0, 3); 
              
              const hasTop3Success = top3Contacts.some(contact => contact.status === 'yes');
              
              if (hasTop3Success) {
                searchesWithTop3Success++;
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des contacts:', error);
          }
        }
        
        const successRate = totalSearchesWithContacts > 0 
          ? Math.round((searchesWithTop3Success / totalSearchesWithContacts) * 100)
          : 0;
        
        setStats({
          successRate: `${successRate} %`,
          missionsInProgress: totalMissions.toString(),
          volumeTransported: `${totalVolume} t`
        });
      } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const statsData = [
    {
      label: 'Taux de réussite Top 3',
      value: stats.successRate,
      icon: TrendingUp,
      status: 'success',
      bgColor: '#E8F5E9',
      iconColor: '#4CAF50',
    },
    {
      label: 'Missions en cours',
      value: stats.missionsInProgress,
      icon: Package,
      bgColor: '#E3F2FD',
      iconColor: '#2196F3',
    },
    {
      label: 'Volume transporté ce mois',
      value: stats.volumeTransported,
      icon: Weight,
      bgColor: '#FFF3E0',
      iconColor: '#FF9800',
    },
  ];

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle>Mes indicateurs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-100 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg transition-all hover:scale-[1.02]"
                style={{ backgroundColor: stat.bgColor }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                  </div>
                  <span className="text-sm text-gray-700">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" style={{ color: stat.iconColor }}>
                    {stat.value}
                  </span>
                  {stat.status === 'success' && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

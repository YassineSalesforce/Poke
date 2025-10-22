import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, MessageSquare, Clock } from 'lucide-react';
import { UserSearchHistoryService, SearchWithStatus } from '../services/UserSearchHistoryService';

interface AlertsCardProps {
  userId?: string;
}

export function AlertsCard({ userId }: AlertsCardProps) {
  const [alerts, setAlerts] = useState([
    {
      icon: AlertCircle,
      message: '0 missions incomplètes',
      time: 'Mis à jour maintenant',
      color: '#F6A20E',
      bgColor: '#FFF3E0',
    },
    {
      icon: MessageSquare,
      message: 'En attente de réponse du transporteur',
      time: '0 transporteurs en attente',
      color: '#2196F3',
      bgColor: '#E3F2FD',
    },
    {
      icon: Clock,
      message: '1 mission expire dans 24h',
      time: 'Il y a 1 jour',
      color: '#FF5722',
      bgColor: '#FFE8E5',
    },
  ]);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const currentUserId = userId || 'user-1'; // Utiliser l'ID utilisateur passé en props
        const allSearches = await UserSearchHistoryService.getUserSearchHistory(currentUserId);
        
        // Compter les recherches en attente et en cours
        const incompleteSearches = allSearches.filter(search => 
          search.status === 'pending' || search.status === 'in-progress'
        );
        
        const incompleteCount = incompleteSearches.length;
        
        // Compter les transporteurs en attente de réponse
        let pendingTransportersCount = 0;
        for (const search of allSearches) {
          try {
            const contacts = await UserSearchHistoryService.getTransporterContacts(search._id);
            const pendingContacts = contacts.filter(contact => contact.status === 'pending');
            pendingTransportersCount += pendingContacts.length;
          } catch (error) {
            console.error('Erreur lors de la récupération des contacts:', error);
          }
        }
        
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => {
            if (alert.icon === AlertCircle) {
              return {
                ...alert,
                message: `${incompleteCount} mission${incompleteCount > 1 ? 's' : ''} incomplète${incompleteCount > 1 ? 's' : ''}`,
                time: 'Mis à jour maintenant'
              };
            } else if (alert.icon === MessageSquare) {
              return {
                ...alert,
                message: `En attente de réponse du transporteur`,
                time: `${pendingTransportersCount} transporteur${pendingTransportersCount > 1 ? 's' : ''} en attente`
              };
            }
            return alert;
          })
        );
      } catch (error) {
        console.error('Erreur lors du chargement des alertes:', error);
      }
    };

    loadAlerts();
  }, []);

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle>Alertes & notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg hover:scale-[1.02] transition-all cursor-pointer"
              style={{ backgroundColor: alert.bgColor }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'white' }}
              >
                <Icon className="w-4 h-4" style={{ color: alert.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

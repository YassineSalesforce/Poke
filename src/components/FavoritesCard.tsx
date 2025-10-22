import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Star, Truck, MapPin } from 'lucide-react';

export function FavoritesCard() {
  const favorites = [
    {
      type: 'transporteur',
      name: 'Transport Express SA',
      detail: '98% de fiabilité',
      icon: Truck,
    },
    {
      type: 'transporteur',
      name: 'Logistique Europe',
      detail: '45 missions réussies',
      icon: Truck,
    },
    {
      type: 'route',
      name: 'Paris → Lyon',
      detail: 'Route fréquente (24 missions)',
      icon: MapPin,
    },
  ];

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle>Favoris</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {favorites.map((favorite, index) => {
          const Icon = favorite.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-200"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F4F5F7' }}
              >
                <Icon className="w-5 h-5" style={{ color: '#2B3A55' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  <span className="text-sm">{favorite.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{favorite.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

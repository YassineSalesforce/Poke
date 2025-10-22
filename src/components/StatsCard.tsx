import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Package, Weight } from 'lucide-react';

export function StatsCard() {
  const stats = [
    {
      label: 'Taux de réussite Top 3',
      value: '82 %',
      icon: TrendingUp,
      status: 'success',
      bgColor: '#E8F5E9',
      iconColor: '#4CAF50',
    },
    {
      label: 'Missions en cours',
      value: '12',
      icon: Package,
      bgColor: '#E3F2FD',
      iconColor: '#2196F3',
    },
    {
      label: 'Volume transporté ce mois',
      value: '480 t',
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
        {stats.map((stat, index) => {
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
        })}
      </CardContent>
    </Card>
  );
}

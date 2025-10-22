import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, MessageSquare, Clock } from 'lucide-react';

export function AlertsCard() {
  const alerts = [
    {
      icon: AlertCircle,
      message: '3 missions incomplètes',
      time: 'Il y a 2h',
      color: '#F6A20E',
      bgColor: '#FFF3E0',
    },
    {
      icon: MessageSquare,
      message: '2 nouveaux retours transporteurs',
      time: 'Il y a 5h',
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
  ];

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

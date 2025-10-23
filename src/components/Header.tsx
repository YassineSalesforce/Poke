import { Search, Plus, Route, ChevronDown, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNewSearch: () => void;
  onManageRoutes?: () => void;
  onDashboard?: () => void;
  onLogout: () => void;
}

export function Header({ onNewSearch, onManageRoutes, onDashboard, onLogout }: HeaderProps) {
  const { user } = useAuth();

  const handleLogout = () => {
    onLogout();
  };

  return (
    <header className="px-8 py-4" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="flex items-center justify-between gap-8">
        {/* Logo officiel */}
        <div className="flex items-center gap-3">
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onDashboard) {
                onDashboard();
              }
            }}
            className="transition-all duration-300 hover:scale-105"
            style={{ 
              fontSize: '1.5rem',
              fontWeight: '800',
              color: 'white',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            Affréteur IA
          </a>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher un transporteur, une mission ou une route"
            className="pl-10 bg-gray-50 border-gray-200 rounded-lg h-11"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={onNewSearch}
            className="rounded-lg h-11 px-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: '#F6A20E', color: 'white' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle recherche
          </Button>

          {onManageRoutes && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="rounded-lg h-11 px-6"
                >
                  Administration
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onManageRoutes} className="cursor-pointer">
                  <Route className="w-4 h-4 mr-2" />
                  Gestion des routes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <Avatar className="w-10 h-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback style={{ backgroundColor: '#2B3A55', color: 'white' }}>
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex flex-col cursor-pointer">
                  <span className="text-sm font-medium" style={{ color: 'white' }}>
                    {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { motion } from "motion/react";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

interface LoginFormProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onClose, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      // La redirection se fait automatiquement via AuthContext
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto p-8 bg-white shadow-2xl"
      style={{
        borderRadius: '24px'
      }}
    >
      <div className="mb-8 text-center">
        <h2 className="text-gray-900 mb-2">Connexion</h2>
        <p className="text-gray-600">Accédez à votre espace transporteur</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              className="pl-12 h-14 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-3"
              style={{
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem'
              }}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700">
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="pl-12 h-14 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-3"
              style={{
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem'
              }}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="size-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
            <span className="text-gray-600">Se souvenir de moi</span>
          </label>
          <a href="#" className="transition-colors" style={{ color: '#fbbf24' }}>
            Mot de passe oublié ?
          </a>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-black rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            border: 'none'
          }}
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>

        <div className="text-center text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <button 
            type="button"
            onClick={onSwitchToRegister}
            className="transition-colors" 
            style={{ color: '#fbbf24' }}
          >
            S'inscrire
          </button>
        </div>
      </form>
    </motion.div>
  );
}

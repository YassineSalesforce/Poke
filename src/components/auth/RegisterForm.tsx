import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { motion } from "motion/react";
import { Mail, Lock, User, Building, Phone } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

interface RegisterFormProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onClose, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const userData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
    };

    try {
      await register(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
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
        <h2 className="text-gray-900 mb-2">Inscription</h2>
        <p className="text-gray-600">Créez votre compte transporteur</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {/* Première ligne - Prénom et Nom */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-700">
              Prénom
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Votre prénom"
                className="pl-12 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-2"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem'
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-gray-700">
              Nom
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Votre nom"
                className="pl-12 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-2"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem'
                }}
                required
              />
            </div>
          </div>
        </div>

        {/* Deuxième ligne - Email et Téléphone */}
        <div className="grid grid-cols-2 gap-4">
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
                className="pl-12 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-2"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem'
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700">
              Téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                className="pl-12 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-2"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem'
                }}
                required
              />
            </div>
          </div>
        </div>

        {/* Troisième ligne - Entreprise et Mot de passe */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company" className="text-gray-700">
              Entreprise
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                id="company"
                name="company"
                type="text"
                placeholder="Nom de votre entreprise"
                className="pl-12 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-2"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem'
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
                className="pl-12 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-base py-2"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem'
                }}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="size-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
            <span className="text-gray-600">J'accepte les conditions d'utilisation</span>
          </label>
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
          {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
        </Button>

        <div className="text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <button 
            type="button"
            onClick={onSwitchToLogin}
            className="transition-colors" 
            style={{ color: '#fbbf24' }}
          >
            Se connecter
          </button>
        </div>
      </form>
    </motion.div>
  );
}

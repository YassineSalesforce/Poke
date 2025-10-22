import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText,
  Search,
  Phone,
  Mail,
  Map,
  TrendingUp,
  Users,
  Package,
  Route as RouteIcon,
  Download,
  CheckCircle,
  Circle,
  Play
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { Progress } from './ui/progress';

interface ProcessOverviewProps {
  onBackToDashboard: () => void;
  onStartNewMission: () => void;
  onNavigateToStep?: (step: number) => void;
}

interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'in-progress' | 'upcoming';
  details: string[];
  screenName: string;
}

export function ProcessOverview({ onBackToDashboard, onStartNewMission, onNavigateToStep }: ProcessOverviewProps) {
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const steps: ProcessStep[] = [
    {
      id: 1,
      title: 'Besoin exprimé',
      description: 'L\'affréteur définit l\'origine, la destination, le type de véhicule et la quantité à transporter.',
      icon: FileText,
      status: 'completed',
      details: [
        'Sélection de l\'origine et destination',
        'Choix du type de véhicule',
        'Définition de la quantité à transporter',
        'Ajout de contraintes spéciales (ADR, température...)',
      ],
      screenName: 'Formulaire de besoin',
    },
    {
      id: 2,
      title: 'Résultats et ranking',
      description: 'Le système propose les transporteurs les plus adaptés selon les routes et la confiance.',
      icon: Search,
      status: 'completed',
      details: [
        'Analyse automatique des routes disponibles',
        'Calcul du score de pertinence',
        'Affichage du Top 3 recommandé',
        'Transporteurs alternatifs suggérés',
      ],
      screenName: 'Résultats de recherche',
    },
    {
      id: 3,
      title: 'Saisie des retours',
      description: 'L\'affréteur enregistre les réponses et le système met à jour le "reste à prendre".',
      icon: Phone,
      status: 'completed',
      details: [
        'Enregistrement des réponses (Oui/Non/En attente)',
        'Saisie du nombre d\'ensembles pris',
        'Ajout de commentaires transporteur',
        'Mise à jour dynamique du reste à prendre',
      ],
      screenName: 'Saisie des retours',
    },
    {
      id: 4,
      title: 'Ordres de mission générés',
      description: 'Les documents PDF sont édités et envoyés aux transporteurs.',
      icon: Mail,
      status: 'completed',
      details: [
        'Génération automatique des ordres PDF',
        'Prévisualisation des documents',
        'Envoi par email aux transporteurs',
        'Export groupé de tous les ordres',
      ],
      screenName: 'Ordres de mission',
    },
    {
      id: 5,
      title: 'Mise à jour des routes',
      description: 'Les routes sont automatiquement suggérées ou ajoutées au profil du transporteur.',
      icon: Map,
      status: 'completed',
      details: [
        'Détection automatique de nouvelles routes',
        'Suggestions basées sur l\'historique',
        'Ajout rapide depuis les suggestions',
        'Mise à jour du réseau transporteur',
      ],
      screenName: 'Gestion des routes',
    },
  ];

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const handleStepClick = (step: ProcessStep) => {
    setSelectedStep(step);
    setIsDrawerOpen(true);
  };

  const handleNavigateToScreen = () => {
    if (selectedStep && onNavigateToStep) {
      onNavigateToStep(selectedStep.id);
      setIsDrawerOpen(false);
    }
  };

  const getStatusConfig = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Terminé',
          color: 'bg-green-100 text-green-700',
          icon: CheckCircle,
        };
      case 'in-progress':
        return {
          label: 'En cours',
          color: 'bg-amber-100 text-amber-700',
          icon: Circle,
        };
      case 'upcoming':
        return {
          label: 'À venir',
          color: 'bg-gray-100 text-gray-700',
          icon: Circle,
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F5F7' }}>
      {/* Header */}
      <header className="px-8 py-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Logo officiel */}
            <div className="flex items-center gap-3">
              <a 
                href="/" 
                className="transition-all duration-300 hover:scale-105"
                style={{ 
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: 'white',
                  textDecoration: 'none'
                }}
              >
                TransportHub
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onBackToDashboard}
                className="rounded-lg h-11 px-6"
              >
                Retour au tableau de bord
              </Button>
              <Button
                onClick={onStartNewMission}
                className="rounded-lg h-11 px-6 transition-all hover:shadow-lg"
                style={{ backgroundColor: '#F6A20E', color: 'white' }}
              >
                <Play className="w-4 h-4 mr-2" />
                Démarrer une nouvelle mission
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBackToDashboard}
                  className="cursor-pointer hover:underline"
                  style={{ color: 'white' }}
                >
                  Tableau de bord
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Vue globale du processus</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 style={{ color: '#2B3A55' }}>Vue globale du processus d'affrètement</h1>
            <p className="text-gray-600">
              Visualisez l'ensemble du cycle, de la création du besoin à la génération des ordres de mission
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="shadow-md border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" style={{ color: '#F6A20E' }} />
                  <span>Progression globale</span>
                </div>
                <span style={{ color: '#F6A20E' }}>{completedSteps} / {steps.length} étapes</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-16 left-0 right-0 h-1 bg-gray-200 z-0" style={{ margin: '0 10%' }} />
            <motion.div 
              className="absolute top-16 left-0 h-1 z-0"
              style={{ 
                backgroundColor: '#F6A20E',
                margin: '0 10%',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(progressPercentage / 100) * 80}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Steps */}
            <div className="grid grid-cols-5 gap-4 relative z-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const statusConfig = getStatusConfig(step.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                  >
                    <Card 
                      className="shadow-md border-gray-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer overflow-hidden"
                      onClick={() => handleStepClick(step)}
                      style={{
                        borderColor: step.status === 'completed' ? '#F6A20E' : undefined,
                        borderWidth: step.status === 'completed' ? '2px' : '1px',
                      }}
                    >
                      <CardContent className="p-6">
                        {/* Step Number Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge 
                            className="text-xs"
                            style={{ backgroundColor: '#2B3A55', color: 'white' }}
                          >
                            #{step.id}
                          </Badge>
                        </div>

                        {/* Icon */}
                        <div className="flex flex-col items-center text-center space-y-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-20 h-20 rounded-full flex items-center justify-center relative"
                            style={{ 
                              backgroundColor: step.status === 'completed' ? '#FFF3E0' : '#F4F5F7',
                            }}
                          >
                            <Icon 
                              className="w-10 h-10" 
                              style={{ color: step.status === 'completed' ? '#F6A20E' : '#717182' }}
                            />
                            {step.status === 'completed' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.15 + 0.3 }}
                                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.div>

                          {/* Title */}
                          <div>
                            <h3 
                              className="mb-2"
                              style={{ color: step.status === 'completed' ? '#F6A20E' : '#2B3A55' }}
                            >
                              {step.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Global Summary */}
          <div className="grid grid-cols-2 gap-6">
            {/* Summary Stats */}
            <Card className="shadow-md border-gray-200">
              <CardContent className="p-6">
                <h2 className="mb-4" style={{ color: '#2B3A55' }}>Récapitulatif global de mission</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">Transporteurs contactés</span>
                    </div>
                    <p className="text-2xl text-blue-700">8</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">Taux de réussite Top 3</span>
                    </div>
                    <p className="text-2xl text-green-700">87%</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-600">Volume transporté</span>
                    </div>
                    <p className="text-2xl text-purple-700">135 t</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RouteIcon className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-gray-600">Routes ajoutées</span>
                    </div>
                    <p className="text-2xl text-amber-700">3</p>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 rounded-lg h-11"
                  style={{ backgroundColor: '#F6A20E', color: 'white' }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter le résumé du processus
                </Button>
              </CardContent>
            </Card>

            {/* Process Visualization */}
            <Card className="shadow-md border-gray-200 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-6">
                <h2 className="mb-4" style={{ color: '#2B3A55' }}>Efficacité du processus</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Temps moyen par mission</span>
                      <span className="text-sm" style={{ color: '#F6A20E' }}>2h 15min</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Taux d'automatisation</span>
                      <span className="text-sm" style={{ color: '#F6A20E' }}>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Satisfaction transporteurs</span>
                      <span className="text-sm" style={{ color: '#F6A20E' }}>4.7/5</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-900">Processus optimisé</p>
                      <p className="text-xs text-green-700 mt-1">
                        Votre workflow est 35% plus rapide que la moyenne du secteur
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-white">
            <CardContent className="p-8 text-center">
              <h2 className="mb-2" style={{ color: '#2B3A55' }}>Prêt à optimiser votre prochain affrètement ?</h2>
              <p className="text-gray-600 mb-6">
                Notre IA vous accompagne à chaque étape pour gagner du temps et maximiser votre efficacité
              </p>
              <Button
                onClick={onStartNewMission}
                size="lg"
                className="rounded-lg h-12 px-8 text-lg"
                style={{ backgroundColor: '#F6A20E', color: 'white' }}
              >
                <Play className="w-5 h-5 mr-2" />
                Démarrer une nouvelle mission
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affréteur IA – Gestion intelligente du transport © 2025
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="#" className="hover:underline">Mentions légales</a>
            <span>|</span>
            <a href="#" className="hover:underline">Aide</a>
            <span>|</span>
            <a href="#" className="hover:underline">Contacter le support</a>
          </div>
        </div>
      </footer>

      {/* Step Detail Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <DrawerContent className="fixed inset-y-0 right-0 mt-0 w-[500px] rounded-none">
          {selectedStep && (
            <>
              <DrawerHeader className="border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <DrawerTitle>{selectedStep.title}</DrawerTitle>
                    <DrawerDescription>Étape {selectedStep.id} sur {steps.length}</DrawerDescription>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <span className="sr-only">Close</span>
                      ✕
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FFF3E0' }}
                  >
                    {(() => {
                      const Icon = selectedStep.icon;
                      return <Icon className="w-12 h-12" style={{ color: '#F6A20E' }} />;
                    })()}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="mb-2" style={{ color: '#2B3A55' }}>Description</h3>
                  <p className="text-sm text-gray-600">{selectedStep.description}</p>
                </div>

                {/* Details */}
                <div>
                  <h3 className="mb-3" style={{ color: '#2B3A55' }}>Actions de cette étape</h3>
                  <ul className="space-y-2">
                    {selectedStep.details.map((detail, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F6A20E' }} />
                        <span>{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Screen Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Écran associé :</strong> {selectedStep.screenName}
                  </p>
                </div>

                {/* Status */}
                <div>
                  {(() => {
                    const statusConfig = getStatusConfig(selectedStep.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <Badge className={`${statusConfig.color} flex items-center gap-2 text-sm py-2 px-4`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              <DrawerFooter className="border-t border-gray-200">
                <Button
                  onClick={handleNavigateToScreen}
                  className="w-full rounded-lg h-11"
                  style={{ backgroundColor: '#F6A20E', color: 'white' }}
                >
                  Voir l'écran correspondant
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full rounded-lg h-11"
                >
                  Fermer
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MissionDetailsService } from '../services/MissionDetailsService';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { 
  MapPin, 
  Truck, 
  ArrowRight,
  FileText,
  Mail,
  Download,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  Package,
  Home,
  PartyPopper,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface MissionOrdersProps {
  onBack: () => void;
  onBackToDashboard?: () => void;
  searchCriteria?: any;
  carrierReturns?: any[];
  searchId?: string;
  onLogout: () => void;
}

interface OrderData {
  id: string;
  carrierName: string;
  route: string;
  vehicleType: string;
  merchandise: string;
  ensembles: number;
  weight: number;
  loadingLocation: string;
  loadingDate: string;
  loadingTime: string;
  deliveryLocation: string;
  deliveryDate: string;
  deliveryTime: string;
  pricePerEnsemble: number;
  totalPrice: number;
  status: 'validated' | 'pending';
  generated: boolean;
  sent: boolean;
}

export function MissionOrders({ onBack, onBackToDashboard, searchCriteria, carrierReturns, searchId, onLogout }: MissionOrdersProps) {
  const { user } = useAuth();

  const handleLogout = () => {
    onLogout();
  };
  const [missionDetails, setMissionDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMissionDetails = async () => {
      if (!searchId) {
        setLoading(false);
        return;
      }

      try {
        console.log('📡 MissionOrders - Chargement des détails de mission pour searchId:', searchId);
        const details = await MissionDetailsService.getMissionDetailsBySearchId(searchId);
        console.log('📊 MissionOrders - Détails de mission reçus:', details);
        setMissionDetails(details);
      } catch (error) {
        console.error('❌ MissionOrders - Erreur lors du chargement des détails:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMissionDetails();
  }, [searchId]);

  const extractCityAndPostalCode = (fullAddress: string) => {
    if (!fullAddress) return 'Adresse non définie';
    
    const parts = fullAddress.split(',');
    if (parts.length >= 1) {
      const cityPart = parts[0].trim();
      const cityMatch = cityPart.match(/^(.+?)\s+(\d{5})$/);
      if (cityMatch) {
        return `${cityMatch[1]} ${cityMatch[2]}`;
      }
      if (cityPart.length > 0) {
        return cityPart;
      }
    }
    return fullAddress;
  };

  const generateOrdersFromReturns = () => {
    if (!carrierReturns || carrierReturns.length === 0) {
      return [];
    }

    return carrierReturns
      .filter(carrier => carrier.response === 'yes' && carrier.ensemblesTaken) // Seulement les confirmés
      .map((carrier, index) => {
        const details = missionDetails.find(detail => detail.transporterId === carrier.id);
        console.log('📋 Détails de mission pour', carrier.name, ':', details);
        console.log('📞 Phone:', details?.phone, 'Email:', details?.email);
        
        return {
          id: `order-${index + 1}`,
          carrierName: carrier.name,
          route: carrier.route,
          vehicleType: searchCriteria?.typeVehicule || 'Tous',
          merchandise: details?.merchandise || 'Granulats',
          ensembles: parseInt(carrier.ensemblesTaken) || 0,
          weight: parseInt(carrier.ensemblesTaken) * 27, // Estimation: 27T par ensemble
          loadingLocation: searchCriteria?.departAdresse || 'Départ',
          loadingDate: details?.loadingDate ? new Date(details.loadingDate).toLocaleDateString('fr-FR') : new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          loadingTime: details?.loadingTime || '08h00',
          deliveryLocation: searchCriteria?.arriveeAdresse || 'Arrivée',
          deliveryDate: details?.deliveryDate ? new Date(details.deliveryDate).toLocaleDateString('fr-FR') : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          deliveryTime: details?.deliveryTime || '18h00',
          pricePerEnsemble: details?.estimatedPrice || 1200,
          totalPrice: parseInt(carrier.ensemblesTaken) * (details?.estimatedPrice || 1200),
          status: 'validated' as const,
          generated: false,
          sent: false,
          notes: details?.notes || '',
          phone: details?.phone || carrier.phone || '',
          email: details?.email || carrier.email || ''
        };
      });
  };

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      setOrders(generateOrdersFromReturns());
    }
  }, [missionDetails, loading, carrierReturns]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [showAllExportedModal, setShowAllExportedModal] = useState(false);

  const totalEnsembles = orders.reduce((sum, order) => sum + order.ensembles, 0);
  const totalEstimated = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const allGenerated = orders.every(order => order.generated);

  const generateOrderPDF = async (order: OrderData): Promise<Blob> => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    const addText = (text: string, x: number, y: number, options: any = {}) => {
      doc.setFontSize(options.fontSize || 12);
      doc.setTextColor(options.color || '#000000');
      doc.setFont(options.font || 'helvetica', options.style || 'normal');
      doc.text(text, x, y);
    };

    const addLine = (y: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
    };

    addText('Ordre de Mission Transport', pageWidth / 2, yPosition, { 
      fontSize: 18, 
      style: 'bold',
      color: '#2B3A55'
    });
    yPosition += 20;

    addText('ORDRE DE MISSION TRANSPORT', pageWidth / 2, yPosition, { 
      fontSize: 16, 
      style: 'bold',
      color: '#F6A20E'
    });
    yPosition += 15;
    addLine(yPosition);
    yPosition += 10;

    const leftColumn = 20;
    const rightColumn = pageWidth / 2 + 10;

    addText('Affréteur : SELI BORDEAUX', leftColumn, yPosition, { style: 'bold' });
    addText('Date : ' + new Date().toLocaleDateString('fr-FR'), rightColumn, yPosition, { style: 'bold' });
    yPosition += 10;

    const orderNumber = `OMD-2025-${order.id.slice(-6).toUpperCase()}`;
    addText('Référence mission : ' + orderNumber, leftColumn, yPosition, { style: 'bold' });
    yPosition += 15;

    addText('Transporteur : ' + order.carrierName, leftColumn, yPosition, { style: 'bold' });
    yPosition += 8;
    const email = order.email || 'contact@' + order.carrierName.toLowerCase().replace(/\s+/g, '-') + '.fr';
    const phone = order.phone || '+33 5 56 00 00 00';
    addText('Contact : ' + email + ' / ' + phone, leftColumn, yPosition);
    yPosition += 15;

    addText('Type de véhicule : ' + order.vehicleType, leftColumn, yPosition, { style: 'bold' });
    yPosition += 8;
    addText('Marchandise : ' + order.merchandise, leftColumn, yPosition, { style: 'bold' });
    yPosition += 8;
    addText('Quantité affectée : ' + order.ensembles + ' tonne' + (order.ensembles > 1 ? 's' : ''), leftColumn, yPosition, { style: 'bold' });
    yPosition += 15;
    addLine(yPosition);
    yPosition += 10;

    addText('Chargement :', leftColumn, yPosition, { style: 'bold' });
    yPosition += 8;
    addText('> ' + order.loadingLocation, leftColumn, yPosition);
    yPosition += 6;
    addText('> ' + order.loadingDate + ' – ' + order.loadingTime, leftColumn, yPosition);
    yPosition += 15;

    addText('Livraison :', leftColumn, yPosition, { style: 'bold' });
    yPosition += 8;
    addText('> ' + order.deliveryLocation, leftColumn, yPosition);
    yPosition += 6;
    addText('> ' + order.deliveryDate + ' – ' + order.deliveryTime, leftColumn, yPosition);
    yPosition += 15;
    addLine(yPosition);
    yPosition += 10;

    addText('Tarification :', leftColumn, yPosition, { style: 'bold' });
    yPosition += 8;
    addText(order.pricePerEnsemble + ' € / tonne', leftColumn, yPosition);
    yPosition += 6;
    addText('Total : ' + order.totalPrice + ' € HT', leftColumn, yPosition, { style: 'bold' });

    yPosition = pageHeight - 30;
    addText('Document généré automatiquement le ' + new Date().toLocaleString('fr-FR'), pageWidth / 2, yPosition, { 
      fontSize: 10, 
      color: '#666666' 
    });

    return doc.output('blob');
  };

  const handleGenerateOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const pdfBlob = await generateOrderPDF(order);
    
    const fileName = `Ordre_Mission_${order.carrierName.replace(/\s+/g, '_')}_${orderId.slice(-6)}.pdf`;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, generated: true } : o
    ));
  };

  const handleSendToCarrier = (orderId: string, carrierName: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, sent: true } : order
    ));
    setSelectedCarrier(carrierName);
    setShowSendModal(true);
  };

  const handleExportAll = async () => {
    try {
      const zip = new JSZip();
      
      for (const order of orders) {
        const pdfBlob = await generateOrderPDF(order);
        const fileName = `Ordre_Mission_${order.carrierName.replace(/\s+/g, '_')}_${order.id.slice(-6)}.pdf`;
        zip.file(fileName, pdfBlob);
        
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.id === order.id ? { ...o, generated: true } : o
          )
        );
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ordres_Mission_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowAllExportedModal(true);
    } catch (error) {
      console.error('Erreur lors de la génération du ZIP:', error);
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
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onBackToDashboard) {
                    onBackToDashboard();
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

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1.5 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Mission complète ✅
              </Badge>
              <Button
                variant="outline"
                onClick={onBack}
                className="rounded-lg h-11 px-6"
              >
                Retour aux retours
              </Button>
              <Button
                onClick={handleExportAll}
                className="rounded-lg h-11 px-6 transition-all hover:shadow-lg"
                style={{ backgroundColor: '#F6A20E', color: 'white' }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter tous les ordres (ZIP)
              </Button>

              {/* Profil utilisateur */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} />
                  <AvatarFallback style={{ backgroundColor: '#2B3A55', color: 'white' }}>
                    {user?.firstName?.[0] || 'J'}{user?.lastName?.[0] || 'D'}
                  </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex flex-col cursor-pointer">
                      <span className="text-sm font-medium" style={{ color: 'white' }}>
                        {user ? `${user.firstName || 'Jean'} ${user.lastName || 'Dupont'}` : 'Utilisateur'}
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

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBackToDashboard || (() => window.location.reload())}
                  className="cursor-pointer hover:underline text-white"
                >
                  Tableau de bord
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBack}
                  className="cursor-pointer hover:underline text-white"
                >
                  Résultats
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBack}
                  className="cursor-pointer hover:underline text-white"
                >
                  Saisie des retours
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Ordres de mission</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Title */}
          <div>
            <h1 className="mb-2" style={{ color: '#2B3A55' }}>Aperçu et génération des ordres de mission</h1>
            <p className="text-gray-600">
              Visualisez, vérifiez et générez les documents d'ordre de mission
            </p>
          </div>

          {/* Global Summary Banner */}
          <Card className="shadow-md border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Route */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: '#2B3A55' }} />
                      <div>
                        <p className="text-sm text-gray-500">Origine</p>
                        <span>{searchCriteria?.departAdresse ? extractCityAndPostalCode(searchCriteria.departAdresse) : 'Bordeaux (33)'}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 mt-3" />
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: '#F6A20E' }} />
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <span>{searchCriteria?.arriveeAdresse ? extractCityAndPostalCode(searchCriteria.arriveeAdresse) : 'Laval (53)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & Merchandise */}
                  <div className="pl-8 border-l border-gray-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Type : {searchCriteria?.typeVehicule || 'Tous'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="pl-8 border-l border-gray-200">
                    <p className="text-sm text-gray-500">Quantité totale</p>
                    <p>{totalEnsembles} tonnes</p>
                  </div>

                  {/* Dates */}
                  <div className="pl-8 border-l border-gray-200 space-y-2">
                    <div className="flex items-center gap-2">
                      
                    </div>
                    <div className="flex items-center gap-2">
                      
                    </div>
                  </div>
                </div>

                {/* Coverage Indicator */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#E0E0E0"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#4CAF50"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm" style={{ color: '#2B3A55' }}>100%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Couvert</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-[1fr_350px] gap-6">
            {/* Mission Orders List */}
            <div className="space-y-4">
              <h2 style={{ color: '#2B3A55' }}>Ordres de mission par transporteur</h2>
              
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="shadow-md border-gray-200 hover:shadow-lg transition-all overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#2B3A55' }}>
                              <Truck className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg">{order.carrierName}</h3>
                              <p className="text-sm text-gray-600">{order.route}</p>
                            </div>
                          </div>
                          <Badge className={`${order.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} flex items-center gap-1`}>
                            {order.status === 'validated' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {order.status === 'validated' ? 'Validé' : 'En attente'}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        {/* Mission Details */}
                        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
                          <div>
                            <p className="text-sm text-gray-500">Type de véhicule</p>
                            <p className="text-sm">{order.vehicleType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Marchandise</p>
                            <p className="text-sm">{order.merchandise}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Quantité</p>
                            <p className="text-sm">{order.ensembles} tonne{order.ensembles > 1 ? 's' : ''} </p>
                          </div>
                        </div>

                        {/* Locations */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-blue-700" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">Chargement</p>
                              <p className="text-sm">{order.loadingLocation}</p>
                              <p className="text-sm text-gray-600 mt-1">{order.loadingDate} – {order.loadingTime}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-orange-700" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">Livraison</p>
                              <p className="text-sm">{order.deliveryLocation}</p>
                              <p className="text-sm text-gray-600 mt-1">{order.deliveryDate} – {order.deliveryTime}</p>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Tarification estimée</span>
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-600">{order.pricePerEnsemble} € / tonne</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-lg" style={{ color: '#2B3A55' }}>Total {order.totalPrice} € HT</span>
                          </div>
                        </div>

                        {/* PDF Preview */}
                        <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded transform rotate-12">
                            Prévisualisation
                          </div>
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Ordre de mission #{order.id}</p>
                          <p className="text-xs text-gray-500 mt-1">PDF – Format A4 – Prêt à imprimer</p>
                          
                          {order.generated && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </motion.div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={() => handleGenerateOrder(order.id)}
                            disabled={order.generated}
                            className="flex-1 rounded-lg h-11 transition-all hover:shadow-lg disabled:opacity-50"
                            style={{ backgroundColor: order.generated ? '#4CAF50' : '#F6A20E', color: 'white' }}
                          >
                            {order.generated ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Ordre généré
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Générer ordre de mission (PDF)
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleSendToCarrier(order.id, order.carrierName)}
                            disabled={!order.generated}
                            variant="outline"
                            className="rounded-lg h-11 px-6 disabled:opacity-50"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {order.sent ? 'Envoyé' : 'Envoyer'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <Card className="shadow-md border-gray-200 sticky top-6">
                <CardContent className="p-6 space-y-4">
                  <h3 style={{ color: '#2B3A55' }}>Récapitulatif global</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total transporteurs</span>
                      <span className="text-lg" style={{ color: '#2B3A55' }}>{orders.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Quantité attribuée</span>
                      <span className="text-lg text-green-700">{totalEnsembles} / {totalEnsembles}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total estimé</span>
                      <span className="text-lg text-blue-700">{totalEstimated.toLocaleString()} € HT</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleExportAll}
                      className="w-full rounded-lg h-11 transition-all hover:shadow-lg"
                      style={{ backgroundColor: '#F6A20E', color: 'white' }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter tout (ZIP)
                    </Button>
                  </div>

                  {allGenerated && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-100 border border-green-300 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <PartyPopper className="w-5 h-5 text-green-700" />
                        <p className="text-sm text-green-900">Mission finalisée 🎉</p>
                      </div>
                      <p className="text-xs text-green-700">Tous les ordres ont été générés avec succès.</p>
                      
                      {onBackToDashboard && (
                        <Button
                          onClick={onBackToDashboard}
                          variant="outline"
                          className="w-full mt-3 rounded-lg border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Home className="w-4 h-4 mr-2" />
                          Retour à l'accueil
                        </Button>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Ordres de mission générés automatiquement à partir des données validées – Affréteur IA © 2025
          </p>
          <a
            href="#"
            className="text-sm hover:underline transition-colors"
            style={{ color: '#2B3A55' }}
          >
            Voir l'historique complet de la mission
          </a>
        </div>
      </footer>

      {/* Success Modal for All Export */}
      <Dialog open={showAllExportedModal} onOpenChange={setShowAllExportedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </motion.div>
            </div>
            <DialogTitle className="text-center">Ordres générés avec succès</DialogTitle>
            <DialogDescription className="text-center">
              Les {orders.length} ordres de mission ont été générés et enregistrés avec succès.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{order.carrierName}</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAllExportedModal(false)}
              className="w-full rounded-lg"
              style={{ backgroundColor: '#F6A20E', color: 'white' }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <Mail className="w-8 h-8 text-blue-600" />
              </motion.div>
            </div>
            <DialogTitle className="text-center">Ordre envoyé</DialogTitle>
            <DialogDescription className="text-center">
              ✉️ Ordre envoyé à {selectedCarrier} – {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowSendModal(false)}
              className="w-full rounded-lg"
              style={{ backgroundColor: '#2B3A55', color: 'white' }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

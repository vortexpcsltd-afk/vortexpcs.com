import { Package, Search, Wrench, Truck, CheckCircle, Clock, MapPin, Shield, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';
const backgroundImage = 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBwYyUyMHNldHVwfGVufDF8fHx8MTc2MDUxOTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080';

interface RepairServiceProps {
  onNavigate: (page: string) => void;
}

export function RepairService({ onNavigate }: RepairServiceProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Details
    name: '',
    email: '',
    phone: '',
    // Collection Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    // Device Information
    deviceType: '',
    deviceModel: '',
    issueDescription: '',
    devicePassword: '',
    // Collection Preferences
    preferredDate: '',
    timeSlot: '',
    specialInstructions: '',
    // Additional Options
    insuranceCover: false,
    dataBackup: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Express Collect & Repair booking submitted! We\'ll contact you within 24 hours to confirm collection. (Mock functionality)');
    setModalOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      deviceType: '',
      deviceModel: '',
      issueDescription: '',
      devicePassword: '',
      preferredDate: '',
      timeSlot: '',
      specialInstructions: '',
      insuranceCover: false,
      dataBackup: false,
    });
  };

  const processSteps = [
    {
      icon: Package,
      title: 'We Collect',
      description: 'Book a collection slot. We\'ll pick up your PC from anywhere in the UK using secure, insured courier service.',
    },
    {
      icon: Search,
      title: 'We Diagnose',
      description: 'Our expert technicians thoroughly test and diagnose your PC. You\'ll receive a detailed report within 24 hours.',
    },
    {
      icon: Wrench,
      title: 'You Approve',
      description: 'We provide a fixed-price quote with no hidden fees. Repair only proceeds with your explicit consent.',
    },
    {
      icon: CheckCircle,
      title: 'We Repair',
      description: 'Using premium parts and industry-leading techniques, we repair your PC to factory standards or better.',
    },
    {
      icon: Truck,
      title: 'We Return',
      description: 'Your PC is thoroughly tested, cleaned, and returned to you fully functional with a service report.',
    },
  ];

  const serviceFeatures = [
    {
      icon: Clock,
      title: 'Fast Turnaround',
      description: '48-72 hour standard service, express options available',
    },
    {
      icon: Shield,
      title: 'No Fix, No Fee',
      description: 'If we can\'t fix it, you don\'t pay for the repair',
    },
    {
      icon: MapPin,
      title: 'UK-Wide Coverage',
      description: 'Collection and return from any UK mainland address',
    },
  ];

  const turnaroundTiers = [
    { tier: 'Standard', time: '3–5 working days', price: 'Included in base price', icon: Clock },
    { tier: 'Fast', time: '1–2 working days', price: '+£40 surcharge', icon: Clock },
    { tier: 'Express', time: 'Same‑day / next‑day', price: '+£80 surcharge', icon: Clock },
  ];

  const serviceCategories = [
    {
      icon: Search,
      title: 'Core Diagnostics & Setup',
      color: 'blue',
      services: [
        { name: 'Full System Diagnostics', price: '£49', description: 'Comprehensive hardware & software health check, error logs, thermal testing.' },
        { name: 'OS Reinstallation & Optimisation', price: '£99', description: 'Clean install of Windows with drivers, updates, and performance tuning.' },
        { name: 'System Tune‑Up & Cleanup', price: '£79', description: 'Malware scan, registry cleanup, startup optimisation, patching.' },
      ],
    },
    {
      icon: Shield,
      title: 'Security & Data',
      color: 'purple',
      services: [
        { name: 'Virus & Malware Removal', price: '£99', description: 'Deep scans, removal of infections, patching vulnerabilities.' },
        { name: 'Data Backup & Transfer', price: '£79', description: 'Secure migration to new device or drive (up to 200GB, then +£10 per 100GB).' },
        { name: 'Data Recovery (Logical)', price: 'from £180', description: 'Recovery from corrupted OS or non‑physical drive faults.' },
        { name: 'Data Recovery (Physical)', price: 'from £350', description: 'Specialist clean‑room recovery for damaged drives.' },
      ],
    },
    {
      icon: Wrench,
      title: 'Hardware Repairs & Upgrades',
      color: 'pink',
      services: [
        { name: 'Hard Drive / SSD Replacement', price: '£120 + parts', description: '' },
        { name: 'RAM Upgrade / Replacement', price: '£60 + parts', description: '' },
        { name: 'Power Supply Replacement', price: '£120 + parts', description: '' },
        { name: 'Motherboard Replacement', price: '£180 + parts', description: '' },
        { name: 'Graphics Card Replacement', price: '£99 + parts', description: '' },
        { name: 'CPU Replacement / Upgrade', price: '£120 + parts', description: '' },
      ],
    },
    {
      icon: Package,
      title: 'Screen, Case & Peripherals',
      color: 'blue',
      services: [
        { name: 'Laptop Screen Replacement', price: 'from £180', description: 'Parts included.' },
        { name: 'Laptop Keyboard Replacement', price: 'from £99', description: 'Parts included.' },
        { name: 'Laptop Power Socket Repair', price: '£120–£199', description: 'Plus parts.' },
        { name: 'Case & Cooling Service', price: '£99', description: '' },
      ],
    },
    {
      icon: MapPin,
      title: 'Networking & Software',
      color: 'purple',
      services: [
        { name: 'Wi‑Fi & Network Troubleshooting', price: '£79', description: '' },
        { name: 'Email & Software Setup', price: '£60', description: '' },
        { name: 'Custom Software Configuration', price: 'from £99', description: '' },
      ],
    },
    {
      icon: CheckCircle,
      title: 'Premium Services',
      color: 'pink',
      services: [
        { name: 'Custom PC Build Assembly', price: '£180', description: '' },
        { name: 'Gaming Optimisation Package', price: '£120', description: '' },
        { name: 'Business IT Care Package', price: 'from £250', description: '' },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block">
              <div className="glass px-4 py-2 rounded-full mb-6 inline-flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">UK-Wide PC Repair Service</span>
              </div>
            </div>
            <h1 className="mb-6">
              <span className="block">Collect & Return</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                PC Repair Service
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12">
              Professional PC diagnostics and repair from the comfort of your home. 
              We collect, diagnose, repair, and return your PC anywhere in the UK.
            </p>
            
            {/* High-Impact CTA Section */}
            <div className="max-w-4xl mx-auto">
              <Card className="glass-strong border-cyan-400/30 p-8 relative overflow-hidden group">
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-block mb-4">
                      <div className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40">
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-semibold">
                          ⚡ Free Collection & Return
                        </span>
                      </div>
                    </div>
                    <h3 className="mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      Book Your PC Collection Now
                    </h3>
                    <p className="text-gray-300 text-lg mb-8">
                      Expert diagnosis in 24 hours · No fix, no fee · 3 year warranty included
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="lg"
                          className="text-lg px-12 h-14 shadow-2xl shadow-cyan-400/40 animate-pulse hover:animate-none"
                        >
                          <Package className="w-6 h-6 mr-3" />
                          Book Free Collection
                          <span className="ml-3 text-2xl">→</span>
                        </Button>
                      </DialogTrigger>
                <DialogContent className="glass-strong max-w-3xl max-h-[90vh] overflow-y-auto border-white/20 backdrop-blur-xl">
                  <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-400" />
                      </div>
                      <DialogTitle className="text-3xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Book Express Collect & Repair
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400 text-base">
                      Fill out the form below and we'll contact you within 24 hours to arrange collection.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <Tabs defaultValue="personal" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 glass p-1 gap-1">
                        <TabsTrigger 
                          value="personal" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all duration-300"
                        >
                          Personal
                        </TabsTrigger>
                        <TabsTrigger 
                          value="device" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 transition-all duration-300"
                        >
                          Device
                        </TabsTrigger>
                        <TabsTrigger 
                          value="collection" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 transition-all duration-300"
                        >
                          Collection
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Personal Details Tab */}
                      <TabsContent value="personal" className="space-y-6 mt-6">
                        <Card className="glass border-white/10 p-6">
                          <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-200 flex items-center gap-2">
                                  <span className="text-blue-400">●</span> Full Name *
                                </Label>
                                <Input
                                  id="name"
                                  required
                                  placeholder="John Smith"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone" className="text-gray-200 flex items-center gap-2">
                                  <span className="text-purple-400">●</span> Phone Number *
                                </Label>
                                <Input
                                  id="phone"
                                  type="tel"
                                  required
                                  placeholder="07XXX XXXXXX"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="bg-white/5 border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400 transition-all"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-gray-200 flex items-center gap-2">
                                <span className="text-blue-400">●</span> Email Address *
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                required
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 transition-all"
                              />
                            </div>
                          </div>
                        </Card>

                        <Card className="glass border-white/10 p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <h4 className="text-sm text-gray-200">Collection Address</h4>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="address1" className="text-gray-200">Address Line 1 *</Label>
                              <Input
                                id="address1"
                                required
                                placeholder="123 High Street"
                                value={formData.addressLine1}
                                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 transition-all"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="address2" className="text-gray-200">Address Line 2</Label>
                              <Input
                                id="address2"
                                placeholder="Flat 4B (optional)"
                                value={formData.addressLine2}
                                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 transition-all"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="city" className="text-gray-200">City *</Label>
                                <Input
                                  id="city"
                                  required
                                  placeholder="London"
                                  value={formData.city}
                                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                  className="bg-white/5 border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="postcode" className="text-gray-200">Postcode *</Label>
                                <Input
                                  id="postcode"
                                  required
                                  placeholder="SW1A 1AA"
                                  value={formData.postcode}
                                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                  className="bg-white/5 border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </TabsContent>
                      
                      {/* Device Information Tab */}
                      <TabsContent value="device" className="space-y-6 mt-6">
                        <Card className="glass border-white/10 p-6">
                          <div className="space-y-5">
                            <div className="space-y-2">
                              <Label htmlFor="deviceType" className="text-gray-200 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-blue-400" />
                                Device Type *
                              </Label>
                              <Select
                                value={formData.deviceType}
                                onValueChange={(value) => setFormData({ ...formData, deviceType: value })}
                                required
                              >
                                <SelectTrigger className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                                  <SelectValue placeholder="Select your device type" />
                                </SelectTrigger>
                                <SelectContent className="glass-strong border-white/20">
                                  <SelectItem value="desktop">🖥️ Desktop PC</SelectItem>
                                  <SelectItem value="laptop">💻 Laptop</SelectItem>
                                  <SelectItem value="gaming-pc">🎮 Gaming PC</SelectItem>
                                  <SelectItem value="workstation">🏢 Workstation</SelectItem>
                                  <SelectItem value="all-in-one">📱 All-in-One PC</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="deviceModel" className="text-gray-200 flex items-center gap-2">
                                <span className="text-purple-400">●</span> Device Model / Description *
                              </Label>
                              <Input
                                id="deviceModel"
                                required
                                placeholder="e.g., Dell XPS 13, Custom Build with RTX 4080"
                                value={formData.deviceModel}
                                onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400 transition-all"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="issue" className="text-gray-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-400" />
                                Issue Description *
                              </Label>
                              <Textarea
                                id="issue"
                                required
                                rows={5}
                                placeholder="Please describe the problem you're experiencing in detail..."
                                value={formData.issueDescription}
                                onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder:text-gray-400 transition-all"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="password" className="text-gray-200 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-400" />
                                Device Password / PIN *
                              </Label>
                              <Input
                                id="password"
                                required
                                type="password"
                                placeholder="Enter login password, PIN, or passcode"
                                value={formData.devicePassword}
                                onChange={(e) => setFormData({ ...formData, devicePassword: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400 transition-all"
                              />
                              <Card className="glass p-4 border-yellow-500/30 bg-yellow-500/5">
                                <div className="flex gap-3">
                                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm text-yellow-400 mb-1">Important Security Notice</p>
                                    <p className="text-xs text-gray-300">
                                      Our technicians need access to your device to perform diagnostics and repairs. Failure to provide the correct password/PIN will delay the start of any work.
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        </Card>
                      </TabsContent>
                      
                      {/* Collection Preferences Tab */}
                      <TabsContent value="collection" className="space-y-6 mt-6">
                        <Card className="glass border-white/10 p-6">
                          <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="date" className="text-gray-200 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-blue-400" />
                                  Preferred Collection Date *
                                </Label>
                                <Input
                                  id="date"
                                  type="date"
                                  required
                                  value={formData.preferredDate}
                                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                                  className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="timeSlot" className="text-gray-200 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-purple-400" />
                                  Time Slot *
                                </Label>
                                <Select
                                  value={formData.timeSlot}
                                  onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}
                                  required
                                >
                                  <SelectTrigger className="bg-white/5 border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all">
                                    <SelectValue placeholder="Select time slot" />
                                  </SelectTrigger>
                                  <SelectContent className="glass-strong border-white/20">
                                    <SelectItem value="morning">☀️ Morning (9am - 12pm)</SelectItem>
                                    <SelectItem value="afternoon">🌤️ Afternoon (12pm - 5pm)</SelectItem>
                                    <SelectItem value="evening">🌙 Evening (5pm - 8pm)</SelectItem>
                                    <SelectItem value="anytime">⏰ Anytime</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="instructions" className="text-gray-200 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                Special Instructions
                              </Label>
                              <Textarea
                                id="instructions"
                                rows={3}
                                placeholder="Any special instructions for collection (e.g., gate code, parking notes)"
                                value={formData.specialInstructions}
                                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder:text-gray-400 transition-all"
                              />
                            </div>
                          </div>
                        </Card>

                        <Card className="glass border-white/10 p-6">
                          <h4 className="text-sm text-gray-200 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            Additional Options
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-600/5 border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer group">
                              <Checkbox
                                id="insurance"
                                checked={formData.insuranceCover}
                                onCheckedChange={(checked) => setFormData({ ...formData, insuranceCover: checked as boolean })}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label htmlFor="insurance" className="text-sm text-gray-200 cursor-pointer flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                  <Shield className="w-4 h-4 text-blue-400" />
                                  Add Insurance Cover (+£15)
                                </Label>
                                <p className="text-xs text-gray-400 mt-1">
                                  Protect your device during transit with comprehensive insurance coverage
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-600/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group">
                              <Checkbox
                                id="backup"
                                checked={formData.dataBackup}
                                onCheckedChange={(checked) => setFormData({ ...formData, dataBackup: checked as boolean })}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label htmlFor="backup" className="text-sm text-gray-200 cursor-pointer flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                                  <Package className="w-4 h-4 text-purple-400" />
                                  Data Backup Service (+£25)
                                </Label>
                                <p className="text-xs text-gray-400 mt-1">
                                  We'll create a full backup of your data before any repairs begin
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                        
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 group"
                        >
                          <CheckCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          Confirm Collection Booking
                          <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                        </Button>
                        
                        <p className="text-xs text-gray-400 text-center p-3 glass rounded-lg border border-white/10">
                          🔒 By submitting this form, you agree to our terms of service. We'll contact you within 24 hours to confirm collection details.
                        </p>
                      </TabsContent>
                    </Tabs>
                  </form>
                </DialogContent>
                    </Dialog>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 h-14"
                      onClick={() => onNavigate('dashboard')}
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Track Existing Repair
                    </Button>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-cyan-400/20">
                    <div className="text-center">
                      <div className="text-cyan-400 text-2xl mb-1">10k+</div>
                      <div className="text-gray-400 text-sm">Repairs Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-cyan-400 text-2xl mb-1">4.9★</div>
                      <div className="text-gray-400 text-sm">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-cyan-400 text-2xl mb-1">24hr</div>
                      <div className="text-gray-400 text-sm">Diagnosis Time</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {serviceFeatures.map((feature, index) => (
            <Card key={index} className="glass p-6 border-white/10 text-center rgb-glow">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-blue-400" />
              </div>
              <h4 className="mb-2">{feature.title}</h4>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="mb-4">How Our Service Works</h2>
          <p className="text-xl text-gray-400">Simple, transparent, and stress-free</p>
        </div>
        <div className="space-y-8">
          {processSteps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="glass p-8 border-white/10 hover:border-blue-400/40 transition-all rgb-glow">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center relative">
                      <step.icon className="w-8 h-8 text-blue-400" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>
              </Card>
              {index < processSteps.length - 1 && (
                <div className="ml-8 w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Repair & Service Menu */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Comprehensive Service Menu</span>
          </div>
          <h2 className="mb-4">VortexPCs Repair & Service Menu</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Professional repair services with transparent pricing and guaranteed workmanship. Choose your turnaround time to suit your needs.
          </p>
        </div>

        {/* Turnaround Tiers */}
        <Card className="glass border-white/10 p-8 mb-12 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl">Turnaround Tiers</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {turnaroundTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`p-5 rounded-xl border transition-all ${
                  index === 0 
                    ? 'bg-white/5 border-white/10 hover:border-blue-500/30' 
                    : index === 1
                    ? 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/20 hover:border-blue-500/40'
                    : 'bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${index === 0 ? 'text-gray-400' : index === 1 ? 'text-blue-400' : 'text-purple-400'}`} />
                  <h4 className="text-base">{tier.tier}</h4>
                </div>
                <p className="text-sm text-gray-300 mb-2">{tier.time}</p>
                <p className={`text-lg ${index === 0 ? 'text-gray-400' : index === 1 ? 'text-blue-400' : 'text-purple-400'}`}>
                  {tier.price}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Service Categories */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {serviceCategories.map((category, catIndex) => (
            <Card key={catIndex} className="glass border-white/10 p-6 hover:border-blue-500/20 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                  category.color === 'blue' ? 'from-blue-500/20 to-blue-600/20' :
                  category.color === 'purple' ? 'from-purple-500/20 to-purple-600/20' :
                  'from-pink-500/20 to-pink-600/20'
                } flex items-center justify-center`}>
                  <category.icon className={`w-5 h-5 ${
                    category.color === 'blue' ? 'text-blue-400' :
                    category.color === 'purple' ? 'text-purple-400' :
                    'text-pink-400'
                  }`} />
                </div>
                <h3 className="text-lg">{category.title}</h3>
              </div>
              <div className="space-y-4">
                {category.services.map((service, serviceIndex) => (
                  <div key={serviceIndex} className="flex justify-between items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-1">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          category.color === 'blue' ? 'text-blue-400' :
                          category.color === 'purple' ? 'text-purple-400' :
                          'text-pink-400'
                        }`} />
                        <div>
                          <h5 className="text-sm text-gray-200 group-hover:text-white transition-colors">{service.name}</h5>
                          {service.description && (
                            <p className="text-xs text-gray-400 mt-1">{service.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm whitespace-nowrap ${
                      category.color === 'blue' ? 'text-blue-400' :
                      category.color === 'purple' ? 'text-purple-400' :
                      'text-pink-400'
                    }`}>
                      {service.price}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Customer Notes */}
        <Card className="glass border-white/10 p-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-xl">Important Information</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">All prices include VAT but exclude parts unless stated.</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">Every repair comes with a 90‑day workmanship warranty.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">No Fix, No Fee guarantee on diagnostics and repairs.</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">For certain services, we may require your system login details (with your consent) to complete testing or repairs.</p>
              </div>
            </div>
          </div>
        </Card>
      </section>



      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Card className="glass p-12 text-center border-white/10 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rgb-glow">
          <h2 className="mb-4">Why Trust Vortex with Your Repair?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Over 10 years of experience building and repairing custom PCs. 
            Every repair is handled by certified technicians using genuine parts.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: '5,000+', label: 'Repairs Completed' },
              { number: '98%', label: 'Success Rate' },
              { number: '4.9/5', label: 'Customer Rating' },
              { number: '24hr', label: 'Avg. Diagnosis Time' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Floating CTA Button - Desktop */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setModalOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group px-8 py-6 text-lg"
        >
          <Package className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          Book Collection Now
          <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
        </Button>
      </div>

      {/* Sticky Bottom CTA Bar - Mobile & Tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 backdrop-blur-xl p-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg group"
          >
            <Package className="w-5 h-5 mr-2" />
            Book a Collection
            <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

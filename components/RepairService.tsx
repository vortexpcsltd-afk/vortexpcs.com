<<<<<<< HEAD
import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Wrench, Truck, Shield, Clock, MapPin, Phone, Mail, CheckCircle, AlertTriangle, Star, Calendar, Package, Key } from 'lucide-react';

export function RepairService() {
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    issueType: '',
    description: '',
    urgency: '',
    collectionMethod: '',
    customerInfo: {},
    preferredDate: '',
    pcPassword: ''
  });

  const repairServices = [
    {
      title: 'Hardware Diagnostics',
      description: 'Complete system diagnosis to identify hardware issues',
      price: 'Free',
      duration: '1-2 hours',
      icon: Wrench
    },
    {
      title: 'Component Replacement',
      description: 'Replace faulty components with genuine parts',
      price: 'From £50',
      duration: '2-5 days',
      icon: Package
    },
    {
      title: 'System Optimisation',
      description: 'Performance tuning and software optimisation',
      price: '£99',
      duration: '1-2 days',
      icon: Star
    },
    {
      title: 'Data Recovery',
      description: 'Professional data recovery from damaged drives',
      price: 'From £199',
      duration: '3-7 days',
      icon: Shield
    }
  ];

  const coverageAreas = [
    'London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield',
    'Bristol', 'Glasgow', 'Edinburgh', 'Newcastle', 'Nottingham', 'Cardiff'
  ];

  const testimonials = [
    {
      name: 'Alex Thompson',
      location: 'London',
      rating: 5,
      comment: 'Incredible service! They collected my PC, diagnosed the issue within hours, and had it back to me in perfect condition within 3 days.',
      repair: 'Graphics card replacement'
    },
    {
      name: 'Emma Wilson',
      location: 'Manchester',
      rating: 5,
      comment: 'Professional team, excellent communication throughout the process. They even optimised my system beyond the original repair.',
      repair: 'System optimisation'
    },
    {
      name: 'James Parker',
      location: 'Birmingham',
      rating: 5,
      comment: 'Thought my data was lost forever, but they recovered everything! Absolutely brilliant service.',
      repair: 'Data recovery'
    }
  ];

  const repairProcess = [
    {
      step: 1,
      title: 'Book Collection',
      description: 'Schedule a convenient time for us to collect your PC',
      icon: Calendar
    },
    {
      step: 2,
      title: 'Free Diagnosis',
      description: 'Our experts diagnose the issue within 24 hours',
      icon: Wrench
    },
    {
      step: 3,
      title: 'Approval & Repair',
      description: 'Get approval for repairs and we fix your PC',
      icon: CheckCircle
    },
    {
      step: 4,
      title: 'Safe Return',
      description: 'Your PC is returned fully tested and working',
      icon: Truck
    }
  ];

  const BookingForm = () => {
    const steps = ['Issue Details', 'Collection Method', 'Customer Information', 'Confirmation'];
    const progress = ((bookingStep + 1) / steps.length) * 100;

    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {bookingStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <h3 className="text-xl font-bold text-white">{steps[bookingStep]}</h3>
        </div>

        {bookingStep === 0 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white mb-3 block">What type of issue are you experiencing?</Label>
              <RadioGroup
                value={bookingData.issueType}
                onValueChange={(value) => setBookingData(prev => ({ ...prev, issueType: value }))}
                className="space-y-3"
              >
                {[
                  'PC won\'t turn on',
                  'Performance issues/slow speeds',
                  'Graphics/display problems',
                  'Overheating issues',
                  'Strange noises',
                  'Blue screen errors',
                  'Internet/connectivity issues',
                  'Other hardware issue'
                ].map((issue) => (
                  <div key={issue} className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                    <RadioGroupItem value={issue} id={issue} />
                    <Label htmlFor={issue} className="text-white cursor-pointer flex-1">{issue}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Describe the issue in detail</Label>
              <Textarea
                id="description"
                value={bookingData.description}
                onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide as much detail as possible about the problem..."
                className="bg-white/5 border-white/10 text-white mt-2"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-white mb-3 block">Select repair turnaround time</Label>
              <RadioGroup
                value={bookingData.urgency}
                onValueChange={(value) => setBookingData(prev => ({ ...prev, urgency: value }))}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="text-white cursor-pointer flex-1">
                    <div>Standard (3-6 days)</div>
                    <div className="text-sm text-gray-400">Free collection and return</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express" className="text-white cursor-pointer flex-1">
                    <div>Express (1-3 days) - £49 extra</div>
                    <div className="text-sm text-gray-400">Priority queue with expedited service</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  <RadioGroupItem value="24hour" id="24hour" />
                  <Label htmlFor="24hour" className="text-white cursor-pointer flex-1">
                    <div>24 Hour Service - £149 extra</div>
                    <div className="text-sm text-gray-400">Emergency repair for critical systems</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {bookingStep === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white mb-3 block">Collection service details</Label>
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <div className="flex items-start space-x-3">
                  <Truck className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-white mb-1">Free Collection & Return Service</div>
                    <div className="text-sm text-gray-400">
                      We'll collect your PC from your address at a convenient time and return it when the repair is complete. Available across the entire UK.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="area" className="text-white">Select your area</Label>
              <Select>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Choose your location" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {coverageAreas.map((area) => (
                    <SelectItem key={area} value={area.toLowerCase()} className="text-white focus:bg-white/10">
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preferredDate" className="text-white">Preferred collection date</Label>
              <Input
                id="preferredDate"
                type="date"
                value={bookingData.preferredDate}
                onChange={(e) => setBookingData(prev => ({ ...prev, preferredDate: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-2"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200 text-sm">
                <strong>Important:</strong> You'll need to provide your PC password in the next step. Without it, any repair work will be delayed until we receive full password access.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {bookingStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white">First Name</Label>
                <Input
                  id="firstName"
                  className="bg-white/5 border-white/10 text-white mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white">Last Name</Label>
                <Input
                  id="lastName"
                  className="bg-white/5 border-white/10 text-white mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                className="bg-white/5 border-white/10 text-white mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                className="bg-white/5 border-white/10 text-white mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-white">Full Address</Label>
              <Textarea
                id="address"
                className="bg-white/5 border-white/10 text-white mt-2"
                rows={3}
                placeholder="Include postcode for accurate collection"
                required
              />
            </div>

            <Separator className="border-white/10" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-blue-400" />
                <Label htmlFor="pcPassword" className="text-white">PC Password (Required)</Label>
              </div>
              <Input
                id="pcPassword"
                type="text"
                value={bookingData.pcPassword}
                onChange={(e) => setBookingData(prev => ({ ...prev, pcPassword: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter your Windows/Mac login password"
                required
              />
              <Alert className="border-blue-500/30 bg-blue-500/10 mt-3">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-200 text-sm">
                  <strong>Why we need this:</strong> Your password is required to carry out diagnostics, testing, and repairs on your system. Without full password access, repair work will be delayed until we can contact you. Your password is kept secure and confidential.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="text-white text-sm">
                I agree to the <span className="text-blue-400 underline">Terms of Service</span> and <span className="text-blue-400 underline">Privacy Policy</span>
              </Label>
            </div>
          </div>
        )}

        {bookingStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-gray-400">Your repair service has been successfully booked.</p>
            </div>

            <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 p-6">
              <h4 className="font-bold text-white mb-4">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Issue Type:</span>
                  <span className="text-white">{bookingData.issueType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Turnaround Time:</span>
                  <span className="text-white capitalize">{bookingData.urgency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Collection Method:</span>
                  <span className="text-white">Free Collection Service</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Booking Reference:</span>
                  <span className="text-white font-mono">VX-REP-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
              </div>
            </Card>

            <div className="text-center text-sm text-gray-400">
              <p>You will receive a confirmation email shortly with tracking details.</p>
              <p>Our team will contact you within 2 hours to confirm collection time.</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setBookingStep(Math.max(0, bookingStep - 1))}
            disabled={bookingStep === 0}
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </Button>

          <Button
            onClick={() => {
              if (bookingStep < 3) {
                setBookingStep(bookingStep + 1);
              }
            }}
            disabled={bookingStep === 3}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {bookingStep === 2 ? 'Confirm Booking' : bookingStep === 3 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
              <Wrench className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm text-blue-300">UK-Wide PC Repair Service</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Expert PC Repair
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Professional PC repair services with free collection and return across the UK. 
              Expert diagnostics, genuine parts, and comprehensive warranty on all repairs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Repair Service
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call: 0800 123 4567
              </Button>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Truck, title: 'Free Collection', desc: 'UK-wide pickup & return' },
                { icon: Clock, title: 'Fast Turnaround', desc: 'Most repairs in 2-5 days' },
                { icon: Shield, title: '90-Day Warranty', desc: 'All repairs guaranteed' },
                { icon: Wrench, title: 'Expert Technicians', desc: 'Certified professionals' }
              ].map((feature, index) => (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Repair Services */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-white">Our Repair Services</h2>
              <p className="text-gray-400 text-lg">Comprehensive PC repair solutions for all your needs</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {repairServices.map((service, index) => (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-gray-400 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      {service.price}
                    </Badge>
                    <span className="text-sm text-gray-400">{service.duration}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Repair Process */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-white">How It Works</h2>
              <p className="text-gray-400 text-lg">Simple, transparent process for all repairs</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {repairProcess.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Booking Form */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-white">Book Your Repair</h2>
              <p className="text-gray-400 text-lg">Get started with your PC repair in just a few steps</p>
            </div>

            <BookingForm />
          </section>

          {/* Testimonials */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-white">What Our Customers Say</h2>
              <p className="text-gray-400 text-lg">Trusted by thousands across the UK</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">"{testimonial.comment}"</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.location}</div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                      {testimonial.repair}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Coverage Area */}
          <section className="mb-20">
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 backdrop-blur-xl p-8 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">UK-Wide Coverage</h3>
              <p className="text-gray-300 text-lg mb-6">
                We provide free collection and return services across major UK cities
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {coverageAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="bg-white/10 text-white border-white/20">
                    {area}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Don't see your area? Contact us - we may still be able to help!
              </p>
            </Card>
          </section>
=======
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
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
        </div>
      </div>
    </div>
  );
}

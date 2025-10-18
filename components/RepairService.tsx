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
        </div>
      </div>
    </div>
  );
}

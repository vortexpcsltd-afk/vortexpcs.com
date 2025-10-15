import { Cpu, Wrench, Sparkles, Shield, Zap, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
const backgroundImage = 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBwYyUyMHNldHVwfGVufDF8fHx8MTc2MDUxOTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: Cpu,
      title: 'Custom PCs Built To Order',
      description: 'Every PC is built to order, tailored precisely to your needs and budget.',
    },
    {
      icon: Wrench,
      title: 'Collect & Return Service',
      description: 'UK-wide PC repair service. We collect, diagnose, and return your PC fully repaired.',
    },
    {
      icon: Shield,
      title: '3 Year Warranty Included',
      description: 'Expert technical support for the lifetime of your build. We\'re always here to help.',
    },
    {
      icon: Zap,
      title: '5-Day Order to Delivery',
      description: 'Quick build times and express repair options to get you up and running fast.',
    },
  ];

  const testimonials = [
    {
      name: 'James Mitchell',
      location: 'Manchester',
      text: 'Absolutely phenomenal service. My gaming PC arrived perfectly configured and runs like a dream. The attention to detail is incredible.',
      rating: 5,
    },
    {
      name: 'Sarah Thompson',
      location: 'London',
      text: 'The Collect & Return service saved me so much hassle. They diagnosed and fixed my PC within days. Highly professional.',
      rating: 5,
    },
    {
      name: 'David Chen',
      location: 'Birmingham',
      text: 'Kevin and the team really know their stuff. Built me a silent workstation that handles 4K editing effortlessly.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <div className="glass px-4 py-2 rounded-full mb-6 inline-flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">UK's Premier Custom PC Builder</span>
              </div>
            </div>
            <h1 className="max-w-4xl mx-auto">
              <span className="block">Custom PC in 5 Days.</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Amazon's Jealous.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-300">
              We don't do cookie‑cutter rigs. We do your rig—built fast, tested hard, and shipped before your next impulse buy arrives.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => onNavigate('finder')}
                size="lg"
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 shadow-2xl shadow-cyan-400/30 text-lg px-8 py-6"
              >
                Find Your Perfect PC
              </Button>
              <Button
                onClick={() => onNavigate('configurator')}
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/5 text-lg px-8 py-6"
              >
                Build Your Own
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" />
                <span>Vortex Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Lifetime Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="mb-4">Why Choose Vortex?</h2>
          <p className="text-xl text-gray-400">Class-leading service, premium builds, expert support</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="glass p-6 border-white/10 hover:border-cyan-400/40 transition-all group rgb-glow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400/10 to-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="mb-4">How It Works</h2>
          <p className="text-xl text-gray-400">From consultation to delivery in three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Find Your Build',
              description: 'Answer a few questions using our PC Finder, or build from scratch with our configurator.',
            },
            {
              step: '02',
              title: 'We Build It',
              description: 'Our expert technicians hand-build your PC using premium components and rigorous testing.',
            },
            {
              step: '03',
              title: 'Delivered & Supported',
              description: 'Your PC arrives ready to go, with lifetime support and our collect & return service.',
            },
          ].map((item, index) => (
            <div key={index} className="relative h-full">
              <div className="glass p-8 rounded-2xl border border-white/10 hover:border-cyan-400/40 transition-all h-full">
                <div className="text-6xl bg-gradient-to-br from-cyan-400 to-blue-400 bg-clip-text text-transparent opacity-20 mb-4">
                  {item.step}
                </div>
                <h3 className="mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
              {index < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="mb-4">What Our Customers Say</h2>
          <p className="text-xl text-gray-400">Trusted by PC enthusiasts across the UK</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="glass p-6 border-white/10 hover:border-blue-400/30 transition-all rgb-glow">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
              <div className="text-sm">
                <div className="text-white">{testimonial.name}</div>
                <div className="text-gray-500">{testimonial.location}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass rounded-3xl p-12 text-center relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="relative z-10">
            <h2 className="mb-4">Ready to Build Your Dream PC?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Start with our PC Finder to get a personalised recommendation, or dive straight into our configurator.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => onNavigate('finder')}
                size="lg"
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 shadow-xl shadow-cyan-400/30"
              >
                Start PC Finder
              </Button>
              <Button
                onClick={() => onNavigate('repair')}
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/5"
              >
                Learn About Repairs
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

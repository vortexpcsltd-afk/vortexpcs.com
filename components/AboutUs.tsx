import React from 'react';
import { Heart, Award, Zap, Shield, Users, Target, Cpu, Wrench, CheckCircle2, Star, TrendingUp, Clock } from 'lucide-react';
import { Card } from './ui/card';

interface AboutUsProps {
  onNavigate?: (view: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps = {}) {
  const values = [
    {
      icon: Heart,
      title: 'Passion for Excellence',
      description: 'Every PC is a testament to my commitment to perfection and attention to detail. I don\'t just build computers—I craft experiences.'
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      description: 'Only premium components make it into Vortex builds. 3-year warranties and rigorous testing ensure your investment is protected.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast Delivery',
      description: 'Your custom-built PC delivered in just 5 days. Express builds without compromising on quality or attention to detail.'
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'Your satisfaction is my obsession. From consultation to delivery and beyond, expect exceptional service every step of the way.'
    }
  ];

  const milestones = [
    { stat: '20+', label: 'Years Experience', icon: TrendingUp },
    { stat: '1000+', label: 'PCs Built', icon: Cpu },
    { stat: '5', label: 'Day Builds', icon: Clock },
    { stat: '3', label: 'Year Warranty', icon: Shield }
  ];

  const expertise = [
    'Custom Gaming Rigs',
    'Professional Workstations',
    'Content Creation Systems',
    'Performance Overclocking',
    'Cable Management Artistry',
    'RGB Lighting Design',
    'Liquid Cooling Solutions',
    'Silent PC Builds',
    'Upgrade Consultations',
    'Performance Optimisation',
    'System Diagnostics',
    'Hardware Selection'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-black to-black"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-sky-500/20 rounded-full">
              <Star className="w-4 h-4 text-sky-400" />
              <span className="text-sm text-sky-400">Est. 2025</span>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-white">
                About Vortex PCs
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto"></div>
            </div>

            {/* Intro text */}
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Where <span className="text-sky-400">passion</span> meets <span className="text-sky-400">precision</span>, 
              and every build is a masterpiece engineered for peak performance.
            </p>
          </div>
        </div>
      </div>

      {/* Founder Section */}
      <div className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/50 to-black"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Image placeholder */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="relative aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                    <div className="text-center space-y-4 p-8">
                      <Cpu className="w-24 h-24 text-sky-400 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-2xl text-white">Kevin Mackay</h3>
                        <p className="text-sky-400">Founder & Master Builder</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-white">
                      The Man Behind the Builds
                    </h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-sky-500 to-transparent"></div>
                  </div>

                  <div className="space-y-4 text-gray-300">
                    <p>
                      Founded in 2025 by <span className="text-white">Kevin Mackay</span>, Vortex PCs Ltd was born from a 
                      lifelong passion for technology and an unwavering commitment to excellence.
                    </p>
                    <p>
                      As a <span className="text-sky-400">Gen X gamer</span> and entrepreneur with <span className="text-sky-400">over 20 years</span> of 
                      hands-on PC building experience, I've witnessed the evolution of computing firsthand—from the early 
                      days of enthusiast builds to today's cutting-edge systems.
                    </p>
                    <p>
                      What sets Vortex apart is my <span className="text-white">fanatical attention to detail</span>. Every 
                      cable is perfectly routed, every component meticulously selected, and every system rigorously tested. 
                      I don't build PCs to meet expectations—I build them to <span className="text-sky-400">exceed them</span>.
                    </p>
                    <p className="text-white border-l-2 border-sky-500 pl-4 italic">
                      "Your PC isn't just a machine—it's an investment in performance, reliability, and peace of mind. 
                      That's why every Vortex build carries my personal guarantee of excellence."
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="pt-4">
                    <p className="text-xl text-sky-400" style={{ fontFamily: 'cursive' }}>Kevin Mackay</p>
                    <p className="text-sm text-gray-500">Founder, Vortex PCs Ltd</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/20 to-black"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-white">Our Core Values</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto"></div>
              <p className="text-gray-400 max-w-2xl mx-auto">
                The principles that drive every decision, every build, and every customer interaction
              </p>
            </div>

            {/* Values grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card 
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-xl border-white/10 p-8 hover:border-sky-500/30 transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                  <div className="relative space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 rounded-xl group-hover:scale-110 transition-transform duration-500">
                      <value.icon className="w-7 h-7 text-sky-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl text-white">{value.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/50 to-black"></div>
        <div className="absolute left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] animate-pulse"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {milestones.map((milestone, index) => (
                <Card 
                  key={index}
                  className="relative group bg-white/5 backdrop-blur-xl border-white/10 p-8 text-center hover:border-sky-500/30 transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-500/0 to-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                  <div className="relative space-y-4">
                    <milestone.icon className="w-10 h-10 text-sky-400 mx-auto group-hover:scale-110 transition-transform duration-500" />
                    <div className="text-4xl text-white group-hover:text-sky-400 transition-colors duration-500">
                      {milestone.stat}
                    </div>
                    <div className="text-sm text-gray-400">{milestone.label}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expertise */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/20 to-black"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-sky-500/20 rounded-full">
                <Wrench className="w-4 h-4 text-sky-400" />
                <span className="text-sm text-sky-400">20+ Years of Expertise</span>
              </div>
              <h2 className="text-white">
                Comprehensive PC Building Services
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto"></div>
            </div>

            {/* Expertise grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {expertise.map((item, index) => (
                <div 
                  key={index}
                  className="group flex items-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg hover:border-sky-500/30 hover:bg-sky-500/5 transition-all duration-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/50 to-black"></div>
        <div className="absolute top-20 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-white">
                    The Vortex Difference
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto"></div>
                </div>

                <div className="space-y-6 text-gray-300 text-left">
                  <p className="text-lg leading-relaxed">
                    When you choose Vortex PCs, you're not just getting a computer—you're getting a 
                    <span className="text-white"> handcrafted masterpiece</span> built by someone who genuinely cares about 
                    your experience.
                  </p>
                  
                  <p className="leading-relaxed">
                    Every system is built to order with <span className="text-sky-400">premium components</span>, 
                    meticulously assembled with attention to every detail, from perfect cable management to optimal 
                    airflow. I personally test and optimise each build before it reaches your door.
                  </p>

                  <p className="leading-relaxed">
                    With <span className="text-sky-400">5-day express builds</span> and an industry-leading 
                    <span className="text-sky-400"> 3-year warranty</span>, you get peace of mind knowing your investment 
                    is protected. And with my collect & return repair service covering the whole of the UK, support is 
                    never far away.
                  </p>

                  <p className="leading-relaxed">
                    But what truly sets Vortex apart is the <span className="text-white">personal touch</span>. As a 
                    small business, I'm not just the owner—I'm the person who will consult with you, select your 
                    components, build your PC, and ensure you're completely satisfied. Your success is my success, 
                    and I take that responsibility seriously.
                  </p>

                  <div className="pt-6 border-t border-white/10 text-center">
                    <p className="text-xl text-sky-400">
                      Welcome to the Vortex family. Let's build something extraordinary together.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/30 to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-white">
              Ready to Experience the Vortex Difference?
            </h2>
            <p className="text-gray-300 text-lg">
              Let's discuss your perfect build and bring your vision to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => onNavigate?.('pc-builder')}
                className="group relative px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                <span className="relative flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Start Building Your PC
                </span>
              </button>
              <button 
                onClick={() => onNavigate?.('contact')}
                className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 text-white rounded-lg hover:bg-sky-500/5 transition-all duration-300"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

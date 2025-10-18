<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send, Bot, User, Sparkles, Cpu, Monitor, HardDrive, Zap, DollarSign, MessageCircle, Settings, Search, X, Minimize2 } from 'lucide-react';

export function AIAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm VortexAI, your personal PC building assistant. I can help you choose the perfect components, check compatibility, and answer any questions about building your dream PC. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
=======
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Cpu, Zap, HelpCircle, TrendingUp, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantProps {
  currentPage: string;
  userContext?: {
    budget?: number;
    useCase?: string;
    selectedComponents?: any;
  };
}

export function AIAssistant({ currentPage, userContext }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

<<<<<<< HEAD
  const predefinedResponses = {
    'gaming': {
      content: "For gaming, I'd recommend focusing on a powerful GPU and CPU combination. What's your budget and what resolution do you want to game at?",
      suggestions: ['Budget gaming build', '4K gaming setup', 'Competitive esports build']
    },
    'budget': {
      content: "I can help you build a great PC within any budget! What's your target price range, and what will you primarily use the PC for?",
      suggestions: ['£500-800 budget', '£800-1500 mid-range', '£1500+ high-end']
    },
    'compatibility': {
      content: "I'll check component compatibility for you! Make sure your CPU socket matches your motherboard, your PSU can handle your GPU's power requirements, and your case fits all components.",
      suggestions: ['Check my build', 'Socket compatibility', 'Power requirements']
    },
    'workstation': {
      content: "For professional work, prioritise CPU cores, RAM capacity, and fast storage. What type of work will you be doing? Video editing, 3D rendering, programming, or general business tasks?",
      suggestions: ['Video editing build', '3D rendering setup', 'Programming workstation']
    }
  };

  const getAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Specific responses for Quick Action questions
    if (lowerMessage.includes('what cpu should i choose') || lowerMessage.includes('cpu recommendations')) {
      return {
        content: "For CPU recommendations, here's what I suggest based on different use cases:\n\n🎮 **Gaming**: AMD Ryzen 5 7600X or Intel i5-13600K offer excellent performance\n💻 **Productivity**: AMD Ryzen 7 7700X or Intel i7-13700K for content creation\n🚀 **High-End**: AMD Ryzen 9 7900X or Intel i9-13900K for maximum performance\n\nWhat's your primary use case and budget range?",
        suggestions: ['Gaming CPU under £300', 'Best productivity CPU', 'Budget CPU options']
      };
    } else if (lowerMessage.includes('best graphics card for gaming') || lowerMessage.includes('gpu for gaming')) {
      return {
        content: "Here are my top GPU recommendations for gaming:\n\n🎯 **1080p Gaming**: RTX 4060 or RX 7600 (£250-300)\n🎮 **1440p Gaming**: RTX 4070 or RX 7700 XT (£450-550)\n🚀 **4K Gaming**: RTX 4080 or RTX 4090 (£1000+)\n\nThe RTX cards also support DLSS and ray tracing for enhanced visuals. What resolution do you plan to game at?",
        suggestions: ['1440p gaming build', '4K gaming setup', 'Ray tracing performance']
      };
    } else if (lowerMessage.includes('ssd vs hdd') || lowerMessage.includes('storage options')) {
      return {
        content: "Here's the breakdown between SSD and HDD storage:\n\n⚡ **SSD Advantages**:\n• 10x faster loading times\n• Silent operation\n• More reliable\n• Better for OS and games\n\n💾 **HDD Advantages**:\n• Much cheaper per GB\n• Great for mass storage\n• Good for backups\n\n**Recommendation**: 1TB NVMe SSD for OS + games, 2TB HDD for storage",
        suggestions: ['Best gaming SSDs', 'NVMe vs SATA', 'Storage capacity planning']
      };
    } else if (lowerMessage.includes('power supply') || lowerMessage.includes('psu') || lowerMessage.includes('how much power')) {
      return {
        content: "PSU wattage depends on your components:\n\n⚡ **Budget Build** (RTX 4060): 650W PSU\n🎮 **Mid-Range** (RTX 4070): 750W PSU\n🚀 **High-End** (RTX 4080/4090): 850W+ PSU\n\n**Key factors**: GPU power draw, CPU power, future upgrades\n**Recommended brands**: Corsair, EVGA, Seasonic (80+ Gold rated)\n\nWhat GPU are you planning to use?",
        suggestions: ['PSU calculator', 'Modular vs non-modular', '80+ efficiency ratings']
      };
    } else if (lowerMessage.includes('best pc build for £1000') || lowerMessage.includes('budget builds')) {
      return {
        content: "Here's an excellent £1000 gaming build:\n\n🎮 **£1000 Gaming Build**:\n• CPU: AMD Ryzen 5 7600 (£200)\n• GPU: RTX 4060 Ti (£400)\n• RAM: 16GB DDR5-5600 (£80)\n• Storage: 1TB NVMe SSD (£60)\n• Motherboard: B650 (£120)\n• PSU: 650W 80+ Gold (£80)\n• Case: Mid-tower (£60)\n\nThis build handles 1440p gaming at high settings beautifully!",
        suggestions: ['£800 budget build', '£1500 high-end build', 'Upgrade priority order']
      };
    } else if (lowerMessage.includes('gaming') || lowerMessage.includes('game')) {
      return predefinedResponses.gaming;
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return predefinedResponses.budget;
    } else if (lowerMessage.includes('compatible') || lowerMessage.includes('compatibility')) {
      return predefinedResponses.compatibility;
    } else if (lowerMessage.includes('work') || lowerMessage.includes('professional') || lowerMessage.includes('editing')) {
      return predefinedResponses.workstation;
    } else if (lowerMessage.includes('ryzen') || lowerMessage.includes('intel')) {
      return {
        content: "Great choice! Both AMD Ryzen and Intel offer excellent processors. Ryzen typically offers better value and more cores, while Intel often has slightly better gaming performance. What's your specific use case?",
        suggestions: ['Ryzen vs Intel', 'Best gaming CPU', 'Productivity CPU']
      };
    } else if (lowerMessage.includes('rtx') || lowerMessage.includes('nvidia') || lowerMessage.includes('graphics')) {
      return {
        content: "NVIDIA RTX cards are excellent for gaming and creative work with features like ray tracing and DLSS. The RTX 4070 is great for 1440p, while the RTX 4080/4090 handle 4K gaming beautifully.",
        suggestions: ['RTX 4070 vs 4080', 'Ray tracing games', 'DLSS benefits']
      };
    } else if (lowerMessage.includes('cooling') || lowerMessage.includes('temperature')) {
      return {
        content: "Good cooling is essential! For most CPUs, a quality air cooler like the Noctua NH-D15 is sufficient. For high-end CPUs or compact builds, consider AIO liquid cooling.",
        suggestions: ['Air vs liquid cooling', 'Best CPU coolers', 'Case airflow tips']
      };
    } else {
      return {
        content: "I'm here to help with any PC building questions! I can assist with component recommendations, compatibility checks, performance optimisation, and build planning. What specific aspect would you like to explore?",
        suggestions: ['Component recommendations', 'Build compatibility', 'Performance tips', 'Troubleshooting']
      };
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = getAIResponse(inputMessage);
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: response.content,
        suggestions: response.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const handleQuickActionClick = async (message) => {
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI thinking time and get response
    setTimeout(() => {
      const response = getAIResponse(message);
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: response.content,
        suggestions: response.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const quickActions = [
    { icon: Cpu, label: 'CPU Recommendations', message: 'What CPU should I choose?' },
    { icon: Monitor, label: 'GPU for Gaming', message: 'Best graphics card for gaming?' },
    { icon: HardDrive, label: 'Storage Options', message: 'SSD vs HDD for gaming?' },
    { icon: Zap, label: 'PSU Calculator', message: 'How much power supply do I need?' },
    { icon: DollarSign, label: 'Budget Builds', message: 'Best PC build for £1000?' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[48vw] w-[48vw] h-[85vh] bg-gradient-to-br from-black/95 via-slate-900/95 to-blue-950/95 backdrop-blur-xl border-sky-500/20 text-white flex flex-col">
        <DialogHeader className="border-b border-sky-500/20 pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">VortexAI Assistant</span>
              <div className="text-sm text-gray-400 font-normal">Powered by AI • Always here to help</div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            VortexAI Assistant is your personal PC building chatbot that can help you choose components, check compatibility, and answer questions about building your dream PC.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex space-x-3 max-w-[70%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="w-10 h-10 mt-1">
                      <AvatarFallback className={message.type === 'user' 
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white' 
                        : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
                      }>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                      <Card className={`p-4 backdrop-blur-sm ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white border-sky-500/30' 
                          : 'bg-white/10 border-white/20 text-white'
                      }`}>
                        <p className="leading-relaxed">{message.content}</p>
                      </Card>
                      
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 max-w-md">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white hover:border-sky-400/50"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex space-x-3">
                    <Avatar className="w-10 h-10 mt-1">
                      <AvatarFallback className="bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <Card className="bg-white/10 border-white/20 p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-sky-500/20 p-4">
              <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything about PC building..."
                  className="flex-1 bg-white/10 border-sky-500/30 text-white placeholder-gray-400"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="w-80 border-l border-sky-500/20 p-4">
            <h3 className="font-bold text-white mb-4 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-sky-400" />
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleQuickActionClick(action.message)}
                  className="w-full justify-start text-left p-3 h-auto border border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-400/30"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white text-sm">{action.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{action.message}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-sky-600/10 to-blue-600/10 border border-sky-500/20 rounded-lg">
              <h4 className="font-medium text-sky-300 mb-2">💡 Pro Tip</h4>
              <p className="text-sm text-gray-300">
                Be specific with your questions! Instead of "What CPU?", try "Best CPU for 1440p gaming under £300?"
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
=======
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send welcome message when first opened
      addAIMessage(getWelcomeMessage(), getContextualSuggestions());
    }
  }, [isOpen]);

  const getWelcomeMessage = () => {
    const greetings = [
      "Hello! I'm your VortexPC AI Assistant. How can I help you build your perfect PC today?",
      "Welcome! I'm here to guide you through creating your ideal custom PC. What would you like to know?",
      "Hi there! Ready to build something amazing? I'm here to help with any questions about your PC journey.",
    ];
    
    if (currentPage === 'finder') {
      return "I see you're using our PC Finder! I'll help you discover the perfect build for your needs. What will you primarily use your PC for?";
    } else if (currentPage === 'configurator') {
      return "Great choice using our Configurator! I can help you optimize your build, check compatibility, and stay within budget. What would you like to know?";
    } else if (currentPage === 'repair') {
      return "I can help you understand our repair services, diagnose issues, or guide you through the repair process. How can I assist?";
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getContextualSuggestions = (): string[] => {
    if (currentPage === 'home') {
      return [
        "Help me choose a gaming PC",
        "What's your build process?",
        "Tell me about warranties",
      ];
    } else if (currentPage === 'finder') {
      return [
        "What's the best GPU for 1440p?",
        "Explain AMD vs Intel",
        "What budget should I consider?",
      ];
    } else if (currentPage === 'configurator') {
      return [
        "Is my build compatible?",
        "How can I reduce costs?",
        "What PSU wattage do I need?",
      ];
    } else if (currentPage === 'repair') {
      return [
        "How long does repair take?",
        "What's covered in warranty?",
        "My PC won't turn on",
      ];
    }
    
    return [
      "Show me popular builds",
      "What makes VortexPC different?",
      "Help me get started",
    ];
  };

  const generateAIResponse = (userMessage: string): { response: string; suggestions?: string[] } => {
    const lowerMessage = userMessage.toLowerCase();

    // Budget-related queries
    if (lowerMessage.includes('budget') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('cheap')) {
      return {
        response: "Great question about budget! Here's what I recommend:\n\n• **Entry Gaming (£600-£900)**: Perfect for 1080p gaming with AMD Ryzen 5 + RTX 4060\n• **Mid-Range (£900-£1,500)**: Excellent for 1440p with Ryzen 7 + RTX 4070\n• **High-End (£1,500-£2,500)**: Premium 4K gaming with Ryzen 9 + RTX 4080\n• **Enthusiast (£2,500+)**: Ultimate performance with top-tier components\n\nWhat's your target budget?",
        suggestions: ["Show me £1000 builds", "Best value components?", "How to save money?"]
      };
    }

    // Component compatibility
    if (lowerMessage.includes('compatible') || lowerMessage.includes('compatibility') || lowerMessage.includes('work together')) {
      return {
        response: "I'll help ensure your components work perfectly together! Key compatibility factors:\n\n✓ **CPU Socket**: Must match motherboard (AM4, AM5, LGA1700)\n✓ **RAM Type**: DDR4 or DDR5 - check your motherboard\n✓ **GPU Clearance**: Ensure your case fits your GPU length\n✓ **PSU Wattage**: Calculate total system power + 20% headroom\n✓ **Cooling**: Check CPU TDP vs cooler rating\n\nOur configurator automatically checks these for you!",
        suggestions: ["Check my current build", "Explain CPU sockets", "PSU calculator"]
      };
    }

    // Gaming performance
    if (lowerMessage.includes('gaming') || lowerMessage.includes('fps') || lowerMessage.includes('performance')) {
      return {
        response: "Let me help optimize your gaming experience!\n\n🎮 **1080p Gaming**: RTX 4060 (8GB) or RX 7700 XT (12GB)\n🎮 **1440p Gaming**: RTX 4070 (12GB) - sweet spot for most gamers\n🎮 **4K Gaming**: RTX 4080 (16GB) or RTX 4090 (24GB)\n\n**CPU Recommendations**:\n• Ryzen 7 7800X3D - Best for pure gaming\n• Intel i7-14700K - Great all-rounder\n• Ryzen 9 7950X - Ultimate multitasking + gaming\n\nWhat resolution and refresh rate are you targeting?",
        suggestions: ["Best CPU for gaming?", "RTX vs AMD GPUs", "Do I need 32GB RAM?"]
      };
    }

    // AMD vs Intel
    if ((lowerMessage.includes('amd') && lowerMessage.includes('intel')) || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
      return {
        response: "Great question! Here's an honest comparison:\n\n**AMD Advantages**:\n✓ Better gaming performance (7800X3D)\n✓ Lower power consumption\n✓ Excellent multi-core value\n✓ PCIe 5.0 on AM5 platform\n\n**Intel Advantages**:\n✓ Higher single-core speeds\n✓ Better for productivity workloads\n✓ Mature platform with broad support\n✓ Competitive pricing on mid-range\n\n**My Recommendation**: Ryzen 7800X3D for gaming, Intel 14700K for mixed workloads.",
        suggestions: ["Show AMD builds", "Show Intel builds", "What about motherboards?"]
      };
    }

    // Storage queries
    if (lowerMessage.includes('storage') || lowerMessage.includes('ssd') || lowerMessage.includes('nvme') || lowerMessage.includes('hard drive')) {
      return {
        response: "Let's talk storage! Here's what I recommend:\n\n**PCIe 4.0 NVMe SSD** (Recommended):\n• 1TB: Perfect for OS + games (£100-130)\n• 2TB: Best value for most users (£180-220)\n• Samsung 990 Pro or WD Black SN850X\n\n**Budget Option**: PCIe 3.0 (still very fast)\n**Content Creators**: Add 2TB+ HDD for project files\n\n⚡ Gen4 SSDs offer 7,000MB/s reads - perfect for gaming and creative work!",
        suggestions: ["How much storage do I need?", "SSD vs HDD differences", "Best value storage"]
      };
    }

    // PSU/Power supply
    if (lowerMessage.includes('psu') || lowerMessage.includes('power') || lowerMessage.includes('wattage') || lowerMessage.includes('supply')) {
      return {
        response: "Power supply is crucial! Here's my guidance:\n\n**Wattage Guidelines**:\n• RTX 4060 builds: 550-650W\n• RTX 4070 builds: 650-750W\n• RTX 4080 builds: 850W\n• RTX 4090 builds: 1000W+\n\n**Efficiency Ratings** (higher = better):\n🥉 80+ Bronze: Budget builds\n🥈 80+ Gold: Best value (recommended)\n🥇 80+ Platinum: High-end builds\n💎 80+ Titanium: Enthusiast tier\n\n**Always go modular** for cleaner cable management!",
        suggestions: ["Calculate my PSU needs", "Gold vs Platinum worth it?", "Recommended PSU brands"]
      };
    }

    // Cooling questions
    if (lowerMessage.includes('cooling') || lowerMessage.includes('cooler') || lowerMessage.includes('temperature') || lowerMessage.includes('aio')) {
      return {
        response: "Keeping your system cool is essential! Here are your options:\n\n**Air Cooling** (£30-100):\n✓ Noctua NH-D15 - Best air cooler\n✓ Quieter, no pump noise\n✓ Great for CPUs up to 150W TDP\n\n**AIO Liquid Cooling** (£80-150):\n✓ 240mm: Good for most CPUs\n✓ 360mm: High-end CPUs (7950X, i9-14900K)\n✓ Better aesthetics with RGB\n\n**Stock Coolers**: Fine for 65W CPUs (Ryzen 5 5600)\n\nWhat CPU are you cooling?",
        suggestions: ["Best cooler for 7800X3D?", "AIO vs air cooling", "Do I need thermal paste?"]
      };
    }

    // RAM queries
    if (lowerMessage.includes('ram') || lowerMessage.includes('memory') || lowerMessage.includes('ddr4') || lowerMessage.includes('ddr5')) {
      return {
        response: "Memory is important for smooth performance!\n\n**How Much RAM**:\n• 16GB: Minimum for gaming (2024)\n• 32GB: Recommended (sweet spot)\n• 64GB+: Content creation & heavy multitasking\n\n**DDR4 vs DDR5**:\n• **DDR4**: Mature, affordable, great performance\n• **DDR5**: Future-proof, required for AM5/newer LGA1700\n\n**Speed Recommendations**:\n• DDR4: 3200-3600MHz\n• DDR5: 5600-6000MHz\n\nAMD Ryzen loves fast RAM! 🚀",
        suggestions: ["Is 32GB overkill?", "DDR4 vs DDR5 performance", "Best RAM brands"]
      };
    }

    // Warranty and support
    if (lowerMessage.includes('warranty') || lowerMessage.includes('support') || lowerMessage.includes('guarantee')) {
      return {
        response: "We've got you covered with comprehensive support!\n\n🛡️ **Standard Warranty**:\n• 12 months parts & labour\n• Free return shipping\n• 48-hour repair turnaround\n\n✨ **NoFearTech Lifetime Support** (£99):\n• Unlimited remote assistance\n• Priority repair queue\n• Free diagnostics for life\n• Expert advice anytime\n\n📞 Contact us for any issues - we're here to help!",
        suggestions: ["What's covered?", "How do I claim warranty?", "Tell me about repairs"]
      };
    }

    // Repair services
    if (lowerMessage.includes('repair') || lowerMessage.includes('broken') || lowerMessage.includes('fix') || lowerMessage.includes("won't")) {
      return {
        response: "I can help with repairs! Our **Collect & Return** service makes it easy:\n\n📦 **Process**:\n1. Book online - we collect next day\n2. Expert diagnosis within 24 hours\n3. Quote approval via email/SMS\n4. Repairs completed in 48 hours\n5. Delivered back to your door\n\n⚡ **Common Issues**:\n• Won't power on → PSU or motherboard\n• No display → GPU or cable issue\n• Overheating → Cooling or dust buildup\n\nDescribe your issue and I can suggest next steps!",
        suggestions: ["Book a repair", "Diagnose my PC", "Repair pricing"]
      };
    }

    // Build process
    if (lowerMessage.includes('build process') || lowerMessage.includes('how do you build') || lowerMessage.includes('assembly')) {
      return {
        response: "Our premium build process ensures perfection:\n\n🔧 **Assembly** (Day 1-2):\n• Components tested individually\n• Expert cable management\n• Optimal airflow configuration\n• RGB synchronization\n\n✅ **Testing** (Day 2-3):\n• 24-hour stress testing\n• Thermal monitoring\n• Benchmark validation\n• Quality inspection\n\n📦 **Packaging**:\n• Custom foam protection\n• All accessories included\n• Setup guide included\n\n**Total build time**: 3-5 working days + delivery",
        suggestions: ["Can I watch my build?", "What tests do you run?", "Delivery options"]
      };
    }

    // VortexPC difference
    if (lowerMessage.includes('vortex') || lowerMessage.includes('different') || lowerMessage.includes('why choose') || lowerMessage.includes('better')) {
      return {
        response: "What makes VortexPC special:\n\n⚡ **Premium Quality**:\n• Hand-picked components\n• Expert cable management\n• 24-hour stress testing\n\n🎯 **Customer-First**:\n• Free lifetime phone support\n• 48-hour repair turnaround\n• No-quibble returns policy\n\n🛠️ **Expert Team**:\n• 15+ years experience\n• Gaming & workstation specialists\n• Always here to help\n\n💎 **Premium Service**:\n• White-glove collect & return\n• Custom configurations\n• Ongoing optimization\n\nWe're not just building PCs - we're building relationships!",
        suggestions: ["Show me testimonials", "What's your experience?", "Start my build"]
      };
    }

    // Motherboard queries
    if (lowerMessage.includes('motherboard') || lowerMessage.includes('mobo') || lowerMessage.includes('chipset')) {
      return {
        response: "Motherboards are the foundation of your build!\n\n**AMD Chipsets**:\n• B550 → AM4, DDR4, PCIe 4.0 (budget)\n• B650 → AM5, DDR5, PCIe 5.0 (recommended)\n• X670E → AM5, DDR5, premium features\n\n**Intel Chipsets**:\n• B760 → LGA1700, DDR4/DDR5, value\n• Z790 → LGA1700, DDR5, overclocking\n\n**Key Features**:\n✓ WiFi 6/6E built-in\n✓ PCIe 5.0 for future GPUs\n✓ M.2 slots for fast storage\n✓ RGB headers for lighting\n\nMatch your motherboard socket to your CPU!",
        suggestions: ["B650 vs X670 difference", "Do I need WiFi?", "ATX vs Mini-ITX"]
      };
    }

    // Default response with helpful suggestions
    return {
      response: "I'd love to help you with that! Here are some popular topics I can assist with:\n\n💰 Budget planning & recommendations\n🎮 Gaming performance optimization\n🔧 Component compatibility checking\n⚡ AMD vs Intel comparisons\n🛡️ Warranty & support information\n📦 Build process & delivery\n\nWhat specific aspect of your PC build would you like to explore?",
      suggestions: [
        "Help me choose components",
        "What's my best budget option?",
        "Explain compatibility",
      ]
    };
  };

  const addAIMessage = (content: string, suggestions?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: false,
      timestamp: new Date(),
      suggestions,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI typing
    setIsTyping(true);
    setTimeout(() => {
      const { response, suggestions } = generateAIResponse(inputValue);
      addAIMessage(response, suggestions);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] max-h-[calc(100vh-120px)]"
          >
            <Card className="h-full flex flex-col border-cyan-500/30 bg-black/40 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black/40" />
                  </div>
                  <div>
                    <h3 className="text-white">VortexPC AI</h3>
                    <p className="text-xs text-gray-400">Always here to help</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.isUser
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.suggestions && (
                        <div className="mt-2 space-y-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="block w-full text-left px-3 py-2 text-sm rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-cyan-300"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-2xl shadow-cyan-500/50 relative group"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulse effect */}
          <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-20" />
          
          {/* Notification badge */}
          {!isOpen && messages.length === 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs animate-pulse">
              1
            </span>
          )}
        </Button>
        
        {/* Tooltip */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          >
            <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap border border-cyan-500/30">
              Need help? Ask me anything!
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[6px] border-l-black/90 border-b-[6px] border-b-transparent" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581

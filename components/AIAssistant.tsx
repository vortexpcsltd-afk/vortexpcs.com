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
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

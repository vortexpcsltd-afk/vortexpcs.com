import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  DollarSign,
} from "lucide-react";

interface Message {
  id: number;
  type: string;
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content:
        "Hi! I'm VortexAI, your personal PC building assistant. I can help you choose the perfect components, check compatibility, and answer any questions about building your dream PC. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const predefinedResponses = {
    gaming: {
      content:
        "For gaming, I'd recommend focusing on a powerful GPU and CPU combination. What's your budget and what resolution do you want to game at?",
      suggestions: [
        "Budget gaming build",
        "4K gaming setup",
        "Competitive esports build",
      ],
    },
    budget: {
      content:
        "I can help you build a great PC within any budget! What's your target price range, and what will you primarily use the PC for?",
      suggestions: [
        "£500-800 budget",
        "£800-1500 mid-range",
        "£1500+ high-end",
      ],
    },
    compatibility: {
      content:
        "I'll check component compatibility for you! Make sure your CPU socket matches your motherboard, your PSU can handle your GPU's power requirements, and your case fits all components.",
      suggestions: [
        "Check my build",
        "Socket compatibility",
        "Power requirements",
      ],
    },
    workstation: {
      content:
        "For professional work, prioritise CPU cores, RAM capacity, and fast storage. What type of work will you be doing? Video editing, 3D rendering, programming, or general business tasks?",
      suggestions: [
        "Video editing build",
        "3D rendering setup",
        "Programming workstation",
      ],
    },
  };

  const getAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    // Specific responses for Quick Action questions
    if (
      lowerMessage.includes("what cpu should i choose") ||
      lowerMessage.includes("cpu recommendations")
    ) {
      return {
        content:
          "For CPU recommendations, here's what I suggest based on different use cases:\n\n🎮 **Gaming**: AMD Ryzen 5 7600X or Intel i5-13600K offer excellent performance\n💻 **Productivity**: AMD Ryzen 7 7700X or Intel i7-13700K for content creation\n🚀 **High-End**: AMD Ryzen 9 7900X or Intel i9-13900K for maximum performance\n\nWhat's your primary use case and budget range?",
        suggestions: [
          "Gaming CPU under £300",
          "Best productivity CPU",
          "Budget CPU options",
        ],
      };
    } else if (
      lowerMessage.includes("best graphics card for gaming") ||
      lowerMessage.includes("gpu for gaming")
    ) {
      return {
        content:
          "Here are my top GPU recommendations for gaming:\n\n🎯 **1080p Gaming**: RTX 4060 or RX 7600 (£250-300)\n🎮 **1440p Gaming**: RTX 4070 or RX 7700 XT (£450-550)\n🚀 **4K Gaming**: RTX 4080 or RTX 4090 (£1000+)\n\nThe RTX cards also support DLSS and ray tracing for enhanced visuals. What resolution do you plan to game at?",
        suggestions: [
          "1440p gaming build",
          "4K gaming setup",
          "Ray tracing performance",
        ],
      };
    } else if (
      lowerMessage.includes("ssd vs hdd") ||
      lowerMessage.includes("storage options")
    ) {
      return {
        content:
          "Here's the breakdown between SSD and HDD storage:\n\n⚡ **SSD Advantages**:\n• 10x faster loading times\n• Silent operation\n• More reliable\n• Better for OS and games\n\n💾 **HDD Advantages**:\n• Much cheaper per GB\n• Great for mass storage\n• Good for backups\n\n**Recommendation**: 1TB NVMe SSD for OS + games, 2TB HDD for storage",
        suggestions: [
          "Best gaming SSDs",
          "NVMe vs SATA",
          "Storage capacity planning",
        ],
      };
    } else if (
      lowerMessage.includes("power supply") ||
      lowerMessage.includes("psu") ||
      lowerMessage.includes("how much power")
    ) {
      return {
        content:
          "PSU wattage depends on your components:\n\n⚡ **Budget Build** (RTX 4060): 650W PSU\n🎮 **Mid-Range** (RTX 4070): 750W PSU\n🚀 **High-End** (RTX 4080/4090): 850W+ PSU\n\n**Key factors**: GPU power draw, CPU power, future upgrades\n**Recommended brands**: Corsair, EVGA, Seasonic (80+ Gold rated)\n\nWhat GPU are you planning to use?",
        suggestions: [
          "PSU calculator",
          "Modular vs non-modular",
          "80+ efficiency ratings",
        ],
      };
    } else if (
      lowerMessage.includes("best pc build for £1000") ||
      lowerMessage.includes("budget builds")
    ) {
      return {
        content:
          "Here's an excellent £1000 gaming build:\n\n🎮 **£1000 Gaming Build**:\n• CPU: AMD Ryzen 5 7600 (£200)\n• GPU: RTX 4060 Ti (£400)\n• RAM: 16GB DDR5-5600 (£80)\n• Storage: 1TB NVMe SSD (£60)\n• Motherboard: B650 (£120)\n• PSU: 650W 80+ Gold (£80)\n• Case: Mid-tower (£60)\n\nThis build handles 1440p gaming at high settings beautifully!",
        suggestions: [
          "£800 budget build",
          "£1500 high-end build",
          "Upgrade priority order",
        ],
      };
    } else if (
      lowerMessage.includes("gaming") ||
      lowerMessage.includes("game")
    ) {
      return predefinedResponses.gaming;
    } else if (
      lowerMessage.includes("budget") ||
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost")
    ) {
      return predefinedResponses.budget;
    } else if (
      lowerMessage.includes("compatible") ||
      lowerMessage.includes("compatibility")
    ) {
      return predefinedResponses.compatibility;
    } else if (
      lowerMessage.includes("work") ||
      lowerMessage.includes("professional") ||
      lowerMessage.includes("editing")
    ) {
      return predefinedResponses.workstation;
    } else if (
      lowerMessage.includes("ryzen") ||
      lowerMessage.includes("intel")
    ) {
      return {
        content:
          "Great choice! Both AMD Ryzen and Intel offer excellent processors. Ryzen typically offers better value and more cores, while Intel often has slightly better gaming performance. What's your specific use case?",
        suggestions: ["Ryzen vs Intel", "Best gaming CPU", "Productivity CPU"],
      };
    } else if (
      lowerMessage.includes("rtx") ||
      lowerMessage.includes("nvidia") ||
      lowerMessage.includes("graphics")
    ) {
      return {
        content:
          "NVIDIA RTX cards are excellent for gaming and creative work with features like ray tracing and DLSS. The RTX 4070 is great for 1440p, while the RTX 4080/4090 handle 4K gaming beautifully.",
        suggestions: ["RTX 4070 vs 4080", "Ray tracing games", "DLSS benefits"],
      };
    } else if (
      lowerMessage.includes("cooling") ||
      lowerMessage.includes("temperature")
    ) {
      return {
        content:
          "Good cooling is essential! For most CPUs, a quality air cooler like the Noctua NH-D15 is sufficient. For high-end CPUs or compact builds, consider AIO liquid cooling.",
        suggestions: [
          "Air vs liquid cooling",
          "Best CPU coolers",
          "Case airflow tips",
        ],
      };
    } else {
      return {
        content:
          "I'm here to help with any PC building questions! I can assist with component recommendations, compatibility checks, performance optimisation, and build planning. What specific aspect would you like to explore?",
        suggestions: [
          "Component recommendations",
          "Build compatibility",
          "Performance tips",
          "Troubleshooting",
        ],
      };
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = getAIResponse(inputMessage);
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        content: response.content,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleQuickActionClick = async (message: string) => {
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI thinking time and get response
    setTimeout(() => {
      const response = getAIResponse(message);
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        content: response.content,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const quickActions = [
    {
      icon: Cpu,
      label: "CPU Recommendations",
      message: "What CPU should I choose?",
    },
    {
      icon: Monitor,
      label: "GPU for Gaming",
      message: "Best graphics card for gaming?",
    },
    {
      icon: HardDrive,
      label: "Storage Options",
      message: "SSD vs HDD for gaming?",
    },
    {
      icon: Zap,
      label: "PSU Calculator",
      message: "How much power supply do I need?",
    },
    {
      icon: DollarSign,
      label: "Budget Builds",
      message: "Best PC build for £1000?",
    },
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
              <span className="text-xl bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                VortexAI Assistant
              </span>
              <div className="text-sm text-gray-400 font-normal">
                Powered by AI • Always here to help
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            VortexAI Assistant is your personal PC building chatbot that can
            help you choose components, check compatibility, and answer
            questions about building your dream PC.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex space-x-3 max-w-[70%] ${
                      message.type === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <Avatar className="w-10 h-10 mt-1">
                      <AvatarFallback
                        className={
                          message.type === "user"
                            ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white"
                            : "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                        }
                      >
                        {message.type === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`flex flex-col space-y-2 ${
                        message.type === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <Card
                        className={`p-4 backdrop-blur-sm ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white border-sky-500/30"
                            : "bg-white/10 border-white/20 text-white"
                        }`}
                      >
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
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask me anything about PC building..."
                  className="flex-1 bg-white/10 border-sky-500/30 text-white placeholder-gray-400"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
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
                      <div className="font-medium text-white text-sm">
                        {action.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {action.message}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-sky-600/10 to-blue-600/10 border border-sky-500/20 rounded-lg">
              <h4 className="font-medium text-sky-300 mb-2">💡 Pro Tip</h4>
              <p className="text-sm text-gray-300">
                Be specific with your questions! Instead of "What CPU?", try
                "Best CPU for 1440p gaming under £300?"
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

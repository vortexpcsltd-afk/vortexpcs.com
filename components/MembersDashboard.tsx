import { useState } from 'react';
import { Package, Wrench, MessageSquare, Settings, LogOut, Plus, Clock, CheckCircle, AlertCircle, Cpu, HardDrive, MemoryStick, Fan, Zap, Box } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface MembersDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function MembersDashboard({ onNavigate, onLogout }: MembersDashboardProps) {
  const [activeTab, setActiveTab] = useState('builds');
  const [selectedBuildForOrder, setSelectedBuildForOrder] = useState<any>(null);

  // Mock data for customer
  const customerName = 'James Mitchell';
  const customerEmail = 'james.mitchell@example.com';

  const builds = [
    {
      id: 'VX-2024-001',
      name: 'Vortex Performance Gaming',
      status: 'Building',
      progress: 65,
      orderDate: '5th October 2025',
      estimatedDelivery: '15th October 2025',
      price: '£1,349',
      components: {
        cpu: 'AMD Ryzen 7 5700X',
        gpu: 'NVIDIA RTX 4070',
        ram: '32GB DDR4',
        storage: '1TB NVMe',
      },
      fullSpec: {
        processor: { name: 'AMD Ryzen 7 5700X', price: '£189', details: '8-Core, 16-Thread, 3.4GHz Base, 4.6GHz Boost' },
        motherboard: { name: 'MSI B550-A PRO', price: '£129', details: 'ATX, PCIe 4.0, WiFi Ready' },
        gpu: { name: 'NVIDIA GeForce RTX 4070', price: '£549', details: '12GB GDDR6X, Ray Tracing, DLSS 3' },
        ram: { name: 'Corsair Vengeance RGB 32GB', price: '£89', details: 'DDR4-3600MHz, CL18, 2x16GB' },
        storage: { name: 'Samsung 980 PRO 1TB', price: '£99', details: 'NVMe M.2, PCIe 4.0, 7000MB/s Read' },
        psu: { name: 'Corsair RM750x', price: '£109', details: '750W, 80+ Gold, Fully Modular' },
        case: { name: 'NZXT H510 Flow', price: '£89', details: 'Mid Tower, Tempered Glass, RGB' },
        cooling: { name: 'Cooler Master Hyper 212', price: '£39', details: '4 Heat Pipes, 120mm Fan' },
        os: { name: 'Windows 11 Home', price: '£99', details: 'Pre-installed and Activated' },
        warranty: { name: '3-Year Premium Warranty', price: '£49', details: 'Full Parts & Labour Coverage' }
      },
      subtotal: '£1,341',
      vat: '£268.20',
      total: '£1,349'
    },
    {
      id: 'VX-2023-087',
      name: 'Vortex Creator Pro',
      status: 'Delivered',
      progress: 100,
      orderDate: '12th March 2024',
      estimatedDelivery: '24th March 2024',
      price: '£2,099',
      components: {
        cpu: 'AMD Ryzen 9 7900X',
        gpu: 'NVIDIA RTX 4070 Ti',
        ram: '64GB DDR5',
        storage: '2TB NVMe',
      },
      fullSpec: {
        processor: { name: 'AMD Ryzen 9 7900X', price: '£389', details: '12-Core, 24-Thread, 4.7GHz Base, 5.4GHz Boost' },
        motherboard: { name: 'ASUS ROG STRIX X670E', price: '£299', details: 'ATX, PCIe 5.0, WiFi 6E' },
        gpu: { name: 'NVIDIA GeForce RTX 4070 Ti', price: '£749', details: '12GB GDDR6X, Ada Lovelace, DLSS 3' },
        ram: { name: 'G.SKILL Trident Z5 64GB', price: '£229', details: 'DDR5-6000MHz, CL36, 2x32GB RGB' },
        storage: { name: 'Samsung 990 PRO 2TB', price: '£179', details: 'NVMe M.2, PCIe 4.0, 7450MB/s Read' },
        psu: { name: 'Corsair HX1000i', price: '£189', details: '1000W, 80+ Platinum, Fully Modular' },
        case: { name: 'Lian Li O11 Dynamic EVO', price: '£159', details: 'Mid Tower, Dual Chamber, Tempered Glass' },
        cooling: { name: 'NZXT Kraken X63 RGB', price: '£149', details: '280mm AIO, RGB Pump, Smart Control' },
        os: { name: 'Windows 11 Pro', price: '£149', details: 'Pre-installed, BitLocker Encryption' },
        warranty: { name: '5-Year Premium Warranty', price: '£99', details: 'Full Parts & Labour, Priority Support' }
      },
      subtotal: '£2,590',
      vat: '£518',
      total: '£2,099'
    },
  ];

  const repairs = [
    {
      id: 'VX-R-2024-042',
      issue: 'Overheating / thermal issues',
      status: 'In Progress',
      stage: 'Diagnosis Complete',
      receivedDate: '8th October 2025',
      estimatedReturn: '12th October 2025',
      cost: '£79',
      description: 'PC experiencing high temperatures under load. Investigating cooling system.',
    },
    {
      id: 'VX-R-2024-015',
      issue: 'GPU upgrade installation',
      status: 'Completed',
      stage: 'Returned',
      receivedDate: '20th August 2025',
      estimatedReturn: '25th August 2025',
      cost: '£49',
      description: 'Successfully installed new RTX 4070 and updated drivers.',
    },
  ];

  const tickets = [
    {
      id: 'VX-T-2024-156',
      subject: 'Question about RAM upgrade compatibility',
      status: 'Open',
      lastUpdate: '2 hours ago',
      priority: 'Medium',
      messages: 3,
    },
    {
      id: 'VX-T-2024-142',
      subject: 'Installation help for new SSD',
      status: 'Resolved',
      lastUpdate: '3 days ago',
      priority: 'Low',
      messages: 7,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'building':
      case 'in progress':
      case 'open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered':
      case 'completed':
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="mb-2">Welcome back, {customerName.split(' ')[0]}</h2>
              <p className="text-gray-400">{customerEmail}</p>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="border-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Active Builds', value: '1', icon: Package },
              { label: 'Active Repairs', value: '1', icon: Wrench },
              { label: 'Open Tickets', value: '1', icon: MessageSquare },
              { label: 'Total Orders', value: '2', icon: CheckCircle },
            ].map((stat, index) => (
              <Card key={index} className="glass p-4 border-white/10 rgb-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                    <div className="text-2xl text-gray-100">{stat.value}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass mb-8">
            <TabsTrigger value="builds">PC Builds</TabsTrigger>
            <TabsTrigger value="repairs">Repairs</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* PC Builds Tab */}
          <TabsContent value="builds" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3>Your PC Builds</h3>
              <Button
                onClick={() => onNavigate('finder')}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Build
              </Button>
            </div>
            {builds.map((build) => (
              <Card key={build.id} className="glass p-6 border-white/10 rgb-glow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{build.name}</h4>
                      <Badge className={`${getStatusColor(build.status)} border`}>
                        {build.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">Order ID: {build.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-blue-400 mb-1">{build.price}</div>
                    <div className="text-sm text-gray-400">incl. VAT</div>
                  </div>
                </div>

                {build.status === 'Building' && (
                  <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 relative overflow-hidden">
                    {/* Animated background shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" 
                         style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-400 animate-pulse" />
                          <span className="font-semibold text-white">Dream PC Build Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {build.progress}%
                          </span>
                          {build.progress === 100 && (
                            <CheckCircle className="w-5 h-5 text-green-400 animate-bounce" />
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="relative h-6 bg-black/40 rounded-full overflow-hidden border border-white/20 shadow-lg">
                        {/* Progress fill with gradient and glow */}
                        <div 
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                          style={{ width: `${build.progress}%` }}
                        >
                          {/* Animated shimmer overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                               style={{ 
                                 animation: 'slide 2s ease-in-out infinite',
                                 backgroundSize: '200% 100%'
                               }} />
                        </div>
                        
                        {/* Milestone markers */}
                        <div className="absolute inset-0 flex items-center justify-between px-1">
                          {[25, 50, 75].map((milestone) => (
                            <div 
                              key={milestone}
                              className={`w-0.5 h-4 rounded-full transition-colors ${
                                build.progress >= milestone ? 'bg-white/60' : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Status text */}
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-300">
                          {build.progress < 25 && "🔧 Starting your dream build..."}
                          {build.progress >= 25 && build.progress < 50 && "⚡ Components being assembled..."}
                          {build.progress >= 50 && build.progress < 75 && "🎨 Installing and configuring..."}
                          {build.progress >= 75 && build.progress < 100 && "✨ Final testing and quality checks..."}
                          {build.progress === 100 && "🎉 Your dream PC is ready!"}
                        </p>
                      </div>
                    </div>
                    
                    <style>{`
                      @keyframes shimmer {
                        0%, 100% { opacity: 0.3; transform: translateX(-100%); }
                        50% { opacity: 0.6; transform: translateX(100%); }
                      }
                      @keyframes slide {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                      }
                    `}</style>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-3">Key Components</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">CPU:</span>
                        <span className="text-white">{build.components.cpu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">GPU:</span>
                        <span className="text-white">{build.components.gpu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">RAM:</span>
                        <span className="text-white">{build.components.ram}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Storage:</span>
                        <span className="text-white">{build.components.storage}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-3">Timeline</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order Date:</span>
                        <span className="text-white">{build.orderDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Est. Delivery:</span>
                        <span className="text-white">{build.estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-white/20"
                    onClick={() => setSelectedBuildForOrder(build)}
                  >
                    View Full Spec
                  </Button>
                  {build.status === 'Building' && (
                    <Button variant="outline" className="flex-1 border-white/20">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Repairs Tab */}
          <TabsContent value="repairs" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3>Your Repairs</h3>
              <Button
                onClick={() => onNavigate('repair')}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Repair
              </Button>
            </div>
            {repairs.map((repair) => (
              <Card key={repair.id} className="glass p-6 border-white/10 rgb-glow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{repair.issue}</h4>
                      <Badge className={`${getStatusColor(repair.status)} border`}>
                        {repair.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">Repair ID: {repair.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl text-blue-400">{repair.cost}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-6">{repair.description}</p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Current Stage</div>
                    <div className="flex items-center gap-2">
                      {repair.status === 'Completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-400" />
                      )}
                      <span className="text-white">{repair.stage}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Received:</span>
                      <span className="text-white">{repair.receivedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Est. Return:</span>
                      <span className="text-white">{repair.estimatedReturn}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-white/20">
                    View Details
                  </Button>
                  <Button variant="outline" className="flex-1 border-white/20">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Tech
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3>Support Tickets</h3>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="glass p-6 border-white/10 hover:border-blue-400/40 transition-all cursor-pointer rgb-glow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{ticket.subject}</h4>
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        {ticket.status}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">Ticket ID: {ticket.id}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{ticket.messages}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Last updated {ticket.lastUpdate}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Conversation
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="glass p-8 border-white/10 rgb-glow">
              <h3 className="mb-6">Account Settings</h3>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm mb-2 text-gray-300">Full Name</label>
                  <input
                    type="text"
                    defaultValue={customerName}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-300">Email Address</label>
                  <input
                    type="email"
                    defaultValue={customerEmail}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+44 7XXX XXXXXX"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-300">Notification Preferences</label>
                  <div className="space-y-3">
                    {['Email updates on orders', 'SMS notifications for repairs', 'Marketing communications'].map((pref, index) => (
                      <label key={index} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked={index < 2} className="w-4 h-4" />
                        <span className="text-sm text-gray-300">{pref}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex gap-3">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    Save Changes
                  </Button>
                  <Button variant="outline" className="border-white/20">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Summary Dialog */}
      <Dialog open={!!selectedBuildForOrder} onOpenChange={() => setSelectedBuildForOrder(null)}>
        <DialogContent className="glass max-w-4xl max-h-[90vh] overflow-y-auto border-white/20">
          {selectedBuildForOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-400" />
                  Complete Order Summary
                </DialogTitle>
                <DialogDescription>
                  Order ID: {selectedBuildForOrder.id} • {selectedBuildForOrder.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Order Status Banner */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(selectedBuildForOrder.status)} border`}>
                        {selectedBuildForOrder.status}
                      </Badge>
                      <span className="text-sm text-gray-300">Order Status</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Placed: {selectedBuildForOrder.orderDate}</div>
                      <div className="text-sm text-gray-400">Est. Delivery: {selectedBuildForOrder.estimatedDelivery}</div>
                    </div>
                  </div>
                </div>

                {/* Component Breakdown */}
                <div>
                  <h4 className="mb-4 flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-400" />
                    Complete Build Specification
                  </h4>
                  <div className="space-y-3">
                    {/* Processor */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.processor.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.processor.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.processor.price}</div>
                      </div>
                    </div>

                    {/* Motherboard */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.motherboard.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.motherboard.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.motherboard.price}</div>
                      </div>
                    </div>

                    {/* GPU */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.gpu.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.gpu.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.gpu.price}</div>
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                            <MemoryStick className="w-5 h-5 text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.ram.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.ram.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.ram.price}</div>
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                            <HardDrive className="w-5 h-5 text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.storage.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.storage.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.storage.price}</div>
                      </div>
                    </div>

                    {/* PSU */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.psu.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.psu.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.psu.price}</div>
                      </div>
                    </div>

                    {/* Case */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                            <Box className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.case.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.case.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.case.price}</div>
                      </div>
                    </div>

                    {/* Cooling */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Fan className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.cooling.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.cooling.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.cooling.price}</div>
                      </div>
                    </div>

                    {/* OS */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <Settings className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.os.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.os.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.os.price}</div>
                      </div>
                    </div>

                    {/* Warranty */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{selectedBuildForOrder.fullSpec.warranty.name}</div>
                            <div className="text-sm text-gray-400">{selectedBuildForOrder.fullSpec.warranty.details}</div>
                          </div>
                        </div>
                        <div className="text-right text-blue-400 font-semibold">{selectedBuildForOrder.fullSpec.warranty.price}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/20">
                  <h4 className="mb-4">Order Total</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>{selectedBuildForOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>VAT (20%)</span>
                      <span>{selectedBuildForOrder.vat}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-xl">
                      <span className="font-semibold text-white">Total</span>
                      <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {selectedBuildForOrder.total}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    onClick={() => window.print()}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Print Order Summary
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-white/20"
                    onClick={() => setSelectedBuildForOrder(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

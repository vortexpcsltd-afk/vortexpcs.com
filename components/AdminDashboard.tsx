import { useState } from 'react';
import { BarChart3, Users, Package, Wrench, MessageSquare, Settings, TrendingUp, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock statistics data
  const stats = {
    totalRevenue: '£247,890',
    revenueChange: '+12.5%',
    totalOrders: '156',
    ordersChange: '+8.3%',
    activeRepairs: '23',
    repairsChange: '+5.2%',
    openTickets: '12',
    ticketsChange: '-15.4%',
  };

  // Mock orders data
  const orders = [
    { id: 'VX-2024-156', customer: 'James Mitchell', build: 'Performance Gaming', status: 'Building', value: '£1,349', date: '10/10/2025' },
    { id: 'VX-2024-155', customer: 'Sarah Thompson', build: 'Creator Pro', status: 'Testing', value: '£2,099', date: '09/10/2025' },
    { id: 'VX-2024-154', customer: 'David Chen', build: 'Elite Gaming', status: 'Shipped', value: '£2,199', date: '08/10/2025' },
    { id: 'VX-2024-153', customer: 'Emma Wilson', build: 'Office Pro', status: 'Completed', value: '£899', date: '07/10/2025' },
    { id: 'VX-2024-152', customer: 'Oliver Brown', build: 'Apex Gaming', status: 'Building', value: '£3,499', date: '06/10/2025' },
  ];

  // Mock repairs data
  const repairs = [
    { id: 'VX-R-2024-089', customer: 'Alice Johnson', issue: 'Overheating', status: 'Diagnosis', priority: 'High', value: '£79', received: '11/10/2025' },
    { id: 'VX-R-2024-088', customer: 'Michael Smith', issue: 'GPU failure', status: 'Awaiting Approval', priority: 'High', value: '£189', received: '10/10/2025' },
    { id: 'VX-R-2024-087', customer: 'Sophie Davies', issue: 'Blue screen errors', status: 'In Repair', priority: 'Medium', value: '£69', received: '09/10/2025' },
    { id: 'VX-R-2024-086', customer: 'Tom Harris', issue: 'Upgrade RAM', status: 'Testing', priority: 'Low', value: '£49', received: '08/10/2025' },
  ];

  // Mock tickets data
  const tickets = [
    { id: 'VX-T-2024-245', customer: 'Laura White', subject: 'Installation help needed', status: 'Open', priority: 'Medium', updated: '2h ago' },
    { id: 'VX-T-2024-244', customer: 'Chris Martin', subject: 'Warranty query', status: 'In Progress', priority: 'Low', updated: '4h ago' },
    { id: 'VX-T-2024-243', customer: 'Rachel Green', subject: 'Component compatibility', status: 'Open', priority: 'High', updated: '6h ago' },
  ];

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('shipped') || statusLower.includes('resolved')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (statusLower.includes('building') || statusLower.includes('repair') || statusLower.includes('progress') || statusLower.includes('testing')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    if (statusLower.includes('awaiting') || statusLower.includes('diagnosis')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="mb-2">Admin Dashboard</h2>
            <p className="text-gray-400">VortexPCs Management System</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-white/20"
          >
            Exit Admin
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="glass p-6 border-white/10 rgb-glow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-600/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <Badge className="bg-green-500/20 text-green-400">
                {stats.revenueChange}
              </Badge>
            </div>
            <div className="text-3xl mb-1 text-white">{stats.totalRevenue}</div>
            <div className="text-sm text-gray-400">Total Revenue (30d)</div>
          </Card>

          <Card className="glass p-6 border-white/10 rgb-glow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <Badge className="bg-blue-500/20 text-blue-400">
                {stats.ordersChange}
              </Badge>
            </div>
            <div className="text-3xl mb-1 text-white">{stats.totalOrders}</div>
            <div className="text-sm text-gray-400">Total Orders (30d)</div>
          </Card>

          <Card className="glass p-6 border-white/10 rgb-glow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-400" />
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-400">
                {stats.repairsChange}
              </Badge>
            </div>
            <div className="text-3xl mb-1 text-white">{stats.activeRepairs}</div>
            <div className="text-sm text-gray-400">Active Repairs</div>
          </Card>

          <Card className="glass p-6 border-white/10 rgb-glow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-600/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-orange-400" />
              </div>
              <Badge className="bg-green-500/20 text-green-400">
                {stats.ticketsChange}
              </Badge>
            </div>
            <div className="text-3xl mb-1 text-white">{stats.openTickets}</div>
            <div className="text-sm text-gray-400">Open Tickets</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="repairs">Repairs</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="cms">CMS</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <Card className="glass p-6 border-white/10 rgb-glow">
                <div className="flex items-center justify-between mb-6">
                  <h3>Recent Orders</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{order.customer}</span>
                          <Badge className={`${getStatusColor(order.status)} border text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">{order.id} • {order.build}</div>
                      </div>
                      <div className="text-sm text-blue-400">{order.value}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Active Repairs */}
              <Card className="glass p-6 border-white/10 rgb-glow">
                <div className="flex items-center justify-between mb-6">
                  <h3>Active Repairs</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('repairs')}>
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {repairs.slice(0, 4).map((repair) => (
                    <div key={repair.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{repair.customer}</span>
                          <Badge className={getPriorityColor(repair.priority)}>
                            {repair.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">{repair.id} • {repair.issue}</div>
                      </div>
                      <Badge className={`${getStatusColor(repair.status)} border text-xs`}>
                        {repair.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="glass p-6 border-white/10 rgb-glow">
              <h3 className="mb-6">Quick Actions</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                  <Package className="w-6 h-6 mb-2 text-blue-400" />
                  <span>New Order</span>
                </Button>
                <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                  <Wrench className="w-6 h-6 mb-2 text-purple-400" />
                  <span>Log Repair</span>
                </Button>
                <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                  <MessageSquare className="w-6 h-6 mb-2 text-orange-400" />
                  <span>View Tickets</span>
                </Button>
                <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                  <BarChart3 className="w-6 h-6 mb-2 text-green-400" />
                  <span>Reports</span>
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="glass border-white/10 rgb-glow">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3>All Orders</h3>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    New Order
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Build</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-blue-400">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.build}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.value}</TableCell>
                      <TableCell className="text-gray-400">{order.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Repairs Tab */}
          <TabsContent value="repairs">
            <Card className="glass border-white/10 rgb-glow">
              <div className="p-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="mb-1">Repair Management</h3>
                    <p className="text-sm text-gray-400">{repairs.length} active repairs</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20">
                    <Wrench className="w-4 h-4 mr-2" />
                    New Repair
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by ID, customer, or issue..."
                      className="pl-10 bg-white/5 border-white/10 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/5">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      High Priority
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/5">
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </Button>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-gray-400">Repair ID</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Issue</TableHead>
                    <TableHead className="text-gray-400">Priority</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Value</TableHead>
                    <TableHead className="text-gray-400">Received</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair) => (
                    <TableRow key={repair.id} className="border-white/10 hover:bg-white/5 group">
                      <TableCell className="text-blue-400">{repair.id}</TableCell>
                      <TableCell className="text-white">{repair.customer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-400" />
                          <span>{repair.issue}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(repair.priority)}>
                          {repair.priority === 'High' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {repair.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(repair.status)} border`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {repair.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{repair.value}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{repair.received}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500/10 hover:text-blue-400"
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/10 hover:text-purple-400"
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card className="glass border-white/10 rgb-glow">
              <div className="p-6 border-b border-white/10">
                <h3 className="mb-4">Support Tickets</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-10 bg-white/5 border-white/10 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="p-6 space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="glass p-6 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all">
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
                        <p className="text-sm text-gray-400">
                          {ticket.id} • {ticket.customer} • Updated {ticket.updated}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View & Reply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* CMS Tab */}
          <TabsContent value="cms">
            <Card className="glass p-8 border-white/10 rgb-glow">
              <h3 className="mb-6">Content Management</h3>
              <div className="space-y-6 max-w-4xl">
                <div className="glass p-6 rounded-lg border border-white/10">
                  <h4 className="mb-4">Firebase / Strapi Integration</h4>
                  <p className="text-gray-400 mb-4">
                    Connect your Firebase project or Strapi CMS to manage:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      PC component catalogue and pricing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Customer orders and build tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Repair requests and status updates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Support ticket system
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Website content and pages
                    </li>
                  </ul>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    Configure Firebase
                  </Button>
                </div>

                <div className="glass p-6 rounded-lg border border-white/10">
                  <h4 className="mb-4">Quick Content Updates</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                      <Package className="w-6 h-6 mb-2 text-blue-400" />
                      <span>Edit PC Builds</span>
                    </Button>
                    <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                      <Settings className="w-6 h-6 mb-2 text-purple-400" />
                      <span>Component Library</span>
                    </Button>
                    <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                      <Users className="w-6 h-6 mb-2 text-green-400" />
                      <span>Manage Customers</span>
                    </Button>
                    <Button variant="outline" className="border-white/20 h-auto py-6 flex-col">
                      <BarChart3 className="w-6 h-6 mb-2 text-orange-400" />
                      <span>Site Settings</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

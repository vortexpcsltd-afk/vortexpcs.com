import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { User, Package, Settings, CreditCard, Clock, CheckCircle, Truck, Star, Edit, Save, Camera } from 'lucide-react';

export function MemberArea({ isLoggedIn, setIsLoggedIn }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+44 7123 456789',
    address: '123 Tech Street, London, UK'
  });

  const mockOrders = [
    {
      id: 'VX-2024-001',
      name: 'Vortex Gaming Pro',
      status: 'building',
      progress: 75,
      orderDate: '2024-01-15',
      estimatedCompletion: '2024-01-20',
      total: 1899,
      components: ['RTX 4070', 'Ryzen 7 5700X', '32GB DDR4', '1TB NVMe']
    },
    {
      id: 'VX-2023-089',
      name: 'Vortex Workstation',
      status: 'delivered',
      progress: 100,
      orderDate: '2023-12-10',
      deliveryDate: '2023-12-18',
      total: 2599,
      components: ['RTX 4080', 'Ryzen 9 5900X', '64GB DDR4', '2TB NVMe']
    },
    {
      id: 'VX-2023-067',
      name: 'Vortex Gaming Essential',
      status: 'completed',
      progress: 100,
      orderDate: '2023-11-22',
      deliveryDate: '2023-11-29',
      total: 1299,
      components: ['RTX 4060', 'Ryzen 5 5600', '16GB DDR4', '500GB NVMe']
    }
  ];

  const mockConfigurations = [
    {
      id: 'config-1',
      name: 'Dream Gaming Build',
      created: '2024-01-10',
      price: 3499,
      components: {
        cpu: 'AMD Ryzen 9 5950X',
        gpu: 'NVIDIA RTX 4090',
        ram: '64GB DDR4-3600',
        storage: '2TB NVMe + 4TB HDD'
      }
    },
    {
      id: 'config-2',
      name: 'Budget Office PC',
      created: '2024-01-08',
      price: 799,
      components: {
        cpu: 'AMD Ryzen 5 5600G',
        gpu: 'Integrated Graphics',
        ram: '16GB DDR4-3200',
        storage: '500GB NVMe'
      }
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('vortex_user');
    setIsLoggedIn(false);
  };

  const handleSaveProfile = () => {
    setEditingProfile(false);
    // In a real app, this would save to backend
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'building':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-400" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'building':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'delivered':
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'shipped':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Access Required</h1>
                <p className="text-gray-400">Please log in to access your member area</p>
              </div>
              
              <Button 
                onClick={() => setIsLoggedIn(true)} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Login to Continue
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">Welcome back, {profileData.name}!</h1>
                <p className="text-gray-400">Member since November 2023</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Logout
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 border-white/10">
              <TabsTrigger value="orders" className="data-[state=active]:bg-white/10 text-white">
                My Orders
              </TabsTrigger>
              <TabsTrigger value="configurations" className="data-[state=active]:bg-white/10 text-white">
                Saved Builds
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 text-white">
                Profile
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-white/10 text-white">
                Support
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="grid gap-6">
                {mockOrders.map((order) => (
                  <Card key={order.id} className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{order.name}</h3>
                          <Badge className={`${getStatusColor(order.status)} border`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <p className="text-gray-400">Order #{order.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">£{order.total.toLocaleString()}</div>
                        <p className="text-gray-400 text-sm">
                          Ordered: {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {order.status === 'building' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Build Progress</span>
                          <span className="text-white">{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                        <p className="text-sm text-gray-400 mt-2">
                          Estimated completion: {new Date(order.estimatedCompletion).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {order.components.map((component, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-center">
                          {component}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                      <div className="text-sm text-gray-400">
                        {order.deliveryDate && `Delivered: ${new Date(order.deliveryDate).toLocaleDateString()}`}
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          View Details
                        </Button>
                        {order.status === 'delivered' && (
                          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                            <Star className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Saved Configurations Tab */}
            <TabsContent value="configurations" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {mockConfigurations.map((config) => (
                  <Card key={config.id} className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{config.name}</h3>
                        <p className="text-gray-400 text-sm">
                          Created: {new Date(config.created).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-400">£{config.price.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {Object.entries(config.components).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-400 capitalize">{key}:</span>
                          <span className="text-white">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Load in Builder
                      </Button>
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Profile Information</h3>
                  <Button
                    variant="outline"
                    onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {editingProfile ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!editingProfile}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!editingProfile}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!editingProfile}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-white">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!editingProfile}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <Avatar className="w-32 h-32 mx-auto mb-4">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-4xl">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      {editingProfile && (
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                      )}
                    </div>

                    <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 p-4">
                      <h4 className="font-bold text-white mb-2">Account Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Member Since:</span>
                          <span className="text-white">November 2023</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Orders:</span>
                          <span className="text-white">3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Spent:</span>
                          <span className="text-green-400">£5,797</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Support</h3>
                  <div className="space-y-3">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                      <Package className="w-4 h-4 mr-3" />
                      Track My Order
                    </Button>
                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                      <Settings className="w-4 h-4 mr-3" />
                      Technical Support
                    </Button>
                    <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                      <CreditCard className="w-4 h-4 mr-3" />
                      Billing & Returns
                    </Button>
                  </div>
                </Card>

                <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 backdrop-blur-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Phone Support:</span>
                      <div className="text-white font-medium">0800 123 4567</div>
                      <div className="text-gray-400 text-xs">Mon-Fri 9AM-6PM</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Email Support:</span>
                      <div className="text-white font-medium">support@vortexpcs.com</div>
                      <div className="text-gray-400 text-xs">24-48 hour response</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Live Chat:</span>
                      <div className="text-white font-medium">Available on website</div>
                      <div className="text-gray-400 text-xs">Mon-Fri 9AM-6PM</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
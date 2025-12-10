import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { SaleRecord, Product, Machine } from '../types';

interface DashboardProps {
  sales: SaleRecord[];
  products: Product[];
  machines: Machine[];
  selectedMachineId: string;
  onMachineChange: (id: string) => void;
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={colorClass.replace('bg-', 'text-')} size={20} />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 mt-1">{subtext}</span>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  sales, 
  products, 
  machines, 
  selectedMachineId, 
  onMachineChange 
}) => {
  
  // Filter data based on selected machine (or 'all')
  const filteredSales = useMemo(() => {
    return selectedMachineId === 'all' 
      ? sales 
      : sales.filter(s => s.machineId === selectedMachineId);
  }, [sales, selectedMachineId]);

  const filteredProducts = useMemo(() => {
    return selectedMachineId === 'all'
      ? products
      : products.filter(p => p.machineId === selectedMachineId);
  }, [products, selectedMachineId]);

  // Metrics Calculation
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.revenue, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalItemsSold = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = filteredProducts.filter(p => p.quantity <= p.min_quantity).length;

  // Chart Data Preparation
  const salesByProduct = useMemo(() => {
    const map = new Map();
    filteredSales.forEach(s => {
      const current = map.get(s.productName) || 0;
      map.set(s.productName, current + s.revenue);
    });
    return Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
        <select 
          value={selectedMachineId}
          onChange={(e) => onMachineChange(e.target.value)}
          className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border"
        >
          <option value="all">All Machines</option>
          {machines.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.location})</option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          subtext="+12.5% from last week"
          icon={DollarSign}
          colorClass="text-teal-600 bg-teal-600"
        />
        <StatCard 
          title="Total Profit" 
          value={`$${totalProfit.toFixed(2)}`} 
          subtext={`${((totalProfit / totalRevenue) * 100 || 0).toFixed(1)}% margin`}
          icon={TrendingUp}
          colorClass="text-emerald-600 bg-emerald-600"
        />
        <StatCard 
          title="Items Sold" 
          value={totalItemsSold} 
          subtext="Across active machines"
          icon={ShoppingCart}
          colorClass="text-blue-600 bg-blue-600"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockCount} 
          subtext={lowStockCount > 0 ? "Action needed" : "Inventory healthy"}
          icon={AlertTriangle}
          colorClass="text-orange-600 bg-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-700 font-semibold mb-6">Revenue by Product</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByProduct}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#f0fdfa' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-700 font-semibold mb-6">Sales Trend</h3>
          <div className="h-80 w-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
             {/* Simplified line chart placeholder or implementation */}
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={filteredSales.slice(0, 20).reverse()}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                 <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).getDate().toString()} />
                 <YAxis />
                 <Tooltip labelFormatter={(t) => new Date(t).toLocaleDateString()} />
                 <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
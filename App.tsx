import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import CustomerView from './components/CustomerView';
import AIAssistant from './components/AIAssistant';
import { INITIAL_PRODUCTS, INITIAL_SALES, MACHINES } from './constants';
import { Product, SaleRecord, PaymentMethod, CartItem } from './types';

// Initialize mock data if not in constants
// Note: In a real app, this would be fetched from an API
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOwnerMode, setIsOwnerMode] = useState(true);
  
  // App State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<SaleRecord[]>(INITIAL_SALES);
  const [selectedMachineId, setSelectedMachineId] = useState('all');

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const handleCustomerPurchase = (cart: CartItem[], method: PaymentMethod) => {
    const timestamp = Date.now();
    const newSales: SaleRecord[] = [];
    const updatedProducts = [...products];

    cart.forEach(item => {
      // Create Sale Record
      newSales.push({
        id: `s-${timestamp}-${item.id}`,
        productId: item.id,
        productName: item.name,
        machineId: item.machineId,
        quantity: item.cartQuantity,
        revenue: item.price * item.cartQuantity,
        profit: (item.price - item.cost) * item.cartQuantity,
        timestamp,
        paymentMethod: method
      });

      // Update Inventory
      const productIndex = updatedProducts.findIndex(p => p.id === item.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          quantity: Math.max(0, updatedProducts[productIndex].quantity - item.cartQuantity)
        };
      }
    });

    setSales(prev => [...newSales, ...prev]);
    setProducts(updatedProducts);
  };

  // Render content based on active tab
  const renderContent = () => {
    if (!isOwnerMode) {
      // Customer Mode Logic: Filter products for the "Machine" the customer is currently standing at.
      // For demo, we just show all or let them filter, but typically a customer is at ONE machine.
      // Let's assume customer is viewing 'm1' (Nexus Prime) for this demo interaction.
      const customerMachineId = 'm1';
      const currentMachine = MACHINES.find(m => m.id === customerMachineId);
      
      return (
        <CustomerView 
          products={products.filter(p => p.machineId === customerMachineId)} 
          onPurchase={handleCustomerPurchase}
          machineName={currentMachine?.name}
          location={currentMachine?.location}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            sales={sales} 
            products={products} 
            machines={MACHINES}
            selectedMachineId={selectedMachineId}
            onMachineChange={setSelectedMachineId}
          />
        );
      case 'inventory':
        return (
          <Inventory 
            products={selectedMachineId === 'all' ? products : products.filter(p => p.machineId === selectedMachineId)}
            machines={MACHINES}
            sales={sales}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={handleAddProduct}
          />
        );
      case 'sales':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm">
             <h2 className="text-xl font-bold mb-4">Sales Ledger</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50 uppercase text-xs font-semibold">
                   <tr>
                     <th className="px-4 py-3">Date</th>
                     <th className="px-4 py-3">Product</th>
                     <th className="px-4 py-3">Qty</th>
                     <th className="px-4 py-3">Method</th>
                     <th className="px-4 py-3 text-right">Revenue</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sales.slice(0, 20).map(s => (
                     <tr key={s.id} className="border-t border-gray-100">
                       <td className="px-4 py-3">{new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString()}</td>
                       <td className="px-4 py-3">{s.productName}</td>
                       <td className="px-4 py-3">{s.quantity}</td>
                       <td className="px-4 py-3">{s.paymentMethod}</td>
                       <td className="px-4 py-3 text-right text-teal-700 font-medium">+${s.revenue.toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );
      case 'ai-agent':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">VendNexus AI Central</h2>
            <p className="text-gray-500 max-w-md">
              Use the chat bubble in the bottom right corner to interact with your AI assistant anytime, anywhere in the app.
            </p>
          </div>
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      isOwnerMode={isOwnerMode}
      toggleMode={() => {
        setIsOwnerMode(!isOwnerMode);
        setActiveTab('dashboard'); // Reset tab when switching modes
      }}
    >
      {renderContent()}
      
      {/* AI Assistant is always available in Owner Mode */}
      {isOwnerMode && (
        <AIAssistant 
          contextData={{
            products,
            salesSummary: {
              totalRevenue: sales.reduce((acc, s) => acc + s.revenue, 0),
              totalSalesCount: sales.length
            },
            machines: MACHINES
          }} 
        />
      )}
    </Layout>
  );
};

export default App;
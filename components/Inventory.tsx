import React, { useState } from 'react';
import { Product, Machine } from '../types';
import { Edit2, Trash2, Plus, Sparkles, X, Minus } from 'lucide-react';
import { generateBusinessInsight } from '../services/geminiService';

interface InventoryProps {
  products: Product[];
  machines: Machine[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  machines,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Snack',
    price: 1.00,
    cost: 0.50,
    quantity: 10,
    min_quantity: 5,
    image: 'https://picsum.photos/200',
    machineId: machines[0]?.id || ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSmartRestock = async () => {
    setIsAnalyzing(true);
    // Simulate passing data to AI for analysis
    const insight = await generateBusinessInsight(
      "Analyze the current inventory levels. Suggest reorder quantities for items below minimum quantity. Format as a bulleted list.",
      { products, sales: [], machines }
    );
    setAiSuggestion(insight);
    setIsAnalyzing(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      onUpdateProduct({ ...product, quantity: Math.max(0, product.quantity + delta) });
    }
  };

  const updatePrice = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newPrice = Math.max(0, parseFloat((product.price + delta).toFixed(2)));
      onUpdateProduct({ ...product, price: newPrice });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.machineId) {
      alert("Please fill in all required fields");
      return;
    }

    const productToAdd: Product = {
      id: `p-${Date.now()}`,
      name: newProduct.name,
      category: newProduct.category || 'Snack',
      price: Number(newProduct.price),
      cost: Number(newProduct.cost),
      quantity: Number(newProduct.quantity),
      min_quantity: Number(newProduct.min_quantity),
      image: newProduct.image || 'https://picsum.photos/200',
      machineId: newProduct.machineId
    };

    onAddProduct(productToAdd);
    setIsAddModalOpen(false);
    // Reset form
    setNewProduct({
      name: '',
      category: 'Snack',
      price: 1.00,
      cost: 0.50,
      quantity: 10,
      min_quantity: 5,
      image: 'https://picsum.photos/200',
      machineId: machines[0]?.id || ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add New Product</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    required
                    type="text" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g., Spicy Chips"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="Snack">Snack</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Health">Health</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
                  <select 
                    required
                    value={newProduct.machineId}
                    onChange={e => setNewProduct({...newProduct, machineId: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="" disabled>Select Machine</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={newProduct.cost}
                    onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newProduct.quantity}
                    onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Quantity Alert</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newProduct.min_quantity}
                    onChange={e => setNewProduct({...newProduct, min_quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input 
                    type="text" 
                    value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex space-x-2">
           <button 
            onClick={handleSmartRestock}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={isAnalyzing}
          >
            <Sparkles size={18} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Smart Reorder'}</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {aiSuggestion && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start space-x-3">
            <BotIcon className="text-indigo-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-indigo-900">AI Reorder Suggestions</h4>
              <p className="text-indigo-800 text-sm whitespace-pre-wrap mt-1">{aiSuggestion}</p>
            </div>
            <button 
              onClick={() => setAiSuggestion(null)} 
              className="text-indigo-400 hover:text-indigo-600 ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Machine</th>
                <th className="px-6 py-4 text-center">Price</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const isLowStock = product.quantity <= product.min_quantity;
                const machine = machines.find(m => m.id === product.machineId);

                return (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center space-x-3">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-10 h-10 rounded-md object-cover bg-gray-200"
                      />
                      <span>{product.name}</span>
                    </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {machine ? machine.location : 'Unknown'}
                    </td>
                    
                    {/* Price Column with Controls */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => updatePrice(product.id, -0.25)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                          title="Decrease Price"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[4rem] text-center font-medium">${product.price.toFixed(2)}</span>
                        <button 
                          onClick={() => updatePrice(product.id, 0.25)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                          title="Increase Price"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-mono">{product.quantity}</span>
                         <button 
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1 text-gray-400 hover:text-teal-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No products found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

const BotIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`w-5 h-5 ${className}`}
  >
    <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <rect x="2" y="8" width="20" height="14" rx="2" />
    <path d="M6 12v-2" />
    <path d="M18 12v-2" />
    <path d="M9 16c.5 1 2 1 2.5 0" />
  </svg>
);

export default Inventory;
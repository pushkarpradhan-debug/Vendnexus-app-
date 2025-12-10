import React, { useState } from 'react';
import { Product, Machine, SaleRecord } from '../types';
import { Edit2, Trash2, Plus, Sparkles, X, Loader2, Wand2, AlertTriangle, Save } from 'lucide-react';
import { generateBusinessInsight, generateProductImage, suggestOptimalPrice } from '../services/geminiService';

interface InventoryProps {
  products: Product[];
  machines: Machine[];
  sales: SaleRecord[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  machines,
  sales,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Snack',
    price: 1.00,
    cost: 0.50,
    quantity: 10,
    min_quantity: 5,
    image: '',
    machineId: machines[0]?.id || '',
    expiryDate: Date.now() + 30 * 86400000 
  });

  // Price Suggestion State
  const [priceSuggestion, setPriceSuggestion] = useState<{
    isOpen: boolean;
    product: Partial<Product> | null;
    suggestedPrice: number;
    reasoning: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    product: null,
    suggestedPrice: 0,
    reasoning: '',
    isLoading: false
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSmartRestock = async () => {
    setIsAnalyzing(true);
    const insight = await generateBusinessInsight(
      "Analyze the current inventory levels. Suggest reorder quantities for items below minimum quantity. Format as a bulleted list.",
      { products, sales: [], machines }
    );
    setAiSuggestion(insight);
    setIsAnalyzing(false);
  };

  const handleGetPriceSuggestion = async (product: Partial<Product>) => {
    if (!product.name) return;
    
    // Create a temporary complete product object for the service
    const tempProduct = { ...product } as Product;

    setPriceSuggestion({
      isOpen: true,
      product,
      suggestedPrice: 0,
      reasoning: '',
      isLoading: true
    });

    const result = await suggestOptimalPrice(tempProduct, sales);

    if (result) {
      setPriceSuggestion({
        isOpen: true,
        product,
        suggestedPrice: result.suggestedPrice,
        reasoning: result.reasoning,
        isLoading: false
      });
    } else {
      setPriceSuggestion(prev => ({ ...prev, isLoading: false, reasoning: 'Failed to generate suggestion.' }));
    }
  };

  const applySuggestedPrice = () => {
    if (priceSuggestion.product) {
      setCurrentProduct({
        ...currentProduct,
        price: priceSuggestion.suggestedPrice
      });
      setPriceSuggestion({ ...priceSuggestion, isOpen: false });
    }
  };

  const handleGenerateImage = async () => {
    if (!currentProduct.name) return;
    setIsGeneratingImage(true);
    const imageUrl = await generateProductImage(currentProduct.name);
    if (imageUrl) {
      setCurrentProduct(prev => ({ ...prev, image: imageUrl }));
    }
    setIsGeneratingImage(false);
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentProduct({
      name: '',
      category: 'Snack',
      price: 1.00,
      cost: 0.50,
      quantity: 10,
      min_quantity: 5,
      image: '',
      machineId: machines[0]?.id || '',
      expiryDate: Date.now() + 30 * 86400000
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode('edit');
    setCurrentProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.name || !currentProduct.machineId) {
      alert("Please fill in all required fields");
      return;
    }

    if (modalMode === 'add') {
      const productToAdd: Product = {
        id: `p-${Date.now()}`,
        name: currentProduct.name,
        category: currentProduct.category || 'Snack',
        price: Number(currentProduct.price),
        cost: Number(currentProduct.cost),
        quantity: Number(currentProduct.quantity),
        min_quantity: Number(currentProduct.min_quantity),
        image: currentProduct.image || 'https://picsum.photos/200',
        machineId: currentProduct.machineId,
        expiryDate: currentProduct.expiryDate || Date.now() + 30 * 86400000
      };
      onAddProduct(productToAdd);
    } else {
      onUpdateProduct(currentProduct as Product);
    }

    setIsModalOpen(false);
  };

  const inputClassName = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400";

  return (
    <div className="space-y-6 relative">
      {/* Price Suggestion Popup (Nested Modal) */}
      {priceSuggestion.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Wand2 size={24} />
                <h3 className="text-xl font-bold">AI Pricing</h3>
              </div>
              <button 
                onClick={() => setPriceSuggestion({ ...priceSuggestion, isOpen: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {priceSuggestion.isLoading ? (
              <div className="py-12 flex flex-col items-center text-center">
                <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500">Analyzing trends...</p>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="text-xl font-bold text-gray-800">${priceSuggestion.product?.price?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-indigo-600 font-medium">Suggested</p>
                    <p className="text-2xl font-bold text-indigo-700">${priceSuggestion.suggestedPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-800 leading-relaxed">
                  {priceSuggestion.reasoning}
                </div>
                <button 
                  onClick={applySuggestedPrice}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
                >
                  Apply Suggestion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Product Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image Section */}
                <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                   <div className="flex gap-4 items-start">
                     <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden bg-white">
                       {currentProduct.image ? (
                         <img src={currentProduct.image} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-gray-400 text-xs">No Image</span>
                       )}
                     </div>
                     <div className="flex-1 space-y-2">
                       <input 
                          type="text" 
                          value={currentProduct.image}
                          onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})}
                          className={`${inputClassName} text-sm`}
                          placeholder="Image URL"
                        />
                       <button
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !currentProduct.name}
                          className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          <span>Generate Professional AI Image</span>
                        </button>
                     </div>
                   </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    required
                    type="text" 
                    value={currentProduct.name}
                    onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className={inputClassName}
                    placeholder="e.g., Spicy Chips"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={currentProduct.category}
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className={inputClassName}
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
                    value={currentProduct.machineId}
                    onChange={e => setCurrentProduct({...currentProduct, machineId: e.target.value})}
                    className={inputClassName}
                  >
                    <option value="" disabled>Select Machine</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pricing with AI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={currentProduct.price}
                      onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                      className={inputClassName}
                    />
                    <button
                       type="button"
                       onClick={() => handleGetPriceSuggestion(currentProduct)}
                       className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                       title="Get AI Price Suggestion"
                    >
                      <Wand2 size={18} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={currentProduct.cost}
                    onChange={e => setCurrentProduct({...currentProduct, cost: parseFloat(e.target.value)})}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    value={currentProduct.quantity}
                    onChange={e => setCurrentProduct({...currentProduct, quantity: parseInt(e.target.value)})}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Quantity Alert</label>
                  <input 
                    type="number" 
                    min="0"
                    value={currentProduct.min_quantity}
                    onChange={e => setCurrentProduct({...currentProduct, min_quantity: parseInt(e.target.value)})}
                    className={inputClassName}
                  />
                </div>

                 <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={currentProduct.expiryDate ? new Date(currentProduct.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={e => setCurrentProduct({...currentProduct, expiryDate: new Date(e.target.value).getTime()})}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Save size={18} />
                  <span>{modalMode === 'add' ? 'Add Product' : 'Save Changes'}</span>
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
            onClick={openAddModal}
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
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-gray-400"
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
                <th className="px-6 py-4 text-center">Expiry</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const isLowStock = product.quantity <= product.min_quantity;
                const machine = machines.find(m => m.id === product.machineId);
                const isExpired = product.expiryDate && product.expiryDate < Date.now();
                const isNearExpiry = product.expiryDate && product.expiryDate < Date.now() + 7 * 24 * 60 * 60 * 1000 && !isExpired;

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
                    
                    <td className="px-6 py-4 text-center font-medium">
                      ${product.price.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-center font-mono">
                      {product.quantity}
                    </td>
                    
                    <td className="px-6 py-4 text-center text-xs">
                       <span className={`flex items-center justify-center gap-1 ${isExpired ? 'text-red-600 font-bold' : isNearExpiry ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                         {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}
                         {isExpired && <span title="Expired">⚠️</span>}
                       </span>
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
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
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
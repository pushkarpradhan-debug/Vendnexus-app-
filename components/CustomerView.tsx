import React, { useState } from 'react';
import { Product, CartItem, PaymentMethod } from '../types';
import { ShoppingCart, CreditCard, Smartphone, Banknote, QrCode } from 'lucide-react';

interface CustomerViewProps {
  products: Product[];
  onPurchase: (cart: CartItem[], method: PaymentMethod) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ products, onPurchase }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  const handleCheckout = (method: PaymentMethod) => {
    setIsProcessing(true);
    setTimeout(() => {
      onPurchase(cart, method);
      setIsProcessing(false);
      setPurchaseComplete(true);
      setCart([]);
    }, 2000);
  };

  if (purchaseComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <QrCode className="text-green-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-8">Please collect your items from the dispensing tray below.</p>
        <button 
          onClick={() => setPurchaseComplete(false)}
          className="bg-teal-600 text-white px-8 py-3 rounded-xl hover:bg-teal-700 transition-colors"
        >
          Buy More Items
        </button>
      </div>
    );
  }

  if (showCart) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-teal-50">
          <h2 className="text-lg font-semibold text-teal-900">Your Cart</h2>
          <button onClick={() => setShowCart(false)} className="text-teal-600 text-sm font-medium">Back to Shop</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Your cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-md border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                    x{item.cartQuantity}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${(item.price * item.cartQuantity).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
            </div>
            
            <p className="text-xs text-gray-500 mb-3 text-center uppercase tracking-wider font-semibold">Select Payment Method</p>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.values(PaymentMethod).map((method) => (
                <button
                  key={method}
                  disabled={isProcessing}
                  onClick={() => handleCheckout(method)}
                  className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all text-gray-600"
                >
                  {method === PaymentMethod.CREDIT_CARD && <CreditCard size={20} className="mb-1" />}
                  {method === PaymentMethod.UPI && <Smartphone size={20} className="mb-1" />}
                  {method === PaymentMethod.WALLET && <Smartphone size={20} className="mb-1" />}
                  {method === PaymentMethod.CASH && <Banknote size={20} className="mb-1" />}
                  {method === PaymentMethod.QR_CODE && <QrCode size={20} className="mb-1" />}
                  <span className="text-xs font-medium">{method}</span>
                </button>
              ))}
            </div>
            
            {isProcessing && (
              <div className="mt-4 text-center text-sm text-teal-600 animate-pulse">
                Processing payment securely...
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors
              ${activeCategory === cat 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="relative h-40 bg-gray-100">
               <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
               {product.quantity === 0 && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold">
                   OUT OF STOCK
                 </div>
               )}
               {product.quantity > 0 && product.quantity < 5 && (
                 <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                   Only {product.quantity} left!
                 </div>
               )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-teal-700">${product.price.toFixed(2)}</span>
                <button
                  disabled={product.quantity === 0}
                  onClick={() => addToCart(product)}
                  className="bg-teal-100 text-teal-700 p-2 rounded-lg hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-teal-900 text-white p-4 rounded-full shadow-lg hover:bg-teal-800 transition-all hover:scale-105 z-50 flex items-center space-x-2"
        >
          <ShoppingCart size={24} />
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full absolute -top-1 -right-1 border-2 border-white">
            {cartItemCount}
          </span>
        </button>
      )}
    </div>
  );
};

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default CustomerView;
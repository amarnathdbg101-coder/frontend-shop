/**
 * POS (Counter Billing) Cart Context with Dynamic Custom Price & Profit Tracking
 */

import React, { createContext, useContext, useState, useMemo } from 'react';

const POSContext = createContext(null);

export const POSProvider = ({ children }) => {
  // Cart items array: [{ product, quantity, customPrice }]
  const [cart, setCart] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'credit' | 'split'

  // Cart me product add karna ya quantity increment karna
  const addToCart = (product, quantity = 1, customPrice = null) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (customPrice !== null) {
          updated[existingIndex].customPrice = customPrice;
        }
        return updated;
      }
      return [...prev, { product, quantity, customPrice: customPrice ?? product.price }];
    });
  };

  // Quantity update (+1 ya -1)
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Update sold price / dynamic bargaining price per item
  const updateCustomPrice = (productId, newPrice) => {
    const parsedPrice = parseFloat(newPrice);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            customPrice: isNaN(parsedPrice) ? 0 : parsedPrice,
          };
        }
        return item;
      })
    );
  };

  // Cart se item nikalna
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cart khali karna (bill banne ke baad)
  const clearCart = () => {
    setCart([]);
    setCustomerPhone('');
    setCustomerName('');
    setSelectedKhataCustomer(null);
    setDiscountAmount(0);
    setPaymentMethod('cash');
  };

  // Bill calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.customPrice !== null && item.customPrice !== undefined ? item.customPrice : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => {
      const cost = Number(item.product.cost_price || 0);
      return sum + cost * item.quantity;
    }, 0);
  }, [cart]);

  const total = useMemo(() => {
    const finalAmt = subtotal - (Number(discountAmount) || 0);
    return Math.max(0, finalAmt);
  }, [subtotal, discountAmount]);

  const netProfit = useMemo(() => {
    return total - totalCost;
  }, [total, totalCost]);

  const profitMargin = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((netProfit / total) * 1000) / 10;
  }, [total, netProfit]);

  const itemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Loss check: Check if any item is priced below floor_price (or below cost_price)
  const lossItems = useMemo(() => {
    return cart.filter((item) => {
      const p = item.product;
      const minAllowed = (p.floor_price && p.floor_price > 0) ? p.floor_price : (p.cost_price && p.cost_price > 0 ? p.cost_price : 0);
      const soldPrice = item.customPrice !== null && item.customPrice !== undefined ? item.customPrice : p.price;
      return minAllowed > 0 && soldPrice < minAllowed;
    });
  }, [cart]);

  const hasLossWarning = lossItems.length > 0;

  return (
    <POSContext.Provider
      value={{
        cart,
        customerPhone,
        setCustomerPhone,
        customerName,
        setCustomerName,
        selectedKhataCustomer,
        setSelectedKhataCustomer,
        discountAmount,
        setDiscountAmount,
        paymentMethod,
        setPaymentMethod,
        addToCart,
        updateQuantity,
        updateCustomPrice,
        removeFromCart,
        clearCart,
        subtotal,
        totalCost,
        total,
        netProfit,
        profitMargin,
        itemCount,
        lossItems,
        hasLossWarning,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, CartCustomization } from '../types';
import { storage } from '../lib/storage';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number, customization?: Partial<CartCustomization>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemCustomization: (cartItemId: string, customization: CartCustomization) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to calculate unit price based on size + addons
export function calculateItemUnitPrice(
  product: Product,
  customization?: Partial<CartCustomization>
): number {
  let price = product.basePrice;
  if (customization?.selectedSize) {
    price = customization.selectedSize.price;
  }
  if (customization?.addOns && customization.addOns.length > 0) {
    const addonsSum = customization.addOns.reduce((sum, add) => sum + add.price, 0);
    price += addonsSum;
  }
  return price;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => storage.getCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    storage.setCart(items);
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    customizationInput?: Partial<CartCustomization>
  ) => {
    const fullCustomization: CartCustomization = {
      selectedSize:
        customizationInput?.selectedSize ||
        (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined),
      addOns: customizationInput?.addOns || [],
      sweetnessLevel: customizationInput?.sweetnessLevel,
      iceLevel: customizationInput?.iceLevel,
      milkChoice: customizationInput?.milkChoice,
      specialInstructions: customizationInput?.specialInstructions || '',
    };

    const unitPrice = calculateItemUnitPrice(product, fullCustomization);

    // Create a unique key for comparing items with identical customization
    const customKey = `${product.id}-${fullCustomization.selectedSize?.id || 'base'}-${fullCustomization.addOns.map((a) => a.id).sort().join(',')}-${fullCustomization.sweetnessLevel || ''}-${fullCustomization.iceLevel || ''}-${fullCustomization.specialInstructions || ''}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (it) =>
          it.product.id === product.id &&
          (it.customization.selectedSize?.id || 'base') === (fullCustomization.selectedSize?.id || 'base') &&
          it.customization.addOns.map((a) => a.id).sort().join(',') === fullCustomization.addOns.map((a) => a.id).sort().join(',') &&
          (it.customization.sweetnessLevel || '') === (fullCustomization.sweetnessLevel || '') &&
          (it.customization.iceLevel || '') === (fullCustomization.iceLevel || '') &&
          (it.customization.specialInstructions || '') === (fullCustomization.specialInstructions || '')
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * updated[existingIndex].unitPrice,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        product,
        quantity,
        unitPrice,
        customization: fullCustomization,
        subtotal: unitPrice * quantity,
      };

      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const updateItemCustomization = (cartItemId: string, customization: CartCustomization) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const unitPrice = calculateItemUnitPrice(item.product, customization);
          return {
            ...item,
            customization,
            unitPrice,
            subtotal: unitPrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemCustomization,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

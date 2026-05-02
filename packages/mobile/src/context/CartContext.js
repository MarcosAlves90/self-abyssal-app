import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { buildCartItemRequest } from "../contracts";

const CartContext = createContext(undefined);
export const MAX_CART_ITEM_QUANTITY = 20;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [checkoutFeedback, setCheckoutFeedback] = useState(null);

  const addItem = useCallback((menuItem) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === menuItem.id);

      if (existingItem) {
        if (existingItem.quantity >= MAX_CART_ITEM_QUANTITY) {
          return currentItems;
        }

        return currentItems.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        buildCartItemRequest(menuItem)
      ];
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }, []);

  const updateItemQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const nextQuantity = Math.min(quantity, MAX_CART_ITEM_QUANTITY);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity: nextQuantity } : item
      )
    );
  }, [removeItem]);

  const updateItemNote = useCallback((itemId, note) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, note } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const clearCheckoutFeedback = useCallback(() => {
    setCheckoutFeedback(null);
  }, []);

  const totalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.priceCents,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(() => ({
    items,
    itemCount,
    totalCents,
    addItem,
    clearCart,
    checkoutFeedback,
    removeItem,
    clearCheckoutFeedback,
    setCheckoutFeedback,
    updateItemNote,
    updateItemQuantity
  }), [
    addItem,
    clearCart,
    clearCheckoutFeedback,
    checkoutFeedback,
    itemCount,
    items,
    totalCents,
    updateItemNote,
    updateItemQuantity,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}

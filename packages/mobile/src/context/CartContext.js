import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem(menuItem) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === menuItem.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          id: menuItem.id,
          name: menuItem.name,
          priceCents: menuItem.priceCents,
          quantity: 1,
          note: ""
        }
      ];
    });
  }

  function removeItem(itemId) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function updateItemQuantity(itemId, quantity) {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }

  function updateItemNote(itemId, note) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, note } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.priceCents,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items,
    itemCount,
    totalCents,
    addItem,
    clearCart,
    removeItem,
    updateItemNote,
    updateItemQuantity
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}

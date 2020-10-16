import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storeProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:product',
      );
      if (!storeProducts) {
        return;
      }
      setProducts(JSON.parse(storeProducts));
    }

    loadProducts();
  }, []);

  const saveInAsyncStorage = useCallback(async (data: Product[]): Promise<
    void
  > => {
    await AsyncStorage.removeItem('@GoMarketPlace:product');

    await AsyncStorage.setItem('@GoMarketPlace:product', JSON.stringify(data));
  }, []);

  const addToCart = useCallback(
    async newProduct => {
      const existItem = products.find(product => newProduct.id === product.id);

      if (existItem) {
        setProducts(
          products.map(product => {
            if (product.id === newProduct.id) {
              product.quantity += 1;
              return product;
            }
            return product;
          }),
        );
      } else {
        newProduct.quantity = 1;
        setProducts([...products, newProduct]);
        saveInAsyncStorage([...products, newProduct]);
      }
    },
    [products, saveInAsyncStorage],
  );

  const increment = useCallback(
    async id => {
      const newProduct = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
        }
        return product;
      });
      setProducts(newProduct);
      saveInAsyncStorage(newProduct);
    },
    [products, saveInAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const newProduct = products.map(product => {
        if (product.id === id) {
          product.quantity -= 1;
        }
        return product;
      });
      setProducts(newProduct);
      saveInAsyncStorage(newProduct);
    },
    [products, saveInAsyncStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const GUEST_CART_KEY = 'stylemate_guest_cart';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantValue: string | null;
  quantity: number;
  unitPriceInPaisa: number;
  totalPriceInPaisa: number;
  stock: number;
  isAvailable: boolean;
  salonId?: string;
  salonName?: string;
}

export interface GuestCartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPriceInPaisa: number;
  salonId?: string;
  salonName?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  isGuest: boolean;
  addToCart: (product: { id: string; name: string; retailPriceInPaisa: number; primaryImage?: string | null; salonId?: string; salonName?: string }) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  mergeGuestCartToServer: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

function getGuestCart(): GuestCartItem[] {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const isCustomer = user?.roles?.includes('customer');

  useEffect(() => {
    if (!isAuthenticated) {
      setGuestItems(getGuestCart());
    }
  }, [isAuthenticated]);

  const { data: serverCartData, isLoading: serverLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated && isCustomer,
  });

  const serverCart = (serverCartData as any)?.cart;
  const serverItems: CartItem[] = serverCart?.items || [];

  const addToServerMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return apiRequest('POST', '/api/cart', { productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const removeFromServerMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest('DELETE', `/api/cart/items/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const updateServerQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const addToCart = useCallback(async (product: { id: string; name: string; retailPriceInPaisa: number; primaryImage?: string | null; salonId?: string; salonName?: string }) => {
    if (isAuthenticated && isCustomer) {
      try {
        await addToServerMutation.mutateAsync({ productId: product.id, quantity: 1 });
        toast({
          title: 'Added to cart',
          description: 'Product added to your shopping cart',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to add to cart',
          variant: 'destructive',
        });
      }
    } else {
      const currentItems = getGuestCart();
      const existingIndex = currentItems.findIndex(item => item.productId === product.id);
      
      if (existingIndex >= 0) {
        currentItems[existingIndex].quantity += 1;
      } else {
        currentItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.primaryImage || null,
          quantity: 1,
          unitPriceInPaisa: product.retailPriceInPaisa,
          salonId: product.salonId,
          salonName: product.salonName,
        });
      }
      
      setGuestCart(currentItems);
      setGuestItems([...currentItems]);
      toast({
        title: 'Added to cart',
        description: 'Product added to your shopping cart',
      });
    }
  }, [isAuthenticated, isCustomer, addToServerMutation, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    if (isAuthenticated && isCustomer) {
      try {
        await removeFromServerMutation.mutateAsync(itemId);
        toast({
          title: 'Item removed',
          description: 'Product removed from cart',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to remove item',
          variant: 'destructive',
        });
      }
    } else {
      const currentItems = getGuestCart();
      const filteredItems = currentItems.filter(item => item.productId !== itemId);
      setGuestCart(filteredItems);
      setGuestItems(filteredItems);
      toast({
        title: 'Item removed',
        description: 'Product removed from cart',
      });
    }
  }, [isAuthenticated, isCustomer, removeFromServerMutation, toast]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (isAuthenticated && isCustomer) {
      try {
        await updateServerQuantityMutation.mutateAsync({ itemId, quantity });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to update quantity',
          variant: 'destructive',
        });
      }
    } else {
      const currentItems = getGuestCart();
      const itemIndex = currentItems.findIndex(item => item.productId === itemId);
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          currentItems.splice(itemIndex, 1);
        } else {
          currentItems[itemIndex].quantity = quantity;
        }
        setGuestCart(currentItems);
        setGuestItems([...currentItems]);
      }
    }
  }, [isAuthenticated, isCustomer, updateServerQuantityMutation, toast]);

  const clearCart = useCallback(async () => {
    if (isAuthenticated && isCustomer) {
      for (const item of serverItems) {
        await removeFromServerMutation.mutateAsync(item.id);
      }
    } else {
      clearGuestCart();
      setGuestItems([]);
    }
  }, [isAuthenticated, isCustomer, serverItems, removeFromServerMutation]);

  const mergeGuestCartToServer = useCallback(async () => {
    const guestCartItems = getGuestCart();
    if (guestCartItems.length === 0) return;

    for (const item of guestCartItems) {
      try {
        await addToServerMutation.mutateAsync({ 
          productId: item.productId, 
          quantity: item.quantity 
        });
      } catch (error) {
        console.error('Failed to merge item:', item.productId, error);
      }
    }
    
    clearGuestCart();
    setGuestItems([]);
    queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
  }, [addToServerMutation, queryClient]);

  useEffect(() => {
    if (isAuthenticated && isCustomer) {
      const guestCartItems = getGuestCart();
      if (guestCartItems.length > 0) {
        mergeGuestCartToServer();
      }
    }
  }, [isAuthenticated, isCustomer, mergeGuestCartToServer]);

  const items: CartItem[] = (isAuthenticated && isCustomer)
    ? serverItems
    : guestItems.map((item, index) => ({
        id: `guest-${item.productId}-${index}`,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variantId: null,
        variantValue: null,
        quantity: item.quantity,
        unitPriceInPaisa: item.unitPriceInPaisa,
        totalPriceInPaisa: item.unitPriceInPaisa * item.quantity,
        stock: 999,
        isAvailable: true,
        salonId: item.salonId,
        salonName: item.salonName,
      }));

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPriceInPaisa, 0);

  const value: CartContextType = {
    items,
    itemCount,
    isLoading: isAuthenticated && isCustomer ? serverLoading : false,
    isGuest: !isAuthenticated || !isCustomer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    mergeGuestCartToServer,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

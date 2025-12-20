import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, Tag, LogIn } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ShoppingCart() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { items, itemCount, isLoading, isGuest, removeFromCart, updateQuantity, subtotal } = useCart();
  const isCustomer = user?.roles?.includes('customer');
  const [couponCode, setCouponCode] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const availableItems = items.filter(item => item.isAvailable);
  const unavailableItems = items.filter(item => !item.isAvailable);

  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('POST', '/api/cart/apply-coupon', { code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Coupon applied',
        description: 'Your discount has been applied',
      });
      setCouponCode('');
    },
    onError: () => {
      toast({
        title: 'Invalid coupon',
        description: 'This coupon code is not valid',
        variant: 'destructive',
      });
    },
  });

  const handleProceedToCheckout = () => {
    if (isGuest) {
      setShowLoginDialog(true);
    } else {
      navigate('/checkout');
    }
  };

  const taxInPaisa = Math.round(subtotal * 0.18);
  const totalInPaisa = subtotal + taxInPaisa;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-40 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 mb-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (availableItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 data-testid="text-empty-cart-title" className="text-2xl font-bold mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Looks like you haven't added any products yet
        </p>
        <Button
          data-testid="button-continue-shopping"
          onClick={() => navigate('/shop')}
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <h1 data-testid="text-cart-title" className="text-2xl font-bold">
          Cart ({itemCount})
        </h1>
        {isGuest && (
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to save your cart and checkout
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          {availableItems.map((item) => (
            <Card key={item.id} data-testid={`cart-item-${item.id}`} className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 
                    data-testid={`text-item-name-${item.id}`}
                    className="font-medium line-clamp-2 mb-1"
                  >
                    {item.productName}
                  </h3>
                  {item.variantValue && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Variant: {item.variantValue}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p 
                      data-testid={`text-item-price-${item.id}`}
                      className="font-bold text-lg"
                    >
                      ₹{(item.totalPriceInPaisa / 100).toFixed(0)}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        data-testid={`button-decrease-${item.id}`}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(isGuest ? item.productId : item.id, item.quantity - 1);
                          }
                        }}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span 
                        data-testid={`text-quantity-${item.id}`}
                        className="w-8 text-center font-medium"
                      >
                        {item.quantity}
                      </span>
                      <Button
                        data-testid={`button-increase-${item.id}`}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity < Math.min(item.stock, 10)) {
                            updateQuantity(isGuest ? item.productId : item.id, item.quantity + 1);
                          }
                        }}
                        disabled={item.quantity >= Math.min(item.stock, 10)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        data-testid={`button-remove-${item.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={() => removeFromCart(isGuest ? item.productId : item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{(item.unitPriceInPaisa / 100).toFixed(0)} each
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {unavailableItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Unavailable Items
            </h3>
            {unavailableItems.map((item) => (
              <Card 
                key={item.id} 
                data-testid={`unavailable-item-${item.id}`}
                className="p-4 opacity-60"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2 mb-1">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-destructive mb-2">Out of Stock</p>
                    <Button
                      data-testid={`button-remove-unavailable-${item.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(isGuest ? item.productId : item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isAuthenticated && isCustomer && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" />
              <h3 className="font-semibold">Apply Coupon</h3>
            </div>
            <div className="flex gap-2">
              <Input
                data-testid="input-coupon-code"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                data-testid="button-apply-coupon"
                onClick={() => applyCouponMutation.mutate(couponCode)}
                disabled={!couponCode || applyCouponMutation.isPending}
              >
                Apply
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Price Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({availableItems.length} items)</span>
              <span data-testid="text-subtotal">
                ₹{(subtotal / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Charge</span>
              <span data-testid="text-delivery-charge">
                <span className="text-green-600 dark:text-green-400">FREE</span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (GST 18%)</span>
              <span data-testid="text-tax">
                ₹{(taxInPaisa / 100).toFixed(0)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span data-testid="text-total">
                ₹{(totalInPaisa / 100).toFixed(0)}
              </span>
            </div>
          </div>
        </Card>

        <Button
          data-testid="button-continue-shopping-bottom"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/shop')}
        >
          Continue Shopping
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p data-testid="text-total-bottom" className="text-2xl font-bold">
              ₹{(totalInPaisa / 100).toFixed(0)}
            </p>
          </div>
          <Button
            data-testid="button-proceed-checkout"
            size="lg"
            onClick={handleProceedToCheckout}
            className="flex-1 max-w-xs"
          >
            {isGuest ? 'Sign in to Checkout' : 'Proceed to Checkout'}
          </Button>
        </div>
      </div>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign in to Continue
            </DialogTitle>
            <DialogDescription>
              Please sign in or create an account to complete your purchase. Your cart items will be saved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              You have {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart worth ₹{(totalInPaisa / 100).toFixed(0)}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Continue Shopping
            </Button>
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="secondary" onClick={() => navigate('/join')}>
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

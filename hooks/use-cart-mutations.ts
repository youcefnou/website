'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateUserCartItem,
  removeUserCartItem,
  mergeGuestCart,
} from '@/app/actions/cart';

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cartItemId,
      quantity,
    }: {
      cartItemId: string;
      quantity: number;
    }) => updateUserCartItem(cartItemId, quantity),
    onSuccess: () => {
      // Invalidate and refetch cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Failed to update cart item:', error);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) => removeUserCartItem(cartItemId),
    onSuccess: () => {
      // Invalidate and refetch cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Failed to remove cart item:', error);
    },
  });
}

export function useMergeGuestCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guestItems: Array<{ sellableItemId: string; quantity: number }>) =>
      mergeGuestCart(guestItems),
    onSuccess: () => {
      // Invalidate and refetch cart queries after merge
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Failed to merge guest cart:', error);
    },
  });
}

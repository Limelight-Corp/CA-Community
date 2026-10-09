'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CommunityStoreData,
  INITIAL_COMMUNITY_DATA,
} from '@ascend/shared';

const STORAGE_KEY = 'ascend_community_store';
const SYNC_CHANNEL = 'ascend_community_sync';

export type ContentType = 'events' | 'gallery' | 'speakers' | 'wings' | 'news' | 'resources';

export function useCommunityData(publishedOnly = false) {
  const [data, setData] = useState<CommunityStoreData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        // Fall back to initial data
      }
    }
    return INITIAL_COMMUNITY_DATA;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = publishedOnly ? '/api/community?publishedOnly=true' : '/api/community';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
      }
    } catch (err: any) {
      console.warn('API fetch failed, utilizing cached/initial store:', err);
      setError(err?.message || 'Failed to fetch community data');
    } finally {
      setIsLoading(false);
    }
  }, [publishedOnly]);

  useEffect(() => {
    fetchLatest();

    // Listen to broadcast channel for multi-tab updates
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'COMMUNITY_DATA_UPDATED' && event.data?.payload) {
          setData(event.data.payload);
        } else if (event.data?.type === 'REFRESH') {
          fetchLatest();
        }
      };
    }

    return () => {
      channel?.close();
    };
  }, [fetchLatest]);

  const notifyChange = (updatedData: CommunityStoreData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel(SYNC_CHANNEL);
        ch.postMessage({ type: 'COMMUNITY_DATA_UPDATED', payload: updatedData });
        ch.close();
      }
    }
  };

  const addItem = async <T = any>(type: ContentType, item: any): Promise<T> => {
    const id = item.id || `${type.slice(0, 3)}-${Date.now()}`;
    const newItem = {
      ...item,
      id,
      isPublished: item.isPublished !== undefined ? item.isPublished : true,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    const updatedData: CommunityStoreData = {
      ...data,
      [type]: [newItem, ...(data[type] || [])],
    };
    setData(updatedData);
    notifyChange(updatedData);

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, item: newItem }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result = await res.json();
      return result.item || newItem;
    } catch (err: any) {
      console.error('Server sync failed:', err);
      return newItem;
    }
  };

  const updateItem = async <T = any>(type: ContentType, id: string, updates: any): Promise<T> => {
    const currentList = (data[type] || []) as any[];
    const idx = currentList.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Item not found');

    const updatedItem = {
      ...currentList[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...currentList];
    updatedList[idx] = updatedItem;

    const updatedData: CommunityStoreData = {
      ...data,
      [type]: updatedList,
    };
    setData(updatedData);
    notifyChange(updatedData);

    try {
      const res = await fetch('/api/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, updates }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result = await res.json();
      return result.item || updatedItem;
    } catch (err: any) {
      console.error('Server sync failed:', err);
      return updatedItem;
    }
  };

  const deleteItem = async (type: ContentType, id: string): Promise<boolean> => {
    const currentList = (data[type] || []) as any[];
    const updatedList = currentList.filter((x) => x.id !== id);

    const updatedData: CommunityStoreData = {
      ...data,
      [type]: updatedList,
    };
    setData(updatedData);
    notifyChange(updatedData);

    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      return res.ok;
    } catch (err: any) {
      console.error('Server sync failed:', err);
      return true;
    }
  };

  const togglePublish = async (type: ContentType, id: string): Promise<boolean> => {
    const currentList = (data[type] || []) as any[];
    const item = currentList.find((x) => x.id === id);
    if (!item) return false;

    const newStatus = !item.isPublished;
    await updateItem(type, id, { isPublished: newStatus });
    return newStatus;
  };

  return {
    data,
    isLoading,
    error,
    refresh: fetchLatest,
    addItem,
    updateItem,
    deleteItem,
    togglePublish,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CommunityStoreData,
  INITIAL_COMMUNITY_DATA,
} from '@ascend/shared';

const STORAGE_KEY = 'ascend_community_store';
const SYNC_CHANNEL = 'ascend_community_sync';

export type ContentType = 'events' | 'gallery' | 'speakers' | 'wings' | 'news' | 'resources';

export function useCommunityData(publishedOnly = true) {
  const [data, setData] = useState<CommunityStoreData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (publishedOnly) {
            return {
              events: (parsed.events || []).filter((x: any) => x.isPublished !== false),
              gallery: (parsed.gallery || []).filter((x: any) => x.isPublished !== false),
              speakers: (parsed.speakers || []).filter((x: any) => x.isPublished !== false),
              wings: (parsed.wings || []).filter((x: any) => x.isPublished !== false),
              news: (parsed.news || []).filter((x: any) => x.isPublished !== false),
              resources: (parsed.resources || []).filter((x: any) => x.isPublished !== false),
            };
          }
          return parsed;
        }
      } catch (e) {
        // Fall back to initial data
      }
    }
    if (publishedOnly) {
      return {
        events: INITIAL_COMMUNITY_DATA.events.filter((x) => x.isPublished !== false),
        gallery: INITIAL_COMMUNITY_DATA.gallery.filter((x) => x.isPublished !== false),
        speakers: INITIAL_COMMUNITY_DATA.speakers.filter((x) => x.isPublished !== false),
        wings: INITIAL_COMMUNITY_DATA.wings.filter((x) => x.isPublished !== false),
        news: INITIAL_COMMUNITY_DATA.news.filter((x) => x.isPublished !== false),
        resources: INITIAL_COMMUNITY_DATA.resources.filter((x) => x.isPublished !== false),
      };
    }
    return INITIAL_COMMUNITY_DATA;
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = publishedOnly ? '/api/community?publishedOnly=true' : '/api/community';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        const fullData = json.data;
        if (publishedOnly) {
          setData({
            events: (fullData.events || []).filter((x: any) => x.isPublished !== false),
            gallery: (fullData.gallery || []).filter((x: any) => x.isPublished !== false),
            speakers: (fullData.speakers || []).filter((x: any) => x.isPublished !== false),
            wings: (fullData.wings || []).filter((x: any) => x.isPublished !== false),
            news: (fullData.news || []).filter((x: any) => x.isPublished !== false),
            resources: (fullData.resources || []).filter((x: any) => x.isPublished !== false),
          });
        } else {
          setData(fullData);
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
        }
      }
    } catch (err: any) {
      // Keep existing data
    } finally {
      setIsLoading(false);
    }
  }, [publishedOnly]);

  useEffect(() => {
    fetchLatest();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'COMMUNITY_DATA_UPDATED' && event.data?.payload) {
          const fullData = event.data.payload;
          if (publishedOnly) {
            setData({
              events: (fullData.events || []).filter((x: any) => x.isPublished !== false),
              gallery: (fullData.gallery || []).filter((x: any) => x.isPublished !== false),
              speakers: (fullData.speakers || []).filter((x: any) => x.isPublished !== false),
              wings: (fullData.wings || []).filter((x: any) => x.isPublished !== false),
              news: (fullData.news || []).filter((x: any) => x.isPublished !== false),
              resources: (fullData.resources || []).filter((x: any) => x.isPublished !== false),
            });
          } else {
            setData(fullData);
          }
        }
      };
    }

    return () => {
      channel?.close();
    };
  }, [fetchLatest, publishedOnly]);

  return {
    data,
    isLoading,
    refresh: fetchLatest,
  };
}

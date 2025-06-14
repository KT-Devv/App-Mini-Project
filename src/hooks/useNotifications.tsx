
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        target_user_id: user.id
      });

      if (!error && data !== null) {
        setUnreadCount(data);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string = 'general',
    relatedId?: string
  ) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up real-time subscription for count updates
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    unreadCount,
    setUnreadCount,
    createNotification,
    refreshCount: fetchUnreadCount
  };
};

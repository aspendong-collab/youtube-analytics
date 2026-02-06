/**
 * 心跳 Hook
 * 定期发送心跳请求以保持在线状态
 */

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface UseHeartbeatOptions {
  /**
   * 心跳间隔（毫秒），默认 30 秒
   */
  interval?: number;
  /**
   * 是否启用心跳
   */
  enabled?: boolean;
}

export function useHeartbeat(options: UseHeartbeatOptions = {}) {
  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout>();

  const {
    interval = 30 * 1000, // 30秒
    enabled = true,
  } = options;

  useEffect(() => {
    // 只有已登录用户才发送心跳
    if (!enabled || status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/stats/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Heartbeat] 心跳成功，在线人数:', data.data?.onlineCount);
        }
      } catch (error) {
        console.error('[Heartbeat] 心跳失败:', error);
      }
    };

    // 立即发送一次心跳
    sendHeartbeat();

    // 设置定时心跳
    intervalRef.current = setInterval(sendHeartbeat, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, status, session, interval]);

  return {
    isActive: status === 'authenticated' && enabled,
  };
}

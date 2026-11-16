import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * İnternet bağlantı durumu.
 * `null` → henüz bilinmiyor (ilk ölçüm yapılmadı).
 */
export function useNetworkStatus(): boolean | null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const apply = (state: {
      isConnected: boolean | null;
      isInternetReachable: boolean | null;
    }): void => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    };

    const unsubscribe = NetInfo.addEventListener(apply);
    void NetInfo.fetch().then(apply).catch(() => undefined);

    return unsubscribe;
  }, []);

  return isOnline;
}

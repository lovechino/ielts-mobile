import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);
      setIsConnected(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return isConnected;
}

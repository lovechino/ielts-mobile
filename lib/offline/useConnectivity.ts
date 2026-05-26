import { useEffect, useState } from 'react';

export function useConnectivity(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      setOnline(navigator.onLine);
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      return () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      };
    }
  }, []);

  return online;
}

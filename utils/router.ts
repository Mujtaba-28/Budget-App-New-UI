
import { useState, useEffect, useCallback } from 'react';

export const useHashLocation = () => {
  const getHash = () => {
    try {
      // Check if location exists and has hash
      if (typeof window !== 'undefined' && window.location) {
          return window.location.hash.replace('#', '') || 'home';
      }
      return 'home';
    } catch (e) {
      return 'home';
    }
  };
  
  const [loc, setLoc] = useState(getHash());

  useEffect(() => {
    const handler = () => {
        const currentHash = getHash();
        if (currentHash !== loc) {
            setLoc(currentHash);
        }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [loc]);

  const navigate = useCallback((path: string) => {
    // State First: Update UI immediately
    setLoc(path);
    
    // Side Effect: Try to update URL, but don't crash if blocked
    try {
      if (typeof window !== 'undefined' && window.location) {
          window.location.hash = path;
      }
    } catch (e) {
      // Silently ignore hash errors in restricted environments (blob/iframe)
      console.warn("Hash navigation restricted, running in internal state mode.");
    }
  }, []);

  return [loc, navigate] as const;
};

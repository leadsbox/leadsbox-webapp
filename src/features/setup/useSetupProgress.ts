import { useState, useEffect } from 'react';
import { fetchSetupMetrics, SetupMetrics, defaultSetupMetrics, hasReachedFirstValue } from './setupProgress';

export const useSetupProgress = () => {
  const [metrics, setMetrics] = useState<SetupMetrics>(defaultSetupMetrics);
  const [loading, setLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const data = await fetchSetupMetrics();
        if (mounted) {
          setMetrics(data);
          setIsSetupComplete(hasReachedFirstValue(data));
        }
      } catch (error) {
        console.error('Failed to load setup progress', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProgress();

    return () => {
      mounted = false;
    };
  }, []);

  return { metrics, loading, isSetupComplete };
};

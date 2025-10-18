import { useState, useEffect } from 'react';
import { ClassArrangementInfo } from '../types';
import {
  fetchAllArrangements,
  createArrangement as apiCreateArrangement,
  updateArrangement as apiUpdateArrangement,
  deleteArrangement as apiDeleteArrangement,
} from '../services/arrangementService';

export function useArrangements() {
  const [arrangements, setArrangements] = useState<ClassArrangementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch arrangements on mount
  useEffect(() => {
    loadArrangements();
  }, []);

  const loadArrangements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllArrangements();
      setArrangements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load arrangements');
      console.error('Error loading arrangements:', err);
    } finally {
      setLoading(false);
    }
  };

  const createArrangement = async (arrangement: ClassArrangementInfo) => {
    try {
      setError(null);
      const created = await apiCreateArrangement(arrangement);
      setArrangements((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create arrangement');
      throw err;
    }
  };

  const updateArrangement = async (arrangement: ClassArrangementInfo) => {
    try {
      setError(null);
      const updated = await apiUpdateArrangement(arrangement);
      setArrangements((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update arrangement');
      throw err;
    }
  };

  const deleteArrangement = async (id: string) => {
    try {
      setError(null);
      await apiDeleteArrangement(id);
      setArrangements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete arrangement');
      throw err;
    }
  };

  const saveArrangement = async (arrangement: ClassArrangementInfo) => {
    const exists = arrangements.some((a) => a.id === arrangement.id);
    if (exists) {
      return updateArrangement(arrangement);
    } else {
      return createArrangement(arrangement);
    }
  };

  return {
    arrangements,
    loading,
    error,
    loadArrangements,
    createArrangement,
    updateArrangement,
    deleteArrangement,
    saveArrangement,
  };
}

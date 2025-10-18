import { useState, useEffect } from 'react';
import { ClassArrangementInfo } from '../types';
import {
  fetchAllArrangements,
  createArrangement as apiCreateArrangement,
  updateArrangement as apiUpdateArrangement,
  deleteArrangement as apiDeleteArrangement,
} from '../services/arrangementService';

const STORAGE_KEY = 'classArrangements';
const USE_MONGODB_KEY = 'useMongoDBStorage';

// Default arrangements for initialization based on the seasonal schedule
const defaultArrangements: ClassArrangementInfo[] = [
  {
    id: 'class-elder-1',
    time: '主日 11:30 AM',
    beginningDate: '2026年1月5日',
    duration: '1 小時',
    place: '講台下右邊',
    teacher: '張淑佳牧師',
    focusLevel: '利未記 - 初讀',
    group: '長者班',
  },
  {
    id: 'class-mentor-1',
    time: '主日 11:30 AM',
    beginningDate: '2026年1月5日',
    duration: '1 小時',
    place: '講台',
    teacher: '黃月保執事',
    focusLevel: '報名參加',
    group: '導修班',
  },
  {
    id: 'class-beginner-1',
    time: '主日 11:30 AM',
    beginningDate: '2026年1月5日',
    duration: '1 小時',
    place: '廚房外面',
    teacher: '陳潤生傳道 + 葉國良弟兄',
    focusLevel: '以弗所 + 歌羅西',
    group: '初讀班',
  },
  {
    id: 'class-application-1',
    time: '主日 11:30 AM',
    beginningDate: '2026年1月5日',
    duration: '1 小時',
    place: '音響室前',
    teacher: '熊天佑弟兄',
    focusLevel: '約伯記、箴言、傳道書 - 反常、正常、無常的人生',
    group: '應用班',
  },
  {
    id: 'class-youth-1',
    time: '主日 11:30 AM',
    beginningDate: '2026年1月5日',
    duration: '1 小時',
    place: '升降🚗前',
    teacher: '劉維廣傳道',
    focusLevel: '交流少年時代有趣的事',
    group: '少年班',
  },
  {
    id: 'class-gospel-1',
    time: '主日 11:30 AM',
    beginningDate: '有需要',
    duration: '1 小時',
    place: '音響室前與近門前',
    teacher: '錢振玉姊妹',
    focusLevel: '',
    group: '福音班',
  },
  {
    id: 'class-growth-1',
    time: '主日 11:30 AM',
    beginningDate: '有需要',
    duration: '1 小時',
    place: '傳道房或教會外',
    teacher: '譚約平弟兄',
    focusLevel: '初信',
    group: '成長8課',
  },
];

export function useArrangements() {
  const [arrangements, setArrangements] = useState<ClassArrangementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMongoDB, setUseMongoDB] = useState(true);

  // Load from localStorage
  const loadFromLocalStorage = (): ClassArrangementInfo[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Return all default arrangements on first load
      return defaultArrangements;
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      return defaultArrangements;
    }
  };

  // Save to localStorage
  const saveToLocalStorage = (data: ClassArrangementInfo[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Fetch arrangements on mount
  useEffect(() => {
    loadArrangements();
  }, []);

  const loadArrangements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we should use MongoDB
      const useDB = localStorage.getItem(USE_MONGODB_KEY) !== 'false';

      if (useDB) {
        try {
          const data = await fetchAllArrangements();
          setArrangements(data);
          setUseMongoDB(true);
          localStorage.setItem(USE_MONGODB_KEY, 'true');
        } catch (err) {
          console.warn('MongoDB unavailable, falling back to localStorage:', err);
          setUseMongoDB(false);
          localStorage.setItem(USE_MONGODB_KEY, 'false');
          const localData = loadFromLocalStorage();
          setArrangements(localData);
          setError('使用本地儲存（MongoDB 未配置）');
        }
      } else {
        const localData = loadFromLocalStorage();
        setArrangements(localData);
        setUseMongoDB(false);
        setError('使用本地儲存（MongoDB 未配置）');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load arrangements');
      console.error('Error loading arrangements:', err);
      const localData = loadFromLocalStorage();
      setArrangements(localData);
    } finally {
      setLoading(false);
    }
  };

  const createArrangement = async (arrangement: ClassArrangementInfo) => {
    try {
      setError(null);

      if (useMongoDB) {
        try {
          const created = await apiCreateArrangement(arrangement);
          setArrangements((prev) => [...prev, created]);
          return created;
        } catch (err) {
          console.warn('MongoDB create failed, using localStorage:', err);
          setUseMongoDB(false);
          localStorage.setItem(USE_MONGODB_KEY, 'false');
          // Fall through to localStorage
        }
      }

      // Use localStorage
      const newArrangements = [...arrangements, arrangement];
      setArrangements(newArrangements);
      saveToLocalStorage(newArrangements);
      return arrangement;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create arrangement');
      throw err;
    }
  };

  const updateArrangement = async (arrangement: ClassArrangementInfo) => {
    try {
      setError(null);

      if (useMongoDB) {
        try {
          const updated = await apiUpdateArrangement(arrangement);
          setArrangements((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          return updated;
        } catch (err) {
          console.warn('MongoDB update failed, using localStorage:', err);
          setUseMongoDB(false);
          localStorage.setItem(USE_MONGODB_KEY, 'false');
          // Fall through to localStorage
        }
      }

      // Use localStorage
      const newArrangements = arrangements.map((a) =>
        a.id === arrangement.id ? arrangement : a
      );
      setArrangements(newArrangements);
      saveToLocalStorage(newArrangements);
      return arrangement;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update arrangement');
      throw err;
    }
  };

  const deleteArrangement = async (id: string) => {
    try {
      setError(null);

      if (useMongoDB) {
        try {
          await apiDeleteArrangement(id);
          setArrangements((prev) => prev.filter((a) => a.id !== id));
          return;
        } catch (err) {
          console.warn('MongoDB delete failed, using localStorage:', err);
          setUseMongoDB(false);
          localStorage.setItem(USE_MONGODB_KEY, 'false');
          // Fall through to localStorage
        }
      }

      // Use localStorage
      const newArrangements = arrangements.filter((a) => a.id !== id);
      setArrangements(newArrangements);
      saveToLocalStorage(newArrangements);
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
    useMongoDB,
  };
}

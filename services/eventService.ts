
import type { ChurchEvent, Task } from '../types-secretary';

// Bilingual event data
const getInitialEvents = (lang: 'en' | 'zh-TW'): ChurchEvent[] => {
  const isZh = lang === 'zh-TW';

  return [
    {
      id: 'evt1',
      title: isZh ? '主日崇拜' : 'Sunday Service',
      date: new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()) % 7)).toISOString().split('T')[0],
      time: isZh ? '上午 10:00' : '10:00 AM',
      location: isZh ? '主堂' : 'Main Sanctuary',
      description: isZh ? '每週崇拜，由約翰牧師證道。' : 'Weekly worship service with sermon from Pastor John.',
    },
    {
      id: 'evt2',
      title: isZh ? '青年小組聚會' : 'Youth Group Meeting',
      date: new Date(new Date().setDate(new Date().getDate() + (3 - new Date().getDay() + 7) % 7)).toISOString().split('T')[0],
      time: isZh ? '晚上 7:00' : '7:00 PM',
      location: isZh ? '交誼廳' : 'Fellowship Hall',
      description: isZh ? '為青少年提供有趣的遊戲和聖經學習。' : 'Fun games and bible study for teenagers.',
    },
    {
      id: 'evt3',
      title: isZh ? '社區義賣會' : 'Community Bake Sale',
      date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString().split('T')[0],
      time: isZh ? '上午 9:00 - 下午 2:00' : '9:00 AM - 2:00 PM',
      location: isZh ? '教會停車場' : 'Church Parking Lot',
      description: isZh ? '為當地食物銀行籌款。所有收益將捐贈。' : 'Fundraiser for the local food bank. All proceeds will be donated.',
    },
  ];
};

// Bilingual task data
const getInitialTasks = (lang: 'en' | 'zh-TW'): Task[] => {
  const isZh = lang === 'zh-TW';

  return [
    { id: 'task1', text: isZh ? '準備主日講道' : 'Prepare sermon for Sunday', completed: false },
    { id: 'task2', text: isZh ? '跟進 Doe 家庭' : 'Follow up with the Doe family', completed: false },
    { id: 'task3', text: isZh ? '訂購新詩歌本' : 'Order new hymnals', completed: true },
    { id: 'task4', text: isZh ? '確認義賣會志工' : 'Confirm volunteers for bake sale', completed: false },
  ];
};

// Store current language data
let currentLang: 'en' | 'zh-TW' = 'en';
let events: ChurchEvent[] = getInitialEvents('en');
let tasks: Task[] = getInitialTasks('en');

export const eventService = {
  getEvents: (lang: 'en' | 'zh-TW' = 'en'): Promise<ChurchEvent[]> => {
    return new Promise(resolve => {
      // Refresh data if language changed
      if (lang !== currentLang) {
        currentLang = lang;
        events = getInitialEvents(lang);
        tasks = getInitialTasks(lang);
      }
      setTimeout(() => resolve([...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())), 50);
    });
  },

  addEvent: (event: Omit<ChurchEvent, 'id'>): Promise<ChurchEvent> => {
     return new Promise(resolve => {
       const newEvent: ChurchEvent = {
         id: `evt${Date.now()}`,
         ...event,
       };
       events.push(newEvent);
       setTimeout(() => resolve(newEvent), 50);
     });
  },

  getTasks: (lang: 'en' | 'zh-TW' = 'en'): Promise<Task[]> => {
    return new Promise(resolve => {
      // Refresh data if language changed
      if (lang !== currentLang) {
        currentLang = lang;
        events = getInitialEvents(lang);
        tasks = getInitialTasks(lang);
      }
      setTimeout(() => resolve([...tasks]), 50);
    });
  }
};

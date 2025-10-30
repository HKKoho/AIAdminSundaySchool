
import type { ChurchEvent, Task } from '../types';

const initialEvents: ChurchEvent[] = [
  {
    id: 'evt1',
    title: 'Sunday Service',
    date: new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()) % 7)).toISOString().split('T')[0],
    time: '10:00 AM',
    location: 'Main Sanctuary',
    description: 'Weekly worship service with sermon from Pastor John.',
  },
  {
    id: 'evt2',
    title: 'Youth Group Meeting',
    date: new Date(new Date().setDate(new Date().getDate() + (3 - new Date().getDay() + 7) % 7)).toISOString().split('T')[0],
    time: '7:00 PM',
    location: 'Fellowship Hall',
    description: 'Fun games and bible study for teenagers.',
  },
    {
    id: 'evt3',
    title: 'Community Bake Sale',
    date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString().split('T')[0],
    time: '9:00 AM - 2:00 PM',
    location: 'Church Parking Lot',
    description: 'Fundraiser for the local food bank. All proceeds will be donated.',
  },
];

const initialTasks: Task[] = [
    { id: 'task1', text: 'Prepare sermon for Sunday', completed: false },
    { id: 'task2', text: 'Follow up with the Doe family', completed: false },
    { id: 'task3', text: 'Order new hymnals', completed: true },
    { id: 'task4', text: 'Confirm volunteers for bake sale', completed: false },
];


let events: ChurchEvent[] = [...initialEvents];
let tasks: Task[] = [...initialTasks];

export const eventService = {
  getEvents: (): Promise<ChurchEvent[]> => {
    return new Promise(resolve => {
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

  getTasks: (): Promise<Task[]> => {
    return new Promise(resolve => {
        setTimeout(() => resolve([...tasks]), 50);
    });
  }
};

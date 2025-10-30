
export interface ChurchEvent {
  id: string;
  title: string;
  date: string; // ISO string format
  time: string;
  location: string;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatarUrl: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

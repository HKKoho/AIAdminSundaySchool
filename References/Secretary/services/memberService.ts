
import type { Member } from '../types';

const members: Member[] = [
  {
    id: 'mem1',
    name: 'John Doe',
    role: 'Pastor',
    phone: '555-0101',
    email: 'john.d@church.org',
    avatarUrl: 'https://picsum.photos/seed/johndoe/100/100',
  },
  {
    id: 'mem2',
    name: 'Jane Smith',
    role: 'Deaconess',
    phone: '555-0102',
    email: 'jane.s@church.org',
    avatarUrl: 'https://picsum.photos/seed/janesmith/100/100',
  },
  {
    id: 'mem3',
    name: 'Robert Brown',
    role: 'Elder',
    phone: '555-0103',
    email: 'robert.b@church.org',
    avatarUrl: 'https://picsum.photos/seed/robertbrown/100/100',
  },
  {
    id: 'mem4',
    name: 'Emily White',
    role: 'Choir Director',
    phone: '555-0104',
    email: 'emily.w@church.org',
    avatarUrl: 'https://picsum.photos/seed/emilywhite/100/100',
  },
  {
    id: 'mem5',
    name: 'Michael Green',
    role: 'Youth Leader',
    phone: '555-0105',
    email: 'michael.g@church.org',
    avatarUrl: 'https://picsum.photos/seed/michaelgreen/100/100',
  },
];

export const memberService = {
  getMembers: (): Promise<Member[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(members), 50);
    });
  },
};


import type { Member } from '../types-secretary';

// Bilingual member data
const getMembers = (lang: 'en' | 'zh-TW'): Member[] => {
  const isZh = lang === 'zh-TW';

  return [
    {
      id: 'mem1',
      name: isZh ? '約翰牧師' : 'John Doe',
      role: isZh ? '牧師' : 'Pastor',
      phone: '555-0101',
      email: 'john.d@church.org',
      avatarUrl: 'https://picsum.photos/seed/johndoe/100/100',
    },
    {
      id: 'mem2',
      name: isZh ? '珍妮·史密斯' : 'Jane Smith',
      role: isZh ? '執事' : 'Deaconess',
      phone: '555-0102',
      email: 'jane.s@church.org',
      avatarUrl: 'https://picsum.photos/seed/janesmith/100/100',
    },
    {
      id: 'mem3',
      name: isZh ? '羅伯特·布朗' : 'Robert Brown',
      role: isZh ? '長老' : 'Elder',
      phone: '555-0103',
      email: 'robert.b@church.org',
      avatarUrl: 'https://picsum.photos/seed/robertbrown/100/100',
    },
    {
      id: 'mem4',
      name: isZh ? '艾米莉·懷特' : 'Emily White',
      role: isZh ? '詩班指揮' : 'Choir Director',
      phone: '555-0104',
      email: 'emily.w@church.org',
      avatarUrl: 'https://picsum.photos/seed/emilywhite/100/100',
    },
    {
      id: 'mem5',
      name: isZh ? '麥可·格林' : 'Michael Green',
      role: isZh ? '青年領袖' : 'Youth Leader',
      phone: '555-0105',
      email: 'michael.g@church.org',
      avatarUrl: 'https://picsum.photos/seed/michaelgreen/100/100',
    },
  ];
};

export const memberService = {
  getMembers: (lang: 'en' | 'zh-TW' = 'en'): Promise<Member[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMembers(lang)), 50);
    });
  },
};

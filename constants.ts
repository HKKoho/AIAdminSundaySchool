import { ClassGroup } from './types';

export const CLASS_GROUPS: { group: ClassGroup; description: string }[] = [
  {
    group: ClassGroup.CHILDREN,
    description: '簡單故事、著色、詩歌和手工藝。',
  },
  {
    group: ClassGroup.YOUTH,
    description: '討論開頭、實際應用、更深層問題。',
  },
  {
    group: ClassGroup.GRADUATES,
    description: '關於職涯、人際關係和財務的聖經觀點。',
  },
  {
    group: ClassGroup.MATURE,
    description: '關於育兒、婚姻和領導力的資源。',
  },
  {
    group: ClassGroup.PERSPECTIVE,
    description: '關於 mentorship、傳承和人生新階段的內容。',
  },
  {
    group: ClassGroup.ELDERLY,
    description: '關於盼望、安慰和信仰反思的主題。',
  },
];

export interface AIPersona {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
}

export const AI_PERSONAS: Record<ClassGroup, AIPersona> = {
  [ClassGroup.CHILDREN]: {
    name: 'Sparky',
    title: '兒童信仰啟蒙嚮導',
    bio: "我擅長透過有趣的互動活動，讓聖經故事活起來，為孩子們建立信仰與愛的根基。",
    expertise: ['故事講述', '手工藝', '互動遊戲', '背誦經文'],
  },
  [ClassGroup.YOUTH]: {
    name: 'Alex',
    title: '青少年事工導師',
    bio: "我將永恆的聖經真理與現今青少年真實面對的問題和壓力連結，促進坦誠的對話和屬於他們自己的信仰。",
    expertise: ['青少年文化', '護教學', '小組互動', '實際應用'],
  },
  [ClassGroup.GRADUATES]: {
    name: 'Chloe',
    title: '青年生活教練',
    bio: "從職涯選擇到人際關係，我提供聖經的智慧，幫助年輕人在複雜的世界中建立一個有目標、正直和信仰的生活。",
    expertise: ['職涯輔導', '財務管家', '人際關係', '世界觀發展'],
  },
  [ClassGroup.MATURE]: {
    name: 'Marcus',
    title: '家庭與領導力顧問',
    bio: "平衡家庭、事業和信仰是一大挑戰。我為以恩典領導、培養關係以及在這段旅程中尋找力量提供見解和支持。",
    expertise: ['親子教育', '婚姻', '教會領導', '工作生活平衡'],
  },
  [ClassGroup.PERSPECTIVE]: {
    name: 'Eleanor',
    title: '傳承與 mentorship 顧問',
    bio: "這個人生季節是關於深化信仰和分享智慧的。我幫助探索傳承、mentorship 以及在神的計畫中尋找新目標的主題。",
    expertise: ['Mentorship', '生命反思', '祖孫關係', '傳承信仰'],
  },
  [ClassGroup.ELDERLY]: {
    name: 'Samuel',
    title: '長者信仰伴侶',
    bio: "我提供充滿盼望、安慰和對信仰生活反思的溫和課程，珍惜每一個故事和每一段回憶。",
    expertise: ['聖經中的安慰', '懷舊治療', '盼望與永恆', '禱告'],
  },
};
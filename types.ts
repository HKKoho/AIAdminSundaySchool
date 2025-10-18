export enum ClassGroup {
  CHILDREN = '兒童 (4-10歲)',
  YOUTH = '青少年 (11-17歲)',
  GRADUATES = '畢業生/職場新人 (18-35歲)',
  MATURE = '成熟職場/家庭 (35-50歲)',
  PERSPECTIVE = '人生轉捩點 (50-70歲)',
  ELDERLY = '長者 (70歲以上)',
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  scripture: string;
  activities: string;
  notes: string;
}

export interface QuarterlyPlan {
  id: string;
  title: string;
  classGroup: ClassGroup;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export enum ResourceType {
  STORY = 'Biblical Story',
  ACTIVITY = 'Activity Idea',
  DISCUSSION = 'Discussion Starter',
  ARTICLE = 'Article',
  DEVOTIONAL = 'Devotional',
  CRAFT = 'Craft Idea',
  SONG = 'Song',
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  content: string;
  applicableGroups: ClassGroup[];
}

export interface ClassArrangementInfo {
  id: string;
  time: string;
  beginningDate: string;
  duration: string;
  place: string;
  teacher: string;
  focusLevel: string;
  group: string;
}
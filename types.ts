// Document Hub Types
export interface DocumentMetadata {
  id: string;
  title: string;
  fileName: string;
  filePath: string; // Path on NAS
  department: string;
  ministry: string;
  docType: string;
  year: number;
  status: string;
  uploadDate: string;
  uploadedBy: string;
  fileSize: number;
  mimeType: string;
}

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
  _id?: any; // MongoDB ObjectId
  time: string;
  beginningDate: string;
  duration: string;
  place: string;
  teacher: string;
  focusLevel: string;
  group: string;
  createdAt?: string; // ISO timestamp
}

export interface ChurchActivity {
  id: string;
  _id?: any; // MongoDB ObjectId
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  organizer: string;
  category: string;
  description: string;
  registrationRequired: string;
  capacity: string;
  contactPerson: string;
  contactPhone: string;
  createdAt?: string; // ISO timestamp
}

// ========== AI Engine Configuration ==========

export enum AIEngine {
  GEMINI = 'gemini',
  LOCAL_LLM = 'localLLM',
  OPENAI = 'openai',
}

export interface LocalLLMConfig {
  model: OllamaModel;
  temperature: number;
  topP: number;
}

// Ollama Models - Cloud and Local
export type OllamaModel =
  // Cloud Models (Ollama Cloud)
  | 'kimi-k2:1t-cloud'           // Default - 1 trillion params, best for complex reasoning
  | 'qwen-coder:480b-cloud'      // 480B params, excellent for coding tasks
  | 'gpt-oss:120b'               // 120B params, open source GPT alternative
  | 'deepseek-v3.1:671b'         // 671B params, deep reasoning model
  | 'llama-omni:671b-cloud'      // 671B params, multimodal capabilities
  | 'qwen-max:lc-cloud'          // Latest Qwen, long context
  | 'yi-lightning:latest-cloud'  // Fast inference model

  // Local Models (Self-hosted Ollama)
  | 'qwen2.5vl:32b'              // 32B vision-language model
  | 'llama4:scout'               // Llama 4 scout variant
  | 'llama3.3:latest'            // Llama 3.3 latest
  | 'gemma2:27b'                 // Google Gemma 2 27B
  | 'deepseek-r1:32b'            // DeepSeek reasoning 32B
  | 'qwen2.5:32b'                // Qwen 2.5 32B
  | 'mistral-large:latest'       // Mistral large latest
  | 'llava:34b';                 // 34B vision model for image analysis

export interface OllamaModelInfo {
  name: OllamaModel;
  displayName: string;
  description: string;
  isCloud: boolean;
  hasVision: boolean;
  parameterSize: string;
}

export const OLLAMA_MODELS: OllamaModelInfo[] = [
  // Cloud Models
  {
    name: 'kimi-k2:1t-cloud',
    displayName: 'Kimi K2 (1T Cloud)',
    description: '1 trillion parameter model - Best for complex reasoning and analysis',
    isCloud: true,
    hasVision: false,
    parameterSize: '1T',
  },
  {
    name: 'qwen-coder:480b-cloud',
    displayName: 'Qwen Coder (480B Cloud)',
    description: '480B parameter coding specialist - Excellent for technical content',
    isCloud: true,
    hasVision: false,
    parameterSize: '480B',
  },
  {
    name: 'gpt-oss:120b',
    displayName: 'GPT OSS (120B)',
    description: '120B open source GPT alternative - General purpose',
    isCloud: true,
    hasVision: false,
    parameterSize: '120B',
  },
  {
    name: 'deepseek-v3.1:671b',
    displayName: 'DeepSeek v3.1 (671B)',
    description: '671B deep reasoning model - Advanced analytical tasks',
    isCloud: true,
    hasVision: false,
    parameterSize: '671B',
  },
  {
    name: 'llama-omni:671b-cloud',
    displayName: 'Llama Omni (671B Cloud)',
    description: '671B multimodal model - Text and vision capabilities',
    isCloud: true,
    hasVision: true,
    parameterSize: '671B',
  },
  {
    name: 'qwen-max:lc-cloud',
    displayName: 'Qwen Max (Long Context Cloud)',
    description: 'Latest Qwen with extended context - Long document processing',
    isCloud: true,
    hasVision: false,
    parameterSize: 'Variable',
  },
  {
    name: 'yi-lightning:latest-cloud',
    displayName: 'Yi Lightning (Cloud)',
    description: 'Fast inference model - Quick responses',
    isCloud: true,
    hasVision: false,
    parameterSize: 'Optimized',
  },

  // Local Models
  {
    name: 'qwen2.5vl:32b',
    displayName: 'Qwen 2.5 Vision (32B Local)',
    description: '32B vision-language model - Image and text understanding',
    isCloud: false,
    hasVision: true,
    parameterSize: '32B',
  },
  {
    name: 'llama4:scout',
    displayName: 'Llama 4 Scout (Local)',
    description: 'Llama 4 scout variant - Balanced performance',
    isCloud: false,
    hasVision: false,
    parameterSize: 'Variable',
  },
  {
    name: 'llama3.3:latest',
    displayName: 'Llama 3.3 (Local)',
    description: 'Latest Llama 3.3 - General purpose',
    isCloud: false,
    hasVision: false,
    parameterSize: 'Variable',
  },
  {
    name: 'gemma2:27b',
    displayName: 'Gemma 2 (27B Local)',
    description: 'Google Gemma 2 27B - Efficient and capable',
    isCloud: false,
    hasVision: false,
    parameterSize: '27B',
  },
  {
    name: 'deepseek-r1:32b',
    displayName: 'DeepSeek R1 (32B Local)',
    description: 'DeepSeek reasoning 32B - Analytical tasks',
    isCloud: false,
    hasVision: false,
    parameterSize: '32B',
  },
  {
    name: 'qwen2.5:32b',
    displayName: 'Qwen 2.5 (32B Local)',
    description: 'Qwen 2.5 32B - Strong general purpose model',
    isCloud: false,
    hasVision: false,
    parameterSize: '32B',
  },
  {
    name: 'mistral-large:latest',
    displayName: 'Mistral Large (Local)',
    description: 'Latest Mistral large model - High quality outputs',
    isCloud: false,
    hasVision: false,
    parameterSize: 'Large',
  },
  {
    name: 'llava:34b',
    displayName: 'LLaVA (34B Local)',
    description: '34B vision model - Image analysis and understanding',
    isCloud: false,
    hasVision: true,
    parameterSize: '34B',
  },
];
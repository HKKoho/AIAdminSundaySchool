import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import type { ChurchEvent, Task, Member } from '../types-secretary';
import type { Language } from '../translations-secretary';

// Initialize the Google GenAI client. The API key is assumed to be in import.meta.env.VITE_API_KEY.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

/**
 * Generates a monthly report for the church congregation meeting based on events and tasks.
 * @param events - A list of all church events.
 * @param tasks - A list of all tasks.
 * @param language - The desired language for the report.
 * @returns A promise that resolves to the generated report text.
 */
const generateMonthlyReport = async (events: ChurchEvent[], tasks: Task[], language: Language): Promise<string> => {
  // Use a cost-effective and fast model for text generation.
  const model = 'gemini-2.5-flash';

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const eventsString = events.map(e => `- ${e.title} on ${new Date(e.date).toLocaleDateString()}: ${e.description}`).join('\n');
  // Include task completion status for better context
  const tasksString = tasks.map(t => `- ${t.text} (Status: ${t.completed ? 'Completed' : 'In Progress'})`).join('\n');
  
  const languageInstruction = language === 'zh-TW' ? 'Please write the report in Traditional Chinese.' : '';

  const prompt = `
    You are an AI assistant for a church pastor. Your task is to generate a summary of the church's activities for the upcoming Church Congregation Monthly Meeting.
    The current month is ${currentMonth}.
    ${languageInstruction}

    Based on the provided data, please write a summary report covering the following points:
    1.  **Review of Recent Activities:** Briefly summarize key events that have taken place recently.
    2.  **Upcoming Events:** Highlight important events scheduled for the near future.
    3.  **Ministry & Project Updates:** Provide a status update on key tasks and projects based on their completion status.

    The tone should be clear, informative, and encouraging, suitable for presenting to the entire congregation. Structure the output with clear headings for each section.

    Here is the data:

    All Church Events:
    ${eventsString}

    All Tasks (completed and incomplete):
    ${tasksString}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    // Extract the text from the response using the .text property.
    return response.text;
  } catch (error) {
    console.error('Error generating monthly report:', error);
    throw new Error('Failed to generate monthly report from Gemini API.');
  }
};

/**
 * Converts a string of text into speech using the Gemini API.
 * @param text - The text to be converted to speech.
 * @returns A promise that resolves to a base64 encoded audio string.
 */
const generateSpeech = async (text: string): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: `Say in a friendly and clear voice: ${text}` }] }],
      config: {
        // Specify that the response modality should be audio.
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Use a prebuilt voice for the speech.
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Extract the base64 encoded audio data from the response.
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini API.");
    }
    return base64Audio;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech from Gemini API.');
  }
};

const draftEmailSkill: FunctionDeclaration = {
  name: 'draft_email',
  description: 'Drafts a pastoral care email to a church member.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientName: {
        type: Type.STRING,
        description: "The name of the church member receiving the email.",
      },
      reason: {
        type: Type.STRING,
        description: "The reason for the email (e.g., 'sickness', 'celebrating a new job', 'condolence').",
      },
      tone: {
        type: Type.STRING,
        description: "The desired tone of the email (e.g., 'comforting', 'encouraging', 'celebratory').",
      },
    },
    required: ['recipientName', 'reason', 'tone'],
  },
};

const draftSocialMediaPostSkill: FunctionDeclaration = {
  name: 'draft_social_media_post',
  description: 'Drafts a social media post for the church community.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: "The topic of the post (e.g., 'weekly encouragement', 'event reminder', 'community prayer request').",
      },
      platform: {
        type: Type.STRING,
        description: "The target platform (e.g., 'Facebook', 'Instagram', 'Church App').",
      },
    },
    required: ['topic', 'platform'],
  },
};


/**
 * Acts as an AI agent router for pastoral care tasks.
 * @param prompt - The user's request.
 * @param members - The list of church members for context.
 * @param language - The desired language for the agent's response.
 * @returns A promise that resolves to the agent's response.
 */
const pastoralAgentRouter = async (prompt: string, members: Member[], language: Language): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const memberContext = members.map(m => `${m.name} (${m.role})`).join(', ');
  const languageInstruction = language === 'zh-TW' ? 'The user is communicating in Traditional Chinese. You must respond in Traditional Chinese.' : 'The user is communicating in English. You must respond in English.';


  try {
    // 1. Router Step: Use function calling to determine intent.
    const routerResponse = await ai.models.generateContent({
      model: model,
      contents: `Context: The available church members are: ${memberContext}. User request: "${prompt}"`,
      config: {
        systemInstruction: `You are a router for a pastoral care AI agent. Your job is to understand the user's request and call the appropriate tool. ${languageInstruction}`,
        tools: [{ functionDeclarations: [draftEmailSkill, draftSocialMediaPostSkill] }],
      },
    });
    
    const functionCalls = routerResponse.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const args = call.args;

      let skillPrompt = '';
      
      // 2. Skill Step: Based on the router's output, execute the skill (another LLM call).
      if (call.name === 'draft_email') {
        skillPrompt = `
          You are a pastor writing to a church member. 
          The request is to draft an email for ${args.recipientName} regarding "${args.reason}" with a ${args.tone} tone.
          Please write a complete, thoughtful, and compassionate email including a subject line and the email body.
          Sign off as "Pastor".
          Format the output clearly with "Subject:" and then the body.
          ${languageInstruction}
        `;
      } else if (call.name === 'draft_social_media_post') {
        skillPrompt = `
          You are the social media manager for a church. 
          The request is to draft a post for ${args.platform} about "${args.topic}".
          Write an engaging and appropriate post.
          ${languageInstruction}
        `;
      } else {
        return language === 'zh-TW' ? '我不確定如何處理該請求，但我正在學習！' : "I'm not sure how to handle that request, but I'm learning!";
      }

      const skillResponse = await ai.models.generateContent({
        model: model,
        contents: skillPrompt,
      });

      return skillResponse.text;

    } else {
      // If no function call was triggered, return the direct text response.
      return routerResponse.text;
    }

  } catch (error) {
    console.error('Error in pastoral agent:', error);
    return language === 'zh-TW' ? '抱歉，我在處理您的請求時遇到錯誤。' : "I'm sorry, I encountered an error while processing your request.";
  }
};

interface TranslatableContent {
  events?: ChurchEvent[];
  tasks?: Task[];
}

interface TranslatedContent {
  events?: { id: string; title: string; description: string; }[];
  tasks?: { id: string; text: string; }[];
}

/**
 * Translates dynamic content like event titles/descriptions and task text.
 * @param content - An object containing arrays of events and/or tasks.
 * @param language - The target language.
 * @returns A promise that resolves to the content with text fields translated.
 */
const translateContent = async (content: TranslatableContent, language: Language): Promise<TranslatableContent> => {
  if (language === 'en' || (!content.events?.length && !content.tasks?.length)) {
    return content;
  }

  const model = 'gemini-2.5-flash';

  const itemsToTranslate: any = {};
  if (content.events) {
      itemsToTranslate.events = content.events.map(e => ({ id: e.id, title: e.title, description: e.description }));
  }
  if (content.tasks) {
      itemsToTranslate.tasks = content.tasks.map(t => ({ id: t.id, text: t.text }));
  }

  const responseSchema: {type: Type, properties: any} = {
      type: Type.OBJECT,
      properties: {},
  };
  
  if (itemsToTranslate.events) {
      responseSchema.properties.events = {
          type: Type.ARRAY,
          items: {
              type: Type.OBJECT,
              properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
              },
              required: ['id', 'title', 'description'],
          },
      };
  }

  if (itemsToTranslate.tasks) {
      responseSchema.properties.tasks = {
          type: Type.ARRAY,
          items: {
              type: Type.OBJECT,
              properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
              },
              required: ['id', 'text'],
          },
      };
  }

  const prompt = `
    Translate the following JSON content into Traditional Chinese.
    Only translate the 'title', 'description', and 'text' fields.
    Return the entire structure as a valid JSON object, matching the provided schema exactly.

    Content to translate:
    ${JSON.stringify(itemsToTranslate, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const translatedJson: TranslatedContent = JSON.parse(response.text);
    
    const translatedResult = { ...content };

    if (translatedJson.events && translatedResult.events) {
      const translationMap = new Map(translatedJson.events.map(item => [item.id, item]));
      translatedResult.events = translatedResult.events.map(originalEvent => {
        const translatedEvent = translationMap.get(originalEvent.id);
        return translatedEvent ? { ...originalEvent, title: translatedEvent.title, description: translatedEvent.description } : originalEvent;
      });
    }

    if (translatedJson.tasks && translatedResult.tasks) {
        const translationMap = new Map(translatedJson.tasks.map(item => [item.id, item]));
        translatedResult.tasks = translatedResult.tasks.map(originalTask => {
            const translatedTask = translationMap.get(originalTask.id);
            return translatedTask ? { ...originalTask, text: translatedTask.text } : originalTask;
        });
    }

    return translatedResult;

// FIX: Added missing curly brace for the catch block to fix syntax error.
  } catch (error) {
    console.error('Error translating content:', error);
    // Return original content on error to prevent crashing the app
    return content; 
  }
};

/**
 * Generates a daily schedule summary from a list of events.
 * @param events - A list of events for today and tomorrow.
 * @param language - The desired language for the schedule.
 * @returns A promise that resolves to the generated schedule text.
 */
const generateDailySchedule = async (events: ChurchEvent[], language: Language): Promise<string> => {
  const model = 'gemini-2.5-flash';

  const eventsString = events.map(e => `- ${e.title} on ${new Date(e.date).toLocaleDateString()} at ${e.time}`).join('\n');
  const languageInstruction = language === 'zh-TW' ? 'Please write the schedule in Traditional Chinese.' : '';

  const prompt = `
    You are an AI assistant for a church pastor. Your task is to generate a clear and concise summary of the schedule for today and tomorrow.
    Today's date is ${new Date().toLocaleDateString()}.
    ${languageInstruction}

    Based on the following events, create a schedule summary.
    - Group events by "Today" and "Tomorrow".
    - If there are no events for a day, state that the schedule is clear for that day.
    - If there are no events at all, state that the schedule for today and tomorrow is clear.

    Events:
    ${eventsString.length > 0 ? eventsString : 'No events scheduled.'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating daily schedule:', error);
    throw new Error('Failed to generate daily schedule from Gemini API.');
  }
};


// --- Event Agent ---

const createEventDetailsSkill: FunctionDeclaration = {
  name: "create_event_details",
  description: "Parses a user's natural language description of an event and extracts the structured details to fill out a form.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The title of the event." },
      date: { type: Type.STRING, description: "The date of the event in YYYY-MM-DD format. Assume the current year if not specified." },
      time: { type: Type.STRING, description: "The time of the event (e.g., '10:00 AM', '7:00 PM - 9:00 PM')." },
      location: { type: Type.STRING, description: "The location of the event." },
      description: { type: Type.STRING, description: "A brief description of the event." },
    },
    required: ["title", "date", "time", "location", "description"],
  },
};

const suggestActivityIdeasSkill: FunctionDeclaration = {
  name: "suggest_activity_ideas",
  description: "Generates creative activity ideas for a specific type of church event or group.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The theme or group for which to generate ideas (e.g., 'youth group', 'community outreach', 'fundraiser')." },
    },
    required: ["topic"],
  },
};

const createChecklistSkill: FunctionDeclaration = {
  name: "create_checklist",
  description: "Generates a logistic checklist of tasks for organizing a specific event.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventName: { type: Type.STRING, description: "The name of the event for which to create a checklist." },
    },
    required: ["eventName"],
  },
};

export type EventAgentResponse = 
    | { type: 'event_details'; data: any }
    | { type: 'text_response'; data: string };

const eventAgentRouter = async (prompt: string, language: Language): Promise<EventAgentResponse> => {
    const model = 'gemini-2.5-flash';
    const languageInstruction = language === 'zh-TW' ? 'The user is communicating in Traditional Chinese. You must respond in Traditional Chinese.' : 'The user is communicating in English. You must respond in English.';

    try {
        const today = new Date().toISOString().split('T')[0];
        const routerResponse = await ai.models.generateContent({
            model,
            contents: `Today's date is ${today}. User request: "${prompt}"`,
            config: {
                systemInstruction: `You are a helpful AI agent assisting a church pastor with event planning. Your job is to understand the user's request and call the appropriate tool. ${languageInstruction}`,
                tools: [{ functionDeclarations: [createEventDetailsSkill, suggestActivityIdeasSkill, createChecklistSkill] }],
            },
        });

        const functionCalls = routerResponse.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const args = call.args;

            if (call.name === 'create_event_details') {
                return { type: 'event_details', data: args };
            }

            let skillPrompt = '';
            if (call.name === 'suggest_activity_ideas') {
                skillPrompt = `Generate a list of 5 creative and engaging activity ideas for a church's "${args.topic}". Provide a brief, one-sentence description for each idea. ${languageInstruction}`;
            } else if (call.name === 'create_checklist') {
                skillPrompt = `Generate a detailed logistic checklist for organizing a "${args.eventName}" at a church. Group items into logical categories (e.g., 'Venue & Setup', 'Volunteers', 'Promotion', 'Supplies'). ${languageInstruction}`;
            } else {
                 const text = language === 'zh-TW' ? '我不確定如何處理該請求，但我正在學習！' : "I'm not sure how to handle that request, but I'm learning!";
                 return { type: 'text_response', data: text };
            }
            
            const skillResponse = await ai.models.generateContent({ model, contents: skillPrompt });
            return { type: 'text_response', data: skillResponse.text };

        } else {
             return { type: 'text_response', data: routerResponse.text };
        }
    } catch (error) {
        console.error('Error in event agent:', error);
        const text = language === 'zh-TW' ? '抱歉，我在處理您的請求時遇到錯誤。' : "I'm sorry, I encountered an error while processing your request.";
        return { type: 'text_response', data: text };
    }
};

export const geminiService = {
  generateMonthlyReport,
  generateSpeech,
  pastoralAgentRouter,
  translateContent,
  generateDailySchedule,
  eventAgentRouter,
};
import React, { useEffect, useState, useRef } from 'react';
import { eventService } from '../services/eventService';
import { geminiService } from '../services/geminiService';
import { EventCard } from '../components/EventCard';
import { TaskItem } from '../components/TaskItem';
import { Communicate } from '../components/Communicate';
import { SparklesIcon, SpeakerIcon, StopIcon } from '../components/icons';
import type { ChurchEvent, Task } from '../types';
import { t, Language } from '../translations';

interface DashboardPageProps {
  language: Language;
}

// Helper functions for audio decoding and playback
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix: Updated decodeAudioData to align with the Gemini API guidelines for handling raw PCM audio.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ language }) => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [report, setReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [schedule, setSchedule] = useState<string>('');
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
      stopPlayback();
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsTranslating(false);
        const [eventsData, tasksData] = await Promise.all([
          eventService.getEvents(),
          eventService.getTasks(),
        ]);
        
        // Generate schedule in parallel
        generateSchedule(eventsData);

        if (language === 'zh-TW') {
          setIsTranslating(true);
          const translatedContent = await geminiService.translateContent({ events: eventsData, tasks: tasksData }, language);
          setEvents(translatedContent.events || eventsData);
          setTasks(translatedContent.tasks || tasksData);
        } else {
          setEvents(eventsData);
          setTasks(tasksData);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
        setIsTranslating(false);
      }
    };

    const generateSchedule = async (allEvents: ChurchEvent[]) => {
      setIsGeneratingSchedule(true);
      try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const relevantEvents = allEvents.filter(e => e.date === todayStr || e.date === tomorrowStr);
        
        const scheduleText = await geminiService.generateDailySchedule(relevantEvents, language);
        setSchedule(scheduleText);
      } catch (error) {
        console.error("Failed to generate schedule:", error);
        setSchedule(t('scheduleError', language));
      } finally {
        setIsGeneratingSchedule(false);
      }
    };

    fetchData();
  }, [language]);

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      // onended listener will handle state changes
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReport('');
    stopPlayback();
    try {
      const generatedReport = await geminiService.generateMonthlyReport(events, tasks, language);
      setReport(generatedReport);
    } catch (error) {
      console.error("Failed to generate report:", error);
      setReport(t('reportError', language));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleReadAloud = async () => {
    if (!report || isPlaying) return;
    setIsGeneratingSpeech(true);
    try {
      const audioBase64 = await geminiService.generateSpeech(report);
      await playAudio(audioBase64);
    } catch (error) {
      console.error("Failed to generate speech:", error);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) return;
    
    stopPlayback();

    const audioData = decode(base64);
    // Fix: Call decodeAudioData with sampleRate and numChannels as per the updated function signature. The TTS API returns 24000Hz mono audio.
    const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      setIsPlaying(false);
      audioSourceRef.current = null;
    };
    source.start(0);
    
    audioSourceRef.current = source;
    setIsPlaying(true);
  };

  const upcomingEvents = events.slice(0, 3);

  if (loading) {
    return <div className="text-center p-10">{t('loadingDashboard', language)}</div>;
  }
  
  if (isTranslating) {
    return <div className="text-center p-10">{t('translatingContent', language)}</div>;
  }


  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-800 mb-8">{t('dashboard', language)}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* AI Monthly Report Generator */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('aiMonthlyReportGenerator', language)}</h2>
          <div className="flex-grow">
            {!report && !isGeneratingReport && (
              <button
                onClick={handleGenerateReport}
                className="flex items-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {t('generateMonthlyReport', language)}
              </button>
            )}
            {isGeneratingReport && <p className="text-gray-500 animate-pulse">{t('generatingMonthlyReport', language)}</p>}
            {report && (
              <div className="space-y-4">
                <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
          {report && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-2">
                {isPlaying ? (
                     <button
                        onClick={stopPlayback}
                        className="flex items-center bg-red-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                        aria-label="Stop reading aloud"
                    >
                        <StopIcon className="h-5 w-5 mr-2" />
                        {t('stop', language)}
                    </button>
                ) : (
                    <button
                        onClick={handleReadAloud}
                        disabled={isGeneratingSpeech}
                        className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                        aria-label="Read report aloud"
                    >
                        {isGeneratingSpeech ? (
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <SpeakerIcon className="h-5 w-5 mr-2" />
                        )}
                        {isGeneratingSpeech ? t('loadingAudio', language) : t('readAloud', language)}
                    </button>
                )}
            </div>
          )}
        </div>

        {/* Today & Tomorrow's Schedule */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('dailyScheduleTitle', language)}</h2>
          {isGeneratingSchedule && <p className="text-gray-500 animate-pulse">{t('generatingSchedule', language)}</p>}
          {schedule && (
            <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap">
              {schedule}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('upcomingEvents', language)}</h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t('noUpcomingEvents', language)}</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('todoList', language)}</h2>
            <div className="bg-white p-4 rounded-xl shadow-md">
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500">{t('allTasksCompleted', language)}</p>
                )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('socialMediaGroups', language)}</h2>
            <Communicate language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};
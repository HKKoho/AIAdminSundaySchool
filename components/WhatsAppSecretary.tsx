import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { geminiService } from '../services/geminiService';
import { eventService } from '../services/eventService';
import { memberService } from '../services/memberService';
import type { ChurchEvent, Task, Member } from '../types-secretary';

interface WhatsAppSecretaryProps {
  onBack: () => void;
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

const WhatsAppSecretary: React.FC<WhatsAppSecretaryProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation('dashboard');
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pastoral' | 'events'>('dashboard');

  // Dashboard state
  const [report, setReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [schedule, setSchedule] = useState<string>('');
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pastoral agent state
  const [pastoralPrompt, setPastoralPrompt] = useState('');
  const [pastoralResponse, setPastoralResponse] = useState('');
  const [isProcessingPastoral, setIsProcessingPastoral] = useState(false);

  // Event agent state
  const [eventPrompt, setEventPrompt] = useState('');
  const [eventResponse, setEventResponse] = useState('');
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);

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
        const [eventsData, tasksData, membersData] = await Promise.all([
          eventService.getEvents(),
          eventService.getTasks(),
          memberService.getMembers(),
        ]);

        setEvents(eventsData);
        setTasks(tasksData);
        setMembers(membersData);

        // Generate schedule
        generateSchedule(eventsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateSchedule = async (allEvents: ChurchEvent[]) => {
    setIsGeneratingSchedule(true);
    try {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const relevantEvents = allEvents.filter(e => e.date === todayStr || e.date === tomorrowStr);

      const language = i18n.language === 'zh' ? 'zh-TW' : 'en';
      const scheduleText = await geminiService.generateDailySchedule(relevantEvents, language);
      setSchedule(scheduleText);
    } catch (error) {
      console.error("Failed to generate schedule:", error);
      setSchedule('Error generating schedule');
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReport('');
    stopPlayback();
    try {
      const language = i18n.language === 'zh' ? 'zh-TW' : 'en';
      const generatedReport = await geminiService.generateMonthlyReport(events, tasks, language);
      setReport(generatedReport);
    } catch (error) {
      console.error("Failed to generate report:", error);
      setReport('Error generating report');
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

  const handlePastoralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastoralPrompt.trim()) return;

    setIsProcessingPastoral(true);
    setPastoralResponse('');
    try {
      const language = i18n.language === 'zh' ? 'zh-TW' : 'en';
      const response = await geminiService.pastoralAgentRouter(pastoralPrompt, members, language);
      setPastoralResponse(response);
    } catch (error) {
      console.error("Failed to process pastoral request:", error);
      setPastoralResponse('Error processing request');
    } finally {
      setIsProcessingPastoral(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventPrompt.trim()) return;

    setIsProcessingEvent(true);
    setEventResponse('');
    try {
      const language = i18n.language === 'zh' ? 'zh-TW' : 'en';
      const response = await geminiService.eventAgentRouter(eventPrompt, language);

      if (response.type === 'event_details') {
        setEventResponse(JSON.stringify(response.data, null, 2));
      } else {
        setEventResponse(response.data);
      }
    } catch (error) {
      console.error("Failed to process event request:", error);
      setEventResponse('Error processing request');
    } finally {
      setIsProcessingEvent(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Monthly Report Generator */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">AI Monthly Report Generator</h2>
          <div className="flex-grow">
            {!report && !isGeneratingReport && (
              <button
                onClick={handleGenerateReport}
                className="flex items-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                ✨ Generate Monthly Report
              </button>
            )}
            {isGeneratingReport && <p className="text-gray-500 animate-pulse">Generating report...</p>}
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
                >
                  🛑 Stop
                </button>
              ) : (
                <button
                  onClick={handleReadAloud}
                  disabled={isGeneratingSpeech}
                  className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {isGeneratingSpeech ? '⏳ Loading...' : '🔊 Read Aloud'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Today & Tomorrow's Schedule */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Daily Schedule</h2>
          {isGeneratingSchedule && <p className="text-gray-500 animate-pulse">Generating schedule...</p>}
          {schedule && (
            <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap">
              {schedule}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                <p className="text-sm text-gray-600">{event.location}</p>
                <p className="text-gray-700 mt-2">{event.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Todo List</h2>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    readOnly
                    className="w-4 h-4"
                  />
                  <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPastoralAgent = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pastoral Care AI Agent</h2>
        <p className="text-gray-600 mb-4">
          Ask me to draft emails, create social media posts, or help with pastoral care tasks.
        </p>
        <form onSubmit={handlePastoralSubmit}>
          <textarea
            value={pastoralPrompt}
            onChange={(e) => setPastoralPrompt(e.target.value)}
            placeholder="Example: Draft an encouraging email to John who is recovering from illness"
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            disabled={isProcessingPastoral || !pastoralPrompt.trim()}
            className="mt-4 bg-purple-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {isProcessingPastoral ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {pastoralResponse && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold text-gray-700 mb-2">Response:</h3>
            <div className="whitespace-pre-wrap text-gray-800">{pastoralResponse}</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEventAgent = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Event Planning AI Agent</h2>
        <p className="text-gray-600 mb-4">
          Ask me to help plan events, suggest activities, or create checklists.
        </p>
        <form onSubmit={handleEventSubmit}>
          <textarea
            value={eventPrompt}
            onChange={(e) => setEventPrompt(e.target.value)}
            placeholder="Example: Plan a youth group meeting next Friday at 7 PM in the fellowship hall"
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            disabled={isProcessingEvent || !eventPrompt.trim()}
            className="mt-4 bg-purple-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {isProcessingEvent ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {eventResponse && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold text-gray-700 mb-2">Response:</h3>
            <div className="whitespace-pre-wrap text-gray-800">{eventResponse}</div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp AI Secretary</h1>
              <p className="text-xs text-purple-100 opacity-80 -mt-1">Your Church Management Assistant</p>
            </div>
          </div>
          <button onClick={onBack} className="text-sm hover:underline">
            {t('common:navigation.backToHome')}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('pastoral')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pastoral'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pastoral Care
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Event Planning
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'pastoral' && renderPastoralAgent()}
        {activeTab === 'events' && renderEventAgent()}
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>{t('common:footer.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default WhatsAppSecretary;

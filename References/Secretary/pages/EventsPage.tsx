import React, { useEffect, useState, useRef } from 'react';
import { eventService } from '../services/eventService';
import { geminiService, EventAgentResponse } from '../services/geminiService';
import type { ChurchEvent } from '../types';
import { EventCard } from '../components/EventCard';
import { Modal } from '../components/Modal';
import { SendIcon } from '../components/icons';
import { t, Language } from '../translations';

interface EventsPageProps {
  language: Language;
}

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export const EventsPage: React.FC<EventsPageProps> = ({ language }) => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for the new event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
  });
  
  // State for the AI Agent
  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [isAgentReplying, setIsAgentReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetchEvents();
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setIsTranslating(false);
      const eventsData = await eventService.getEvents();
      
      if (language === 'zh-TW') {
        setIsTranslating(true);
        const translatedContent = await geminiService.translateContent({ events: eventsData }, language);
        setEvents(translatedContent.events || eventsData);
      } else {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      alert(t('fillAllFields', language));
      return;
    }
    try {
      await eventService.addEvent(newEvent);
      closeModalAndReset();
      fetchEvents();
    } catch (error) {
      console.error("Failed to add event:", error);
    }
  };
  
  const handleAgentSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim() || isAgentReplying) return;

    const userMessage: Message = { sender: 'user', text: agentInput };
    setAgentMessages(prev => [...prev, userMessage]);
    const currentInput = agentInput;
    setAgentInput('');
    setIsAgentReplying(true);

    try {
        const agentResponse: EventAgentResponse = await geminiService.eventAgentRouter(currentInput, language);
        
        if (agentResponse.type === 'event_details') {
            const { title, date, time, location, description } = agentResponse.data;
            setNewEvent({ title, date, time, location, description });
            const confirmationText = t('agentFormFill', language);
            setAgentMessages(prev => [...prev, { sender: 'agent', text: confirmationText }]);
        } else {
             setAgentMessages(prev => [...prev, { sender: 'agent', text: agentResponse.data }]);
        }

    } catch (error) {
        console.error("Agent failed to respond:", error);
        const errorMessage: Message = { sender: 'agent', text: t('agentError', language) };
        setAgentMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsAgentReplying(false);
    }
  };
  
  const closeModalAndReset = () => {
      setIsModalOpen(false);
      setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
      setAgentMessages([]);
      setAgentInput('');
  };

  if (loading) {
    return <p>{t('loadingEvents', language)}</p>;
  }

  if (isTranslating) {
    return <p>{t('translatingContent', language)}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">{t('events', language)}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          {t('createWithAI', language)}
        </button>
      </div>

      <div className="space-y-4">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>


      <Modal isOpen={isModalOpen} onClose={closeModalAndReset} title={t('eventAIAgent', language)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
            {/* AI Agent Chat */}
            <div className="flex flex-col h-full border-r border-gray-200 pr-4">
                <p className="text-sm text-gray-600 mb-4 border-b pb-3">{t('eventAgentHelp', language)}</p>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                     {agentMessages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isAgentReplying && (
                         <div className="flex items-end gap-2 justify-start">
                            <div className="rounded-lg px-4 py-2 max-w-sm bg-gray-200 text-gray-800">
                               <div className="flex items-center justify-center space-x-1">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                     <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleAgentSendMessage} className="mt-4 flex items-center">
                    <input
                        type="text"
                        value={agentInput}
                        onChange={(e) => setAgentInput(e.target.value)}
                        placeholder={t('askForHelp', language)}
                        disabled={isAgentReplying}
                        className="flex-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                    />
                    <button type="submit" disabled={isAgentReplying || !agentInput.trim()} className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
            {/* Event Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 flex flex-col">
                <div className="flex-grow">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">{t('title', language)}</label>
                        <input type="text" name="title" id="title" value={newEvent.title} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">{t('date', language)}</label>
                            <input type="date" name="date" id="date" value={newEvent.date} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700">{t('time', language)}</label>
                            <input type="text" name="time" id="time" value={newEvent.time} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={t('timeExample', language)} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">{t('location', language)}</label>
                        <input type="text" name="location" id="location" value={newEvent.location} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('description', language)}</label>
                        <textarea name="description" id="description" value={newEvent.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="button" onClick={closeModalAndReset} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md mr-2 hover:bg-gray-300 transition-colors">
                      {t('cancel', language)}
                    </button>
                    <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                      {t('addEvent', language)}
                    </button>
                </div>
            </form>
        </div>
      </Modal>
    </div>
  );
};
import React, { useEffect, useState, useRef } from 'react';
import { memberService } from '../services/memberService';
import { geminiService } from '../services/geminiService';
import { Modal } from '../components/Modal';
import { WhatsAppIcon, ChatBubbleIcon, SendIcon } from '../components/icons';
import type { Member } from '../types';
import { t, Language } from '../translations';

interface MembersPageProps {
  language: Language;
}

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const MemberCard: React.FC<{ member: Member, language: Language }> = ({ member, language }) => {
    // Sanitize phone number for WhatsApp link
    const whatsappNumber = member.phone.replace(/\D/g, '');

    return (
        <div className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full">
            <div className="flex items-center space-x-4">
                <img className="h-16 w-16 rounded-full object-cover" src={member.avatarUrl} alt={member.name} />
                <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{member.name}</h3>
                <p className="text-sm text-blue-600 font-semibold">{member.role}</p>
                </div>
            </div>
            <div className="text-sm text-gray-500 mt-3 flex-grow">
                <p>{member.email}</p>
                <p>{member.phone}</p>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-end space-x-3">
                 <a href={`mailto:${member.email}`} title={t('sendEmail', language)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 </a>
                 <a href={`tel:${member.phone}`} title={t('call', language)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 </a>
                 <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" title={t('chatOnWhatsApp', language)} className="text-gray-400 hover:text-green-600 transition-colors">
                    <WhatsAppIcon className="h-6 w-6"/>
                 </a>
            </div>
        </div>
    );
};

export const MembersPage: React.FC<MembersPageProps> = ({ language }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [isAgentReplying, setIsAgentReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const membersData = await memberService.getMembers();
        setMembers(membersData);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const handleAgentSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim() || isAgentReplying) return;

    const userMessage: Message = { sender: 'user', text: agentInput };
    setAgentMessages(prev => [...prev, userMessage]);
    setAgentInput('');
    setIsAgentReplying(true);

    try {
        const agentResponseText = await geminiService.pastoralAgentRouter(agentInput, members, language);
        const agentMessage: Message = { sender: 'agent', text: agentResponseText };
        setAgentMessages(prev => [...prev, agentMessage]);
    } catch (error) {
        console.error("Agent failed to respond:", error);
        const errorMessage: Message = { sender: 'agent', text: t('agentError', language) };
        setAgentMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsAgentReplying(false);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">{t('members', language)}</h1>
        <button
          onClick={() => setIsAgentModalOpen(true)}
          className="flex items-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
        >
          <ChatBubbleIcon className="h-5 w-5 mr-2" />
          {t('consultingAIAgent', language)}
        </button>
      </div>
      {loading ? (
        <p>{t('loadingMembers', language)}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <MemberCard key={member.id} member={member} language={language} />
          ))}
        </div>
      )}
      <Modal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title={t('pastoralAIAssistant', language)}>
        <div className="flex flex-col h-[60vh]">
            <p className="text-sm text-gray-600 mb-4 border-b pb-3">{t('agentHelp', language)}</p>
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
      </Modal>
    </div>
  );
};
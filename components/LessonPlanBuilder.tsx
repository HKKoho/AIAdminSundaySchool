import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassGroup, Lesson, QuarterlyPlan } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Button from './common/Button';
import { generateLessonIdeas } from '../services/multiProviderChatService';
import { AI_PERSONAS } from '../constants';

interface LessonPlanBuilderProps {
  selectedGroup: ClassGroup;
  planId: string | null;
  onBack: () => void;
}

const LessonPlanBuilder: React.FC<LessonPlanBuilderProps> = ({ selectedGroup, planId, onBack }) => {
  const { t, i18n } = useTranslation('lessonPlan');
  const [plans, setPlans] = useLocalStorage<QuarterlyPlan[]>('quarterlyPlans', []);

  const createEmptyPlan = (group: ClassGroup): Omit<QuarterlyPlan, 'id' | 'createdAt' | 'updatedAt'> => ({
    title: t('builder.newPlanTitle', { group }),
    classGroup: group,
    lessons: Array.from({ length: 12 }, (_, i) => ({
      id: `lesson-${i + 1}`,
      title: i18n.language === 'zh-TW' ? `${t('builder.lessonPrefix')} ${i + 1} ${t('builder.lessonSuffix')}` : `${t('builder.lessonPrefix')} ${i + 1}`,
      topic: '',
      scripture: '',
      activities: '',
      notes: '',
    })),
  });

  const [plan, setPlan] = useState<Omit<QuarterlyPlan, 'id' | 'createdAt' | 'updatedAt'>>(createEmptyPlan(selectedGroup));
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');

  const currentPersona = AI_PERSONAS[selectedGroup];

  useEffect(() => {
    if (planId) {
      const existingPlan = plans.find(p => p.id === planId);
      if (existingPlan) {
        setPlan(existingPlan);
      }
    } else {
        setPlan(createEmptyPlan(selectedGroup));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, selectedGroup]);

  const handlePlanChange = (field: keyof Omit<QuarterlyPlan, 'lessons' | 'id' | 'createdAt' | 'updatedAt' | 'classGroup'>, value: string) => {
    setPlan(prev => ({ ...prev, [field]: value }));
  };

  const handleLessonChange = (index: number, field: keyof Lesson, value: string) => {
    const updatedLessons = [...plan.lessons];
    updatedLessons[index] = { ...updatedLessons[index], [field]: value };
    setPlan(prev => ({ ...prev, lessons: updatedLessons }));
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    if (planId) {
      setPlans(plans.map(p => p.id === planId ? { ...plan, id: planId, updatedAt: now } as QuarterlyPlan : p));
    } else {
      const newPlan = {
        ...plan,
        id: `plan-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setPlans([...plans, newPlan]);
    }
    onBack();
  };
  
  const handleGenerateIdeas = async (lesson: Lesson) => {
      if (!lesson.topic) {
          setError(t('builder.aiTutor.errorNoTopic'));
          return;
      }
      setIsGenerating(true);
      setError('');
      setIdea('');
      try {
        const ideas = await generateLessonIdeas(lesson.topic, selectedGroup, currentPersona);
        setIdea(ideas);
      } catch (err) {
        setError(t('builder.aiTutor.errorGeneration'));
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
            <button onClick={onBack} className="text-brand-primary hover:underline mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('builder.backToDashboard')}
            </button>
            <input
                type="text"
                value={plan.title}
                onChange={e => handlePlanChange('title', e.target.value)}
                className="text-3xl font-bold text-brand-dark border-b-2 border-transparent focus:border-brand-primary outline-none"
            />
        </div>
        <Button onClick={handleSave}>{t('builder.savePlan')}</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <h3 className="font-bold text-lg mb-4 text-brand-dark">{t('builder.lessons')}</h3>
          <ul className="space-y-2">
            {plan.lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <button
                  onClick={() => setActiveLessonIndex(index)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${activeLessonIndex === index ? 'bg-brand-primary text-white shadow' : 'bg-gray-100 hover:bg-brand-light'}`}
                >
                  <span className="font-semibold">{i18n.language === 'zh-TW' ? `${t('builder.lessonPrefix')} ${index + 1} ${t('builder.lessonSuffix')}:` : `${t('builder.lessonPrefix')} ${index + 1}:`}</span> {lesson.title || t('builder.unnamed')}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:w-2/3">
            {plan.lessons[activeLessonIndex] && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-brand-dark">{t('builder.editingLesson')} {activeLessonIndex + 1}</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('builder.fields.lessonTitle')}</label>
                        <input type="text" value={plan.lessons[activeLessonIndex].title} onChange={e => handleLessonChange(activeLessonIndex, 'title', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('builder.fields.topic')}</label>
                        <input type="text" value={plan.lessons[activeLessonIndex].topic} onChange={e => handleLessonChange(activeLessonIndex, 'topic', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('builder.fields.scripture')}</label>
                        <input type="text" value={plan.lessons[activeLessonIndex].scripture} onChange={e => handleLessonChange(activeLessonIndex, 'scripture', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('builder.fields.activities')}</label>
                        <textarea rows={5} value={plan.lessons[activeLessonIndex].activities} onChange={e => handleLessonChange(activeLessonIndex, 'activities', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('builder.fields.notes')}</label>
                        <textarea rows={3} value={plan.lessons[activeLessonIndex].notes} onChange={e => handleLessonChange(activeLessonIndex, 'notes', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-brand-light border-l-4 border-brand-accent">
                      <h4 className="text-xl font-bold text-brand-dark mb-2">{t('builder.aiTutor.title')}</h4>
                      <div className="flex items-start gap-4 p-4 bg-white rounded-md shadow-sm">
                        <div className="flex-shrink-0 h-16 w-16 rounded-full bg-brand-primary text-white flex items-center justify-center text-2xl font-bold">
                          {currentPersona.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-bold text-lg text-brand-dark">{currentPersona.name}</h5>
                          <p className="text-sm text-gray-600 italic">"{currentPersona.bio}"</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="secondary"
                          onClick={() => handleGenerateIdeas(plan.lessons[activeLessonIndex])}
                          isLoading={isGenerating}
                          className="w-full"
                        >
                          {isGenerating ? t('builder.aiTutor.thinking') : t('builder.aiTutor.askForIdeas', { name: currentPersona.name })}
                        </Button>
                      </div>

                      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                      {idea && (
                          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
                            <h5 className="font-semibold mb-2 text-brand-dark">{t('builder.aiTutor.suggestionsFrom', { name: currentPersona.name })}</h5>
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{idea}</div>
                          </div>
                      )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LessonPlanBuilder;
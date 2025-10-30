import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassGroup, ClassArrangementInfo } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useArrangements } from './hooks/useArrangements';
import ClassGroupSelector from './components/ClassGroupSelector';
import Dashboard from './components/Dashboard';
import LessonPlanBuilder from './components/LessonPlanBuilder';
import RollCallSystem from './components/RollCallSystem';
import LanguageSwitcher from './components/LanguageSwitcher';
import WhatsAppSecretary from './components/WhatsAppSecretary';
import { CLASS_GROUPS } from './constants';
import Card from './components/common/Card';
import Button from './components/common/Button';
import { downloadArrangementsAsJSON, uploadArrangementsFromFile } from './services/arrangementService';

// ========== Setup Modal Component ==========

interface SetupModalProps {
    classInfo: ClassArrangementInfo;
    onSave: (newArrangement: ClassArrangementInfo) => void;
    onClose: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ classInfo, onSave, onClose }) => {
    const { t } = useTranslation('dashboard');
    const [formState, setFormState] = useState(classInfo);

    const fieldLabels: Record<keyof Omit<ClassArrangementInfo, 'id'>, string> = {
        time: t('classArrangement.fields.time'),
        beginningDate: t('classArrangement.fields.beginningDate'),
        duration: t('classArrangement.fields.duration'),
        place: t('classArrangement.fields.place'),
        teacher: t('classArrangement.fields.teacher'),
        focusLevel: t('classArrangement.fields.focusLevel'),
        group: t('classArrangement.fields.group'),
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };
    
    const fields = (Object.keys(classInfo) as Array<keyof ClassArrangementInfo>).filter(key => key !== 'id');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
            <Card className="w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-brand-dark">{t('classArrangement.modal.title')}</h2>
                        <p className="text-gray-500 mb-6">{t('classArrangement.modal.description')}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map(field => (
                                <div key={field}>
                                    <label htmlFor={field} className="block text-sm font-medium text-gray-700 capitalize">
                                        {fieldLabels[field as keyof typeof fieldLabels]}
                                    </label>
                                    <input
                                        type="text"
                                        id={field}
                                        name={field}
                                        value={formState[field]}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={onClose}>{t('common:buttons.cancel')}</Button>
                        <Button type="submit">{t('common:buttons.save')}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// ========== Class Arrangement Component ==========

interface ClassArrangementProps {
    onBack: () => void;
}

const ClassArrangement: React.FC<ClassArrangementProps> = ({ onBack }) => {
    const { t } = useTranslation('dashboard');
    const {
        arrangements,
        loading,
        error,
        saveArrangement,
        deleteArrangement: dbDeleteArrangement,
        loadArrangements,
        useMongoDB
    } = useArrangements();
    const [isManaging, setIsManaging] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassArrangementInfo | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleManageClick = () => {
        if (isManaging) {
            setIsManaging(false);
            return;
        }
        const password = prompt(t('classArrangement.passwordPrompt'));
        if (password === 'cklbckoho') {
            setIsManaging(true);
        } else if (password !== null) {
            alert(t('classArrangement.passwordIncorrect'));
        }
    };

    const handleAddNew = () => {
        setEditingClass({
            id: `class-${Date.now()}`,
            time: i18n.language === 'en' ? 'Sunday 10:00 AM' : '主日 10:00 AM',
            beginningDate: '',
            duration: i18n.language === 'en' ? '1 Hour' : '1 小時',
            place: '',
            teacher: '',
            focusLevel: '',
            group: i18n.language === 'en' ? 'New Course' : '新課程',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (classToEdit: ClassArrangementInfo) => {
        setEditingClass(classToEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (classId: string) => {
        if (window.confirm(t('classArrangement.confirmDelete'))) {
            try {
                await dbDeleteArrangement(classId);
                alert(t('classArrangement.deleteSuccess'));
            } catch (err) {
                alert(t('classArrangement.deleteError'));
            }
        }
    };

    const handleSave = async (classInfo: ClassArrangementInfo) => {
        try {
            await saveArrangement(classInfo);
            setIsModalOpen(false);
            setEditingClass(null);
            alert(t('classArrangement.saveSuccess'));
        } catch (err) {
            alert(t('classArrangement.saveError'));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClass(null);
    };

    const handleExport = async () => {
        try {
            await downloadArrangementsAsJSON();
        } catch (err) {
            alert(t('classArrangement.exportError'));
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadArrangementsFromFile(file);
            await loadArrangements();
            alert(t('classArrangement.importSuccess'));
        } catch (err) {
            alert(t('classArrangement.importError'));
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
            <header className="bg-brand-primary text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <div>
                        <h1 className="text-2xl font-bold">{t('classArrangement.title')}</h1>
                        <p className="text-xs text-brand-light opacity-80 -mt-1">{t('classArrangement.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                  <LanguageSwitcher />
                  <Button variant="secondary" onClick={handleManageClick}>{isManaging ? t('common:navigation.finishManaging') : t('common:navigation.manageClasses')}</Button>
                  <button onClick={onBack} className="text-sm hover:underline">{t('common:navigation.backToHome')}</button>
                </div>
              </div>
            </header>
            <main className="flex-grow container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-brand-dark">{t('classArrangement.heading')}</h2>
                    <div className="flex items-center space-x-2">
                        {isManaging && (
                            <>
                                <Button onClick={handleAddNew} className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    <span>{t('classArrangement.addNewClass')}</span>
                                </Button>
                                <Button onClick={handleImportClick} variant="secondary" className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                    <span>{t('common:buttons.import')}</span>
                                </Button>
                                <Button onClick={handleExport} variant="secondary" className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    <span>{t('common:buttons.export')}</span>
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    style={{ display: 'none' }}
                                />
                            </>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                        <p className="mt-4 text-gray-500">{t('common:common.loading')}</p>
                    </div>
                )}

                {error && !useMongoDB && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                        <p className="font-medium">{t('dashboard:info.title')}</p>
                        <p>{error}</p>
                        <p className="text-sm mt-2">{t('classArrangement.mongoInfo')}</p>
                    </div>
                )}

                {error && useMongoDB && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-medium">❌ {t('classArrangement.mongoError')}</p>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && arrangements.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {arrangements.map(arrangement => (
                            <Card key={arrangement.id} className="flex flex-col">
                                <div className="p-6 flex-grow">
                                    <h3 className="text-xl font-bold text-brand-dark mb-4">{arrangement.group}: <span className="font-medium text-brand-secondary">{arrangement.focusLevel}</span></h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        {(Object.keys(arrangement) as Array<keyof ClassArrangementInfo>)
                                            .filter(key => !['id', 'group', 'focusLevel'].includes(key))
                                            .map(key => (
                                            <div key={key}>
                                                <span className="font-semibold text-gray-500 capitalize">{fieldLabels[key]}: </span>
                                                <span className="text-brand-dark">{arrangement[key] || 'N/A'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {isManaging && (
                                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                                        <Button variant="ghost" onClick={() => handleEdit(arrangement)}>{t('common:buttons.edit')}</Button>
                                        <Button variant="danger" onClick={() => handleDelete(arrangement.id)}>{t('common:buttons.delete')}</Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : !loading ? (
                    <div className="text-center py-20 bg-brand-light rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        <h3 className="mt-4 text-xl font-medium text-brand-dark">{t('classArrangement.noClasses')}</h3>
                        <p className="mt-2 text-gray-500">{t('classArrangement.noClassesDescription')}</p>
                    </div>
                ) : null}
            </main>
            {isModalOpen && editingClass && (
                <SetupModal 
                    classInfo={editingClass}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}
            <footer className="text-center p-4 text-gray-500 text-sm">
                <p>{t('common:footer.copyright', { year: new Date().getFullYear() })}</p>
            </footer>
        </div>
    );
};

// ========== Roll Call Component ==========

interface RollCallProps {
    onBack: () => void;
}

const RollCall: React.FC<RollCallProps> = ({ onBack }) => {
    const { t } = useTranslation('dashboard');

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
            <header className="bg-green-600 text-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h1 className="text-2xl font-bold">{t('rollCallPage.title')}</h1>
                            <p className="text-xs text-green-100 opacity-80 -mt-1">{t('rollCallPage.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher />
                        <button onClick={onBack} className="text-sm hover:underline">{t('common:navigation.backToHome')}</button>
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-4 md:p-8">
                <RollCallSystem />
            </main>
            <footer className="text-center p-4 text-gray-500 text-sm">
                <p>{t('common:footer.copyright', { year: new Date().getFullYear() })}</p>
            </footer>
        </div>
    );
};

// ========== Landing Page Component ==========

interface LandingPageProps {
  onSelectView: (view: 'classes' | 'support' | 'rollcall' | 'whatsapp') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectView }) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-brand-dark mb-4">{t('landing.title')}</h1>
        <p className="text-xl text-gray-600">{t('landing.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
        <Card onClick={() => onSelectView('classes')} className="group text-center">
            <div className="p-6 bg-brand-primary group-hover:bg-brand-dark transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.classes.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.classes.description')}</p>
            </div>
        </Card>
        <Card onClick={() => onSelectView('support')} className="group text-center">
            <div className="p-6 bg-brand-secondary group-hover:bg-yellow-600 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.teacherSupport.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.teacherSupport.description')}</p>
            </div>
        </Card>
        <Card onClick={() => onSelectView('rollcall')} className="group text-center">
            <div className="p-6 bg-green-600 group-hover:bg-green-700 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.rollCall.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.rollCall.description')}</p>
            </div>
        </Card>
        <Card onClick={() => onSelectView('whatsapp')} className="group text-center">
            <div className="p-6 bg-purple-600 group-hover:bg-purple-700 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.whatsappSecretary.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.whatsappSecretary.description')}</p>
            </div>
        </Card>
        <Card onClick={() => alert(t('landing.aiBookkeeper.title') + ' - ' + t('common:common.comingSoon'))} className="group text-center">
            <div className="p-6 bg-blue-600 group-hover:bg-blue-700 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.aiBookkeeper.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.aiBookkeeper.description')}</p>
            </div>
        </Card>
        <Card onClick={() => alert(t('landing.aiEventOrganizer.title') + ' - ' + t('common:common.comingSoon'))} className="group text-center">
            <div className="p-6 bg-pink-600 group-hover:bg-pink-700 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.aiEventOrganizer.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.aiEventOrganizer.description')}</p>
            </div>
        </Card>
      </div>
      <footer className="absolute bottom-0 text-center p-4 text-gray-500 text-sm">
        <p>{t('common:footer.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};


// ========== Support App Component (Original App) ==========

type SupportView = 'selector' | 'dashboard' | 'builder';

interface SupportAppProps {
  onBack: () => void;
}

const SupportApp: React.FC<SupportAppProps> = ({ onBack }) => {
  const { t } = useTranslation('dashboard');
  const [selectedGroup, setSelectedGroup] = useLocalStorage<ClassGroup | null>('selectedClassGroup', null);
  const [view, setView] = useState<SupportView>('selector');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedGroup) {
      setView('dashboard');
    } else {
      setView('selector');
    }
  }, [selectedGroup]);

  const handleGroupSelect = (group: ClassGroup) => {
    setSelectedGroup(group);
    setView('dashboard');
  };
  
  const handleResetGroup = () => {
    setSelectedGroup(null);
    setView('selector');
  }

  const handleNavigateToBuilder = (planId: string | null) => {
    setActivePlanId(planId);
    setView('builder');
  };
  
  const handleBackToDashboard = () => {
    setActivePlanId(null);
    setView('dashboard');
  };

  const renderHeader = () => (
    <header className="bg-brand-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            <div>
                <h1 className="text-2xl font-bold">{t('teacherSupport.title')}</h1>
                <p className="text-xs text-brand-light opacity-80 -mt-1">{t('teacherSupport.subtitle')}</p>
            </div>
        </div>
        {selectedGroup && (
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <span className="hidden sm:block bg-brand-accent text-brand-dark px-3 py-1 rounded-full text-sm font-semibold">{selectedGroup}</span>
            <button onClick={handleResetGroup} className="text-sm hover:underline">{t('common:navigation.changeGroup')}</button>
            <button onClick={onBack} className="text-sm hover:underline">{t('common:navigation.backToHome')}</button>
          </div>
        )}
        {!selectedGroup && (
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
          </div>
        )}
      </div>
    </header>
  );

  const renderView = () => {
    if (!selectedGroup || view === 'selector') {
      return <ClassGroupSelector classGroups={CLASS_GROUPS} onSelect={handleGroupSelect} />;
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard selectedGroup={selectedGroup} onNavigateToBuilder={handleNavigateToBuilder} />;
      case 'builder':
        return <LessonPlanBuilder selectedGroup={selectedGroup} planId={activePlanId} onBack={handleBackToDashboard} />;
      default:
        return <ClassGroupSelector classGroups={CLASS_GROUPS} onSelect={handleGroupSelect} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {renderHeader()}
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderView()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>{t('common:footer.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};


// ========== Main App Router ==========

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'classes' | 'support' | 'rollcall' | 'whatsapp'>('landing');

  const renderContent = () => {
    switch (view) {
      case 'classes':
        return <ClassArrangement onBack={() => setView('landing')} />;
      case 'support':
        return <SupportApp onBack={() => setView('landing')} />;
      case 'rollcall':
        return <RollCall onBack={() => setView('landing')} />;
      case 'whatsapp':
        return <WhatsAppSecretary onBack={() => setView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onSelectView={setView} />;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
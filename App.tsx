import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassGroup, ClassArrangementInfo, ChurchActivity } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useArrangements } from './hooks/useArrangements';
import ClassGroupSelector from './components/ClassGroupSelector';
import Dashboard from './components/Dashboard';
import LessonPlanBuilder from './components/LessonPlanBuilder';
import RollCallSystem from './components/RollCallSystem';
import LanguageSwitcher from './components/LanguageSwitcher';
import WhatsAppSecretary from './components/WhatsAppSecretary';
import WhatsAppBookkeeper from './components/WhatsAppBookkeeper';
import DocumentHub from './components/DocumentHub';
import SignInPage from './components/SignInPage';
import Sidebar, { ViewType } from './components/Sidebar';
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

// ========== Activity Modal Component ==========

interface ActivityModalProps {
    activity: ChurchActivity;
    onSave: (newActivity: ChurchActivity) => void;
    onClose: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ activity, onSave, onClose }) => {
    const { t } = useTranslation('dashboard');
    const [formState, setFormState] = useState(activity);

    const fieldLabels: Record<keyof Omit<ChurchActivity, 'id' | '_id' | 'createdAt'>, string> = {
        title: t('activities.monthly.fields.title'),
        date: t('activities.monthly.fields.date'),
        time: t('activities.monthly.fields.time'),
        duration: t('activities.monthly.fields.duration'),
        location: t('activities.monthly.fields.location'),
        organizer: t('activities.monthly.fields.organizer'),
        category: t('activities.monthly.fields.category'),
        description: t('activities.monthly.fields.description'),
        registrationRequired: t('activities.monthly.fields.registrationRequired'),
        capacity: t('activities.monthly.fields.capacity'),
        contactPerson: t('activities.monthly.fields.contactPerson'),
        contactPhone: t('activities.monthly.fields.contactPhone'),
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    const fields = (Object.keys(activity) as Array<keyof ChurchActivity>).filter(key => !['id', '_id', 'createdAt'].includes(key));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-brand-dark">{t('activities.monthly.modal.title')}</h2>
                        <p className="text-gray-500 mb-6">{t('activities.monthly.modal.description')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map(field => (
                                <div key={field} className={field === 'description' ? 'md:col-span-2' : ''}>
                                    <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                                        {fieldLabels[field as keyof typeof fieldLabels]}
                                    </label>
                                    {field === 'description' ? (
                                        <textarea
                                            id={field}
                                            name={field}
                                            value={formState[field]}
                                            onChange={handleChange}
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            id={field}
                                            name={field}
                                            value={formState[field]}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                        />
                                    )}
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

type ClassTab = 'quarterly' | 'monthly';

interface ClassArrangementProps {
    onBack: () => void;
    hideHeader?: boolean;
}

const ClassArrangement: React.FC<ClassArrangementProps> = ({ onBack, hideHeader = false }) => {
    const { t, i18n } = useTranslation('dashboard');
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
    const [activeTab, setActiveTab] = useState<ClassTab>('quarterly');

    const fieldLabels: Record<keyof Omit<ClassArrangementInfo, 'id'>, string> = {
        time: t('classArrangement.fields.time'),
        beginningDate: t('classArrangement.fields.beginningDate'),
        duration: t('classArrangement.fields.duration'),
        place: t('classArrangement.fields.place'),
        teacher: t('classArrangement.fields.teacher'),
        focusLevel: t('classArrangement.fields.focusLevel'),
        group: t('classArrangement.fields.group'),
    };

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

    // Monthly Activities State
    const [isManagingActivities, setIsManagingActivities] = useState(false);
    const [activities, setActivities] = useState<ChurchActivity[]>([
        {
            id: 'activity-sample-1',
            title: i18n.language === 'en' ? 'Outdoor Worship Service' : '戶外崇拜',
            date: i18n.language === 'en' ? 'February 20, 2026' : '2026年2月20日',
            time: i18n.language === 'en' ? 'Sunday 10:00 AM' : '星期日 上午10:00',
            duration: i18n.language === 'en' ? '2 Hours' : '2小時',
            location: i18n.language === 'en' ? 'Central Park' : '中央公園',
            organizer: i18n.language === 'en' ? 'Worship Ministry' : '崇拜事工部',
            category: i18n.language === 'en' ? 'Worship' : '崇拜',
            description: i18n.language === 'en' ? 'Join us for a special outdoor worship service celebrating God\'s creation. Bring your family and friends!' : '與我們一同參加特別的戶外崇拜，頌讚神的創造。歡迎攜帶家人朋友一同參與！',
            registrationRequired: i18n.language === 'en' ? 'Yes' : '需要',
            capacity: '200',
            contactPerson: i18n.language === 'en' ? 'Pastor John' : '張牧師',
            contactPhone: '(123) 456-7890'
        }
    ]);
    const [editingActivity, setEditingActivity] = useState<ChurchActivity | null>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    const handleManageActivitiesClick = () => {
        if (isManagingActivities) {
            setIsManagingActivities(false);
            return;
        }
        const password = prompt(t('activities.monthly.passwordPrompt'));
        if (password === 'cklbckoho') {
            setIsManagingActivities(true);
        } else if (password !== null) {
            alert(t('activities.monthly.passwordIncorrect'));
        }
    };

    const handleAddNewActivity = () => {
        setEditingActivity({
            id: `activity-${Date.now()}`,
            title: '',
            date: '',
            time: '',
            duration: i18n.language === 'en' ? '1 Hour' : '1小時',
            location: '',
            organizer: '',
            category: i18n.language === 'en' ? 'General' : '一般',
            description: '',
            registrationRequired: i18n.language === 'en' ? 'No' : '不需要',
            capacity: '',
            contactPerson: '',
            contactPhone: ''
        });
        setIsActivityModalOpen(true);
    };

    const handleEditActivity = (activity: ChurchActivity) => {
        setEditingActivity(activity);
        setIsActivityModalOpen(true);
    };

    const handleDeleteActivity = (activityId: string) => {
        if (window.confirm(t('activities.monthly.confirmDelete'))) {
            setActivities(prev => prev.filter(a => a.id !== activityId));
            alert(t('activities.monthly.deleteSuccess'));
        }
    };

    const handleSaveActivity = (activity: ChurchActivity) => {
        const existingIndex = activities.findIndex(a => a.id === activity.id);
        if (existingIndex >= 0) {
            setActivities(prev => prev.map(a => a.id === activity.id ? activity : a));
        } else {
            setActivities(prev => [...prev, activity]);
        }
        setIsActivityModalOpen(false);
        setEditingActivity(null);
        alert(t('activities.monthly.saveSuccess'));
    };

    const renderMonthlyActivities = () => {
        const activityFieldLabels: Record<keyof Omit<ChurchActivity, 'id' | '_id' | 'createdAt'>, string> = {
            title: t('activities.monthly.fields.title'),
            date: t('activities.monthly.fields.date'),
            time: t('activities.monthly.fields.time'),
            duration: t('activities.monthly.fields.duration'),
            location: t('activities.monthly.fields.location'),
            organizer: t('activities.monthly.fields.organizer'),
            category: t('activities.monthly.fields.category'),
            description: t('activities.monthly.fields.description'),
            registrationRequired: t('activities.monthly.fields.registrationRequired'),
            capacity: t('activities.monthly.fields.capacity'),
            contactPerson: t('activities.monthly.fields.contactPerson'),
            contactPhone: t('activities.monthly.fields.contactPhone'),
        };

        return (
            <div className="w-full py-4 md:py-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4 px-2 sm:px-4 md:px-8">
                    <h2 className="text-2xl font-bold text-brand-dark">{t('activities.monthly.title')}</h2>
                    <div className="flex items-center space-x-2">
                        {isManagingActivities && (
                            <Button onClick={handleAddNewActivity} className="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                <span>{t('activities.monthly.addNewActivity')}</span>
                            </Button>
                        )}
                        <Button onClick={handleManageActivitiesClick} variant={isManagingActivities ? "danger" : "secondary"}>
                            {isManagingActivities ? t('activities.monthly.exitScheduleMode') : t('activities.monthly.scheduleButton')}
                        </Button>
                    </div>
                </div>

                {activities.length > 0 ? (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 sm:px-4 md:px-8">
                        {activities.map(activity => (
                            <Card key={activity.id} className="flex flex-col">
                                <div className="p-6 flex-grow">
                                    <h3 className="text-xl font-bold text-brand-dark mb-4">{activity.title}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        {(Object.keys(activity) as Array<keyof ChurchActivity>)
                                            .filter(key => !['id', '_id', 'title', 'createdAt'].includes(key))
                                            .map(key => (
                                            <div key={key} className={key === 'description' ? 'col-span-2' : ''}>
                                                <span className="font-semibold text-gray-500 capitalize">{activityFieldLabels[key]}: </span>
                                                <span className="text-brand-dark">{activity[key] || 'N/A'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {isManagingActivities && (
                                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                                        <Button variant="ghost" onClick={() => handleEditActivity(activity)}>{t('common:buttons.edit')}</Button>
                                        <Button variant="danger" onClick={() => handleDeleteActivity(activity.id)}>{t('common:buttons.delete')}</Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-brand-light rounded-lg mx-2 sm:mx-4 md:mx-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <h3 className="mt-4 text-xl font-medium text-brand-dark">{t('activities.monthly.noActivities')}</h3>
                        <p className="mt-2 text-gray-500">{t('activities.monthly.noActivitiesDescription')}</p>
                    </div>
                )}
            </div>
        );
    };

    const content = (
        <div className="w-full py-4 md:py-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4 px-2 sm:px-4 md:px-8">
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
                        <Button onClick={handleManageClick} variant={isManaging ? "danger" : "secondary"}>
                            {isManaging ? t('classArrangement.exitManageMode') : t('classArrangement.manageButton')}
                        </Button>
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
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 sm:px-4 md:px-8">
                        {arrangements.map(arrangement => (
                            <Card key={arrangement.id} className="flex flex-col">
                                <div className="p-6 flex-grow">
                                    <h3 className="text-xl font-bold text-brand-dark mb-4">{arrangement.group}: <span className="font-medium text-brand-secondary">{arrangement.focusLevel}</span></h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        {arrangement._id && (
                                            <div className="col-span-2">
                                                <span className="font-semibold text-gray-500">DBcode: </span>
                                                <span className="text-brand-dark font-mono text-xs">{String(arrangement._id)}</span>
                                            </div>
                                        )}
                                        {arrangement.createdAt && (
                                            <div className="col-span-2">
                                                <span className="font-semibold text-gray-500">{fieldLabels.createdAt || 'Created At'}: </span>
                                                <span className="text-brand-dark text-xs">{new Date(arrangement.createdAt).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {(Object.keys(arrangement) as Array<keyof ClassArrangementInfo>)
                                            .filter(key => !['id', '_id', 'group', 'focusLevel', 'createdAt'].includes(key))
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
        </div>
    );

    if (hideHeader) {
        return (
            <div className="flex flex-col bg-gray-50 h-full">
                {/* Navigation Tabs */}
                <nav className="bg-white shadow">
                    <div className="w-full px-2 sm:px-4">
                        <div className="flex justify-between items-center overflow-x-auto">
                            <div className="flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('quarterly')}
                                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                        activeTab === 'quarterly'
                                            ? 'border-brand-primary text-brand-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {t('activities.quarterly.tab')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('monthly')}
                                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                        activeTab === 'monthly'
                                            ? 'border-brand-primary text-brand-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {t('activities.monthly.tab')}
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-grow w-full overflow-y-auto">
                    {activeTab === 'quarterly' && content}
                    {activeTab === 'monthly' && renderMonthlyActivities()}
                </main>

                {/* Modal */}
                {isModalOpen && editingClass && (
                    <SetupModal
                        classInfo={editingClass}
                        onSave={handleSave}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        );
    }

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
            <main className="flex-grow">
                {content}
            </main>
            {isModalOpen && editingClass && (
                <SetupModal
                    classInfo={editingClass}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}
            {isActivityModalOpen && editingActivity && (
                <ActivityModal
                    activity={editingActivity}
                    onSave={handleSaveActivity}
                    onClose={() => setIsActivityModalOpen(false)}
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
    hideHeader?: boolean;
}

const RollCall: React.FC<RollCallProps> = ({ onBack, hideHeader = false }) => {
    const { t } = useTranslation('dashboard');

    if (hideHeader) {
        return (
            <div className="w-full px-2 py-4 sm:px-4 md:px-8 md:py-8">
                <RollCallSystem />
            </div>
        );
    }

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
  onSelectView: (view: 'classes' | 'support' | 'rollcall' | 'whatsapp' | 'documenthub') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectView }) => {
  const { t } = useTranslation(['dashboard', 'secretary']);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light p-4">
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <a
          href="https://christianityplatform.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>{t('secretary:header.platformHome')}</span>
        </a>
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
        <Card onClick={() => onSelectView('bookkeeper')} className="group text-center">
            <div className="p-6 bg-blue-600 group-hover:bg-blue-700 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">{t('landing.aiBookkeeper.title')}</h2>
                <p className="text-gray-600 mt-2">{t('landing.aiBookkeeper.description')}</p>
            </div>
        </Card>
        <Card onClick={() => onSelectView('documenthub')} className="group text-center">
            <div className="p-6 bg-pink-600 group-hover:bg-pink-700 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
type SupportTab = 'bible' | 'outdoor' | 'gathering' | 'documents' | 'template';

interface SupportAppProps {
  onBack: () => void;
  hideHeader?: boolean;
}

const SupportApp: React.FC<SupportAppProps> = ({ onBack, hideHeader = false }) => {
  const { t, i18n } = useTranslation('dashboard');
  const [selectedGroup, setSelectedGroup] = useLocalStorage<ClassGroup | null>('selectedClassGroup', null);
  const [view, setView] = useState<SupportView>('selector');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SupportTab>('bible');

  // Bible Study states
  const [bibleIsGenerating, setBibleIsGenerating] = useState(false);
  const [bibleGeneratedPlan, setBibleGeneratedPlan] = useState<string>('');
  const [bibleFormData, setBibleFormData] = useState({
    ageRange: 'adults',
    classSize: '',
    experienceLevel: 'intermediate',
    studyGoals: '',
    preferredTopics: '',
    sessionDuration: '',
    numberOfSessions: ''
  });

  // Outdoor Activity states
  const [outdoorIsGenerating, setOutdoorIsGenerating] = useState(false);
  const [outdoorGeneratedPlan, setOutdoorGeneratedPlan] = useState<string>('');
  const [outdoorFormData, setOutdoorFormData] = useState({
    activityType: 'fellowship',
    activityDate: '',
    duration: '',
    participantCount: '',
    ageGroups: 'all',
    budget: '',
    location: 'flexible',
    specialRequirements: '',
    objectives: ''
  });

  // Church Gathering states
  const [gatheringIsGenerating, setGatheringIsGenerating] = useState(false);
  const [gatheringGeneratedPlan, setGatheringGeneratedPlan] = useState<string>('');
  const [gatheringFormData, setGatheringFormData] = useState({
    eventType: 'fellowship',
    eventDate: '',
    eventTime: '',
    duration: '',
    expectedAttendance: '',
    venue: 'fellowship',
    setupRequirements: '',
    equipment: '',
    refreshments: 'light',
    program: ''
  });

  // Routine Documents states
  const [docIsAnalyzing, setDocIsAnalyzing] = useState(false);
  const [docIsRefining, setDocIsRefining] = useState(false);
  const [docIsGenerating, setDocIsGenerating] = useState(false);
  const [docUploadedFile, setDocUploadedFile] = useState<File | null>(null);
  const [docStructure, setDocStructure] = useState<string>('');
  const [docUserFeedback, setDocUserFeedback] = useState('');
  const [docContentItems, setDocContentItems] = useState<Array<{id: string; type: string; content: string; target: string}>>([]);
  const [docNewContentType, setDocNewContentType] = useState('chapter');
  const [docNewContent, setDocNewContent] = useState('');
  const [docTargetLocation, setDocTargetLocation] = useState('');
  const [docGeneratedDocument, setDocGeneratedDocument] = useState('');
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Document Template states
  const [templateIsGenerating, setTemplateIsGenerating] = useState(false);
  const [templateIsRefining, setTemplateIsRefining] = useState(false);
  const [templateGeneratedTemplate, setTemplateGeneratedTemplate] = useState('');
  const [templateFormData, setTemplateFormData] = useState({
    templatePurpose: '',
    documentType: 'newsletter',
    targetAudience: 'congregation',
    contentSections: '',
    specialFeatures: '',
    designPreferences: ''
  });
  const [templateSelectedSections, setTemplateSelectedSections] = useState<string[]>([]);
  const [templateSelectedFeatures, setTemplateSelectedFeatures] = useState<string[]>([]);
  const [templateSelectedDesignPrefs, setTemplateSelectedDesignPrefs] = useState<string[]>([]);
  const [templateChatHistory, setTemplateChatHistory] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);
  const [templateChatInput, setTemplateChatInput] = useState('');
  const [templateSavedTemplates, setTemplateSavedTemplates] = useState<Array<{id: string; name: string; content: string; createdAt: string}>>([]);
  
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

  const renderBibleStudy = () => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setBibleFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGeneratePlan = async () => {
      setBibleIsGenerating(true);
      setBibleGeneratedPlan('');

      try {
        const systemPrompt = `You are an expert Bible class designer with deep knowledge of Christian education and pedagogy. Create comprehensive, engaging Bible class plans tailored to specific participant groups.`;

        const userPrompt = `Create a detailed Bible class plan with the following parameters:
- Age Range: ${t(`support.bible.ageRanges.${bibleFormData.ageRange}`)}
- Class Size: ${bibleFormData.classSize}
- Bible Knowledge Level: ${t(`support.bible.experienceLevels.${bibleFormData.experienceLevel}`)}
- Study Goals: ${bibleFormData.studyGoals}
- Preferred Topics: ${bibleFormData.preferredTopics || 'Any suitable topics'}
- Session Duration: ${bibleFormData.sessionDuration}
- Number of Sessions: ${bibleFormData.numberOfSessions}

Please provide:
1. An overview of the class plan
2. Weekly session breakdown with topics
3. Suggested scripture passages for each session
4. Teaching methods appropriate for this age group and experience level
5. Discussion questions or activities for each session
6. Materials needed
7. Assessment/reflection methods

Format the response in a clear, structured way using markdown.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 3000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate plan');
        }

        const data = await response.json();
        const plan = data.choices?.[0]?.message?.content || '';
        setBibleGeneratedPlan(plan);
      } catch (error) {
        console.error('Error generating plan:', error);
        alert(t('support.bible.error'));
      } finally {
        setBibleIsGenerating(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('support.bible.title')}</h3>
          <p className="text-gray-600 mb-6">{t('support.bible.description')}</p>

          {/* Form Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.bible.participantInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.ageRange')}
                  </label>
                  <select
                    name="ageRange"
                    value={bibleFormData.ageRange}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="children">{t('support.bible.ageRanges.children')}</option>
                    <option value="youth">{t('support.bible.ageRanges.youth')}</option>
                    <option value="youngAdults">{t('support.bible.ageRanges.youngAdults')}</option>
                    <option value="adults">{t('support.bible.ageRanges.adults')}</option>
                    <option value="seniors">{t('support.bible.ageRanges.seniors')}</option>
                    <option value="mixed">{t('support.bible.ageRanges.mixed')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.classSize')}
                  </label>
                  <input
                    type="text"
                    name="classSize"
                    value={bibleFormData.classSize}
                    onChange={handleInputChange}
                    placeholder={t('support.bible.placeholder.classSize')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.experienceLevel')}
                  </label>
                  <select
                    name="experienceLevel"
                    value={bibleFormData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="beginner">{t('support.bible.experienceLevels.beginner')}</option>
                    <option value="intermediate">{t('support.bible.experienceLevels.intermediate')}</option>
                    <option value="advanced">{t('support.bible.experienceLevels.advanced')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.sessionDuration')}
                  </label>
                  <input
                    type="text"
                    name="sessionDuration"
                    value={bibleFormData.sessionDuration}
                    onChange={handleInputChange}
                    placeholder={t('support.bible.placeholder.sessionDuration')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.numberOfSessions')}
                  </label>
                  <input
                    type="text"
                    name="numberOfSessions"
                    value={bibleFormData.numberOfSessions}
                    onChange={handleInputChange}
                    placeholder={t('support.bible.placeholder.numberOfSessions')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.bible.classInfo')}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.studyGoals')}
                  </label>
                  <textarea
                    name="studyGoals"
                    value={bibleFormData.studyGoals}
                    onChange={handleInputChange}
                    placeholder={t('support.bible.placeholder.studyGoals')}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.bible.preferredTopics')}
                  </label>
                  <textarea
                    name="preferredTopics"
                    value={bibleFormData.preferredTopics}
                    onChange={handleInputChange}
                    placeholder={t('support.bible.placeholder.preferredTopics')}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleGeneratePlan}
                disabled={bibleIsGenerating || !bibleFormData.classSize || !bibleFormData.studyGoals || !bibleFormData.sessionDuration || !bibleFormData.numberOfSessions}
                className="px-8"
              >
                {bibleIsGenerating ? t('support.bible.generating') : t('support.bible.generatePlan')}
              </Button>
            </div>
          </div>

          {/* Generated Plan Section */}
          {bibleGeneratedPlan && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-brand-dark">{t('support.bible.generatedPlan')}</h4>
                <Button variant="ghost" onClick={handleGeneratePlan} disabled={bibleIsGenerating}>
                  {t('support.bible.regenerate')}
                </Button>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{bibleGeneratedPlan}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOutdoorActivity = () => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setOutdoorFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGeneratePlan = async () => {
      setOutdoorIsGenerating(true);
      setOutdoorGeneratedPlan('');

      try {
        const systemPrompt = `You are an expert church event planner with extensive experience in organizing outdoor activities, retreats, and fellowship events. Create comprehensive, practical activity plans with attention to safety, logistics, and spiritual objectives.`;

        const userPrompt = `Create a detailed outdoor activity plan with the following parameters:
- Activity Type: ${t(`support.outdoor.activityTypes.${outdoorFormData.activityType}`)}
- Preferred Date: ${outdoorFormData.activityDate}
- Duration: ${outdoorFormData.duration}
- Expected Participants: ${outdoorFormData.participantCount}
- Age Groups: ${t(`support.outdoor.ageGroupOptions.${outdoorFormData.ageGroups}`)}
- Budget Range: ${outdoorFormData.budget}
- Location Type: ${t(`support.outdoor.locationTypes.${outdoorFormData.location}`)}
- Special Requirements: ${outdoorFormData.specialRequirements || 'None specified'}
- Objectives: ${outdoorFormData.objectives}

Please provide:
1. Activity overview and theme
2. Suggested venues/locations (search for actual places if possible)
3. Detailed schedule/itinerary
4. Materials and equipment needed
5. Food and refreshment plans
6. Safety considerations and emergency procedures
7. Transportation logistics
8. Budget breakdown
9. Team assignments and responsibilities
10. Spiritual components (devotions, prayer times, etc.)
11. Weather contingency plans

Format the response in a clear, structured way using markdown.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 3500,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate plan');
        }

        const data = await response.json();
        const plan = data.choices?.[0]?.message?.content || '';
        setOutdoorGeneratedPlan(plan);
      } catch (error) {
        console.error('Error generating plan:', error);
        alert(t('support.outdoor.error'));
      } finally {
        setOutdoorIsGenerating(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('support.outdoor.title')}</h3>
          <p className="text-gray-600 mb-6">{t('support.outdoor.description')}</p>

          {/* Form Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.outdoor.activityInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.activityType')}
                  </label>
                  <select
                    name="activityType"
                    value={outdoorFormData.activityType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="retreat">{t('support.outdoor.activityTypes.retreat')}</option>
                    <option value="picnic">{t('support.outdoor.activityTypes.picnic')}</option>
                    <option value="hiking">{t('support.outdoor.activityTypes.hiking')}</option>
                    <option value="sports">{t('support.outdoor.activityTypes.sports')}</option>
                    <option value="service">{t('support.outdoor.activityTypes.service')}</option>
                    <option value="fellowship">{t('support.outdoor.activityTypes.fellowship')}</option>
                    <option value="other">{t('support.outdoor.activityTypes.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.activityDate')}
                  </label>
                  <input
                    type="date"
                    name="activityDate"
                    value={outdoorFormData.activityDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.duration')}
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={outdoorFormData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., Half day, Full day, 2 days"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.location')}
                  </label>
                  <select
                    name="location"
                    value={outdoorFormData.location}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="park">{t('support.outdoor.locationTypes.park')}</option>
                    <option value="beach">{t('support.outdoor.locationTypes.beach')}</option>
                    <option value="mountain">{t('support.outdoor.locationTypes.mountain')}</option>
                    <option value="campsite">{t('support.outdoor.locationTypes.campsite')}</option>
                    <option value="farm">{t('support.outdoor.locationTypes.farm')}</option>
                    <option value="indoor">{t('support.outdoor.locationTypes.indoor')}</option>
                    <option value="flexible">{t('support.outdoor.locationTypes.flexible')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.outdoor.participantInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.participantCount')}
                  </label>
                  <input
                    type="text"
                    name="participantCount"
                    value={outdoorFormData.participantCount}
                    onChange={handleInputChange}
                    placeholder={t('support.outdoor.placeholder.participantCount')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.ageGroups')}
                  </label>
                  <select
                    name="ageGroups"
                    value={outdoorFormData.ageGroups}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="children">{t('support.outdoor.ageGroupOptions.children')}</option>
                    <option value="youth">{t('support.outdoor.ageGroupOptions.youth')}</option>
                    <option value="youngAdults">{t('support.outdoor.ageGroupOptions.youngAdults')}</option>
                    <option value="adults">{t('support.outdoor.ageGroupOptions.adults')}</option>
                    <option value="seniors">{t('support.outdoor.ageGroupOptions.seniors')}</option>
                    <option value="family">{t('support.outdoor.ageGroupOptions.family')}</option>
                    <option value="all">{t('support.outdoor.ageGroupOptions.all')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.budget')}
                  </label>
                  <input
                    type="text"
                    name="budget"
                    value={outdoorFormData.budget}
                    onChange={handleInputChange}
                    placeholder={t('support.outdoor.placeholder.budget')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.objectives')}
                  </label>
                  <input
                    type="text"
                    name="objectives"
                    value={outdoorFormData.objectives}
                    onChange={handleInputChange}
                    placeholder={t('support.outdoor.placeholder.objectives')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.outdoor.specialRequirements')}
                  </label>
                  <textarea
                    name="specialRequirements"
                    value={outdoorFormData.specialRequirements}
                    onChange={handleInputChange}
                    placeholder={t('support.outdoor.placeholder.specialRequirements')}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleGeneratePlan}
                disabled={outdoorIsGenerating || !outdoorFormData.activityDate || !outdoorFormData.participantCount || !outdoorFormData.objectives}
                className="px-8"
              >
                {outdoorIsGenerating ? t('support.outdoor.generating') : t('support.outdoor.generatePlan')}
              </Button>
            </div>
          </div>

          {/* Generated Plan Section */}
          {outdoorGeneratedPlan && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-brand-dark">{t('support.outdoor.generatedPlan')}</h4>
                <Button variant="ghost" onClick={handleGeneratePlan} disabled={outdoorIsGenerating}>
                  {t('support.outdoor.regenerate')}
                </Button>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{outdoorGeneratedPlan}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChurchGathering = () => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setGatheringFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGeneratePlan = async () => {
      setGatheringIsGenerating(true);
      setGatheringGeneratedPlan('');

      try {
        const systemPrompt = `You are an expert church event coordinator with extensive experience in organizing worship services, meetings, and church gatherings. Create comprehensive, practical event plans with attention to logistics, scheduling, and spiritual flow.`;

        const userPrompt = `Create a detailed church gathering plan with the following parameters:
- Event Type: ${t(`support.gathering.eventTypes.${gatheringFormData.eventType}`)}
- Event Date: ${gatheringFormData.eventDate}
- Start Time: ${gatheringFormData.eventTime}
- Duration: ${gatheringFormData.duration}
- Expected Attendance: ${gatheringFormData.expectedAttendance}
- Venue: ${t(`support.gathering.venueOptions.${gatheringFormData.venue}`)}
- Setup Requirements: ${gatheringFormData.setupRequirements || 'Standard setup'}
- Equipment Needed: ${gatheringFormData.equipment || 'Standard AV equipment'}
- Refreshments: ${t(`support.gathering.refreshmentOptions.${gatheringFormData.refreshments}`)}
- Program Description: ${gatheringFormData.program}

Please provide:
1. Event overview and objectives
2. Detailed timeline/program flow
3. Room setup diagram description
4. Equipment checklist
5. Volunteer roles and responsibilities
6. Refreshment/hospitality plan
7. Pre-event preparation checklist
8. Day-of coordination tasks
9. Post-event cleanup and follow-up
10. Budget considerations
11. Communication plan (announcements, invitations)

Format the response in a clear, structured way using markdown.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 3500,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate plan');
        }

        const data = await response.json();
        const plan = data.choices?.[0]?.message?.content || '';
        setGatheringGeneratedPlan(plan);
      } catch (error) {
        console.error('Error generating plan:', error);
        alert(t('support.gathering.error'));
      } finally {
        setGatheringIsGenerating(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('support.gathering.title')}</h3>
          <p className="text-gray-600 mb-6">{t('support.gathering.description')}</p>

          {/* Form Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.gathering.eventInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.eventType')}
                  </label>
                  <select
                    name="eventType"
                    value={gatheringFormData.eventType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="worship">{t('support.gathering.eventTypes.worship')}</option>
                    <option value="prayer">{t('support.gathering.eventTypes.prayer')}</option>
                    <option value="fellowship">{t('support.gathering.eventTypes.fellowship')}</option>
                    <option value="committee">{t('support.gathering.eventTypes.committee')}</option>
                    <option value="training">{t('support.gathering.eventTypes.training')}</option>
                    <option value="celebration">{t('support.gathering.eventTypes.celebration')}</option>
                    <option value="memorial">{t('support.gathering.eventTypes.memorial')}</option>
                    <option value="other">{t('support.gathering.eventTypes.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.eventDate')}
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={gatheringFormData.eventDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.eventTime')}
                  </label>
                  <input
                    type="time"
                    name="eventTime"
                    value={gatheringFormData.eventTime}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.duration')}
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={gatheringFormData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.5 hours, 2 hours"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.gathering.logisticsInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.expectedAttendance')}
                  </label>
                  <input
                    type="text"
                    name="expectedAttendance"
                    value={gatheringFormData.expectedAttendance}
                    onChange={handleInputChange}
                    placeholder={t('support.gathering.placeholder.expectedAttendance')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.venue')}
                  </label>
                  <select
                    name="venue"
                    value={gatheringFormData.venue}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="mainHall">{t('support.gathering.venueOptions.mainHall')}</option>
                    <option value="chapel">{t('support.gathering.venueOptions.chapel')}</option>
                    <option value="fellowship">{t('support.gathering.venueOptions.fellowship')}</option>
                    <option value="classroom">{t('support.gathering.venueOptions.classroom')}</option>
                    <option value="meetingRoom">{t('support.gathering.venueOptions.meetingRoom')}</option>
                    <option value="outdoor">{t('support.gathering.venueOptions.outdoor')}</option>
                    <option value="other">{t('support.gathering.venueOptions.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.refreshments')}
                  </label>
                  <select
                    name="refreshments"
                    value={gatheringFormData.refreshments}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="none">{t('support.gathering.refreshmentOptions.none')}</option>
                    <option value="light">{t('support.gathering.refreshmentOptions.light')}</option>
                    <option value="tea">{t('support.gathering.refreshmentOptions.tea')}</option>
                    <option value="lunch">{t('support.gathering.refreshmentOptions.lunch')}</option>
                    <option value="potluck">{t('support.gathering.refreshmentOptions.potluck')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.equipment')}
                  </label>
                  <input
                    type="text"
                    name="equipment"
                    value={gatheringFormData.equipment}
                    onChange={handleInputChange}
                    placeholder={t('support.gathering.placeholder.equipment')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.setupRequirements')}
                  </label>
                  <input
                    type="text"
                    name="setupRequirements"
                    value={gatheringFormData.setupRequirements}
                    onChange={handleInputChange}
                    placeholder={t('support.gathering.placeholder.setupRequirements')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.gathering.program')}
                  </label>
                  <textarea
                    name="program"
                    value={gatheringFormData.program}
                    onChange={handleInputChange}
                    placeholder={t('support.gathering.placeholder.program')}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleGeneratePlan}
                disabled={gatheringIsGenerating || !gatheringFormData.eventDate || !gatheringFormData.eventTime || !gatheringFormData.expectedAttendance || !gatheringFormData.program}
                className="px-8"
              >
                {gatheringIsGenerating ? t('support.gathering.generating') : t('support.gathering.generatePlan')}
              </Button>
            </div>
          </div>

          {/* Generated Plan Section */}
          {gatheringGeneratedPlan && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-brand-dark">{t('support.gathering.generatedPlan')}</h4>
                <Button variant="ghost" onClick={handleGeneratePlan} disabled={gatheringIsGenerating}>
                  {t('support.gathering.regenerate')}
                </Button>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{gatheringGeneratedPlan}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRoutineDocuments = () => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        setDocUploadedFile(file);
      } else {
        alert(t('support.documents.pdfOnly'));
      }
    };

    const handleAnalyzeDocument = async () => {
      if (!docUploadedFile) return;

      setDocIsAnalyzing(true);
      setDocStructure('');

      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];

          const systemPrompt = `You are an expert document analyst specializing in understanding document structure and formatting. Analyze the uploaded PDF document and identify its structure including chapters, sections, subsections, headings, and content organization.`;

          const userPrompt = `Analyze this PDF document and provide a detailed breakdown of its structure:

1. Identify the main title and document type
2. List all chapters with their titles and page numbers
3. Within each chapter, identify all sections and subsections
4. Note any special formatting patterns (headers, footers, numbering styles)
5. Identify tables, figures, and lists
6. Describe the overall document layout and formatting style

Please format your response as a structured outline that clearly shows the hierarchy of the document.

[PDF Content to analyze - filename: ${docUploadedFile.name}]`;

          const response = await fetch('/api/unified', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.3,
              maxTokens: 3000,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to analyze document');
          }

          const data = await response.json();
          const structure = data.choices?.[0]?.message?.content || '';
          setDocStructure(structure);
        };
        reader.readAsDataURL(docUploadedFile);
      } catch (error) {
        console.error('Error analyzing document:', error);
        alert(t('support.documents.error'));
      } finally {
        setDocIsAnalyzing(false);
      }
    };

    const handleRefineAnalysis = async () => {
      if (!docStructure || !docUserFeedback) return;

      setDocIsRefining(true);

      try {
        const systemPrompt = `You are an expert document analyst. The user has provided feedback on your previous document structure analysis. Refine and correct your analysis based on their feedback.`;

        const userPrompt = `Previous analysis:
${docStructure}

User feedback for corrections:
${docUserFeedback}

Please provide an updated and corrected document structure analysis based on this feedback. Maintain the same format but incorporate the user's corrections.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            maxTokens: 3000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to refine analysis');
        }

        const data = await response.json();
        const refinedStructure = data.choices?.[0]?.message?.content || '';
        setDocStructure(refinedStructure);
        setDocUserFeedback('');
      } catch (error) {
        console.error('Error refining analysis:', error);
        alert(t('support.documents.error'));
      } finally {
        setDocIsRefining(false);
      }
    };

    const handleAddContent = () => {
      if (!docNewContent) return;

      const newItem = {
        id: `content-${Date.now()}`,
        type: docNewContentType,
        content: docNewContent,
        target: docTargetLocation
      };

      setDocContentItems(prev => [...prev, newItem]);
      setDocNewContent('');
      setDocTargetLocation('');
    };

    const handleRemoveContent = (id: string) => {
      setDocContentItems(prev => prev.filter(item => item.id !== id));
    };

    const handleGenerateDocument = async () => {
      if (docContentItems.length === 0) return;

      setDocIsGenerating(true);
      setDocGeneratedDocument('');

      try {
        const contentSummary = docContentItems.map(item =>
          `${t(`support.documents.contentTypes.${item.type}`)}: ${item.content.substring(0, 100)}...`
        ).join('\n');

        const systemPrompt = `You are an expert document generator specializing in creating well-formatted church documents. Based on the document structure and new content provided, generate a complete document that follows the original formatting and structure.`;

        const userPrompt = `Original document structure:
${docStructure || 'No previous structure - create new document'}

New content to incorporate:
${docContentItems.map(item => `
Type: ${t(`support.documents.contentTypes.${item.type}`)}
Target: ${item.target || 'Auto-place'}
Content:
${item.content}
`).join('\n---\n')}

Please generate a complete document that:
1. Follows the original document formatting and style
2. Incorporates all the new content in appropriate locations
3. Maintains consistent numbering and formatting
4. Includes proper chapter/section headings
5. Formats the content professionally

Output the complete document in a well-structured format with clear headings and sections.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            maxTokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate document');
        }

        const data = await response.json();
        const document = data.choices?.[0]?.message?.content || '';
        setDocGeneratedDocument(document);
      } catch (error) {
        console.error('Error generating document:', error);
        alert(t('support.documents.error'));
      } finally {
        setDocIsGenerating(false);
      }
    };

    const handleClearAll = () => {
      setDocUploadedFile(null);
      setDocStructure('');
      setDocUserFeedback('');
      setDocContentItems([]);
      setDocGeneratedDocument('');
      if (docFileInputRef.current) {
        docFileInputRef.current.value = '';
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('support.documents.title')}</h3>
          <p className="text-gray-600 mb-6">{t('support.documents.description')}</p>

          {/* Document Analysis Section */}
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.documents.analyzeSection')}</h4>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('support.documents.uploadPDF')}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700"
                  >
                    {t('support.documents.selectFile')}
                  </label>
                  <span className="text-sm text-gray-500">
                    {docUploadedFile ? docUploadedFile.name : t('support.documents.pdfOnly')}
                  </span>
                </div>
              </div>

              {docUploadedFile && (
                <div className="mb-4">
                  <Button
                    onClick={handleAnalyzeDocument}
                    disabled={docIsAnalyzing}
                  >
                    {docIsAnalyzing ? t('support.documents.analyzing') : t('support.documents.analyzeDocument')}
                  </Button>
                </div>
              )}

              {/* Document Structure Display */}
              {docStructure && (
                <div className="mt-4">
                  <h5 className="text-md font-semibold text-brand-dark mb-2">{t('support.documents.documentStructure')}</h5>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{docStructure}</pre>
                  </div>

                  {/* Feedback for Refinement */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('support.documents.feedbackPrompt')}
                    </label>
                    <textarea
                      value={docUserFeedback}
                      onChange={(e) => setDocUserFeedback(e.target.value)}
                      placeholder={t('support.documents.feedbackPlaceholder')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <Button
                      onClick={handleRefineAnalysis}
                      disabled={docIsRefining || !docUserFeedback}
                      className="mt-2"
                      variant="ghost"
                    >
                      {docIsRefining ? t('support.documents.refining') : t('support.documents.refineAnalysis')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Document Generation Section */}
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.documents.generateSection')}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.documents.contentType')}
                  </label>
                  <select
                    value={docNewContentType}
                    onChange={(e) => setDocNewContentType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="chapter">{t('support.documents.contentTypes.chapter')}</option>
                    <option value="section">{t('support.documents.contentTypes.section')}</option>
                    <option value="appendix">{t('support.documents.contentTypes.appendix')}</option>
                    <option value="preface">{t('support.documents.contentTypes.preface')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.documents.targetChapter')}
                  </label>
                  <input
                    type="text"
                    value={docTargetLocation}
                    onChange={(e) => setDocTargetLocation(e.target.value)}
                    placeholder="e.g., After Chapter 2"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('support.documents.pasteContent')}
                </label>
                <textarea
                  value={docNewContent}
                  onChange={(e) => setDocNewContent(e.target.value)}
                  placeholder={t('support.documents.contentPlaceholder')}
                  rows={5}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <Button
                onClick={handleAddContent}
                disabled={!docNewContent}
                variant="ghost"
              >
                {t('support.documents.addToDocument')}
              </Button>

              {/* Added Content List */}
              {docContentItems.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-md font-semibold text-brand-dark mb-2">{t('support.documents.addedContent')}</h5>
                  <div className="space-y-2">
                    {docContentItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                        <div>
                          <span className="font-medium text-sm">{t(`support.documents.contentTypes.${item.type}`)}</span>
                          {item.target && <span className="text-xs text-gray-500 ml-2">({item.target})</span>}
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveContent(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          {t('support.documents.removeItem')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate and Actions */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleGenerateDocument}
                disabled={docIsGenerating || docContentItems.length === 0}
              >
                {docIsGenerating ? t('support.documents.generating') : t('support.documents.generatePDF')}
              </Button>
              <Button
                onClick={handleClearAll}
                variant="ghost"
              >
                {t('support.documents.clearAll')}
              </Button>
            </div>

            {/* Generated Document Display */}
            {docGeneratedDocument && (
              <div className="mt-6 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-brand-dark">{t('support.documents.previewDocument')}</h4>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg prose prose-sm max-w-none max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{docGeneratedDocument}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentTemplate = () => {
    const sectionOptions = ['header', 'introduction', 'mainContent', 'scripture', 'prayer', 'announcements', 'events', 'testimony', 'teaching', 'contactInfo', 'footer', 'signature', 'appendix'];
    const featureOptions = ['logo', 'colorScheme', 'photos', 'scriptureQuotes', 'bulletPoints', 'tables', 'borders', 'watermark', 'qrCode', 'socialMedia', 'pageNumbers', 'dateField'];
    const designPrefOptions = ['formal', 'informal', 'modern', 'traditional', 'colorful', 'minimalist', 'elegant', 'simple', 'professional', 'casual', 'creative', 'classic'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTemplateFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSectionToggle = (section: string) => {
      setTemplateSelectedSections(prev =>
        prev.includes(section)
          ? prev.filter(s => s !== section)
          : [...prev, section]
      );
    };

    const handleFeatureToggle = (feature: string) => {
      setTemplateSelectedFeatures(prev =>
        prev.includes(feature)
          ? prev.filter(f => f !== feature)
          : [...prev, feature]
      );
    };

    const handleDesignPrefToggle = (pref: string) => {
      setTemplateSelectedDesignPrefs(prev =>
        prev.includes(pref)
          ? prev.filter(p => p !== pref)
          : [...prev, pref]
      );
    };

    const getSelectedSectionsText = () => {
      const selectedLabels = templateSelectedSections.map(s => t(`support.template.sectionOptions.${s}`));
      const additionalText = templateFormData.contentSections;
      const allSections = [...selectedLabels];
      if (additionalText) allSections.push(additionalText);
      return allSections.join(', ') || 'Standard sections for this document type';
    };

    const getSelectedFeaturesText = () => {
      const selectedLabels = templateSelectedFeatures.map(f => t(`support.template.featureOptions.${f}`));
      const additionalText = templateFormData.specialFeatures;
      const allFeatures = [...selectedLabels];
      if (additionalText) allFeatures.push(additionalText);
      return allFeatures.join(', ') || 'None specified';
    };

    const getSelectedDesignPrefsText = () => {
      const selectedLabels = templateSelectedDesignPrefs.map(p => t(`support.template.designPreferenceOptions.${p}`));
      const additionalText = templateFormData.designPreferences;
      const allPrefs = [...selectedLabels];
      if (additionalText) allPrefs.push(additionalText);
      return allPrefs.join(', ') || 'Professional and clean';
    };

    const handleGenerateTemplate = async () => {
      setTemplateIsGenerating(true);
      setTemplateGeneratedTemplate('');
      setTemplateChatHistory([]);

      try {
        const systemPrompt = `You are an expert document template designer specializing in church and ministry documents. You understand document structure, formatting, and design principles. Your goal is to help users create professional, well-organized document templates that match their specific needs. Be creative yet practical, and always consider the target audience and purpose.`;

        const userPrompt = `Create a detailed document template with the following requirements:

- Purpose: ${templateFormData.templatePurpose}
- Document Type: ${t(`support.template.documentTypes.${templateFormData.documentType}`)}
- Target Audience: ${t(`support.template.audienceOptions.${templateFormData.targetAudience}`)}
- Required Sections: ${getSelectedSectionsText()}
- Special Features: ${getSelectedFeaturesText()}
- Design Preferences: ${getSelectedDesignPrefsText()}

Please provide:
1. Document title and header design
2. Complete section-by-section structure with:
   - Section headers
   - Content placeholders with descriptions
   - Formatting suggestions
3. Footer design
4. Style guide (fonts, colors, spacing recommendations)
5. Usage instructions for filling in the template

Format the template in a clear, structured way that users can easily follow and customize. Use markdown formatting.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate template');
        }

        const data = await response.json();
        const template = data.choices?.[0]?.message?.content || '';
        setTemplateGeneratedTemplate(template);
      } catch (error) {
        console.error('Error generating template:', error);
        alert(t('support.template.error'));
      } finally {
        setTemplateIsGenerating(false);
      }
    };

    const handleChatSubmit = async () => {
      if (!templateChatInput.trim() || !templateGeneratedTemplate) return;

      const userMessage = templateChatInput.trim();
      setTemplateChatInput('');
      setTemplateChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
      setTemplateIsRefining(true);

      try {
        const systemPrompt = `You are an expert document template designer. The user has a document template and wants to modify it based on their feedback. Update the template according to their request while maintaining the overall structure and professionalism. Always return the complete updated template.`;

        const conversationHistory = templateChatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const userPrompt = `Current template:
${templateGeneratedTemplate}

User request: ${userMessage}

Please update the template according to the user's request and return the complete modified template.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to refine template');
        }

        const data = await response.json();
        const updatedTemplate = data.choices?.[0]?.message?.content || '';
        setTemplateGeneratedTemplate(updatedTemplate);
        setTemplateChatHistory(prev => [...prev, { role: 'assistant', content: 'Template updated successfully based on your request.' }]);
      } catch (error) {
        console.error('Error refining template:', error);
        setTemplateChatHistory(prev => [...prev, { role: 'assistant', content: t('support.template.error') }]);
      } finally {
        setTemplateIsRefining(false);
      }
    };

    const handleSaveTemplate = () => {
      if (!templateGeneratedTemplate) return;

      const templateName = prompt(t('support.template.enterTemplateName'));
      if (!templateName) return;

      const newTemplate = {
        id: `template-${Date.now()}`,
        name: templateName,
        content: templateGeneratedTemplate,
        createdAt: new Date().toISOString()
      };

      setTemplateSavedTemplates(prev => [...prev, newTemplate]);
      alert(t('support.template.templateSaved'));
    };

    const handleLoadTemplate = (template: {id: string; name: string; content: string; createdAt: string}) => {
      setTemplateGeneratedTemplate(template.content);
      setTemplateChatHistory([]);
    };

    const handleDeleteTemplate = (id: string) => {
      setTemplateSavedTemplates(prev => prev.filter(t => t.id !== id));
    };

    const handleClearConversation = () => {
      setTemplateChatHistory([]);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('support.template.title')}</h3>
          <p className="text-gray-600 mb-6">{t('support.template.description')}</p>

          {/* Template Form */}
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.template.templateInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.template.templatePurpose')}
                  </label>
                  <input
                    type="text"
                    name="templatePurpose"
                    value={templateFormData.templatePurpose}
                    onChange={handleInputChange}
                    placeholder={t('support.template.placeholder.templatePurpose')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.template.documentType')}
                  </label>
                  <select
                    name="documentType"
                    value={templateFormData.documentType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="report">{t('support.template.documentTypes.report')}</option>
                    <option value="newsletter">{t('support.template.documentTypes.newsletter')}</option>
                    <option value="announcement">{t('support.template.documentTypes.announcement')}</option>
                    <option value="minutes">{t('support.template.documentTypes.minutes')}</option>
                    <option value="proposal">{t('support.template.documentTypes.proposal')}</option>
                    <option value="certificate">{t('support.template.documentTypes.certificate')}</option>
                    <option value="invitation">{t('support.template.documentTypes.invitation')}</option>
                    <option value="bulletin">{t('support.template.documentTypes.bulletin')}</option>
                    <option value="other">{t('support.template.documentTypes.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.template.targetAudience')}
                  </label>
                  <select
                    name="targetAudience"
                    value={templateFormData.targetAudience}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="congregation">{t('support.template.audienceOptions.congregation')}</option>
                    <option value="leadership">{t('support.template.audienceOptions.leadership')}</option>
                    <option value="youth">{t('support.template.audienceOptions.youth')}</option>
                    <option value="children">{t('support.template.audienceOptions.children')}</option>
                    <option value="external">{t('support.template.audienceOptions.external')}</option>
                    <option value="general">{t('support.template.audienceOptions.general')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.template.contentSections')}
                    <span className="text-xs text-gray-500 ml-2">({t('support.template.clickToSelect')})</span>
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 mb-2">
                    <div className="flex flex-wrap gap-2">
                      {sectionOptions.map((section) => (
                        <button
                          key={section}
                          type="button"
                          onClick={() => handleSectionToggle(section)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            templateSelectedSections.includes(section)
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`support.template.sectionOptions.${section}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {templateSelectedSections.length > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      {t('support.template.selectedSections')}: {templateSelectedSections.map(s => t(`support.template.sectionOptions.${s}`)).join(', ')}
                    </p>
                  )}
                  <input
                    type="text"
                    name="contentSections"
                    value={templateFormData.contentSections}
                    onChange={handleInputChange}
                    placeholder={t('support.template.placeholder.contentSections')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('support.template.additionalSections')}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.template.specialFeatures')}
                    <span className="text-xs text-gray-500 ml-2">({t('support.template.clickToSelect')})</span>
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 mb-2">
                    <div className="flex flex-wrap gap-2">
                      {featureOptions.map((feature) => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => handleFeatureToggle(feature)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            templateSelectedFeatures.includes(feature)
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`support.template.featureOptions.${feature}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {templateSelectedFeatures.length > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      {t('support.template.selectedFeatures')}: {templateSelectedFeatures.map(f => t(`support.template.featureOptions.${f}`)).join(', ')}
                    </p>
                  )}
                  <input
                    type="text"
                    name="specialFeatures"
                    value={templateFormData.specialFeatures}
                    onChange={handleInputChange}
                    placeholder={t('support.template.placeholder.specialFeatures')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('support.template.additionalFeatures')}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support.template.designPreferences')}
                    <span className="text-xs text-gray-500 ml-2">({t('support.template.clickToSelect')})</span>
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 mb-2">
                    <div className="flex flex-wrap gap-2">
                      {designPrefOptions.map((pref) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => handleDesignPrefToggle(pref)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            templateSelectedDesignPrefs.includes(pref)
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`support.template.designPreferenceOptions.${pref}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {templateSelectedDesignPrefs.length > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      {t('support.template.selectedDesignPrefs')}: {templateSelectedDesignPrefs.map(p => t(`support.template.designPreferenceOptions.${p}`)).join(', ')}
                    </p>
                  )}
                  <input
                    type="text"
                    name="designPreferences"
                    value={templateFormData.designPreferences}
                    onChange={handleInputChange}
                    placeholder={t('support.template.placeholder.designPreferences')}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('support.template.additionalDesignPrefs')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleGenerateTemplate}
                disabled={templateIsGenerating || !templateFormData.templatePurpose}
                className="px-8"
              >
                {templateIsGenerating ? t('support.template.generating') : t('support.template.generateTemplate')}
              </Button>
            </div>
          </div>

          {/* Generated Template and Chat */}
          {templateGeneratedTemplate && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-brand-dark">{t('support.template.generatedTemplate')}</h4>
                <div className="flex space-x-2">
                  <Button variant="ghost" onClick={handleGenerateTemplate} disabled={templateIsGenerating}>
                    {t('support.template.regenerate')}
                  </Button>
                  <Button variant="ghost" onClick={handleSaveTemplate}>
                    {t('support.template.saveTemplate')}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg prose prose-sm max-w-none max-h-96 overflow-y-auto mb-6">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{templateGeneratedTemplate}</pre>
              </div>

              {/* AI Chat Interface */}
              <div className="border-t pt-6">
                <h5 className="text-md font-semibold text-brand-dark mb-4">{t('support.template.chatWithAI')}</h5>

                {/* Chat History */}
                {templateChatHistory.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">{t('support.template.conversationHistory')}</span>
                      <button
                        onClick={handleClearConversation}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        {t('support.template.clearConversation')}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {templateChatHistory.map((msg, idx) => (
                        <div key={idx} className={`text-sm p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          <span className="font-medium">{msg.role === 'user' ? 'You' : 'AI'}:</span> {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={templateChatInput}
                    onChange={(e) => setTemplateChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder={t('support.template.chatPlaceholder')}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    disabled={templateIsRefining}
                  />
                  <Button
                    onClick={handleChatSubmit}
                    disabled={templateIsRefining || !templateChatInput.trim()}
                  >
                    {templateIsRefining ? t('support.template.refining') : t('support.template.sendMessage')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Templates */}
          {templateSavedTemplates.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">{t('support.template.savedTemplates')}</h4>
              <div className="space-y-2">
                {templateSavedTemplates.map((template) => (
                  <div key={template.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-medium text-sm">{template.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        {t('support.template.loadTemplate')}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {t('support.template.deleteTemplate')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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

  if (hideHeader) {
    return (
      <div className="flex flex-col bg-gray-50 h-full">
        {/* Navigation Tabs */}
        <nav className="bg-white shadow">
          <div className="w-full px-2 sm:px-4">
            <div className="flex justify-between items-center overflow-x-auto">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('bible')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'bible'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('support.bible.tab')}
                </button>
                <button
                  onClick={() => setActiveTab('outdoor')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'outdoor'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('support.outdoor.tab')}
                </button>
                <button
                  onClick={() => setActiveTab('gathering')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'gathering'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('support.gathering.tab')}
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'documents'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('support.documents.tab')}
                </button>
                <button
                  onClick={() => setActiveTab('template')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'template'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('support.template.tab')}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow w-full px-2 py-4 sm:px-4 md:px-8 md:py-8 overflow-y-auto">
          {activeTab === 'bible' && renderBibleStudy()}
          {activeTab === 'outdoor' && renderOutdoorActivity()}
          {activeTab === 'gathering' && renderChurchGathering()}
          {activeTab === 'documents' && renderRoutineDocuments()}
          {activeTab === 'template' && renderDocumentTemplate()}
        </main>
      </div>
    );
  }

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [view, setView] = useState<ViewType>('classes');

  const handleSignIn = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setView('classes');
  };

  const renderMainContent = () => {
    switch (view) {
      case 'classes':
        return <ClassArrangement onBack={() => {}} hideHeader={true} />;
      case 'support':
        return <SupportApp onBack={() => {}} hideHeader={true} />;
      case 'rollcall':
        return <RollCall onBack={() => {}} hideHeader={true} />;
      case 'whatsapp':
        return <WhatsAppSecretary onBack={() => {}} hideHeader={true} />;
      case 'bookkeeper':
        return <WhatsAppBookkeeper onBack={() => {}} hideHeader={true} />;
      case 'documenthub':
        return <DocumentHub onBack={() => {}} hideHeader={true} />;
      case 'home':
      default:
        return (
          <div className="flex items-center justify-center h-full bg-brand-light p-8">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto mb-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-4xl font-bold text-brand-dark mb-4">Welcome, {userEmail}!</h1>
              <p className="text-gray-600 text-lg">Select a module from the sidebar to get started.</p>
            </div>
          </div>
        );
    }
  };

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return <SignInPage onSignIn={handleSignIn} />;
  }

  // Show main app with sidebar layout
  return (
    <div className="relative h-screen overflow-hidden">
      <Sidebar
        currentView={view}
        onSelectView={setView}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />
      <main className="absolute inset-0 lg:left-72 overflow-y-auto pt-16 lg:pt-0">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default App;
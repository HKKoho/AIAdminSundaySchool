import React, { useState, useEffect, useRef } from 'react';
import { ClassGroup, ClassArrangementInfo } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useArrangements } from './hooks/useArrangements';
import ClassGroupSelector from './components/ClassGroupSelector';
import Dashboard from './components/Dashboard';
import LessonPlanBuilder from './components/LessonPlanBuilder';
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

const fieldLabels: Record<keyof Omit<ClassArrangementInfo, 'id'>, string> = {
    time: '時間',
    beginningDate: '開始日期',
    duration: '時長',
    place: '地點',
    teacher: '老師',
    focusLevel: '焦點/級別',
    group: '群組',
};

const SetupModal: React.FC<SetupModalProps> = ({ classInfo, onSave, onClose }) => {
    const [formState, setFormState] = useState(classInfo);

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
                        <h2 className="text-2xl font-bold text-brand-dark">課程詳情</h2>
                        <p className="text-gray-500 mb-6">更新此課程的詳細資訊。</p>
                        
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
                        <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
                        <Button type="submit">儲存變更</Button>
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
        const password = prompt('請輸入設定密碼：');
        if (password === 'cklbckoho') {
            setIsManaging(true);
        } else if (password !== null) {
            alert('密碼不正確。');
        }
    };

    const handleAddNew = () => {
        setEditingClass({
            id: `class-${Date.now()}`,
            time: '主日 10:00 AM',
            beginningDate: '',
            duration: '1 小時',
            place: '',
            teacher: '',
            focusLevel: '',
            group: '新課程',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (classToEdit: ClassArrangementInfo) => {
        setEditingClass(classToEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (classId: string) => {
        if (window.confirm('您確定要刪除此課程嗎？')) {
            try {
                await dbDeleteArrangement(classId);
                alert('課程已成功刪除！');
            } catch (err) {
                alert('刪除課程失敗，請稍後再試。');
            }
        }
    };

    const handleSave = async (classInfo: ClassArrangementInfo) => {
        try {
            await saveArrangement(classInfo);
            setIsModalOpen(false);
            setEditingClass(null);
            alert('課程已成功儲存！');
        } catch (err) {
            alert('儲存課程失敗，請稍後再試。');
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
            alert('匯出課程失敗，請稍後再試。');
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
            alert('課程已成功匯入！');
        } catch (err) {
            alert('匯入課程失敗，請檢查檔案格式。');
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
                        <h1 className="text-2xl font-bold">課程安排</h1>
                        <p className="text-xs text-brand-light opacity-80 -mt-1">本季</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="secondary" onClick={handleManageClick}>{isManaging ? '完成管理' : '管理課程'}</Button>
                  <button onClick={onBack} className="text-sm hover:underline">返回首頁</button>
                </div>
              </div>
            </header>
            <main className="flex-grow container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-brand-dark">季度課程表</h2>
                    <div className="flex items-center space-x-2">
                        {isManaging && (
                            <>
                                <Button onClick={handleAddNew} className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    <span>新增課程</span>
                                </Button>
                                <Button onClick={handleImportClick} variant="secondary" className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                    <span>匯入</span>
                                </Button>
                                <Button onClick={handleExport} variant="secondary" className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    <span>匯出</span>
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
                        <p className="mt-4 text-gray-500">載入中...</p>
                    </div>
                )}

                {error && !useMongoDB && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                        <p className="font-medium">ℹ️ 資訊</p>
                        <p>{error}</p>
                        <p className="text-sm mt-2">資料儲存在瀏覽器本地，不會同步到雲端。若需使用雲端儲存，請在 Vercel 設定 MongoDB 環境變數。</p>
                    </div>
                )}

                {error && useMongoDB && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-medium">❌ 錯誤</p>
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
                                        <Button variant="ghost" onClick={() => handleEdit(arrangement)}>編輯</Button>
                                        <Button variant="danger" onClick={() => handleDelete(arrangement.id)}>刪除</Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : !loading ? (
                    <div className="text-center py-20 bg-brand-light rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        <h3 className="mt-4 text-xl font-medium text-brand-dark">尚未安排課程</h3>
                        <p className="mt-2 text-gray-500">點擊「管理課程」按鈕以新增第一門課程。</p>
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
                <p>&copy; {new Date().getFullYear()} 教師支援工具。版權所有。</p>
            </footer>
        </div>
    );
};

// ========== Landing Page Component ==========

interface LandingPageProps {
  onSelectView: (view: 'classes' | 'support') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectView }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-brand-dark">主日學中心</h1>
        <p className="text-xl text-gray-600 mt-4">您的教學與組織一站式資源。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card onClick={() => onSelectView('classes')} className="group text-center">
            <div className="p-6 bg-brand-primary group-hover:bg-brand-dark transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">課程</h2>
                <p className="text-gray-600 mt-2">查看及管理季度課程表與安排。</p>
            </div>
        </Card>
        <Card onClick={() => onSelectView('support')} className="group text-center">
            <div className="p-6 bg-brand-secondary group-hover:bg-yellow-600 transition-colors duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div className="p-8">
                <h2 className="text-3xl font-bold text-brand-dark">教師支援</h2>
                <p className="text-gray-600 mt-2">AI 驅動的課程計畫、創意生成及資源。</p>
            </div>
        </Card>
      </div>
      <footer className="absolute bottom-0 text-center p-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} 教師支援工具。版權所有。</p>
      </footer>
    </div>
  );
};


// ========== Support App Component (Original App) ==========

type SupportView = 'selector' | 'dashboard' | 'builder';

const SupportApp: React.FC = () => {
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
                <h1 className="text-2xl font-bold">主日學教師支援</h1>
                <p className="text-xs text-brand-light opacity-80 -mt-1">針對東亞及東南亞地區 (2026)</p>
            </div>
        </div>
        {selectedGroup && (
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block bg-brand-accent text-brand-dark px-3 py-1 rounded-full text-sm font-semibold">{selectedGroup}</span>
            <button onClick={handleResetGroup} className="text-sm hover:underline">更換群組</button>
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
        <p>&copy; {new Date().getFullYear()} 教師支援工具。版權所有。</p>
      </footer>
    </div>
  );
};


// ========== Main App Router ==========

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'classes' | 'support'>('landing');

  const renderContent = () => {
    switch (view) {
      case 'classes':
        return <ClassArrangement onBack={() => setView('landing')} />;
      case 'support':
        return <SupportApp />;
      case 'landing':
      default:
        return <LandingPage onSelectView={setView} />;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
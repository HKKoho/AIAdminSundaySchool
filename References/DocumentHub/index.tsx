import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// --- I18n & Translations ---
const translations = {
  en: {
    appTitle: 'Church Document Hub',
    uploadNewDocument: '▼ Upload New Document',
    closeUploadForm: '▲ Close Upload Form',
    filterDocuments: 'Filter Documents',
    searchPlaceholder: 'Search by title...',
    department: 'Department',
    ministry: 'Ministry',
    documentType: 'Document Type',
    year: 'Year',
    status: 'Status',
    clearFilters: 'Clear Filters',
    uploadDocument: 'Upload Document',
    documentTitle: 'Document Title',
    file: 'File',
    uploadButton: 'Upload Document',
    formError: 'Please provide a title and select a file.',
    noDocumentsFound: 'No documents found. Try adjusting your filters or uploading a new document.',
    type: 'Type',
    uploaded: 'Uploaded',
    languageToggle: '中文',
    loginTitle: 'Login to Document Hub',
    selectRole: 'Select Your Role',
    password: 'Password',
    loginButton: 'Login',
    loginError: 'Invalid password. Please try again.',
    logout: 'Logout',
    loggedInAs: 'Logged in as',
  },
  zh: {
    appTitle: '茶果嶺浸信會文件中心',
    uploadNewDocument: '▼ 上傳新文件',
    closeUploadForm: '▲ 關閉上傳表單',
    filterDocuments: '篩選文件',
    searchPlaceholder: '按標題搜索...',
    department: '部門',
    ministry: '事工',
    documentType: '文件類型',
    year: '年份',
    status: '狀態',
    clearFilters: '清除篩選',
    uploadDocument: '上傳文件',
    documentTitle: '文件標題',
    file: '檔案',
    uploadButton: '上傳文件',
    formError: '請提供標題並選擇一個文件。',
    noDocumentsFound: '找不到任何文件。請嘗試調整篩選條件或上傳新文件。',
    type: '類型',
    uploaded: '上傳於',
    languageToggle: 'English',
    loginTitle: '登入文件中心',
    selectRole: '選擇您的角色',
    password: '密碼',
    loginButton: '登入',
    loginError: '密碼錯誤，請重試。',
    logout: '登出',
    loggedInAs: '登入身份',
  },
};

// --- User Roles and Authentication ---
interface UserRole {
  id: string;
  name: string;
  password: string;
  type: 'pastoral' | 'deacon' | 'ministry';
}

const USER_ROLES: UserRole[] = [
  { id: 'pastoral', name: 'Pastoral', password: 'pastoral123', type: 'pastoral' },
  { id: 'deacon', name: 'Deacon', password: 'deacon123', type: 'deacon' },
  { id: 'exec_committee', name: 'Executive Committee', password: 'exec123', type: 'ministry' },
  { id: 'missions', name: 'Missions Department', password: 'missions123', type: 'ministry' },
  { id: 'nurture_education', name: 'Nurture & Education Department', password: 'nurture123', type: 'ministry' },
  { id: 'pastoral_adult', name: 'Pastoral Department (Adult Zone)', password: 'adult123', type: 'ministry' },
  { id: 'pastoral_youth', name: 'Pastoral Department (Youth Zone)', password: 'youth123', type: 'ministry' },
  { id: 'pastoral_children', name: 'Pastoral Department (Children Zone)', password: 'children123', type: 'ministry' },
  { id: 'admin_resources', name: 'Admin & Resources Department', password: 'admin123', type: 'ministry' },
  { id: 'worship', name: 'Worship Department', password: 'worship123', type: 'ministry' },
];

const DEPARTMENTS = ['Executive Committee', 'Missions Department', 'Nurture & Education Department', 'Pastoral Department (Adult Zone)', 'Pastoral Department (Youth Zone)', 'Pastoral Department (Children Zone)', 'Admin & Resources Department', 'Worship Department'];
const MINISTRIES = ['General', 'Short-term Mission', 'English Class', 'Cha Kwo Ling Community', 'Mommy\'s Group', 'Homework Class', 'Shared Space'];
const DOC_TYPES = ['Meeting Minutes', 'Annual Plan', 'Project Plan', 'Budget Report', 'Event Proposal'];
const STATUSES = ['Draft', 'Final', 'For Review'];
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const translationsMap = {
  departments: {
    'Executive Committee': '事工委員會',
    'Missions Department': '宣教部',
    'Nurture & Education Department': '培育部',
    'Pastoral Department (Adult Zone)': '牧養部成人牧區',
    'Pastoral Department (Youth Zone)': '牧養部青少年牧區',
    'Pastoral Department (Children Zone)': '牧養部兒童牧區',
    'Admin & Resources Department': '行政資源部',
    'Worship Department': '敬拜部',
  },
  ministries: {
    'General': '一般',
    'Short-term Mission': '短宣',
    'English Class': '英文班',
    'Cha Kwo Ling Community': '茶果嶺社區',
    'Mommy\'s Group': '媽咪小組',
    'Homework Class': '功課班',
    'Shared Space': '共享空間',
  },
  docTypes: {
    'Meeting Minutes': '會議記錄',
    'Annual Plan': '年度計劃',
    'Project Plan': '項目計劃',
    'Budget Report': '預算報告',
    'Event Proposal': '活動提案',
  },
  statuses: {
    'Draft': '草稿',
    'Final': '最終版',
    'For Review': '審核中',
  },
};

const titleTranslations = {
    'Executive Committee Meeting Minutes': '事委會議事記錄',
    'Pastoral Dept. (Children) 2024 Annual Plan': '牧養部兒童牧區2024年度計劃',
    'Monthly Financial Report': '月會財務報表',
    'Short-term Mission Proposal': '茶果嶺區活動預算',
};


// --- Helper Data & Types ---
interface Document {
  id: string;
  title: string;
  file: File;
  department: string;
  ministry: string;
  docType: string;
  year: number;
  status: string;
  uploadDate: Date;
  uploadedBy: string; // User role ID who uploaded the document
}

interface Filters {
  searchTerm: string;
  department: string;
  ministry: string;
  docType: string;
  year: string;
  status: string;
}

type Language = 'en' | 'zh';

// --- Authentication Context ---
interface AuthContextType {
  user: UserRole | null;
  login: (roleId: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRole | null>(() => {
    const savedUser = localStorage.getItem('documenthub_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (roleId: string, password: string): boolean => {
    const role = USER_ROLES.find(r => r.id === roleId && r.password === password);
    if (role) {
      const userWithoutPassword = { ...role, password: '' }; // Don't store password
      setUser(userWithoutPassword);
      localStorage.setItem('documenthub_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('documenthub_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Login Component ---
const LoginPage: React.FC<{ language: Language; setLanguage: (lang: Language) => void }> = ({ language, setLanguage }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(USER_ROLES[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const t = (key: keyof (typeof translations)['en']) => translations[language][key];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(selectedRole, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError(t('loginError'));
      setPassword('');
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>{t('loginTitle')}</h1>
            <button onClick={() => setLanguage(lang => lang === 'en' ? 'zh' : 'en')} className="lang-toggle">
              {t('languageToggle')}
            </button>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="role">{t('selectRole')}</label>
              <select
                id="role"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="login-select"
              >
                {USER_ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>
            <button type="submit" className="login-button">{t('loginButton')}</button>
          </form>
          <div className="login-hint">
            <p style={{ fontSize: '0.85rem', color: '#708090', marginTop: '1.5rem', textAlign: 'center' }}>
              Demo passwords: pastoral123, deacon123, exec123, missions123, etc.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Protected Route Component ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// --- Main App Component ---
const Dashboard: React.FC<{ language: Language; setLanguage: (lang: Language) => void }> = ({ language, setLanguage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    department: 'All',
    ministry: 'All',
    docType: 'All',
    year: 'All',
    status: 'All',
  });
  const [isUploading, setIsUploading] = useState(false);

  const t = (key: keyof (typeof translations)['en']) => translations[language][key];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getTranslatedValue = (category: keyof typeof translationsMap, value: string) => {
    if (language === 'zh' && translationsMap[category][value]) {
      return translationsMap[category][value];
    }
    return value;
  };

  const getTranslatedDocTitle = (title: string) => {
      if (language === 'zh' && titleTranslations[title]) {
        return titleTranslations[title];
      }
      const reverseTitleMap = Object.entries(titleTranslations).find(([_, val]) => val === title);
      if (language === 'en' && reverseTitleMap) {
        return reverseTitleMap[0];
      }
      return title;
  };

  const handleAddDocument = (doc: Omit<Document, 'id' | 'uploadDate' | 'uploadedBy'>) => {
    const newDocument: Document = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadDate: new Date(),
      uploadedBy: user?.id || 'unknown',
    };
    setDocuments(prevDocs => [newDocument, ...prevDocs]);
    setIsUploading(false); // Close form after submission
  };

  const filteredDocuments = useMemo(() => {
    const { searchTerm, department, ministry, docType, year, status } = filters;

    let filtered = documents.filter(doc => (
      (department === 'All' || doc.department === department) &&
      (ministry === 'All' || doc.ministry === ministry) &&
      (docType === 'All' || doc.docType === docType) &&
      (year === 'All' || doc.year === parseInt(year)) &&
      (status === 'All' || doc.status === status)
    ));

    if (!searchTerm.trim()) {
      // Default sort by date if no search term
      return filtered.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return filtered
      .map(doc => {
        let relevanceScore = 0;
        // Use translated values for scoring to match what the user sees
        const title = getTranslatedDocTitle(doc.title).toLowerCase();
        const type = getTranslatedValue('docTypes', doc.docType).toLowerCase();
        const dept = getTranslatedValue('departments', doc.department).toLowerCase();

        if (title.includes(lowerCaseSearchTerm)) {
          relevanceScore += 3; // Title match is most important
        }
        if (type.includes(lowerCaseSearchTerm)) {
          relevanceScore += 2; // Document type match
        }
        if (dept.includes(lowerCaseSearchTerm)) {
          relevanceScore += 1; // Department match
        }
        
        return { ...doc, relevanceScore };
      })
      .filter(doc => doc.relevanceScore > 0) // Filter out non-matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance

  }, [documents, filters, language]);
  
  // Add some initial dummy data for demonstration
  useEffect(() => {
    const dummyFile = new File(["dummy content"], "dummy.txt", { type: "text/plain" });
    const initialDocs: Document[] = [
        { id: '1', title: 'Executive Committee Meeting Minutes', file: dummyFile, department: 'Executive Committee', ministry: 'General', docType: 'Meeting Minutes', year: 2023, status: 'Final', uploadDate: new Date('2023-03-15'), uploadedBy: 'exec_committee' },
        { id: '2', title: 'Pastoral Dept. (Children) 2024 Annual Plan', file: dummyFile, department: 'Pastoral Department (Children Zone)', ministry: 'General', docType: 'Annual Plan', year: 2024, status: 'Draft', uploadDate: new Date('2024-01-20'), uploadedBy: 'pastoral_children' },
        { id: '3', title: 'Monthly Financial Report', file: dummyFile, department: 'Admin & Resources Department', ministry: 'General', docType: 'Budget Report', year: 2023, status: 'For Review', uploadDate: new Date('2023-11-05'), uploadedBy: 'admin_resources' },
        { id: '4', title: 'Short-term Mission Proposal', file: dummyFile, department: 'Missions Department', ministry: 'Short-term Mission', docType: 'Event Proposal', year: 2024, status: 'Draft', uploadDate: new Date('2024-05-10'), uploadedBy: 'missions' },
    ];
    setDocuments(initialDocs);
  }, []);


  return (
    <>
      <style>{STYLES}</style>
      <div className="app-container">
        <header className="app-header">
          <h1>{t('appTitle')}</h1>
          <div className="header-actions">
            <span className="user-info">{t('loggedInAs')}: <strong>{user?.name}</strong></span>
            <button onClick={() => setLanguage(lang => lang === 'en' ? 'zh' : 'en')} className="lang-toggle">
              {t('languageToggle')}
            </button>
            <button onClick={handleLogout} className="logout-btn">{t('logout')}</button>
          </div>
        </header>
        <main className="app-main">
          <aside className="left-panel">
            <ControlPanel 
              filters={filters} 
              setFilters={setFilters} 
              onAddDocument={handleAddDocument}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              t={t}
              getTranslatedValue={getTranslatedValue}
            />
          </aside>
          <section className="right-panel">
            <DocumentList documents={filteredDocuments} t={t} getTranslatedValue={getTranslatedValue} getTranslatedDocTitle={getTranslatedDocTitle} />
          </section>
        </main>
      </div>
    </>
  );
};

// --- Control Panel Component ---
interface ControlPanelProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onAddDocument: (doc: Omit<Document, 'id' | 'uploadDate'>) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  t: (key: keyof (typeof translations)['en']) => string;
  getTranslatedValue: (category: keyof typeof translationsMap, value: string) => string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ filters, setFilters, onAddDocument, isUploading, setIsUploading, t, getTranslatedValue }) => {
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      department: 'All',
      ministry: 'All',
      docType: 'All',
      year: 'All',
      status: 'All',
    });
  };

  return (
    <div className="control-panel">
      <button className="upload-toggle-btn" onClick={() => setIsUploading(!isUploading)}>
        {isUploading ? t('closeUploadForm') : t('uploadNewDocument')}
      </button>
      {isUploading && <UploadForm onAddDocument={onAddDocument} t={t} getTranslatedValue={getTranslatedValue} />}
      
      <div className="filters-section">
        <h2>{t('filterDocuments')}</h2>
        <input
          type="text"
          name="searchTerm"
          placeholder={t('searchPlaceholder')}
          value={filters.searchTerm}
          onChange={handleFilterChange}
          className="filter-input"
          aria-label={t('searchPlaceholder')}
        />
        <FilterDropdown label={t('department')} name="department" value={filters.department} options={DEPARTMENTS} onChange={handleFilterChange} getTranslatedValue={(val) => getTranslatedValue('departments', val)} />
        <FilterDropdown label={t('ministry')} name="ministry" value={filters.ministry} options={MINISTRIES} onChange={handleFilterChange} getTranslatedValue={(val) => getTranslatedValue('ministries', val)} />
        <FilterDropdown label={t('documentType')} name="docType" value={filters.docType} options={DOC_TYPES} onChange={handleFilterChange} getTranslatedValue={(val) => getTranslatedValue('docTypes', val)} />
        <FilterDropdown label={t('year')} name="year" value={filters.year} options={YEARS.map(String)} onChange={handleFilterChange} getTranslatedValue={(val) => val} />
        <FilterDropdown label={t('status')} name="status" value={filters.status} options={STATUSES} onChange={handleFilterChange} getTranslatedValue={(val) => getTranslatedValue('statuses', val)} />
        <button onClick={clearFilters} className="clear-filters-btn">{t('clearFilters')}</button>
      </div>
    </div>
  );
};

// --- Upload Form Component ---
interface UploadFormProps {
    onAddDocument: (doc: Omit<Document, 'id' | 'uploadDate' | 'uploadedBy'>) => void;
    t: (key: keyof (typeof translations)['en']) => string;
    getTranslatedValue: (category: keyof typeof translationsMap, value: string) => string;
}

const UploadForm: React.FC<UploadFormProps> = ({ onAddDocument, t, getTranslatedValue }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [ministry, setMinistry] = useState(MINISTRIES[0]);
    const [docType, setDocType] = useState(DOC_TYPES[0]);
    const [year, setYear] = useState(YEARS[0]);
    const [status, setStatus] = useState(STATUSES[0]);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) {
            setError(t('formError'));
            return;
        }
        onAddDocument({ title, file, department, ministry, docType, year, status });
        // Reset form
        setTitle('');
        setFile(null);
        setError('');
        (e.target as HTMLFormElement).reset();
    };

    return (
        <form onSubmit={handleSubmit} className="upload-form">
            <h2>{t('uploadDocument')}</h2>
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
                <label htmlFor="title">{t('documentTitle')}</label>
                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="file">{t('file')}</label>
                <input id="file" type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required />
            </div>
            <div className="form-group">
                <label htmlFor="department">{t('department')}</label>
                <select id="department" value={department} onChange={e => setDepartment(e.target.value)} required>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{getTranslatedValue('departments', d)}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="ministry">{t('ministry')}</label>
                <select id="ministry" value={ministry} onChange={e => setMinistry(e.target.value)} required>
                    {MINISTRIES.map(m => <option key={m} value={m}>{getTranslatedValue('ministries', m)}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="docType">{t('documentType')}</label>
                <select id="docType" value={docType} onChange={e => setDocType(e.target.value)} required>
                    {DOC_TYPES.map(type => <option key={type} value={type}>{getTranslatedValue('docTypes', type)}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="year">{t('year')}</label>
                <select id="year" value={year} onChange={e => setYear(parseInt(e.target.value))} required>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>{t('status')}</label>
                <div className="radio-group">
                {STATUSES.map(s => (
                    <label key={s}>
                        <input type="radio" name="status" value={s} checked={status === s} onChange={e => setStatus(e.target.value)} />
                        {getTranslatedValue('statuses', s)}
                    </label>
                ))}
                </div>
            </div>
            <button type="submit" className="submit-btn">{t('uploadButton')}</button>
        </form>
    );
};


// --- Document List Component ---
interface DocumentListProps {
  documents: Document[];
  t: (key: keyof (typeof translations)['en']) => string;
  getTranslatedValue: (category: keyof typeof translationsMap, value: string) => string;
  getTranslatedDocTitle: (title: string) => string;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, t, getTranslatedValue, getTranslatedDocTitle }) => {
  if (documents.length === 0) {
    return <div className="empty-state">{t('noDocumentsFound')}</div>;
  }

  return (
    <div className="document-list">
      {documents.map(doc => <DocumentCard key={doc.id} document={doc} t={t} getTranslatedValue={getTranslatedValue} getTranslatedDocTitle={getTranslatedDocTitle}/>)}
    </div>
  );
};

// --- Document Card Component ---
interface DocumentCardProps {
  document: Document;
  t: (key: keyof (typeof translations)['en']) => string;
  getTranslatedValue: (category: keyof typeof translationsMap, value: string) => string;
  getTranslatedDocTitle: (title: string) => string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, t, getTranslatedValue, getTranslatedDocTitle }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Final': return '#4CAF50';
            case 'For Review': return '#FFC107';
            case 'Draft': return '#03A9F4';
            default: return '#9E9E9E';
        }
    };

    return (
    <article className="document-card" aria-labelledby={`doc-title-${document.id}`}>
      <h3 id={`doc-title-${document.id}`}>{getTranslatedDocTitle(document.title)}</h3>
      <div className="doc-meta">
        <span className="meta-item"><strong>{t('department')}:</strong> {getTranslatedValue('departments', document.department)}</span>
        <span className="meta-item"><strong>{t('ministry')}:</strong> {getTranslatedValue('ministries', document.ministry)}</span>
        <span className="meta-item"><strong>{t('type')}:</strong> {getTranslatedValue('docTypes', document.docType)}</span>
        <span className="meta-item"><strong>{t('year')}:</strong> {document.year}</span>
      </div>
       <div className="doc-footer">
          <span className="tag" style={{ backgroundColor: getStatusColor(document.status) }}>{getTranslatedValue('statuses', document.status)}</span>
          <span className="upload-date">{t('uploaded')}: {document.uploadDate.toLocaleDateString()}</span>
       </div>
    </article>
  );
};


// --- Filter Dropdown Component ---
interface FilterDropdownProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  getTranslatedValue: (value: string) => string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, name, value, options, onChange, getTranslatedValue }) => (
  <div className="filter-group">
    <label htmlFor={name}>{label}</label>
    <select id={name} name={name} value={value} onChange={onChange}>
      <option value="All">{name === 'year' ? 'All' : label}</option>
      {options.map(option => <option key={option} value={option}>{getTranslatedValue(option)}</option>)}
    </select>
  </div>
);


// --- Styles ---
const STYLES = `
:root {
  --primary-bg: #f4f7f9;
  --secondary-bg: #ffffff;
  --primary-text: #334e68;
  --secondary-text: #708090;
  --primary-accent: #336699;
  --primary-accent-hover: #29527a;
  --border-color: #d8e2e7;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  --border-radius: 8px;
  --font-family: 'Inter', sans-serif;
}

body {
  margin: 0;
  font-family: var(--font-family);
  background-color: var(--primary-bg);
  color: var(--primary-text);
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--primary-accent);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-weight: 600;
  font-size: 1.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  font-size: 0.95rem;
  color: white;
}

.lang-toggle, .logout-btn {
    background: transparent;
    border: 1px solid white;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;
}

.lang-toggle:hover, .logout-btn:hover {
    background-color: white;
    color: var(--primary-accent);
}

.logout-btn {
  background-color: rgba(231, 76, 60, 0.8);
  border-color: white;
}

.logout-btn:hover {
  background-color: #e74c3c;
  color: white;
}

.app-main {
  display: flex;
  flex: 1;
  padding: 1.5rem;
  gap: 1.5rem;
}

.left-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--secondary-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  height: fit-content;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.control-panel h2 {
    font-size: 1.2rem;
    color: var(--primary-accent);
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 0.5rem;
}

.upload-toggle-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--primary-accent);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    margin-bottom: 1rem;
}

.upload-toggle-btn:hover {
    background-color: var(--primary-accent-hover);
}

.upload-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin-bottom: 1.5rem;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.upload-form h2 {
    margin-top: 0;
    font-size: 1.2rem;
    color: var(--primary-accent);
    text-align: center;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-weight: 500;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.95rem;
}

.radio-group {
    display: flex;
    gap: 1rem;
    align-items: center;
}
.radio-group label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 400;
}


.filter-input,
.filter-group select {
    width: 100%;
    padding: 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    margin-bottom: 1rem;
}

.filter-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
    font-size: 0.9rem;
}

.clear-filters-btn, .submit-btn {
    width: 100%;
    padding: 0.75rem;
    border-radius: var(--border-radius);
    border: none;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.clear-filters-btn {
    background-color: #e74c3c;
    color: white;
}
.clear-filters-btn:hover {
    background-color: #c0392b;
}

.submit-btn {
    background-color: #2ecc71;
    color: white;
    margin-top: 0.5rem;
}
.submit-btn:hover {
    background-color: #27ae60;
}

.error-message {
    color: #e74c3c;
    background-color: #fadbd8;
    border: 1px solid #f5b7b1;
    border-radius: 4px;
    padding: 0.5rem;
    text-align: center;
}


.document-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.document-card {
  background: var(--secondary-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  border-left: 5px solid var(--primary-accent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.document-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0,0,0,0.08);
}

.document-card h3 {
  margin-top: 0;
  font-size: 1.15rem;
  color: var(--primary-text);
}

.doc-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
    font-size: 0.9rem;
    color: var(--secondary-text);
}

.meta-item strong {
    color: var(--primary-text);
}

.doc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    font-size: 0.85rem;
}

.tag {
    color: white;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-weight: 500;
}

.upload-date {
    color: var(--secondary-text);
}


.empty-state {
  text-align: center;
  padding: 4rem;
  background: var(--secondary-bg);
  border-radius: var(--border-radius);
  color: var(--secondary-text);
  font-size: 1.1rem;
}

@media (max-width: 850px) {
  .app-header h1 {
    font-size: 1.25rem;
  }
  .header-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .user-info {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .app-main {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    height: auto;
  }
  .document-list {
     grid-template-columns: 1fr;
  }
}

/* Login Page Styles */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-accent) 0%, #5a8ab8 100%);
  padding: 1rem;
}

.login-box {
  background: var(--secondary-bg);
  border-radius: var(--border-radius);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--primary-accent);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-select, .login-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.login-select:focus, .login-input:focus {
  outline: none;
  border-color: var(--primary-accent);
}

.login-button {
  width: 100%;
  padding: 0.9rem;
  background-color: var(--primary-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-button:hover {
  background-color: var(--primary-accent-hover);
}

.login-hint {
  margin-top: 1rem;
  text-align: center;
}

@media (max-width: 500px) {
  .login-box {
    padding: 1.5rem;
  }
  .login-header h1 {
    font-size: 1.4rem;
  }
}
`;


// --- Main App Wrapper with Router ---
const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage language={language} setLanguage={setLanguage} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard language={language} setLanguage={setLanguage} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

// --- Render App ---
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Card from './common/Card';
import Button from './common/Button';
import LanguageSwitcher from './LanguageSwitcher';

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
  uploadedBy: string;
}

interface Filters {
  searchTerm: string;
  department: string;
  ministry: string;
  docType: string;
  year: string;
  status: string;
}

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
      const userWithoutPassword = { ...role, password: '' };
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
const LoginPage: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation('documenthub');
  const [selectedRole, setSelectedRole] = useState(USER_ROLES[0].id);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(selectedRole, password);
    if (success) {
      onLoginSuccess();
    } else {
      setError(t('loginError'));
      setPassword('');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      {/* Language Switcher in top-right corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* App Title - Bilingual */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {i18n.language === 'en' ? 'Document Hub' : '文檔中心'}
          </h1>
          <h2 className="text-2xl font-medium text-gray-600 mb-3">
            {i18n.language === 'en' ? '文檔中心' : 'Document Hub'}
          </h2>
          <p className="text-gray-600">{t('loginTitle')}</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectRole')}
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {USER_ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {t(`roles.${role.name}`) !== `roles.${role.name}` ? t(`roles.${role.name}`) : role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{t('rememberMe')}</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                {t('forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors shadow-sm hover:shadow-md"
            >
              {t('loginButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors shadow-sm">
              {t('createAccount')}
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
            {t('demoPasswordHint')}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation('documenthub');
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
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const getTranslation = (key: string, enValue: string) => {
    if (i18n.language === 'zh-TW' && t(key) !== key) {
      return t(key);
    }
    return enValue;
  };

  const getTranslatedDocTitle = (title: string) => {
    const titleKey = `titles.${title.replace(/[^a-zA-Z0-9]/g, '_')}`;
    if (i18n.language === 'zh-TW' && t(titleKey) !== titleKey) {
      return t(titleKey);
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
    setIsUploading(false);
  };

  const handleLogout = () => {
    logout();
    setLogoutConfirm(false);
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
      return filtered.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return filtered
      .map(doc => {
        let relevanceScore = 0;
        const title = getTranslatedDocTitle(doc.title).toLowerCase();
        const type = doc.docType.toLowerCase();
        const dept = doc.department.toLowerCase();

        if (title.includes(lowerCaseSearchTerm)) relevanceScore += 3;
        if (type.includes(lowerCaseSearchTerm)) relevanceScore += 2;
        if (dept.includes(lowerCaseSearchTerm)) relevanceScore += 1;

        return { ...doc, relevanceScore };
      })
      .filter(doc => (doc as any).relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

  }, [documents, filters, i18n.language]);

  // Add some initial dummy data
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
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-80 flex-shrink-0">
        <Card className="p-6">
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm text-gray-600">{t('loggedInAs')}</p>
            <p className="font-semibold text-brand-dark">{user?.name}</p>
            <Button
              onClick={() => setLogoutConfirm(true)}
              variant="ghost"
              className="mt-2 w-full text-sm"
            >
              {t('logout')}
            </Button>
          </div>

          <button
            onClick={() => setIsUploading(!isUploading)}
            className="w-full bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors mb-4"
          >
            {isUploading ? t('closeUploadForm') : t('uploadNewDocument')}
          </button>

          {isUploading && <UploadForm onAddDocument={handleAddDocument} t={t} getTranslation={getTranslation} />}

          <div className="mt-6">
            <h2 className="font-bold text-lg text-brand-dark mb-4">{t('filterDocuments')}</h2>
            <ControlPanel
              filters={filters}
              setFilters={setFilters}
              t={t}
              getTranslation={getTranslation}
            />
          </div>
        </Card>
      </aside>

      <section className="flex-1">
        <DocumentList
          documents={filteredDocuments}
          t={t}
          getTranslation={getTranslation}
          getTranslatedDocTitle={getTranslatedDocTitle}
        />
      </section>

      {logoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setLogoutConfirm(false)}>
          <Card className="max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{t('logoutConfirm')}</h3>
              <div className="flex space-x-3">
                <Button onClick={handleLogout} variant="danger" className="flex-1">{t('logout')}</Button>
                <Button onClick={() => setLogoutConfirm(false)} variant="ghost" className="flex-1">{t('cancel')}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- Control Panel Component ---
interface ControlPanelProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  t: (key: string) => string;
  getTranslation: (key: string, enValue: string) => string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ filters, setFilters, t, getTranslation }) => {
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
    <div className="space-y-4">
      <input
        type="text"
        name="searchTerm"
        placeholder={t('searchPlaceholder')}
        value={filters.searchTerm}
        onChange={handleFilterChange}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />

      <FilterDropdown
        label={t('department')}
        name="department"
        value={filters.department}
        options={DEPARTMENTS}
        onChange={handleFilterChange}
        getTranslation={(val) => val === 'All' ? t('department') : getTranslation(`departments.${val}`, val)}
      />
      <FilterDropdown
        label={t('ministry')}
        name="ministry"
        value={filters.ministry}
        options={MINISTRIES}
        onChange={handleFilterChange}
        getTranslation={(val) => val === 'All' ? t('ministry') : getTranslation(`ministries.${val}`, val)}
      />
      <FilterDropdown
        label={t('documentType')}
        name="docType"
        value={filters.docType}
        options={DOC_TYPES}
        onChange={handleFilterChange}
        getTranslation={(val) => val === 'All' ? t('documentType') : getTranslation(`docTypes.${val}`, val)}
      />
      <FilterDropdown
        label={t('year')}
        name="year"
        value={filters.year}
        options={YEARS.map(String)}
        onChange={handleFilterChange}
        getTranslation={(val) => val}
      />
      <FilterDropdown
        label={t('status')}
        name="status"
        value={filters.status}
        options={STATUSES}
        onChange={handleFilterChange}
        getTranslation={(val) => val === 'All' ? t('status') : getTranslation(`statuses.${val}`, val)}
      />

      <Button onClick={clearFilters} variant="danger" className="w-full text-sm">
        {t('clearFilters')}
      </Button>
    </div>
  );
};

// --- Upload Form Component ---
interface UploadFormProps {
    onAddDocument: (doc: Omit<Document, 'id' | 'uploadDate' | 'uploadedBy'>) => void;
    t: (key: string) => string;
    getTranslation: (key: string, enValue: string) => string;
}

const UploadForm: React.FC<UploadFormProps> = ({ onAddDocument, t, getTranslation }) => {
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
        setTitle('');
        setFile(null);
        setError('');
        (e.target as HTMLFormElement).reset();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-brand-dark">{t('uploadDocument')}</h3>
            {error && <p className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded">{error}</p>}

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('documentTitle')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('file')}</label>
                <input
                  type="file"
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm"
                  required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('department')}</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{getTranslation(`departments.${d}`, d)}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('ministry')}</label>
                <select
                  value={ministry}
                  onChange={e => setMinistry(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    {MINISTRIES.map(m => (
                      <option key={m} value={m}>{getTranslation(`ministries.${m}`, m)}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('documentType')}</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    {DOC_TYPES.map(type => (
                      <option key={type} value={type}>{getTranslation(`docTypes.${type}`, type)}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('year')}</label>
                <select
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('status')}</label>
                <div className="flex gap-3 text-sm">
                {STATUSES.map(s => (
                    <label key={s} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={status === s}
                          onChange={e => setStatus(e.target.value)}
                        />
                        <span>{getTranslation(`statuses.${s}`, s)}</span>
                    </label>
                ))}
                </div>
            </div>

            <Button type="submit" className="w-full text-sm">
              {t('uploadButton')}
            </Button>
        </form>
    );
};

// --- Document List Component ---
interface DocumentListProps {
  documents: Document[];
  t: (key: string) => string;
  getTranslation: (key: string, enValue: string) => string;
  getTranslatedDocTitle: (title: string) => string;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, t, getTranslation, getTranslatedDocTitle }) => {
  if (documents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500">{t('noDocumentsFound')}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {documents.map(doc => (
        <DocumentCard
          key={doc.id}
          document={doc}
          t={t}
          getTranslation={getTranslation}
          getTranslatedDocTitle={getTranslatedDocTitle}
        />
      ))}
    </div>
  );
};

// --- Document Card Component ---
interface DocumentCardProps {
  document: Document;
  t: (key: string) => string;
  getTranslation: (key: string, enValue: string) => string;
  getTranslatedDocTitle: (title: string) => string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, t, getTranslation, getTranslatedDocTitle }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Final': return 'bg-green-500';
            case 'For Review': return 'bg-yellow-500';
            case 'Draft': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-4 border-l-4 border-brand-primary">
        <h3 className="font-bold text-brand-dark mb-3">{getTranslatedDocTitle(document.title)}</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <p><span className="font-semibold">{t('department')}:</span> {getTranslation(`departments.${document.department}`, document.department)}</p>
          <p><span className="font-semibold">{t('ministry')}:</span> {getTranslation(`ministries.${document.ministry}`, document.ministry)}</p>
          <p><span className="font-semibold">{t('type')}:</span> {getTranslation(`docTypes.${document.docType}`, document.docType)}</p>
          <p><span className="font-semibold">{t('year')}:</span> {document.year}</p>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t">
          <span className={`${getStatusColor(document.status)} text-white px-2 py-1 rounded text-xs font-medium`}>
            {getTranslation(`statuses.${document.status}`, document.status)}
          </span>
          <span className="text-xs text-gray-500">{t('uploaded')}: {document.uploadDate.toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
};

// --- Filter Dropdown Component ---
interface FilterDropdownProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  getTranslation: (value: string) => string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, name, value, options, onChange, getTranslation }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
    >
      <option value="All">{label}</option>
      {options.map(option => (
        <option key={option} value={option}>{getTranslation(option)}</option>
      ))}
    </select>
  </div>
);

// --- Main Document Hub Component ---
interface DocumentHubProps {
  onBack: () => void;
  hideHeader?: boolean;
}

const DocumentHub: React.FC<DocumentHubProps> = ({ onBack, hideHeader = false }) => {
  const { t } = useTranslation('documenthub');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AuthProvider>
      <DocumentHubContent onBack={onBack} hideHeader={hideHeader} isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
    </AuthProvider>
  );
};

const DocumentHubContent: React.FC<{
  onBack: () => void;
  hideHeader: boolean;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
}> = ({ onBack, hideHeader, isAuthenticated, setIsAuthenticated }) => {
  const { user } = useAuth();
  const { t } = useTranslation('documenthub');

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user, setIsAuthenticated]);

  if (hideHeader) {
    return (
      <div className="w-full lg:max-w-7xl lg:mx-auto px-2 py-4 sm:px-4 md:px-8 md:py-8">
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        ) : (
          <Dashboard />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <header className="bg-pink-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">{t('appTitle')}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button onClick={onBack} className="text-sm hover:underline">{t('backToHome')}</button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        ) : (
          <Dashboard />
        )}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>{t('copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default DocumentHub;

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import Card from './common/Card';
import Button from './common/Button';
import { Alert, AlertDescription } from './common/Alert';

type AnalysisCategory = 'worship' | 'lordsupper' | 'calendar';

interface AnalysisChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AnalysisSuggestion {
  id: string;
  title: string;
  description: string;
  analysisType: string;
}

interface Member {
  id: string;
  name: string;
}

interface AttendanceRecord {
  present: boolean;
  timestamp: string;
}

interface AttendanceState {
  [memberId: string]: AttendanceRecord;
}

const STORAGE_KEY = 'rollCallSystemTemp';

type RollCallTab = 'rollcall' | 'worship' | 'lordsupper' | 'calendar' | 'analysis' | 'analysepast' | 'survey';
type EventType = 'worship' | 'lordsupper' | 'christmaseve' | 'easterfriday' | 'eastersunday';

const RollCallSystem: React.FC = () => {
  const { t } = useTranslation('rollCall');

  // Tab state
  const [activeTab, setActiveTab] = useState<RollCallTab>('rollcall');

  // Event type state for roll call
  const [eventType, setEventType] = useState<EventType>('worship');

  // QR Code state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [googleFormUrl, setGoogleFormUrl] = useState<string>('https://forms.gle/example');

  // Initialize state variables
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [newName, setNewName] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [countdown, setCountdown] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRecoveryAlert, setShowRecoveryAlert] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [savedRecords, setSavedRecords] = useState<any[]>([]);

  // Analysis tab state
  const [analysisCategory, setAnalysisCategory] = useState<AnalysisCategory>('worship');
  const [analysisCsvFile, setAnalysisCsvFile] = useState<File | null>(null);
  const [analysisCsvData, setAnalysisCsvData] = useState<string>('');
  const [analysisIsLoading, setAnalysisIsLoading] = useState(false);
  const [analysisChatHistory, setAnalysisChatHistory] = useState<AnalysisChatMessage[]>([]);
  const [analysisChatInput, setAnalysisChatInput] = useState('');
  const [analysisSuggestion, setAnalysisSuggestion] = useState<AnalysisSuggestion | null>(null);
  const [analysisResults, setAnalysisResults] = useState<string>('');
  const analysisFileInputRef = useRef<HTMLInputElement>(null);

  // Participation list state for Worship, Lord's Supper, Calendar tabs
  const [participationData, setParticipationData] = useState<{
    worship: any;
    lordsupper: any;
    calendar: any;
  }>({ worship: null, lordsupper: null, calendar: null });
  const [participationLoading, setParticipationLoading] = useState<{
    worship: boolean;
    lordsupper: boolean;
    calendar: boolean;
  }>({ worship: false, lordsupper: false, calendar: false });
  const [aiInsights, setAiInsights] = useState<{
    worship: string;
    lordsupper: string;
    calendar: string;
  }>({ worship: '', lordsupper: '', calendar: '' });

  // Analyse Past Data tab state
  const [pastDataFiles, setPastDataFiles] = useState<File[]>([]);
  const [pastDataCsvContents, setPastDataCsvContents] = useState<string[]>([]);
  const [pastDataIsLoading, setPastDataIsLoading] = useState(false);
  const [pastDataChatHistory, setPastDataChatHistory] = useState<AnalysisChatMessage[]>([]);
  const [pastDataChatInput, setPastDataChatInput] = useState('');
  const [pastDataParticipation, setPastDataParticipation] = useState<any>(null);
  const [pastDataAiInsights, setPastDataAiInsights] = useState('');
  const pastDataFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setRecoveryData(parsedData);
        setShowRecoveryAlert(true);
      } catch (error) {
        console.error('Error loading saved data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (members.length > 0 || Object.keys(attendance).length > 0) {
      const dataToSave = {
        members,
        attendance,
        fileName: currentFileName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [members, attendance, currentFileName]);

  // QR Code generation effect
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(googleFormUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    if (googleFormUrl) {
      generateQR();
    }
  }, [googleFormUrl]);

  // Load saved attendance records for non-rollcall tabs
  useEffect(() => {
    const loadRecords = async () => {
      if (activeTab === 'rollcall') return;

      // Map tab to event type for church calendar events
      const eventTypeMap: { [key: string]: string } = {
        'worship': 'worship',
        'lordsupper': 'lordsupper',
        'calendar': 'christmaseve,easterfriday,eastersunday'
      };

      const eventTypeQuery = eventTypeMap[activeTab];
      if (!eventTypeQuery) return;

      try {
        const response = await fetch(`/api/attendance/get?eventType=${eventTypeQuery}`);
        const result = await response.json();

        if (result.success && result.data) {
          setSavedRecords(Array.isArray(result.data) ? result.data : [result.data]);
        }
      } catch (error) {
        console.error('Error loading saved records:', error);
      }
    };

    loadRecords();
  }, [activeTab]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, countdown]);

  // Format countdown time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Timer controls
  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setCountdown(1800);
    setIsTimerRunning(false);
  };

  // Handle recovery
  const handleRecover = () => {
    if (recoveryData) {
      setMembers(recoveryData.members || []);
      setAttendance(recoveryData.attendance || {});
      setCurrentFileName(recoveryData.fileName || '');
      setShowRecoveryAlert(false);
    }
  };

  const handleDismissRecovery = () => {
    setShowRecoveryAlert(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Enhanced reset function
  const handleReset = () => {
    if (window.confirm(t('messages.confirmReset'))) {
      setMembers([]);
      setAttendance({});
      setNewName('');
      setCurrentFileName('');
      resetTimer();
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Attendance statistics
  const getAttendanceStats = () => {
    const totalMembers = members.length;
    const presentMembers = Object.values(attendance).filter(status => status.present).length;
    return { totalMembers, presentMembers };
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const newMembers = lines
          .filter(line => line.trim())
          .map((line, index) => ({
            id: `${Date.now()}_${index}`,
            name: line.trim().split(',')[0]
          }));
        setMembers(prevMembers => [...prevMembers, ...newMembers]);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  // Add name handler
  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      const newMember = {
        id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: newName.trim()
      };
      setMembers(prevMembers => [...prevMembers, newMember]);
      setNewName('');
      setShowAddSuccess(true);
      setTimeout(() => setShowAddSuccess(false), 2000);
    }
  };

  // Toggle attendance
  const toggleAttendance = (memberId: string) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        present: !prev[memberId]?.present,
        timestamp: new Date().toISOString()
      }
    }));
  };

  // Delete member
  const handleDelete = (memberId: string, memberName: string) => {
    if (window.confirm(t('messages.confirmDelete', { name: memberName }))) {
      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
      setAttendance(prev => {
        const newAttendance = { ...prev };
        delete newAttendance[memberId];
        return newAttendance;
      });
    }
  };

  // Generate CSV content for storage
  const generateCsvContent = () => {
    const headers = [t('csvHeaders.name'), t('csvHeaders.status'), t('csvHeaders.time')];
    const rows = members.map(member => [
      member.name,
      attendance[member.id]?.present ? t('csvHeaders.present') : t('csvHeaders.absent'),
      attendance[member.id]?.timestamp || ''
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Generate file name based on event type and date
  const generateFileName = (eventType: EventType, date: string) => {
    const eventTypeNames: Record<EventType, string> = {
      worship: 'Worship',
      lordsupper: 'LordSupper',
      christmaseve: 'ChurchCalendar_ChristmasEve',
      easterfriday: 'ChurchCalendar_EasterFriday',
      eastersunday: 'ChurchCalendar_EasterSunday'
    };
    return `${eventTypeNames[eventType]}_${date}.csv`;
  };

  // Save to database
  const saveToDatabase = async () => {
    try {
      const eventDate = new Date().toISOString().split('T')[0];
      const csvContent = generateCsvContent();
      const fileName = generateFileName(eventType, eventDate);

      const attendanceData = {
        eventType,
        eventDate,
        fileName,
        csvContent,
        members: members.map(member => ({
          id: member.id,
          name: member.name,
          present: attendance[member.id]?.present || false,
          timestamp: attendance[member.id]?.timestamp || new Date().toISOString()
        })),
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/attendance?action=save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        console.error('Failed to save to database:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      // Fallback to localStorage if DB fails
      return false;
    }
  };

  // Export handler
  const handleExport = async () => {
    if (members.length === 0) {
      alert(t('messages.noMembersToExport'));
      return;
    }

    // Save to database first
    const saved = await saveToDatabase();
    if (saved) {
      alert(t('messages.savedToDatabase'));
      // Clear temporary data after successful save
      localStorage.removeItem(STORAGE_KEY);
    } else {
      alert(t('messages.saveToDbFailed'));
    }

    // Continue with CSV export
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    const headers = [t('csvHeaders.name'), t('csvHeaders.status'), t('csvHeaders.time')];

    const rows = members.map(member => [
      member.name,
      attendance[member.id]?.present ? t('csvHeaders.present') : t('csvHeaders.absent'),
      attendance[member.id]?.timestamp || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('systemTitle')}_${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderRollCall = () => (
    <div className="p-4 max-w-6xl mx-auto">
      {showRecoveryAlert && (
        <Alert variant="warning" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{t('recovery.found')}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRecover}>
                {t('recovery.recover')}
              </Button>
              <Button variant="ghost" onClick={handleDismissRecovery}>
                {t('recovery.dismiss')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2 text-brand-dark">
          {t('dynamicTitle', { eventType: t(`eventTypes.${eventType}`) })}
        </h1>

        {/* Event Type Selector */}
        <div className="flex justify-center mb-4">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-sm font-medium text-gray-700"
          >
            <option value="worship">{t('eventTypes.worship')}</option>
            <option value="lordsupper">{t('eventTypes.lordsupper')}</option>
            <option value="christmaseve">{t('eventTypes.christmaseve')}</option>
            <option value="easterfriday">{t('eventTypes.easterfriday')}</option>
            <option value="eastersunday">{t('eventTypes.eastersunday')}</option>
          </select>
        </div>

        {currentFileName && (
          <h2 className="text-lg text-gray-600 text-center mb-4">
            {t('fileList', { fileName: currentFileName })}
          </h2>
        )}

        <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
          {/* Countdown Timer */}
          <Card className="p-3 bg-yellow-50">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-center">
                <p className="text-yellow-600 font-medium">{t('timer.countdown')}</p>
                <p className="text-xl font-bold text-yellow-700">{formatTime(countdown)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {t('timer.start')}
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  {t('timer.pause')}
                </button>
              )}
              <button
                onClick={resetTimer}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                {t('timer.reset')}
              </button>
            </div>
          </Card>

          {/* QR Code */}
          <Card className="p-3 bg-blue-50">
            <div className="text-center">
              <p className="text-blue-600 font-medium mb-2">{t('qrCode.title')}</p>
              {qrCodeUrl ? (
                <div className="flex flex-col items-center">
                  <img src={qrCodeUrl} alt="Google Form QR Code" className="w-40 h-40 rounded" />
                  <p className="text-xs text-blue-500 mt-2">{t('qrCode.scanToFill')}</p>
                </div>
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-xs text-gray-500">{t('qrCode.generating')}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {members.length > 0 && (
          <div className="flex justify-center items-center gap-2 mb-4">
            <Card className="p-3 bg-blue-50">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="text-center">
                  <p className="text-blue-600 font-medium">
                    {t('stats.attendance', { present: getAttendanceStats().presentMembers, total: getAttendanceStats().totalMembers })}
                  </p>
                  <p className="text-xs text-blue-500">
                    {t('stats.rate', { rate: ((getAttendanceStats().presentMembers / getAttendanceStats().totalMembers) * 100 || 0).toFixed(1) })}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2"
            disabled={members.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('buttons.saveRollCall')}
          </Button>
          <Button
            variant="danger"
            onClick={handleReset}
            className="flex items-center gap-2"
            disabled={members.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('buttons.reset')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleAddName} className="mb-4 flex gap-2 flex-wrap">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('input.placeholder')}
          className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
        />
        <Button type="submit">{t('buttons.add')}</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => document.getElementById('file-upload')?.click()}
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {t('buttons.importList')}
        </Button>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
        />
      </form>

      {showAddSuccess && (
        <div className="text-green-600 text-center mb-2 font-medium">
          {t('messages.addSuccess')}
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 mt-4">
            {t('messages.noMembers')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {members.map(member => (
            <Card
              key={member.id}
              className="p-3 relative group hover:shadow-lg"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(member.id, member.name);
                }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100
                  transition-opacity p-1 hover:bg-red-100 rounded-full"
                title={t('tooltip.deleteMember')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div
                onClick={() => toggleAttendance(member.id)}
                className={`cursor-pointer pt-2 pb-1 px-2 rounded transition-colors
                  ${attendance[member.id]?.present
                    ? 'bg-green-100'
                    : 'hover:bg-gray-50'}`}
              >
                <div className="text-center">
                  <h3 className="font-medium text-sm mb-1">{member.name}</h3>
                  <p className="text-xs text-gray-600">
                    {attendance[member.id]?.present ? t('status.present') : t('status.notMarked')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAttendanceRecords = (records: any[], title: string) => (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-dark mb-6">{title}</h2>
      {records.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">{t('records.noRecords')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => (
            <Card key={record.id || index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-dark">
                    {t(`eventTypes.${record.eventType}`)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(record.eventDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {t('records.attendance')}: {record.members.filter((m: any) => m.present).length} / {record.members.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('records.rate')}: {Math.round((record.members.filter((m: any) => m.present).length / record.members.length) * 100)}%
                  </p>
                </div>
              </div>
              <div className="border-t pt-3">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-brand-primary hover:text-brand-dark">
                    {t('records.viewDetails')}
                  </summary>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {record.members.map((member: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded text-sm ${
                          member.present ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          member.present ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {member.name}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Fetch participation data and AI insights
  const fetchParticipationData = async (eventType: 'worship' | 'lordsupper' | 'calendar') => {
    setParticipationLoading(prev => ({ ...prev, [eventType]: true }));

    try {
      // Fetch participation list from API
      const response = await fetch(`/api/attendance?action=participation-list&eventType=${eventType}`);
      const result = await response.json();

      if (result.success) {
        setParticipationData(prev => ({ ...prev, [eventType]: result.data }));

        // Generate AI insights if we have data
        if (result.data.participationList.length > 0) {
          await generateAiInsights(eventType, result.data);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${eventType} participation:`, error);
    } finally {
      setParticipationLoading(prev => ({ ...prev, [eventType]: false }));
    }
  };

  // Generate AI insights for participation data
  const generateAiInsights = async (eventType: string, data: any) => {
    try {
      const participationSummary = data.participationList
        .slice(0, 20)
        .map((p: any) => `${p.name}: ${p.participationRate}% (${p.attended}/${p.totalEvents})`)
        .join('\n');

      const systemPrompt = `You are a church administrator AI assistant. Analyze the participation data and provide brief, actionable insights. Focus on:
1. Overall engagement trends
2. Members who may need pastoral attention (low attendance)
3. Members with excellent engagement (potential leaders)
4. Late arrival patterns (benchmark: 9:45am Sunday service)
Keep your response concise (4-6 bullet points). Include insights about punctuality when time data is available.`;

      const userPrompt = `Analyze this ${eventType} participation data (last 3 months):

Total Records: ${data.totalRecords}
Members: ${data.participationList.length}

Note: Late arrival benchmark is 9:45am HKT for Sunday service. Check-in times after this are considered late.

Top participation rates:
${participationSummary}

Provide brief insights for church leadership including any punctuality observations.`;

      const response = await fetch('/api/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          maxTokens: 500,
        }),
      });

      if (response.ok) {
        const aiResult = await response.json();
        const insights = aiResult.choices?.[0]?.message?.content || '';
        setAiInsights(prev => ({ ...prev, [eventType]: insights }));
      }
    } catch (error) {
      console.error(`Error generating AI insights for ${eventType}:`, error);
    }
  };

  // Render participation list component
  const renderParticipationList = (
    eventType: 'worship' | 'lordsupper' | 'calendar',
    title: string
  ) => {
    const data = participationData[eventType];
    const loading = participationLoading[eventType];
    const insights = aiInsights[eventType];

    // Fetch data on first render
    useEffect(() => {
      if (!data && !loading) {
        fetchParticipationData(eventType);
      }
    }, [eventType]);

    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-dark">{title}</h2>
          <Button
            onClick={() => fetchParticipationData(eventType)}
            variant="ghost"
            disabled={loading}
          >
            {loading ? t('tabs.analysis.analyzing') : t('participation.refresh')}
          </Button>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-500">{t('participation.loading')}</p>
          </div>
        ) : !data || data.participationList.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">{t('records.noRecords')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Insights Card */}
            {insights && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('participation.aiInsights')}
                </h3>
                <div className="text-sm text-blue-900 whitespace-pre-wrap">{insights}</div>
              </Card>
            )}

            {/* Summary Stats */}
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-brand-primary">{data.totalRecords}</p>
                  <p className="text-sm text-gray-500">{t('participation.totalEvents')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-primary">{data.participationList.length}</p>
                  <p className="text-sm text-gray-500">{t('participation.totalMembers')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-primary">
                    {data.participationList.length > 0
                      ? Math.round(data.participationList.reduce((acc: number, p: any) => acc + p.participationRate, 0) / data.participationList.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">{t('participation.avgRate')}</p>
                </div>
              </div>
            </Card>

            {/* Participation List Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-brand-dark">{t('participation.memberList')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('participation.name')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.attended')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.total')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.rate')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.lastAttended')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.participationList.map((member: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{member.attended}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{member.totalEvents}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.participationRate >= 80 ? 'bg-green-100 text-green-800' :
                            member.participationRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.participationRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {member.lastAttended ? new Date(member.lastAttended).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* CSV Files List */}
            {data.csvFiles && data.csvFiles.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-brand-dark mb-3">{t('participation.csvFiles')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {data.csvFiles.map((file: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{file.fileName}</span>
                      <span className="text-gray-500 ml-2">({new Date(file.eventDate).toLocaleDateString()})</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderWorship = () => renderParticipationList('worship', t('tabs.worship.title'));

  const renderLordSupper = () => renderParticipationList('lordsupper', t('tabs.lordsupper.title'));

  const renderCalendar = () => renderParticipationList('calendar', t('tabs.calendar.title'));

  const renderAnalysis = () => {
    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.csv')) {
        alert(t('tabs.analysis.errors.invalidFormat'));
        return;
      }

      setAnalysisCsvFile(file);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvContent = event.target?.result as string;
        if (!csvContent || csvContent.trim().length === 0) {
          alert(t('tabs.analysis.errors.emptyFile'));
          return;
        }
        setAnalysisCsvData(csvContent);

        // Add welcome message with file info
        const lines = csvContent.split('\n').filter(line => line.trim());
        const rowCount = lines.length - 1; // Exclude header
        setAnalysisChatHistory(prev => [...prev, {
          role: 'system',
          content: `${t('tabs.analysis.chat.fileLoaded')}\n\n- File: ${file.name}\n- Rows: ${rowCount}\n- Category: ${t(`tabs.analysis.categories.${analysisCategory}`)}`
        }]);
      };
      reader.readAsText(file);
    };

    const handleSuggestAnalysis = async () => {
      if (!analysisCsvData) {
        alert(t('tabs.analysis.errors.noFile'));
        return;
      }

      setAnalysisIsLoading(true);
      setAnalysisChatHistory(prev => [...prev, {
        role: 'system',
        content: t('tabs.analysis.chat.suggestingAnalysis')
      }]);

      try {
        const systemPrompt = `You are an expert data analyst specializing in church attendance analysis. You use PandasAI and statistical methods to analyze attendance patterns. Based on the CSV data provided, suggest ONE specific analysis that would be valuable for church administrators.

For the "${analysisCategory}" category, consider analyses like:
- Attendance trends over time
- Member engagement patterns
- Seasonal patterns
- Drop-off analysis
- Growth rates
- Correlations between events

Provide your response in this JSON format:
{
  "title": "Analysis title",
  "description": "Brief description of what this analysis will reveal and why it's useful",
  "analysisType": "one of: attendanceTrends, memberEngagement, seasonalPatterns, dropoffAnalysis, growthRate, comparisonAnalysis, correlationAnalysis, predictiveAnalysis"
}`;

        const userPrompt = `Here is the CSV data for ${t(`tabs.analysis.categories.${analysisCategory}`)}:\n\n${analysisCsvData.substring(0, 2000)}${analysisCsvData.length > 2000 ? '\n...(truncated for preview)' : ''}

Please suggest ONE valuable analysis for this church attendance data.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 1000,
          }),
        });

        if (!response.ok) throw new Error('Failed to get analysis suggestion');

        const data = await response.json();
        const suggestionText = data.choices?.[0]?.message?.content || '';

        // Parse the JSON response
        try {
          const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const suggestion = JSON.parse(jsonMatch[0]);
            setAnalysisSuggestion({
              id: `suggestion-${Date.now()}`,
              title: suggestion.title,
              description: suggestion.description,
              analysisType: suggestion.analysisType
            });

            setAnalysisChatHistory(prev => [...prev, {
              role: 'assistant',
              content: `**${t('tabs.analysis.suggestions.title')}**\n\n**${suggestion.title}**\n\n${suggestion.description}\n\nWould you like me to perform this analysis?`
            }]);
          }
        } catch (parseError) {
          setAnalysisChatHistory(prev => [...prev, {
            role: 'assistant',
            content: suggestionText
          }]);
        }
      } catch (error) {
        console.error('Error suggesting analysis:', error);
        setAnalysisChatHistory(prev => [...prev, {
          role: 'assistant',
          content: t('tabs.analysis.errors.analysisError')
        }]);
      } finally {
        setAnalysisIsLoading(false);
      }
    };

    const handlePerformAnalysis = async (analysisType?: string) => {
      if (!analysisCsvData) {
        alert(t('tabs.analysis.errors.noFile'));
        return;
      }

      setAnalysisIsLoading(true);
      setAnalysisChatHistory(prev => [...prev, {
        role: 'system',
        content: t('tabs.analysis.chat.performingAnalysis')
      }]);

      try {
        const typeToPerform = analysisType || analysisSuggestion?.analysisType || 'attendanceTrends';

        const systemPrompt = `You are an expert data analyst using PandasAI and statistical methods. Perform the requested analysis on the church attendance data and provide:

1. **Key Insights**: 3-5 specific findings from the data
2. **Statistics**: Relevant numbers, percentages, averages
3. **Recommendations**: 2-3 actionable suggestions for church administrators
4. **Visualization Description**: Describe what chart/graph would best represent this data

Be specific with numbers and dates from the actual data. Use markdown formatting for clarity.`;

        const userPrompt = `Perform a ${t(`tabs.analysis.possibleAnalyses.${typeToPerform}` as any)} analysis on this ${t(`tabs.analysis.categories.${analysisCategory}`)} data:

${analysisCsvData}

Provide detailed insights, statistics, and recommendations.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            maxTokens: 2000,
          }),
        });

        if (!response.ok) throw new Error('Failed to perform analysis');

        const data = await response.json();
        const results = data.choices?.[0]?.message?.content || '';

        setAnalysisResults(results);
        setAnalysisChatHistory(prev => [...prev, {
          role: 'assistant',
          content: results
        }]);
        setAnalysisSuggestion(null);
      } catch (error) {
        console.error('Error performing analysis:', error);
        setAnalysisChatHistory(prev => [...prev, {
          role: 'assistant',
          content: t('tabs.analysis.errors.analysisError')
        }]);
      } finally {
        setAnalysisIsLoading(false);
      }
    };

    const handleChatSubmit = async () => {
      if (!analysisChatInput.trim()) return;

      const userMessage = analysisChatInput.trim();
      setAnalysisChatInput('');
      setAnalysisChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
      setAnalysisIsLoading(true);

      try {
        const systemPrompt = `You are an AI assistant helping analyze church attendance data. You use PandasAI and OpenAI to provide insights. The user has uploaded CSV data for "${t(`tabs.analysis.categories.${analysisCategory}`)}" analysis.

${analysisCsvData ? `Current CSV data preview:\n${analysisCsvData.substring(0, 1500)}` : 'No data uploaded yet.'}

Important: The benchmark for late arrival is 9:45am HKT for Sunday service. Time data in CSV is in UTC format (HKT = UTC+8). Arrivals after 01:45 UTC are considered late.

Help the user understand their data, suggest analyses, or answer questions about attendance patterns and late arrivals. Be specific and helpful.`;

        const conversationHistory = analysisChatHistory.slice(-10).map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        }));

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            maxTokens: 1500,
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';

        setAnalysisChatHistory(prev => [...prev, {
          role: 'assistant',
          content: reply
        }]);
      } catch (error) {
        console.error('Error in chat:', error);
        setAnalysisChatHistory(prev => [...prev, {
          role: 'assistant',
          content: t('tabs.analysis.errors.analysisError')
        }]);
      } finally {
        setAnalysisIsLoading(false);
      }
    };

    const handleClearChat = () => {
      setAnalysisChatHistory([]);
      setAnalysisSuggestion(null);
      setAnalysisResults('');
    };

    const handleExportResults = () => {
      if (!analysisResults) return;

      const blob = new Blob([analysisResults], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisCategory}-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('tabs.analysis.title')}</h3>
          <p className="text-gray-600 mb-6">{t('tabs.analysis.description')}</p>

          {/* Category Selection and File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tabs.analysis.selectCategory')}
              </label>
              <select
                value={analysisCategory}
                onChange={(e) => setAnalysisCategory(e.target.value as AnalysisCategory)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="worship">{t('tabs.analysis.categories.worship')}</option>
                <option value="lordsupper">{t('tabs.analysis.categories.lordsupper')}</option>
                <option value="calendar">{t('tabs.analysis.categories.calendar')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tabs.analysis.uploadCsv')}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={analysisFileInputRef}
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => analysisFileInputRef.current?.click()}
                  variant="ghost"
                  className="flex-1"
                >
                  {analysisCsvFile ? analysisCsvFile.name : t('tabs.analysis.noFileSelected')}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('tabs.analysis.csvOnly')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={handleSuggestAnalysis}
              disabled={!analysisCsvData || analysisIsLoading}
            >
              {t('tabs.analysis.suggestAnalysis')}
            </Button>
            {analysisSuggestion && (
              <Button
                onClick={() => handlePerformAnalysis()}
                disabled={analysisIsLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {t('tabs.analysis.suggestions.approve')}
              </Button>
            )}
            <Button
              onClick={handleClearChat}
              variant="ghost"
            >
              {t('tabs.analysis.clearChat')}
            </Button>
            {analysisResults && (
              <Button
                onClick={handleExportResults}
                variant="ghost"
              >
                {t('tabs.analysis.exportResults')}
              </Button>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-brand-dark">{t('tabs.analysis.chat.title')}</h4>
          </div>

          {/* Chat History */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {analysisChatHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>{t('tabs.analysis.chat.welcome')}</p>
              </div>
            ) : (
              analysisChatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-100 ml-8'
                      : msg.role === 'system'
                      ? 'bg-gray-100'
                      : 'bg-green-50 mr-8'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'AI Assistant'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))
            )}
            {analysisIsLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <p className="text-sm text-gray-500 mt-2">{t('tabs.analysis.analyzing')}</p>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={analysisChatInput}
                onChange={(e) => setAnalysisChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder={t('tabs.analysis.chatPlaceholder')}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                disabled={analysisIsLoading}
              />
              <Button
                onClick={handleChatSubmit}
                disabled={!analysisChatInput.trim() || analysisIsLoading}
              >
                {t('tabs.analysis.sendMessage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysePastData = () => {
    // Handle multiple CSV file upload
    const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const validFiles = files.filter(f => f.name.endsWith('.csv'));
      if (validFiles.length === 0) {
        alert(t('tabs.analysepast.errors.invalidFormat'));
        return;
      }

      setPastDataFiles(prev => [...prev, ...validFiles]);
      setPastDataIsLoading(true);

      try {
        const newContents: string[] = [];
        for (const file of validFiles) {
          const content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsText(file);
          });
          newContents.push(content);
        }

        setPastDataCsvContents(prev => [...prev, ...newContents]);

        // Parse and aggregate participation data
        const allData = [...pastDataCsvContents, ...newContents];
        const participation = parseMultipleCsvFiles(allData);
        setPastDataParticipation(participation);

        // Add system message
        setPastDataChatHistory(prev => [...prev, {
          role: 'system',
          content: t('tabs.analysepast.chat.filesLoaded', {
            count: validFiles.length,
            total: pastDataFiles.length + validFiles.length,
            members: participation.participationList.length
          })
        }]);

        // Generate AI insights
        await generatePastDataInsights(participation);
      } catch (error) {
        console.error('Error processing files:', error);
      } finally {
        setPastDataIsLoading(false);
      }
    };

    // Parse multiple CSV files and aggregate participation with late arrival detection
    const parseMultipleCsvFiles = (csvContents: string[]) => {
      const memberMap = new Map<string, { name: string; totalEvents: number; attended: number; lateArrivals: number; dates: string[]; arrivalTimes: string[] }>();

      // Benchmark: 9:45am HKT = 01:45:00 UTC
      const LATE_ARRIVAL_HOUR_UTC = 1;
      const LATE_ARRIVAL_MINUTE_UTC = 45;

      csvContents.forEach((content, fileIndex) => {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) return;

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',');
          if (columns.length < 2) continue;

          const name = columns[0].trim();
          const status = columns[1].trim().toLowerCase();
          const timeStr = columns[2]?.trim() || '';
          const isPresent = status.includes('present') || status.includes('出席') || status === 'yes' || status === '1';

          const existing = memberMap.get(name) || {
            name,
            totalEvents: 0,
            attended: 0,
            lateArrivals: 0,
            dates: [],
            arrivalTimes: []
          };

          existing.totalEvents++;
          if (isPresent) {
            existing.attended++;
            existing.dates.push(`File ${fileIndex + 1}`);

            // Check for late arrival (after 9:45am HKT / 01:45 UTC)
            if (timeStr) {
              try {
                const arrivalTime = new Date(timeStr);
                const arrivalHour = arrivalTime.getUTCHours();
                const arrivalMinute = arrivalTime.getUTCMinutes();

                // Late if after 01:45 UTC (9:45am HKT)
                if (arrivalHour > LATE_ARRIVAL_HOUR_UTC ||
                    (arrivalHour === LATE_ARRIVAL_HOUR_UTC && arrivalMinute > LATE_ARRIVAL_MINUTE_UTC)) {
                  existing.lateArrivals++;
                  // Convert to HKT for display
                  const hktHour = (arrivalHour + 8) % 24;
                  const hktMinute = arrivalMinute;
                  existing.arrivalTimes.push(`${hktHour.toString().padStart(2, '0')}:${hktMinute.toString().padStart(2, '0')}`);
                }
              } catch (e) {
                // Invalid date format, skip
              }
            }
          }

          memberMap.set(name, existing);
        }
      });

      const participationList = Array.from(memberMap.values()).map(member => ({
        ...member,
        participationRate: member.totalEvents > 0
          ? Math.round((member.attended / member.totalEvents) * 100)
          : 0,
        lateArrivalRate: member.attended > 0
          ? Math.round((member.lateArrivals / member.attended) * 100)
          : 0
      }));

      participationList.sort((a, b) => b.participationRate - a.participationRate);

      // Calculate late arrival statistics
      const totalAttendances = participationList.reduce((sum, m) => sum + m.attended, 0);
      const totalLateArrivals = participationList.reduce((sum, m) => sum + m.lateArrivals, 0);
      const lateArrivalRate = totalAttendances > 0 ? Math.round((totalLateArrivals / totalAttendances) * 100) : 0;

      // Get frequently late members (late more than 50% of their attendances)
      const frequentlyLate = participationList
        .filter(m => m.attended >= 2 && m.lateArrivalRate > 50)
        .sort((a, b) => b.lateArrivalRate - a.lateArrivalRate);

      return {
        totalFiles: csvContents.length,
        participationList,
        lateArrivalStats: {
          totalLateArrivals,
          totalAttendances,
          lateArrivalRate,
          frequentlyLate: frequentlyLate.slice(0, 10)
        }
      };
    };

    // Generate AI insights for past data
    const generatePastDataInsights = async (data: any) => {
      if (!data || data.participationList.length === 0) return;

      try {
        const participationSummary = data.participationList
          .slice(0, 20)
          .map((p: any) => `${p.name}: ${p.participationRate}% (${p.attended}/${p.totalEvents})${p.lateArrivals > 0 ? ` [Late: ${p.lateArrivals}x]` : ''}`)
          .join('\n');

        // Late arrival summary
        const lateStats = data.lateArrivalStats || { totalLateArrivals: 0, totalAttendances: 0, lateArrivalRate: 0, frequentlyLate: [] };
        const lateArrivalSummary = lateStats.frequentlyLate.length > 0
          ? `\n\nFrequently Late Members (>50% late arrivals, benchmark 9:45am):\n${lateStats.frequentlyLate.map((m: any) => `${m.name}: ${m.lateArrivalRate}% late (${m.lateArrivals}/${m.attended})`).join('\n')}`
          : '';

        const systemPrompt = `You are a church administrator AI assistant using PandasAI to analyze historical attendance data. Provide actionable insights based on the aggregated participation data from multiple CSV files. Focus on:
1. Overall engagement patterns
2. Members needing follow-up (low attendance)
3. Highly engaged members (potential leaders)
4. Late arrival patterns (benchmark: 9:45am Sunday service)
5. Trends and recommendations
Keep response concise (5-7 bullet points). Include at least one insight about punctuality/late arrivals.`;

        const userPrompt = `Analyze this aggregated participation data from ${data.totalFiles} CSV files:

Total Members: ${data.participationList.length}
Late Arrival Rate: ${lateStats.lateArrivalRate}% (${lateStats.totalLateArrivals} late out of ${lateStats.totalAttendances} attendances)

Participation rates:
${participationSummary}
${lateArrivalSummary}

Provide insights for church leadership including late arrival patterns.`;

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 600,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const insights = result.choices?.[0]?.message?.content || '';
          setPastDataAiInsights(insights);
        }
      } catch (error) {
        console.error('Error generating insights:', error);
      }
    };

    // Handle chat submission
    const handlePastDataChatSubmit = async () => {
      if (!pastDataChatInput.trim()) return;

      const userMessage = pastDataChatInput.trim();
      setPastDataChatInput('');
      setPastDataChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
      setPastDataIsLoading(true);

      try {
        const csvPreview = pastDataCsvContents.slice(0, 3).map((content, i) =>
          `File ${i + 1}:\n${content.substring(0, 500)}`
        ).join('\n\n');

        const lateStats = pastDataParticipation?.lateArrivalStats || { totalLateArrivals: 0, totalAttendances: 0, lateArrivalRate: 0, frequentlyLate: [] };
        const lateArrivalInfo = lateStats.totalAttendances > 0
          ? `\nLate Arrival Stats (benchmark: 9:45am HKT):
- Late arrivals: ${lateStats.totalLateArrivals} out of ${lateStats.totalAttendances} (${lateStats.lateArrivalRate}%)
- Frequently late members: ${lateStats.frequentlyLate.map((m: any) => `${m.name} (${m.lateArrivalRate}%)`).join(', ') || 'None'}`
          : '';

        const systemPrompt = `You are an AI assistant using PandasAI and OpenAI to analyze church attendance data. The user has uploaded ${pastDataFiles.length} CSV files with roll call data.

Data preview:
${csvPreview}

${pastDataParticipation ? `
Aggregated stats:
- Total members: ${pastDataParticipation.participationList.length}
- Files analyzed: ${pastDataParticipation.totalFiles}${lateArrivalInfo}
` : ''}

Help analyze patterns, answer questions about attendance and late arrivals, and provide recommendations. The benchmark for late arrival is 9:45am Sunday service time.`;

        const conversationHistory = pastDataChatHistory.slice(-10).map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        }));

        const response = await fetch('/api/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            maxTokens: 1500,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const reply = result.choices?.[0]?.message?.content || '';
          setPastDataChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
        }
      } catch (error) {
        console.error('Error in chat:', error);
        setPastDataChatHistory(prev => [...prev, {
          role: 'assistant',
          content: t('tabs.analysepast.errors.analysisError')
        }]);
      } finally {
        setPastDataIsLoading(false);
      }
    };

    // Clear all data
    const handleClearAll = () => {
      setPastDataFiles([]);
      setPastDataCsvContents([]);
      setPastDataChatHistory([]);
      setPastDataParticipation(null);
      setPastDataAiInsights('');
    };

    // Remove a specific file
    const handleRemoveFile = (index: number) => {
      setPastDataFiles(prev => prev.filter((_, i) => i !== index));
      setPastDataCsvContents(prev => prev.filter((_, i) => i !== index));

      // Recalculate participation
      const remaining = pastDataCsvContents.filter((_, i) => i !== index);
      if (remaining.length > 0) {
        const participation = parseMultipleCsvFiles(remaining);
        setPastDataParticipation(participation);
      } else {
        setPastDataParticipation(null);
        setPastDataAiInsights('');
      }
    };

    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold text-brand-dark mb-4">{t('tabs.analysepast.title')}</h3>
          <p className="text-gray-600 mb-6">{t('tabs.analysepast.description')}</p>

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <input
                type="file"
                ref={pastDataFileInputRef}
                accept=".csv"
                multiple
                onChange={handleMultiFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => pastDataFileInputRef.current?.click()}
                disabled={pastDataIsLoading}
              >
                {t('tabs.analysepast.uploadFiles')}
              </Button>
              {pastDataFiles.length > 0 && (
                <Button variant="ghost" onClick={handleClearAll}>
                  {t('tabs.analysepast.clearAll')}
                </Button>
              )}
            </div>

            {/* Uploaded Files List */}
            {pastDataFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('tabs.analysepast.uploadedFiles')} ({pastDataFiles.length})
                </h4>
                <div className="space-y-2">
                  {pastDataFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {t('tabs.analysepast.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights and Participation Data */}
        {pastDataParticipation && (
          <div className="space-y-6 mb-6">
            {/* AI Insights */}
            {pastDataAiInsights && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('participation.aiInsights')}
                </h3>
                <div className="text-sm text-blue-900 whitespace-pre-wrap">{pastDataAiInsights}</div>
              </Card>
            )}

            {/* Summary Stats */}
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-brand-primary">{pastDataParticipation.totalFiles}</p>
                  <p className="text-sm text-gray-500">{t('tabs.analysepast.filesAnalyzed')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-primary">{pastDataParticipation.participationList.length}</p>
                  <p className="text-sm text-gray-500">{t('participation.totalMembers')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-primary">
                    {pastDataParticipation.participationList.length > 0
                      ? Math.round(pastDataParticipation.participationList.reduce((acc: number, p: any) => acc + p.participationRate, 0) / pastDataParticipation.participationList.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">{t('participation.avgRate')}</p>
                </div>
              </div>
            </Card>

            {/* Participation Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-brand-dark">{t('participation.memberList')}</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('participation.name')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.attended')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.total')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('participation.rate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pastDataParticipation.participationList.map((member: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{member.attended}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{member.totalEvents}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.participationRate >= 80 ? 'bg-green-100 text-green-800' :
                            member.participationRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.participationRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-brand-dark">{t('tabs.analysepast.chat.title')}</h4>
          </div>

          {/* Chat History */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {pastDataChatHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>{t('tabs.analysepast.chat.welcome')}</p>
              </div>
            ) : (
              pastDataChatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-100 ml-8'
                      : msg.role === 'system'
                      ? 'bg-gray-100'
                      : 'bg-green-50 mr-8'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'AI Assistant'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))
            )}
            {pastDataIsLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <p className="text-sm text-gray-500 mt-2">{t('tabs.analysis.analyzing')}</p>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            {/* Pastoral Care Questions Dropdown */}
            <div className="mb-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setPastDataChatInput(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                disabled={pastDataIsLoading || pastDataFiles.length === 0}
              >
                <option value="">{t('tabs.analysepast.pastoralQuestions.select')}</option>
                <option value={t('tabs.analysepast.pastoralQuestions.q1')}>{t('tabs.analysepast.pastoralQuestions.q1')}</option>
                <option value={t('tabs.analysepast.pastoralQuestions.q2')}>{t('tabs.analysepast.pastoralQuestions.q2')}</option>
                <option value={t('tabs.analysepast.pastoralQuestions.q3')}>{t('tabs.analysepast.pastoralQuestions.q3')}</option>
                <option value={t('tabs.analysepast.pastoralQuestions.q4')}>{t('tabs.analysepast.pastoralQuestions.q4')}</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={pastDataChatInput}
                onChange={(e) => setPastDataChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePastDataChatSubmit()}
                placeholder={t('tabs.analysepast.chat.placeholder')}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                disabled={pastDataIsLoading || pastDataFiles.length === 0}
              />
              <Button
                onClick={handlePastDataChatSubmit}
                disabled={!pastDataChatInput.trim() || pastDataIsLoading || pastDataFiles.length === 0}
              >
                {t('tabs.analysis.sendMessage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSurvey = () => (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold text-brand-dark mb-4">{t('tabs.survey.title')}</h3>
        <p className="text-gray-600 mb-4">{t('tabs.survey.description')}</p>
        <div className="bg-brand-light p-4 rounded-lg">
          <p className="text-sm text-gray-700">{t('tabs.survey.comingSoon')}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-gray-50 h-full">
      {/* Navigation Tabs */}
      <nav className="bg-white shadow">
        <div className="w-full px-2 sm:px-4">
          <div className="flex justify-between items-center overflow-x-auto">
            <div className="flex space-x-4 md:space-x-8">
              <button
                onClick={() => setActiveTab('rollcall')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'rollcall'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.rollcall.tab')}
              </button>
              <button
                onClick={() => setActiveTab('worship')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'worship'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.worship.tab')}
              </button>
              <button
                onClick={() => setActiveTab('lordsupper')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'lordsupper'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.lordsupper.tab')}
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.calendar.tab')}
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'analysis'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.analysis.tab')}
              </button>
              <button
                onClick={() => setActiveTab('analysepast')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'analysepast'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.analysepast.tab')}
              </button>
              <button
                onClick={() => setActiveTab('survey')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'survey'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.survey.tab')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full overflow-y-auto">
        {activeTab === 'rollcall' && renderRollCall()}
        {activeTab === 'worship' && renderWorship()}
        {activeTab === 'lordsupper' && renderLordSupper()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'analysis' && renderAnalysis()}
        {activeTab === 'analysepast' && renderAnalysePastData()}
        {activeTab === 'survey' && renderSurvey()}
      </main>
    </div>
  );
};

export default RollCallSystem;

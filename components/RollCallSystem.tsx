import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from './common/Card';
import Button from './common/Button';
import { Alert, AlertDescription } from './common/Alert';

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

const RollCallSystem: React.FC = () => {
  const { t } = useTranslation('rollCall');

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

  // Export handler
  const handleExport = () => {
    if (members.length === 0) {
      alert(t('messages.noMembersToExport'));
      return;
    }
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

  return (
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
        <h1 className="text-3xl font-bold text-center mb-2 text-brand-dark">{t('systemTitle')}</h1>
        {currentFileName && (
          <h2 className="text-lg text-gray-600 text-center mb-4">
            {t('fileList', { fileName: currentFileName })}
          </h2>
        )}

        <div className="flex justify-center items-center mb-4">
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
};

export default RollCallSystem;

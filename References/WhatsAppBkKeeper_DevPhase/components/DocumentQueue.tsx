
import React from 'react';
import type { QueueStatus } from '../types';
import { ClockIcon, LoaderIcon, CheckCircle2Icon, XCircleIcon } from './icons';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center space-x-4 border border-slate-200 dark:border-gray-700">
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
};


export const DocumentQueue: React.FC<{ status: QueueStatus }> = ({ status }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Processing Queue</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Queued"
          value={status.queued}
          icon={<ClockIcon className="h-6 w-6 text-blue-800 dark:text-blue-200" />}
          color="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          label="Processing"
          value={status.processing}
          icon={<LoaderIcon className="h-6 w-6 text-yellow-800 dark:text-yellow-200 animate-spin" />}
          color="bg-yellow-100 dark:bg-yellow-900/50"
        />
        <StatCard
          label="Completed"
          value={status.completed}
          icon={<CheckCircle2Icon className="h-6 w-6 text-green-800 dark:text-green-200" />}
          color="bg-green-100 dark:bg-green-900/50"
        />
        <StatCard
          label="Rejected"
          value={status.rejected}
          icon={<XCircleIcon className="h-6 w-6 text-orange-800 dark:text-orange-200" />}
          color="bg-orange-100 dark:bg-orange-900/50"
        />
        <StatCard
          label="Failed"
          value={status.failed}
          icon={<XCircleIcon className="h-6 w-6 text-red-800 dark:text-red-200" />}
          color="bg-red-100 dark:bg-red-900/50"
        />
      </div>
    </div>
  );
};

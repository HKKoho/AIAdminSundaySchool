import React from 'react';
import type { Document, DocumentStatus, ReviewStatus } from '../types';
import { FileIcon, LoaderIcon, CheckCircle2Icon, XCircleIcon, PercentIcon, PencilIcon, RefreshCwIcon } from './icons';
import { SearchAndFilter } from './SearchAndFilter';

const ReviewStatusBadge: React.FC<{ reviewStatus: ReviewStatus }> = ({ reviewStatus }) => {
  const config = {
    not_yet: {
      text: 'Not Yet',
      color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    confirmed: {
      text: 'Confirmed',
      color: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100',
    },
    reclassified_by_human: {
      text: 'Human Reclassified',
      color: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    },
    reclassified_by_machine: {
      text: 'AI Reclassified',
      color: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
    },
  }[reviewStatus];

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      <span>{config.text}</span>
    </span>
  );
};

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const config = {
    pending_classification: {
      text: 'Pending',
      icon: <FileIcon className="h-3 w-3" />,
      color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    },
    classifying: {
      text: 'Classifying...',
      icon: <LoaderIcon className="h-3 w-3 animate-spin" />,
      color: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    },
    classified: {
      text: 'Classified',
      icon: <CheckCircle2Icon className="h-3 w-3" />,
      color: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100',
    },
    rejected: {
      text: 'Rejected',
      icon: <XCircleIcon className="h-3 w-3" />,
      color: 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
    },
    classification_failed: {
      text: 'Failed',
      icon: <XCircleIcon className="h-3 w-3" />,
      color: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100',
    },
  }[status];

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
};

interface DocumentRowProps {
  doc: Document;
  index: number;
  onSelect: () => void;
  onRetry: (docId: string) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ doc, index, onSelect, onRetry }) => {
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
  };
  
  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the row's onClick from firing
    onRetry(doc.id);
  };

  const isProcessing = doc.status === 'classifying';
  
  const rowClasses = [
    'border-b', 'border-gray-200', 'dark:border-gray-700',
    'transition-colors', 'cursor-pointer'
  ];

  if (isProcessing) {
    rowClasses.push('bg-yellow-50', 'dark:bg-yellow-900/20', 'animate-pulse');
  } else {
    rowClasses.push('hover:bg-gray-50', 'dark:hover:bg-gray-700/50');
  }

  return (
    <tr 
      className={rowClasses.join(' ')}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      aria-label={`View details for ${doc.filename}`}
    >
      <td className="p-4 text-center text-sm font-mono text-gray-500 dark:text-gray-400">{index + 1}</td>
      <td className="p-4 flex items-center space-x-3">
        <img src={doc.thumbnailUrl || ''} alt="thumbnail" className="h-10 w-10 rounded-md object-cover" />
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{doc.filename}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{(doc.size / 1024).toFixed(1)} KB</p>
        </div>
      </td>
      <td className="p-4 text-center">
        {doc.status === 'classification_failed' ? (
          <button
            onClick={handleRetryClick}
            className="inline-flex items-center space-x-1.5 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900"
            aria-label={`Retry classification for ${doc.filename}`}
          >
            <RefreshCwIcon className="h-3 w-3" />
            <span>Retry</span>
          </button>
        ) : doc.status === 'rejected' ? (
          <button
            onClick={handleRetryClick}
            className="inline-flex items-center space-x-1.5 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900"
            aria-label={`Retry classification for ${doc.filename}`}
          >
            <RefreshCwIcon className="h-3 w-3" />
            <span>Retry</span>
          </button>
        ) : (
          <StatusBadge status={doc.status} />
        )}
      </td>
      <td className="p-4">
        {doc.documentType ? (
          <div className="flex flex-col">
             <div className="flex items-center space-x-2">
                <span className="font-semibold">{doc.documentType}</span>
                {doc.isManuallyClassified && <span title="Manually classified"><PencilIcon className="h-3.5 w-3.5 text-blue-500" /></span>}
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <PercentIcon className="h-3 w-3 mr-1" />
              <span>{doc.classificationConfidence?.toFixed(1)}% confidence</span>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        )}
      </td>
      <td className="p-4 text-center">
        <ReviewStatusBadge reviewStatus={doc.reviewStatus} />
      </td>
      <td className="p-4 text-right text-sm text-gray-500 dark:text-gray-400">
        <time dateTime={doc.uploadedAt}>{timeAgo(doc.uploadedAt)}</time>
      </td>
    </tr>
  );
};

interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (doc: Document) => void;
  onRetryClassification: (docId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedType: string;
  onSelectedTypeChange: (type: string) => void;
  onClearFilters: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onRetryClassification,
  searchTerm,
  onSearchTermChange,
  selectedType,
  onSelectedTypeChange,
  onClearFilters
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Documents</h2>

      {/* Search and Filter Section */}
      <div className="mb-4">
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          selectedType={selectedType}
          onSelectedTypeChange={onSelectedTypeChange}
          onClearFilters={onClearFilters}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            <tr>
              <th className="p-4 font-semibold text-center w-12">#</th>
              <th className="p-4 font-semibold">File Details</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold">Classification</th>
              <th className="p-4 font-semibold text-center">Review</th>
              <th className="p-4 font-semibold text-right">Received</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                index={index}
                onSelect={() => onDocumentSelect(doc)}
                onRetry={onRetryClassification}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
import React from 'react';
import type { Document, DocumentStatus, ExtractedEntities } from '../types';
import { DOCUMENT_TYPES } from '../constants';
import { LoaderIcon, CheckCircle2Icon, XCircleIcon, PercentIcon, ClockIcon, XIcon, RefreshCwIcon } from './icons';

const DetailStatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const config = {
    pending_classification: {
      text: 'Pending Classification',
      icon: <ClockIcon className="h-4 w-4" />,
      color: 'text-gray-600 dark:text-gray-300',
    },
    classifying: {
      text: 'Classifying...',
      icon: <LoaderIcon className="h-4 w-4 animate-spin" />,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    classified: {
      text: 'Classified',
      icon: <CheckCircle2Icon className="h-4 w-4" />,
      color: 'text-green-600 dark:text-green-400',
    },
    rejected: {
      text: 'Rejected - Not a Bookkeeping Document',
      icon: <XCircleIcon className="h-4 w-4" />,
      color: 'text-orange-600 dark:text-orange-400',
    },
    classification_failed: {
      text: 'Classification Failed',
      icon: <XCircleIcon className="h-4 w-4" />,
      color: 'text-red-600 dark:text-red-400',
    },
  }[status];

  return (
    <div className={`flex items-center space-x-2 font-medium ${config.color}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    {children ? children : <p className="text-md font-semibold text-gray-800 dark:text-gray-100 break-words">{value || '-'}</p>}
  </div>
);


const ExtractedEntitiesDisplay: React.FC<{entities?: ExtractedEntities}> = ({ entities }) => {
    if (!entities || Object.keys(entities).length === 0) {
        return null;
    }

    const validEntities = Object.entries(entities).filter(([, value]) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0));

    if (validEntities.length === 0) return null;

    return (
        <div>
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Extracted Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {validEntities.map(([key, value]) => (
                    <DetailItem key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}>
                       <p className="text-md font-semibold text-gray-800 dark:text-gray-100 break-words">
                         {Array.isArray(value) ? value.join(', ') : String(value)}
                       </p>
                    </DetailItem>
                ))}
            </div>
        </div>
    );
};

interface DocumentDetailModalProps {
  doc: Document;
  onClose: () => void;
  onUpdateDocument: (docId: string, updates: Partial<Document>) => void;
  onRetryClassification: (docId: string) => void;
  onConfirmReview?: (docId: string) => void;
  onReclassifyByMachine?: (docId: string) => void;
  onReclassifyByHuman?: (docId: string, newType: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  doc,
  onClose,
  onUpdateDocument,
  onRetryClassification,
  onConfirmReview,
  onReclassifyByMachine,
  onReclassifyByHuman
}) => {
  const [showReclassifyDropdown, setShowReclassifyDropdown] = React.useState(false);
  const [selectedNewType, setSelectedNewType] = React.useState('');

  const handleRetry = () => {
    onRetryClassification(doc.id);
    onClose();
  };

  const handleConfirm = () => {
    if (onConfirmReview) {
      onConfirmReview(doc.id);
    }
  };

  const handleReclassifyMachine = () => {
    if (onReclassifyByMachine) {
      onReclassifyByMachine(doc.id);
    }
  };

  const handleReclassifyHuman = () => {
    if (selectedNewType && onReclassifyByHuman) {
      onReclassifyByHuman(doc.id, selectedNewType);
      setShowReclassifyDropdown(false);
      setSelectedNewType('');
    }
  };

  const isProcessing = doc.status === 'classifying';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden transform animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full md:w-1/2 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
          <img src={doc.url} alt={`Preview of ${doc.filename}`} className={`max-w-full max-h-full object-contain rounded-lg transition-opacity ${isProcessing ? 'opacity-20' : ''}`} />
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 text-center p-4 rounded-l-xl">
              <LoaderIcon className="h-12 w-12 text-yellow-500 animate-spin" />
              <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                Classifying Document...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI is analyzing the content.
              </p>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <div className="flex-shrink-0 flex justify-between items-start">
            <h2 id="document-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
              {doc.filename}
            </h2>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
              aria-label="Close document details"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 flex-grow space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</p>
              <DetailStatusBadge status={doc.status} />
              {doc.status === 'rejected' && (
                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/50 p-3 rounded-md space-y-3">
                  <div>
                    <p><strong>Rejection Reason:</strong></p>
                    <p className="mt-1">{doc.rejectionReason || doc.errorMessage || 'This image is not a bookkeeping or financial document.'}</p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    <span>Retry Classification</span>
                  </button>
                </div>
              )}
              {doc.status === 'classification_failed' && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 p-3 rounded-md space-y-3">
                  <p><strong>Reason:</strong> {doc.errorMessage}</p>
                   <button
                    onClick={handleRetry}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    <span>Retry Classification</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <DetailItem label="Document Type">
                 <select
                    value={doc.documentType || ''}
                    onChange={(e) => onUpdateDocument(doc.id, { documentType: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-md font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={doc.status !== 'classified' && doc.status !== 'classification_failed'}
                    aria-label="Manually classify document"
                 >
                    <option value="" disabled>Select type...</option>
                    {DOCUMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                 </select>
              </DetailItem>
              {doc.classificationConfidence && (
                 <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                    <div className="flex items-center space-x-2">
                        <PercentIcon className="h-4 w-4 text-gray-400"/>
                        <p className="text-md font-semibold text-gray-800 dark:text-gray-100">{doc.classificationConfidence.toFixed(1)}%</p>
                    </div>
                </div>
              )}
            </div>
            
            <ExtractedEntitiesDisplay entities={doc.extractedEntities} />

            {/* Review Section - Only show for classified documents */}
            {doc.status === 'classified' && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Document Review</h3>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                  {/* Current Review Status */}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Review Status</p>
                    <div className="flex items-center space-x-2">
                      {doc.reviewStatus === 'not_yet' && (
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Not Yet Reviewed
                        </span>
                      )}
                      {doc.reviewStatus === 'confirmed' && (
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100">
                          ✓ Confirmed
                        </span>
                      )}
                      {doc.reviewStatus === 'reclassified_by_human' && (
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          Reclassified by Human
                        </span>
                      )}
                      {doc.reviewStatus === 'reclassified_by_machine' && (
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                          Reclassified by AI
                        </span>
                      )}
                    </div>
                    {doc.reviewedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Reviewed {new Date(doc.reviewedAt).toLocaleString()}
                        {doc.reviewedBy && ` • by ${doc.reviewedBy}`}
                      </p>
                    )}
                  </div>

                  {/* Review Action Buttons */}
                  {!showReclassifyDropdown ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md flex items-center justify-center space-x-2 transition-colors"
                      >
                        <CheckCircle2Icon className="h-4 w-4" />
                        <span>Confirm</span>
                      </button>

                      <button
                        onClick={handleReclassifyMachine}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md flex items-center justify-center space-x-2 transition-colors"
                      >
                        <RefreshCwIcon className="h-4 w-4" />
                        <span>AI Reclassify</span>
                      </button>

                      <button
                        onClick={() => setShowReclassifyDropdown(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md flex items-center justify-center space-x-2 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Manual Reclassify</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select new document type:</p>
                      <select
                        value={selectedNewType}
                        onChange={(e) => setSelectedNewType(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select type...</option>
                        {DOCUMENT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleReclassifyHuman}
                          disabled={!selectedNewType}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => {
                            setShowReclassifyDropdown(false);
                            setSelectedNewType('');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">File Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="File Size" value={`${(doc.size / 1024).toFixed(1)} KB`} />
              <DetailItem label="MIME Type" value={doc.mimetype} />
              <DetailItem label="Received At" value={new Date(doc.uploadedAt).toLocaleString()} />
              <DetailItem label="Classified At" value={doc.classifiedAt ? new Date(doc.classifiedAt).toLocaleString() : undefined} />
            </div>
          </div>

          <div className="mt-6 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
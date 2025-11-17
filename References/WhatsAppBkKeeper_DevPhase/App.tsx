import React, { useState, useEffect, useCallback, useMemo } from 'react';

import type { Document, ConnectionState, QueueStatus, Instruction } from './types';
import { INITIAL_DOCUMENTS, DOCUMENT_TYPES } from './constants';
import { API_URL } from './config';
import { Header } from './components/Header';
import { ConnectionStatus } from './components/ConnectionStatus';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { DocumentQueue } from './components/DocumentQueue';
import { DocumentList } from './components/DocumentList';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { InstructionsPanel } from './components/InstructionsPanel';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { Notification } from './components/Notification';

// Utility function for async sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [qrCode, setQrCode] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [instructions, setInstructions] = useState<Instruction[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    const lowerCommand = command.toLowerCase();

    // Search command
    const searchMatch = lowerCommand.match(/search for (.+)/);
    if (searchMatch && searchMatch[1]) {
      setSearchTerm(searchMatch[1]);
      showNotification(`Searching for "${searchMatch[1]}"`);
      return;
    }

    // Filter by type command
    const filterMatch = lowerCommand.match(/filter by (.+)|show (.+)s?/);
    if (filterMatch) {
      const type = (filterMatch[1] || filterMatch[2] || '').trim();
      const foundType = DOCUMENT_TYPES.find(dt => dt.toLowerCase() === type);
      if (foundType) {
        setSelectedType(foundType);
        showNotification(`Filtering by type: ${foundType}`);
      } else {
        showNotification(`Could not find document type "${type}"`);
      }
      return;
    }
    
    // Select document command
    const selectMatch = lowerCommand.match(/(select|open) document number (\d+)|(select|open) document (\d+)/);
    if (selectMatch) {
        const docNumber = parseInt(selectMatch[2] || selectMatch[4], 10);
        if (docNumber > 0 && docNumber <= filteredDocuments.length) {
            setSelectedDocument(filteredDocuments[docNumber - 1]);
            showNotification(`Opening document #${docNumber}`);
        } else {
            showNotification(`Document #${docNumber} not found.`);
        }
        return;
    }
    
    // Close document command
    if (lowerCommand.includes('close document')) {
        if(selectedDocument) {
            setSelectedDocument(null);
            showNotification('Closing document.');
        }
        return;
    }

    // Clear commands
    if (lowerCommand.includes('clear all') || lowerCommand.includes('clear filters')) {
        handleClearFilters();
        showNotification('All filters cleared.');
        return;
    }
    if (lowerCommand.includes('clear search')) {
        setSearchTerm('');
        showNotification('Search cleared.');
        return;
    }
    if (lowerCommand.includes('clear filter')) {
        setSelectedType('');
        showNotification('Type filter cleared.');
        return;
    }
    
    showNotification(`Command not recognized: "${command}"`);
  };

  const { isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition({
    onResult: handleVoiceCommand,
  });

  // Connect to backend and poll for status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);
        const data = await response.json();

        // Map backend states to frontend states
        if (data.connectionState === 'qr_ready') {
          setConnectionState('connecting');
          setQrCode(data.qrCode || '');
        } else if (data.connectionState === 'connected') {
          setConnectionState('connected');
          setQrCode('');
        } else if (data.connectionState === 'connecting') {
          setConnectionState('connecting');
          setQrCode('');
        } else {
          setConnectionState('connecting');
          setQrCode('');
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setConnectionState('connecting');
      }
    };

    // Poll every 2 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  // Poll for received documents from WhatsApp
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const pollDocuments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/documents`);
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
          // Convert backend documents to frontend format
          const newDocs = data.documents.map((doc: any) => ({
            id: doc.id,
            filename: doc.filename,
            url: `data:${doc.mimetype};base64,${doc.data}`,
            thumbnailUrl: `data:${doc.mimetype};base64,${doc.data}`,
            mimetype: doc.mimetype,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
            status: 'pending_classification',
            reviewStatus: 'not_yet',
            from: doc.from
          }));

          // Add new documents that aren't already in the list
          setDocuments(prevDocs => {
            const existingIds = new Set(prevDocs.map(d => d.id));
            const docsToAdd = newDocs.filter((d: any) => !existingIds.has(d.id));
            return [...docsToAdd, ...prevDocs];
          });
        }
      } catch (error) {
        console.error('Error polling documents:', error);
      }
    };

    pollDocuments();
    const interval = setInterval(pollDocuments, 3000);

    return () => clearInterval(interval);
  }, [connectionState]);

  // Real document processing using Gemini AI
  useEffect(() => {
    const processDocument = async (docId: string) => {
        // Set status to classifying
        setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status: 'classifying' } : d));

        try {
          // Call the real classification API
          const response = await fetch(`${API_URL}/api/classify/${docId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Classification failed');
          }

          const data = await response.json();
          const { classification } = data;

          // Check if it's a valid bookkeeping document
          if (classification.isBookkeepingDocument) {
            // Valid bookkeeping document - update with extracted data
            setDocuments(docs => docs.map(d => d.id === docId ? {
                ...d,
                status: 'classified',
                documentType: classification.documentType,
                classificationConfidence: classification.confidence,
                classifiedAt: new Date().toISOString(),
                // Only reset reviewStatus if it's not already a reclassification
                reviewStatus: d.reviewStatus === 'reclassified_by_machine' ? 'reclassified_by_machine' : (d.reviewStatus || 'not_yet'),
                extractedEntities: {
                    documentTitle: classification.extractedData?.documentTitle,
                    vendor: classification.extractedData?.vendor,
                    totalAmount: classification.extractedData?.totalAmount,
                    date: classification.extractedData?.date,
                    invoiceNumber: classification.extractedData?.invoiceNumber,
                    paymentMethod: classification.extractedData?.paymentMethod,
                    keywords: classification.extractedData?.keywords,
                }
            } : d));

            showNotification(`✅ Document classified as ${classification.documentType}`);
          } else {
            // Not a bookkeeping document - reject it
            setDocuments(docs => docs.map(d => d.id === docId ? {
                ...d,
                status: 'rejected',
                rejectionReason: classification.rejectionReason || 'Not a bookkeeping document',
                errorMessage: `Rejected: ${classification.imageType || 'Not a financial document'}`,
            } : d));

            showNotification(`❌ Document rejected: ${classification.imageType || 'Not a bookkeeping document'}`);
          }
        } catch (error) {
          console.error('Classification error:', error);
          // Handle classification failure
          setDocuments(docs => docs.map(d => d.id === docId ? {
              ...d,
              status: 'classification_failed',
              errorMessage: error.message || 'AI classification failed. Please try again.',
          } : d));

          showNotification(`⚠️ Classification failed: ${error.message}`);
        }
    };

    const pendingDoc = documents.find(d => d.status === 'pending_classification');
    if (pendingDoc) {
        processDocument(pendingDoc.id);
    }

  }, [documents]);

  const queueStatus: QueueStatus = useMemo(() => {
    return documents.reduce((acc, doc) => {
        if (doc.status === 'pending_classification') acc.queued++;
        else if (doc.status === 'classifying') acc.processing++;
        else if (doc.status === 'classified') acc.completed++;
        else if (doc.status === 'classification_failed') acc.failed++;
        else if (doc.status === 'rejected') acc.rejected++;
        return acc;
    }, { queued: 0, processing: 0, completed: 0, failed: 0, rejected: 0 });
  }, [documents]);
  
  const handleUpdateDocument = useCallback((docId: string, updates: Partial<Document>) => {
    setDocuments(docs => 
      docs.map(d => d.id === docId ? { ...d, ...updates, isManuallyClassified: true } : d)
    );
  }, []);
  
  const handleRetryClassification = useCallback((docId: string) => {
    setDocuments(docs =>
      docs.map(d =>
        d.id === docId
          ? { ...d, status: 'pending_classification', errorMessage: undefined }
          : d
      )
    );
  }, []);

  const handleConfirmReview = useCallback((docId: string) => {
    setDocuments(docs =>
      docs.map(d =>
        d.id === docId
          ? {
              ...d,
              reviewStatus: 'confirmed',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'human'
            }
          : d
      )
    );
    showNotification('✅ Document confirmed');
  }, []);

  const handleReclassifyByMachine = useCallback(async (docId: string) => {
    // Set status to reclassifying
    setDocuments(docs =>
      docs.map(d =>
        d.id === docId
          ? {
              ...d,
              status: 'classifying',
              reviewStatus: 'reclassified_by_machine',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'machine'
            }
          : d
      )
    );

    // Trigger re-classification (will be picked up by classification effect)
    setTimeout(() => {
      setDocuments(docs =>
        docs.map(d =>
          d.id === docId
            ? { ...d, status: 'pending_classification' }
            : d
        )
      );
    }, 100);

    showNotification('🤖 Triggering AI reclassification...');
  }, []);

  const handleReclassifyByHuman = useCallback((docId: string, newType: string) => {
    setDocuments(docs =>
      docs.map(d =>
        d.id === docId
          ? {
              ...d,
              documentType: newType,
              reviewStatus: 'reclassified_by_human',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'human',
              isManuallyClassified: true
            }
          : d
      )
    );
    showNotification(`✏️ Document reclassified as ${newType}`);
  }, []);

  const handleSubmitInstruction = useCallback(async (userInput: string) => {
    const instructionId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new instruction with processing status
    const newInstruction: Instruction = {
      id: instructionId,
      userInput,
      comprehendedCommand: '',
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    setInstructions(prev => [newInstruction, ...prev]);

    try {
      // Call backend to process instruction with OpenAI
      const response = await fetch(`${API_URL}/api/process-instruction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction: userInput })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process instruction');
      }

      const data = await response.json();

      // Update instruction with comprehended command
      setInstructions(prev =>
        prev.map(inst =>
          inst.id === instructionId
            ? {
                ...inst,
                status: 'completed',
                comprehendedCommand: data.comprehendedCommand,
                processedAt: new Date().toISOString(),
              }
            : inst
        )
      );

      showNotification(`✅ Instruction processed successfully`);
    } catch (error: any) {
      console.error('Error submitting instruction:', error);

      // Update instruction with error
      setInstructions(prev =>
        prev.map(inst =>
          inst.id === instructionId
            ? {
                ...inst,
                status: 'failed',
                error: error.message || 'Failed to process instruction',
                processedAt: new Date().toISOString(),
              }
            : inst
        )
      );

      showNotification(`❌ Failed to process instruction: ${error.message}`);
    }
  }, []);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
  };
  
  const filteredDocuments = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return documents.filter(doc => {
      const matchesType = selectedType ? doc.documentType === selectedType : true;
      if (!matchesType) return false;

      if (!lowerSearchTerm) return true;

      const entities = doc.extractedEntities || {};
      const searchableContent = [
        doc.filename,
        doc.documentType,
        entities.vendor,
        entities.documentTitle,
        entities.totalAmount?.toString(),
        entities.invoiceNumber,
        ...(entities.keywords || [])
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableContent.includes(lowerSearchTerm);

    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [documents, searchTerm, selectedType]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100">
      <Header
        isListening={isListening}
        onToggleListening={isListening ? stopListening : startListening}
        hasRecognitionSupport={hasRecognitionSupport}
      />
      <Notification message={notification} onClose={() => setNotification(null)} />
      <main className="container mx-auto p-4 md:p-6">
        {connectionState !== 'connected' ? (
          <div className="max-w-md mx-auto space-y-4 mt-6">
            <ConnectionStatus state={connectionState} />
            {qrCode ? (
              <QRCodeDisplay qrCode={qrCode} loading={false} />
            ) : (
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="animate-pulse">
                  <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 mx-auto flex items-center justify-center rounded">
                    <span className="text-gray-500 dark:text-gray-400">Generating QR Code...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column */}
            <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
              <DocumentQueue status={queueStatus} />
              <InstructionsPanel
                instructions={instructions}
                onSubmitInstruction={handleSubmitInstruction}
              />
            </div>
            {/* Right Column */}
            <div className="w-full md:w-2/3 lg:w-3/4">
              <DocumentList
                documents={filteredDocuments}
                onDocumentSelect={setSelectedDocument}
                onRetryClassification={handleRetryClassification}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                selectedType={selectedType}
                onSelectedTypeChange={setSelectedType}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        )}
      </main>
      {selectedDocument && (
        <DocumentDetailModal
          doc={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdateDocument={handleUpdateDocument}
          onRetryClassification={handleRetryClassification}
          onConfirmReview={handleConfirmReview}
          onReclassifyByMachine={handleReclassifyByMachine}
          onReclassifyByHuman={handleReclassifyByHuman}
        />
      )}
    </div>
  );
};

export default App;

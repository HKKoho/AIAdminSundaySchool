import React, { useState } from 'react';
import type { Instruction } from '../types';
import { SendIcon, LoaderIcon, CheckCircle2Icon, XCircleIcon, BookOpenIcon } from './icons';

interface InstructionsPanelProps {
  instructions: Instruction[];
  onSubmitInstruction: (instruction: string) => void;
}

export const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ instructions, onSubmitInstruction }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onSubmitInstruction(inputValue.trim());
    setInputValue('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">AI Bookkeeper Instructions</h2>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Give instructions to the AI bookkeeper. GPT-4o will comprehend your instructions and prepare them as commands for automated bookkeeping tasks.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="E.g., Categorize all invoices from ACME Corp as office expenses..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <LoaderIcon className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <SendIcon className="h-5 w-5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Instructions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {instructions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpenIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No instructions yet. Start by giving the AI bookkeeper a command!</p>
          </div>
        ) : (
          instructions.map((instruction) => (
            <div
              key={instruction.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
            >
              {/* User Input */}
              <div className="mb-2">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Your Instruction</span>
                  <div className="flex items-center space-x-2">
                    {instruction.status === 'processing' && (
                      <span className="flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                        <span>Processing</span>
                      </span>
                    )}
                    {instruction.status === 'completed' && (
                      <span className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2Icon className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                    )}
                    {instruction.status === 'failed' && (
                      <span className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
                        <XCircleIcon className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-100">{instruction.userInput}</p>
              </div>

              {/* AI Comprehended Command */}
              {instruction.status === 'completed' && instruction.comprehendedCommand && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1 block">
                    AI Comprehended Command
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                    {instruction.comprehendedCommand}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {instruction.status === 'failed' && instruction.error && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1 block">
                    Error
                  </span>
                  <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {instruction.error}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {new Date(instruction.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { DOCUMENT_TYPES } from '../constants';
import { SearchIcon, FilterIcon, XIcon } from './icons';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedType: string;
  onSelectedTypeChange: (type: string) => void;
  onClearFilters: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedType,
  onSelectedTypeChange,
  onClearFilters
}) => {
  const isFilterActive = searchTerm !== '' || selectedType !== '';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search documents by keyword, vendor, amount..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          aria-label="Search documents"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      <div className="relative w-full sm:w-auto sm:min-w-[200px]">
        <select
          value={selectedType}
          onChange={(e) => onSelectedTypeChange(e.target.value)}
          className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
          aria-label="Filter by document type"
        >
          <option value="">All Document Types</option>
          {DOCUMENT_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
      {isFilterActive && (
        <button
          onClick={onClearFilters}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
          aria-label="Clear all filters"
        >
            <XIcon className="h-4 w-4" />
            <span>Clear</span>
        </button>
      )}
    </div>
  );
};
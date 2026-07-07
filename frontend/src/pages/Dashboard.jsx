import React, { useState, useContext } from 'react';
import Layout from '../components/Layout';
import ProjectListView from '../components/ProjectListView';
import CreateIssueModal from '../components/CreateIssueModal';
import { Plus, LayoutGrid, List, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataContext } from '../context/DataContext';

export default function Dashboard() {
  const { activeBoard, searchQuery, setSearchQuery, issuePage, setIssuePage, issuePagination } = useContext(DataContext);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {activeBoard ? activeBoard.name : 'No Board Selected'}
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Search Input[cite: 7] */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-purple-500 w-64"
              />
            </div>

            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-purple-700 transition shadow-sm"
              disabled={!activeBoard}
            >
              <Plus size={16} /> New Issue
            </button>
          </div>
        </div>

        <div className="flex justify-between border-b border-gray-200 pb-px">
          <div className="flex gap-1">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 border-b-2 border-purple-600 bg-white">
              <List size={16} /> The Plan
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              <LayoutGrid size={16} /> Board Backlog
            </button>
          </div>
          
          {/* Pagination Controls */}
          {issuePagination.total > 0 && (
            <div className="flex items-center gap-3 text-sm text-gray-600 py-2 px-4">
              <span>Page {issuePagination.page} of {issuePagination.pages}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setIssuePage(p => Math.max(1, p - 1))}
                  disabled={issuePage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setIssuePage(p => Math.min(issuePagination.pages, p + 1))}
                  disabled={issuePage === issuePagination.pages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectListView />
      
      {isIssueModalOpen && <CreateIssueModal onClose={() => setIsIssueModalOpen(false)} />}
    </Layout>
  );
}
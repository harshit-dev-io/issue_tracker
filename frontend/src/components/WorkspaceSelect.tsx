import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { useAxiosPrivate } from '../hooks/useAxiosPrivate';

interface WorkspaceSelectProps {
  onError: (err: any) => void;
}

export default function WorkspaceSelect({ onError }: WorkspaceSelectProps) {
  const wsContext = useContext(WorkspaceContext);
  const axiosPrivate = useAxiosPrivate();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  if (!wsContext) return null;
  const { activeWorkspaceId, workspaces, setActiveWorkspaceId, refreshWorkspaces } = wsContext;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      await axiosPrivate.post('/workspace/create/', { name: newWorkspaceName });
      setNewWorkspaceName('');
      await refreshWorkspaces();
    } catch (err: any) {
      onError(err.response?.data?.detail || 'Failed to create workspace');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-6 bg-gray-900 border border-gray-800 p-4 rounded-lg">
      <div className="flex flex-col min-w-[200px]">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Selected Scope Context</label>
        <select
          value={activeWorkspaceId || ''}
          onChange={(e) => setActiveWorkspaceId(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleCreateWorkspace} className="flex items-end gap-2 flex-1 min-w-[280px]">
        <div className="flex flex-col flex-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Spawn Core Workspace</label>
          <input
            type="text" placeholder="Unique ID / Name Cluster"
            value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2 rounded transition shadow">
          Create
        </button>
      </form>
    </div>
  );
}
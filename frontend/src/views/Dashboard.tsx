import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import WorkspaceSelect from '../components/WorkspaceSelect';
import KanbanBoard from '../components/KanbanBoard';
import ErrorBanner from '../components/ErrorBanner';
import { useAxiosPrivate } from '../hooks/useAxiosPrivate';
import { WorkspaceContext } from '../context/WorkspaceContext';

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const wsContext = useContext(WorkspaceContext);
  const axiosPrivate = useAxiosPrivate();
  const [globalError, setGlobalError] = useState<any | null>(null);

  // Membership form states
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsContext?.activeWorkspaceId) return;
    try {
      await axiosPrivate.post('/membership/create/', {
        email,
        role,
        workspace_id: wsContext.activeWorkspaceId
      });
      setEmail('');
      alert('Member added successfully!');
    } catch (err: any) {
      setGlobalError(err.response?.data?.detail || 'Failed to add member');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Global Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-mono font-bold text-white tracking-tight">Backend Contract Execution Suite</h1>
          <p className="text-xs text-gray-400 mt-0.5">Asynchronous API Validation Portal</p>
        </div>
        <button 
          onClick={() => auth?.logout()} 
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition"
        >
          Disconnect
        </button>
      </header>

      {/* Global Error Reporting Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-4">
        <ErrorBanner error={globalError} onClear={() => setGlobalError(null)} />
      </div>

      {/* Configuration & Workspace Panel */}
      <div className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <WorkspaceSelect onError={(err) => setGlobalError(err)} />
          </div>
          
          {/* Memberships Quick Setup */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invite Workspace Member</h3>
            <form onSubmit={handleAddMember} className="flex flex-col gap-2">
              <input 
                type="email" placeholder="collaborator@email.com" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <select 
                  value={role} onChange={e => setRole(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5 flex-1"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-1.5 rounded transition">
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Primary Workspace Board Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        <div className="bg-gray-950 rounded-xl border border-gray-800 shadow-xl overflow-hidden">
          <KanbanBoard onError={(err) => setGlobalError(err)} />
        </div>
      </main>
    </div>
  );
}
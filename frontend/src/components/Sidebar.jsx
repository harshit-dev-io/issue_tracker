import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Plus, ChevronDown, FolderPlus, UserPlus } from 'lucide-react';
import CreateBoardModal from './CreateBoardModal';
import CreateMembershipModal from './CreateMembershipModal';

export default function Sidebar() {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, boards, activeBoard, setActiveBoard } = useContext(DataContext);
  const { logout } = useContext(AuthContext);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const handleCreateWorkspace = async () => {
    const name = window.prompt("Enter new Workspace name:");
    if (name && name.trim() !== "") {
      await createWorkspace(name);
    }
  };

  return (
    <div className="w-64 bg-gray-50 text-gray-800 flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <select 
            className="w-full bg-white text-gray-800 p-2 border border-gray-300 rounded appearance-none cursor-pointer outline-none focus:border-purple-500 text-sm font-medium"
            value={activeWorkspace?.id || ''}
            onChange={(e) => setActiveWorkspace(workspaces.find(w => w.id === e.target.value))}
          >
            {workspaces.length === 0 && <option value="">No Workspaces</option>}
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-gray-500" />
        </div>
        
        <button 
          onClick={handleCreateWorkspace}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 w-full transition-colors"
        >
          <FolderPlus size={16} /> Create Workspace
        </button>
        <button 
          onClick={() => setIsMemberModalOpen(true)}
          disabled={!activeWorkspace}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 w-full transition-colors disabled:opacity-50"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Boards</h2>
          <button onClick={() => setIsBoardModalOpen(true)} disabled={!activeWorkspace} className="text-gray-400 hover:text-purple-600"><Plus size={16} /></button>
        </div>
        <ul className="space-y-1">
          {boards.map(board => (
            <li key={board.id}>
              <button 
                onClick={() => setActiveBoard(board)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeBoard?.id === board.id ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                # {board.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 w-full text-sm transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {isBoardModalOpen && <CreateBoardModal onClose={() => setIsBoardModalOpen(false)} />}
      {isMemberModalOpen && <CreateMembershipModal onClose={() => setIsMemberModalOpen(false)} />}
    </div>
  );
}
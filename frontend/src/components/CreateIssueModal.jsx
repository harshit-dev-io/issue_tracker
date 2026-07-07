import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';

export default function CreateIssueModal({ onClose }) {
  const { activeBoard, labels, members, createIssue, createLabel } = useContext(DataContext);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  
  // NEW: State for selected assignees
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [priority, setPriority] = useState('low');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBoard) return;
    await createIssue({
      name,
      content,
      board_id: activeBoard.id,
      label: selectedLabels,
      assignees: selectedAssignees,
      priority // NEW: Pass priority to the API
    });
    onClose();
  };

  const toggleLabel = (id) => {
    setSelectedLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  // NEW: Function to toggle assignees
  const toggleAssignee = (userId) => {
    setSelectedAssignees(prev => prev.includes(userId) ? prev.filter(a => a !== userId) : [...prev, userId]);
  };

  const handleCreateLabel = async () => {
    if (newLabelName.trim()) {
      await createLabel(newLabelName.trim());
      setNewLabelName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Create New Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-purple-500 h-24" />
          </div>
          {/* NEW: Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-purple-500 bg-white capitalize"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          {/* NEW: Assignees Selection */}
          {/* Change member.user_id to member.user in BOTH places here */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {members.length === 0 && <span className="text-xs text-gray-400">No members in workspace.</span>}
              {members.map(member => (
                <button 
                  type="button" 
                  key={member.user}
                  onClick={() => toggleAssignee(member.user)} 
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${selectedAssignees.includes(member.user) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`} 
                >
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]">
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {member.name || 'User'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {labels.map(lbl => (
                <button 
                  type="button" 
                  key={lbl.id}
                  onClick={() => toggleLabel(lbl.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedLabels.includes(lbl.id) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
                >
                  {lbl.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                placeholder="New label name..." 
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1 p-1.5 text-sm border rounded outline-none focus:border-purple-500"
              />
              <button 
                type="button" 
                onClick={handleCreateLabel}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 border border-gray-200"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Create Issue</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';

export default function EditIssueModal({ issue, onClose }) {
  const { labels, members, updateIssue } = useContext(DataContext);
  
  const [name, setName] = useState(issue.name);
  const [content, setContent] = useState(issue.content || '');
  const [status, setStatus] = useState(issue.status);
  const [priority, setPriority] = useState(issue.priority || 'low');
  
  // Initialize from existing objects mapping to raw IDs
  const [selectedLabels, setSelectedLabels] = useState(issue.label?.map(l => l.id) || []);
  const [selectedAssignees, setSelectedAssignees] = useState(issue.assignees?.map(a => a.id) || []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await updateIssue(issue.id, {
      name,
      content,
      status,
      priority,
      label: selectedLabels,     // Handled as array of IDs on the backend rewrite
      assignees: selectedAssignees // Handled as array of IDs on the backend rewrite
    });
    
    onClose();
  };

  const toggleLabel = (id) => {
    setSelectedLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleAssignee = (userId) => {
    setSelectedAssignees(prev => prev.includes(userId) ? prev.filter(a => a !== userId) : [...prev, userId]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-gray-800">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-purple-500 h-24" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded outline-none bg-white capitalize">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full p-2 border rounded outline-none bg-white capitalize">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {members.map(member => (
                <button 
                  type="button" key={member.user} onClick={() => toggleAssignee(member.user)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedAssignees.includes(member.user) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map(lbl => (
                <button 
                  type="button" key={lbl.id} onClick={() => toggleLabel(lbl.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedLabels.includes(lbl.id) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  {lbl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
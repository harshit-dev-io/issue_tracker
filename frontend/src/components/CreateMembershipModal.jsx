import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';

export default function CreateMembershipModal({ onClose }) {
  const { createMembership } = useContext(DataContext);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member'); // Default role matching ENUM[cite: 6]
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMembership(email, role);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to invite member");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-gray-900">
        <h2 className="text-xl font-bold mb-4">Invite Member to Workspace</h2>
        
        {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
            <input 
              type="email" 
              placeholder="user@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-purple-500 bg-white capitalize"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Invite</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';

export default function CreateBoardModal({ onClose }) {
  const { createBoard } = useContext(DataContext);
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBoard(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-gray-900">
        <h2 className="text-xl font-bold mb-4">Create New Board</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Board Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="w-full p-2 border border-gray-300 rounded mb-6 outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create Board</button>
          </div>
        </form>
      </div>
    </div>
  );
}
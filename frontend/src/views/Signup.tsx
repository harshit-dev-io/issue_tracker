import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/auth/signup/', { name, email, password });
      setMessage('Registration successful! Redirecting to setup view...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Account generation failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleSignup} className="flex flex-col gap-4 w-96 p-8 bg-white border shadow-sm rounded">
        <h2 className="text-xl font-bold text-gray-800">Account Registration</h2>
        {error && <div className="p-2.5 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
        {message && <div className="p-2.5 bg-green-100 text-green-700 text-sm rounded">{message}</div>}
        
        <input
          type="text" placeholder="Full Name" required
          className="border p-2 text-sm" value={name} onChange={e => setName(e.target.value)}
        />
        <input
          type="email" placeholder="Email Address" required
          className="border p-2 text-sm" value={email} onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password" placeholder="Secure Password" required
          className="border p-2 text-sm" value={password} onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded text-sm font-medium hover:bg-blue-700 transition">
          Sign Up
        </button>
        <span className="text-xs text-center text-gray-500">
          Existing account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </span>
      </form>
    </div>
  );
}
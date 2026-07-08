import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link here
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import type { TokenResponse } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post<TokenResponse>('/auth/login/', { email, password });
      auth?.setAuth(data.access_token, data.refresh_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80 p-6 bg-white border rounded shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Login</h2>
        {error && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
        
        <input 
          type="email" placeholder="Email" required 
          className="border p-2 rounded text-sm text-gray-900 bg-white" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Password" required 
          className="border p-2 rounded text-sm text-gray-900 bg-white" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
        />
        
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium text-sm transition">
          Login
        </button>

        {/* This was the missing navigation toggle */}
        <span className="text-xs text-center text-gray-500 mt-2">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </span>
      </form>
    </div>
  );
}
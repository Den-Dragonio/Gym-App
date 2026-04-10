import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide username and password.');
      return;
    }
    try {
      await login(username.toLowerCase(), password);
      navigate('/');
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
         setError('Incorrect password or username. Please check your spelling.');
      } else if (code === 'auth/user-not-found') {
         setError('Account not found. Please register first.');
      } else if (code === 'auth/too-many-requests') {
         setError('Too many failed attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
         setError('Network error. Check your internet connection.');
      } else if (code === 'auth/configuration-not-found') {
         setError('Server connection failed. Is the database set up?');
      } else {
         setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="card glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--color-primary)', padding: '1rem', borderRadius: '50%', color: 'white' }}>
            <LogIn size={32} />
          </div>
        </div>
        
        <h2 style={{ textAlign: 'center', margin: '0 0 2rem 0' }}>{t('login')}</h2>
        
        {error && <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="@alex_lifter" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}>
            {t('login')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create User</Link>
        </p>
      </div>
    </div>
  );
};

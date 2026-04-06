import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  BarChart3, 
  Users, 
  Globe, 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff,
  Zap,
  Activity,
  ArrowUpRight,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useNeuralTheme } from '../context/ThemeContext';
import logo from '../assets/Favicon.webp';
import './Welcome.css';

const Commander = ({ setView }) => {
  const { currentTheme } = useNeuralTheme();
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CORRECT_PASSWORD = import.meta.env.VITE_COPY_PAGE_PASSWORD || 'admin123';

  const handleAuth = async (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
      setError('');
      fetchCommanderIntelligence();
    } else {
      setError('Invalid Access Credentials');
      setPassword('');
    }
  };

  const fetchCommanderIntelligence = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin?channel=stats', {
        headers: {
            'Authorization': `Bearer ${password}`
        }
      });
      const data = await response.json();
      if (response.ok) {
          setStats(data);
      } else {
          setError(data.error);
      }
    } catch (err) {
      console.error('Commander Error:', err);
      setError('Failed to reach orbital intelligence.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content" style={{ maxWidth: '400px' }}>
          <div className="welcome-logo-container" style={{ borderColor: '#ef4444' }}>
            <img src={logo} alt="Company Logo" className="welcome-logo" />
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem', letterSpacing: '4px' }}>COMMANDER ACCESS</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '2rem' }}>IDENTIFY PROTOCOL BYPASS CREDENTIALS</p>
          
          <form onSubmit={handleAuth} style={{ width: '100%' }}>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="COMMANDER KEY"
                style={{
                  width: '100%',
                  padding: '14px 45px 14px 15px',
                  background: 'rgba(239, 68, 68, 0.03)',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(239, 68, 68, 0.1)'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="submit-btn" style={{ background: '#ef4444' }}>
              <Shield size={16} style={{ marginRight: '8px' }} /> Initialize Commander Terminal
            </button>
          </form>
          <button onClick={() => setView('home')} style={{ marginTop: '2rem', background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={14} /> Return to Public Node
          </button>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
        <div className="welcome-screen">
            <div className="welcome-content">
                <div className="loading-spinner" style={{ borderColor: '#ef4444', borderTopColor: 'transparent' }}></div>
                <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '2px' }}>SYNCING GLOBAL NODES...</p>
            </div>
        </div>
    );
  }

  const { totalSubscribers, verifiedNodes, pendingNodes, growthLast7Days, latestIssue, timezoneDistribution, totalOpens, activeNodes, reactionCounts = { happy: 0, neutral: 0, sad: 0 } } = stats.stats;
  const engagementRate = totalSubscribers > 0 ? Math.round((activeNodes / totalSubscribers) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: '40px 20px', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
          <div>
            <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>// COMMAND_TERMINAL v2.5</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-1.5px' }}>Intelligence Oversight.</h1>
          </div>
          <button 
            onClick={() => setView('dashboard')} 
            className="secondary-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}
          >
            <ArrowLeft size={16} /> Exit Terminal
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard title="Total Growth" value={totalSubscribers} icon={<Users size={20} />} trend={`+${growthLast7Days} New Nodes`} />
          <StatCard title="Active Nodes" value={activeNodes} icon={<Activity size={20} />} trend={`${engagementRate}% Engagement`} />
          <StatCard title="Signals Read" value={totalOpens} icon={<Zap size={20} />} color="#10b981" />
          <StatCard title="Latest Issue" value={latestIssue} icon={<Shield size={20} />} color="#ef4444" />
        </div>

        {/* Feedback Pulse */}
        <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={18} color="#ef4444" /> Feedback Pulse
          </h3>
          {(() => {
            const totalReactions = reactionCounts.happy + reactionCounts.neutral + reactionCounts.sad;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { emoji: '\u{1F60D}', label: 'Loved it', count: reactionCounts.happy, color: '#10b981' },
                  { emoji: '\u{1F610}', label: 'It was ok', count: reactionCounts.neutral, color: '#f59e0b' },
                  { emoji: '\u{1F61E}', label: 'Not great', count: reactionCounts.sad, color: '#ef4444' },
                ].map((r, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{r.emoji}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{r.count}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>{r.label}</div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: totalReactions > 0 ? `${(r.count / totalReactions) * 100}%` : '0%', height: '100%', background: r.color, borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
          <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Globe size={18} color="#ef4444" /> Node Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {timezoneDistribution.map((tz, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{tz.tz.split('/').pop()}</span>
                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', margin: '0 20px', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${(tz.count / totalSubscribers) * 100}%`, height: '100%', background: '#ef4444' }}></div>
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>{tz.count}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Activity size={18} color="#ef4444" /> Recent Transitions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.rawNodes.slice(0, 8).map((node, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', fontSize: '0.85rem' }}>
                        <span style={{ color: '#cbd5e1' }}>{node.email}</span>
                        <span style={{ color: node.is_verified ? '#10b981' : '#f59e0b', fontWeight: '800', fontSize: '0.7rem' }}>
                            {node.is_verified ? 'VERIFIED' : 'PENDING'}
                        </span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color = '#ef4444' }) => (
  <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
    <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        {icon} {title}
    </div>
    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', marginBottom: trend ? '8px' : 0 }}>
        {value}
    </div>
    {trend && (
        <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            <ArrowUpRight size={14} /> {trend}
        </div>
    )}
  </div>
);

export default Commander;

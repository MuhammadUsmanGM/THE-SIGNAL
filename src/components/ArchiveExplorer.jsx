import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, ShieldAlert, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import logo from '../assets/Favicon.webp';
import './Feedback.css';
import './ArchiveExplorer.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ArchiveExplorer = ({ setView, setSelectedIssueId, email }) => {
  const [archives, setArchives] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeVault = async () => {
      await fetchUserData();
      await fetchArchives();
    };
    initializeVault();
  }, [email]);

  const fetchUserData = async () => {
    if (!email) return;
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('created_at, referral_count')
        .eq('email', email)
        .single();
      
      if (data) setUserData(data);
    } catch (err) {
      console.error('Error fetching subscriber for archive:', err);
    }
  };

  const fetchArchives = async () => {
    try {
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000));
      const fetchPromise = supabase
        .from('newsletter_archive')
        .select('id, week_date, created_at, is_pro')
        .order('id', { ascending: false });

      const [_, { data, error }] = await Promise.all([minLoadTime, fetchPromise]);

      if (error) throw error;
      setArchives(data || []);
    } catch (err) {
      console.error('Error fetching archives:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hybrid Calculation Logic
  const canAccess = (item, index) => {
    // 0. Public items are always accessible
    if (!item.is_pro) return true;
    
    // 1. Referral Master Logic: (3+ Referrals unlocks entire archive)
    const isReferralMaster = userData?.referral_count >= 3;
    if (isReferralMaster) return true;

    // 2. Loyalty (Drip) Logic: (1 Week = 1 Archive Issue Unlocked starting from bottom or specific count)
    // We treat 'index' carefully here from the fetched list (most recent first)
    // For a simpler loyalty rule: Unlock 1 Pro issue per week of subscription age.
    const joinDate = userData ? new Date(userData.created_at) : new Date();
    const subbedWeeks = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24 * 7));
    
    // Reverse rank issues: The older the issue, the easier to unlock?
    // Let's just say subbedWeeks = total number of Pro issues unlocked for them.
    const proIssues = archives.filter(a => a.is_pro);
    const issueProIndex = proIssues.findIndex(a => a.id === item.id);
    
    // If they have been subbed for 4 weeks, they can read 4 'Pro' issues.
    // We check from the most recent downwards for loyalty.
    if (subbedWeeks > issueProIndex) return true;

    return false;
  };

  if (loading) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-logo-container">
            <img src={logo} alt="Company Logo" className="welcome-logo" />
          </div>
          <div className="welcome-text">THE SIGNAL</div>
          <div className="loading-container">
            <div className="loading-bar"></div>
          </div>
          <div className="welcome-subtitle">Scanning Intelligence Vault...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container fade-in">
      <div className="feedback-card archive-card">
        <div className="feedback-header">
          <div className="feedback-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Intelligence Archive</div>
          <h1 className="feedback-title" style={{ letterSpacing: '-2px' }}>DATA_VAULT_v3.0.</h1>
          <p className="feedback-subtitle">Access all historical signals extracted by the neural network.</p>
        </div>

        <div className="feedback-form">
          <div className="archive-grid">
            {archives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#94a3b8' }}>Archive is currently empty. Initializing first signal capture sequence.</p>
              </div>
            ) : (
              archives.map((item, index) => {
                const unlocked = canAccess(item, index);
                const isPro = item.is_pro;
                
                const itemTypeClass = !unlocked ? 'locked' : (isPro ? 'pro' : 'public');

                return (
                  <div 
                    key={item.id} 
                    className={`archive-item archive-item--${itemTypeClass}`}
                    onClick={() => {
                      if (!unlocked) {
                          setView('omegawall');
                          return;
                      }
                      window.history.pushState({}, '', `/?view=issue&id=${item.id}`);
                      if (setSelectedIssueId) setSelectedIssueId(item.id);
                      setView('issue');
                    }}
                    style={{
                      background: !unlocked ? 'rgba(239, 68, 68, 0.02)' : (isPro ? 'rgba(139, 92, 246, 0.03)' : 'rgba(16, 185, 129, 0.03)'),
                      border: `1px solid ${!unlocked ? 'rgba(239, 68, 68, 0.1)' : (isPro ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)')}`,
                    }}
                  >
                    <div className="archive-item-content">
                      <div className="archive-item-icon" style={{
                        background: !unlocked ? 'rgba(239, 68, 68, 0.1)' : (isPro ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'), 
                        color: !unlocked ? '#ef4444' : (isPro ? '#8b5cf6' : '#10b981'),
                        border: `1px solid ${!unlocked ? 'rgba(239, 68, 68, 0.2)' : (isPro ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)')}`,
                      }}>
                        {!unlocked ? <Lock size={20} /> : (isPro ? <Zap size={20} /> : <ShieldCheck size={20} />)}
                      </div>
                      <div className="archive-item-info">
                        <div className="archive-item-status-tags">
                          {!unlocked ? (
                            <>
                              <div className="archive-item-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>RESTRICTED</div>
                              <span className="archive-item-subtitle">INVITE 3 NODES OR WAIT {index + 1} WEEKS</span>
                            </>
                          ) : (
                            <>
                              <div className="archive-item-badge" style={{ background: isPro ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isPro ? '#8b5cf6' : '#10b981' }}>
                                {isPro ? 'PREMIUM SIGNAL' : 'PUBLIC ACCESS'}
                              </div>
                              <span className="archive-item-subtitle">DECRYPTION_SUCCESSFUL</span>
                            </>
                          )}
                        </div>
                        <h3 className="archive-item-title">{item.week_date}</h3>
                        <p className="archive-item-date">Decrypted on: {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="archive-item-action" style={{ color: !unlocked ? '#ef4444' : (isPro ? '#8b5cf6' : '#10b981') }}>
                      {!unlocked ? 'Protocol Locked' : 'Access Signal'} <ArrowRight size={16} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <button onClick={() => setView('home')} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '0.9rem', textDecoration: 'underline' }}>Return to Home Protocol</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveExplorer;

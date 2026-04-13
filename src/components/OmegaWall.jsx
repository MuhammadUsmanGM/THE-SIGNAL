import React, { useState, useEffect } from 'react';
import { Lock, Zap, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useNeuralTheme } from '../context/ThemeContext';
import './OmegaWall.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const OmegaWall = ({ setView, email }) => {
  const { currentTheme } = useNeuralTheme();
  const [userData, setUserData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    const fetchInviteData = async () => {
      if (!email) return;
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('referral_count, v_token')
        .eq('email', email)
        .single();
      if (data) setUserData(data);
    };
    fetchInviteData();
  }, [email]);

  const referralLink = userData?.v_token 
    ? `${window.location.origin}/?ref=${userData.v_token}` 
    : 'Initializing node...';

  const handleCopy = () => {
    if (!userData?.v_token) return;
    navigator.clipboard.writeText(referralLink);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="feedback-container fade-in">
      <div className="feedback-card omega-wall-card">
        
        {/* Background "Omega" Ambient Glow */}
        <div className="omega-glow"></div>

        <div className="omega-content">
          <div className="omega-icon-container">
            <Zap size={34} />
          </div>

          <p className="mono omega-tag">
            // PROTOCOL_LOCKED :: UPGRADE_REQUIRED
          </p>
          
          <h1 className="omega-title">Unlock The Vault.</h1>
          
          <p className="omega-description">
            This signal is currently encrypted. To gain immediate access to the full historical intelligence database, you must expand the neural network.
          </p>

          <div className="milestone-container">
            <div className="milestone-header">
                <span className="milestone-label">Milestone Progress</span>
                <span className="milestone-value">{userData?.referral_count || 0} / 3 VERIFIED</span>
            </div>
            <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.min(((userData?.referral_count || 0) / 3) * 100, 100)}%` }}
                ></div>
            </div>
            <p className="milestone-footer">
                <ShieldCheck size={12} style={{ marginRight: '6px', display: 'inline' }} /> 
                Reach 3 referrals to bypass all time-locks instantly.
            </p>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label className="referral-label">Your Referral Uplink</label>
            <div className="referral-link-container">
                <code className="referral-code">{referralLink}</code>
                <button onClick={handleCopy} className="copy-btn">
                    {copyStatus ? 'COPIED' : 'COPY'}
                </button>
            </div>
          </div>

          <div className="action-container">
            <button 
              onClick={() => setView('archive')} 
              className="secondary-btn"
              style={{ width: '100%', padding: '15px' }}
            >
              Return to Archives
            </button>
            <p className="wait-footer">
                Or wait for the weekly loyalty drip to unlock issues one by one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OmegaWall;

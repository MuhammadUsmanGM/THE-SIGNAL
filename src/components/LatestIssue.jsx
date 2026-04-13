import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/Favicon.webp';
import { Share2, Zap, ArrowLeft } from 'lucide-react';
import AudioSynthesis from './AudioSynthesis';
import { useNeuralTheme } from '../context/ThemeContext';
import './Feedback.css'; // Reuse premium styles for content
import './LatestIssue.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LatestIssue = ({ issueId = null, setView }) => {
  const { currentTheme } = useNeuralTheme();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/api/share?id=${issue?.id || ''}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  useEffect(() => {
    // Detect prompt in content and extract it for the playground
    if (issue && issue.content_html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(issue.content_html, 'text/html');
      
      const insightHeader = Array.from(doc.querySelectorAll('h3')).find(h => 
        h.textContent.includes("This Week's Actionable Insight")
      );

      if (insightHeader && insightHeader.parentElement) {
        const promptText = insightHeader.parentElement.querySelector('p')?.textContent;
        if (promptText) {
          setCurrentPrompt(promptText);
        }
      }
    }
  }, [issue]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      let query = supabase.from('newsletter_archive').select('*');
      
      if (issueId) {
        query = query.eq('id', issueId).single();
      } else {
        query = query.order('id', { ascending: false }).limit(1);
      }
        
      const [_, result] = await Promise.all([minLoadTime, query]);
      const data = result.data;
      const error = result.error;

      if (error && !issueId) throw error;

      if (issueId) {
        setIssue(data);
      } else if (data && data.length > 0) {
        setIssue(data[0]);
      }
    } catch (err) {
      console.error('Error fetching issue:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-logo-container" style={{ borderColor: currentTheme.color }}>
            <img src={logo} alt="Company Logo" className="welcome-logo" />
          </div>
          <div className="welcome-text">
            THE SIGNAL
          </div>
          <div className="loading-container">
            <div className="loading-bar" style={{ background: currentTheme.color }}></div>
          </div>
          <div className="welcome-subtitle">
            {issueId ? 'Accessing Protocol Record...' : 'Decrypting Latest Protocol'}
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="feedback-container">
        <div className="feedback-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 className="feedback-title">Signal Not Found</h2>
          <p className="feedback-subtitle">The requested intelligence record is missing or classified.</p>
          <button onClick={() => setView('archive')} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Return to Archive</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-card issue-card" style={{ border: `1px solid ${currentTheme.color}22` }}>
        {/* Header */}
        <div className="feedback-header issue-header">
          <div>
            <div className="feedback-badge" style={{ background: `${currentTheme.color}11`, color: currentTheme.color, borderColor: `${currentTheme.color}33` }}>
              {issueId ? `Protocol Record #${issueId}` : 'Latest Protocol Release'}
            </div>
            <h1 className="feedback-title">THE SIGNAL.</h1>
            <p className="feedback-subtitle" style={{ color: currentTheme.color }}>{issue.week_date}</p>
          </div>
          <div className="issue-actions">
            <button 
              onClick={handleShare}
              className="share-btn"
              style={{
                background: copied ? `${currentTheme.color}11` : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${copied ? currentTheme.color : 'rgba(255, 255, 255, 0.1)'}`,
                color: copied ? currentTheme.color : '#94a3b8',
              }}
            >
              <Share2 size={14} />
              {copied ? 'Copied!' : 'Share Signal'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="feedback-form" style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
          {/* Audio Protocol */}
          <AudioSynthesis contentHtml={issue.content_html} />

          {/* We inject the saved HTML directly here */}
          <div 
            dangerouslySetInnerHTML={{ __html: issue.content_html }} 
            className="newsletter-content"
          />

          {/* Actionable Prompt Playground Access */}
          {currentPrompt && (
            <div 
              className="playground-container"
              style={{ 
                background: `${currentTheme.color}08`, 
                border: `1px solid ${currentTheme.color}33`, 
                boxShadow: `0 10px 30px -10px ${currentTheme.color}22`
              }}
            >
              <div>
                <div className="playground-label" style={{ color: currentTheme.color }}>
                  Interactive Insight Pipeline
                </div>
                <div className="playground-title">
                  Execute this week's neural protocol in the side-sandbox.
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://chatgpt.com/?q=${encodeURIComponent(currentPrompt)}`, '_blank')}
                className="submit-btn" 
                style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', background: currentTheme.color }}
              >
                Initialize External Protocol
              </button>
            </div>
          )}
          
          <div className="issue-footer">
            <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>{issueId ? 'Interested in future signals?' : 'Want this delivered to your inbox?'}</p>
            <div className="issue-footer-btns">
              <button onClick={() => setView('home')} className="submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '12px 30px', background: currentTheme.color }}>
                Subscribe to Protocol
              </button>
              <button onClick={() => setView('archive')} className="back-link" style={{ marginTop: 0, background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.color }}>
                Protocol Archive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestIssue;

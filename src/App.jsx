import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Welcome from './components/Welcome'
import Dashboard from './components/Dashboard'
import Feedback from './components/Feedback'
import LatestIssue from './components/LatestIssue'
import ArchiveExplorer from './components/ArchiveExplorer'
import LiveTicker from './components/LiveTicker'
import CopyPage from './components/CopyPage'
import Unsubscribe from './components/Unsubscribe'
import Commander from './components/Commander'
import OmegaWall from './components/OmegaWall'
import VerificationStatus from './components/VerificationStatus'
import { Turnstile } from '@marsidev/react-turnstile'
import logo from './assets/Favicon.webp'
import { useNeuralTheme } from './context/ThemeContext'
import './App.css'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    timezone: ''
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successTransition, setSuccessTransition] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'dashboard', 'feedback', 'latest', 'archive', 'issue'
  const [userName, setUserName] = useState('Commander');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const [referrerToken, setReferrerToken] = useState(null);

  const { calculateTheme } = useNeuralTheme();

  useEffect(() => {
    // Get user timezone and update form data
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setFormData(prevFormData => ({
      ...prevFormData,
      timezone: userTimezone
    }));
    
    // Add network status listener
    const handleOnline = () => {
      if (apiError && apiError.includes('No internet connection')) {
        setApiError('');
      }
    };
    
    const handleOffline = () => {
      if (isLoading) {
        setIsLoading(false);
        setApiError('No internet connection. Please check your connection and try again.');
      }
    };

    // Check for query parameters (Routing & Notifications)
    const params = new URLSearchParams(window.location.search);
    const unsubscribeEmail = params.get('email');
    const unsubscribeToken = params.get('token');
    const isUnsubscribeAction = params.get('unsubscribe') === 'true';
    const viewParam = params.get('view');
    const verifiedStatus = params.get('verified');
    const verifyError = params.get('error');
    const refParam = params.get('ref');

    if (refParam) {
        setReferrerToken(refParam);
    }

    if (verifiedStatus) {
      setCurrentView('verification');
      setShowWelcome(false);
    }

    if (viewParam === 'dashboard') {
      const nameParam = params.get('name');
      const emailParam = params.get('email');
      if (nameParam) setUserName(nameParam);
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }));
      }
      setCurrentView('dashboard');
      setShowWelcome(false); 
    } else if (viewParam === 'feedback' || params.get('status')) {
      setCurrentView('feedback');
      setShowWelcome(false);
    } else if (viewParam === 'latest') {
      setCurrentView('latest');
      setShowWelcome(false);
    } else if (viewParam === 'archive') {
      setCurrentView('archive');
      setShowWelcome(false);
    } else if (viewParam === 'issue') {
      const id = params.get('id');
      if (id) setSelectedIssueId(id);
      setCurrentView('issue');
      setShowWelcome(false);
    } else if (viewParam === 'getcopy') {
      setCurrentView('getcopy');
      setShowWelcome(false);
    } else if (viewParam === 'commander') {
      setCurrentView('commander');
      setShowWelcome(false);
    }

    if (isUnsubscribeAction && (unsubscribeEmail || unsubscribeToken)) {
      if (unsubscribeEmail) setFormData(prev => ({ ...prev, email: unsubscribeEmail }));
      setCurrentView('unsubscribe');
      setShowWelcome(false);
      // Pass token to unsubscribe view if needed
      window.dispatchToken = unsubscribeToken; 
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [apiError, isLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name] || apiError) {
      setErrors({
        ...errors,
        [name]: ''
      });
      setApiError('');
    }
  };



  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }



    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setApiError(''); // Clear any previous API errors
      
      // Check for network connectivity
      if (!navigator.onLine) {
        setIsLoading(false);
        setApiError('No internet connection. Please check your connection and try again.');
        return;
      }
      
      try {
        // Call our custom serverless API to handle subscription and welcome email
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            timezone: formData.timezone,
            turnstileToken: turnstileToken,
            referrerToken: referrerToken
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to subscribe');
        }
        
        console.log('User response:', result);
        if (result.alreadySubscribed) {
          setIsAlreadySubscribed(true);
          if (result.name) setUserName(result.name);
          if (result.joinDate) calculateTheme(result.joinDate, result.preferredThemeIndex);
        } else {
          setIsAlreadySubscribed(false);
          if (result.joinDate) calculateTheme(result.joinDate);
        }
        
        setSubmitted(true);
        setSuccessTransition(false);
        
        // Reset form after success with a smooth transition
        setTimeout(() => {
          setSuccessTransition(true); // Trigger the fade-out transition
          
          // Reset form after animation completes
          setTimeout(() => {
            setSubmitted(false);
            setSuccessTransition(false); // Reset for next time
            setIsAlreadySubscribed(false); // Reset for next time
            // Get user timezone and reset form with new timezone
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setFormData({ name: '', email: '', timezone: userTimezone });
            setIsLoading(false);
          }, 500);
        }, 5000); // Keep it longer for them to read the "Welcome Back" message
      } catch (error) {
        console.error('Error subscribing:', error);
        setIsLoading(false);
        
        // More specific network error detection
        if (error.name === 'AbortError') {
          setApiError('Request timed out. Please check your internet connection and try again.');
        } else if (error.status === 0 || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setApiError('No internet connection. Please check your connection and try again.');
        } else if (error.status === 503 || error.status === 502) {
          setApiError('Service temporarily unavailable. Please try again later.');
        } else if (error.status === 429) {
          setApiError('Too many requests. Please wait before trying again.');
        } else if (error.status >= 500) {
          setApiError('Server error. Please try again later.');
        } else if (error.status >= 400 && error.status < 500) {
          setApiError('Invalid request. Please check your input and try again.');
        } else {
          let finalError = 'An error occurred while subscribing. Please try again.';

          if (error.code === '23505' || 
              (error.message && (error.message.includes('newsletter_subscribers_email_key') || 
               error.message.toLowerCase().includes('duplicate')))) {
            finalError = 'Email already subscribed! Happy to have you continue receiving AI updates.';
          } else if (error.message && (error.message.toLowerCase().includes('permission') || 
                     error.message.toLowerCase().includes('policy'))) {
            finalError = 'Access denied. Please try again later.';
          }
          
          setApiError(finalError);
        }
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleJoinAgain = () => {
    setUnsubscribed(false);
    setApiError('');
    setFormData({
      name: '',
      email: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const renderView = () => {
    if (showWelcome) return <Welcome onWelcomeComplete={handleWelcomeComplete} />;
    if (currentView === 'dashboard') return <Dashboard name={userName} email={formData.email} setView={setCurrentView} />;
    if (currentView === 'feedback') return <Feedback setView={setCurrentView} />;
    if (currentView === 'latest') return <LatestIssue setView={setCurrentView} />;
    if (currentView === 'archive') return <ArchiveExplorer setView={setCurrentView} setSelectedIssueId={setSelectedIssueId} email={formData.email} />;
    if (currentView === 'issue') return <LatestIssue issueId={selectedIssueId} setView={setCurrentView} />;
    if (currentView === 'getcopy') return <CopyPage setView={setCurrentView} />;
    if (currentView === 'unsubscribe') return (
      <Unsubscribe 
        email={formData.email} 
        token={window.dispatchToken}
        setView={setCurrentView} 
        onUnsubscribe={() => {
          setUnsubscribed(true);
          setCurrentView('home');
          window.history.replaceState({}, document.title, window.location.pathname);
        }} 
      />
    );
    if (currentView === 'commander') return <Commander setView={setCurrentView} />;
    if (currentView === 'omegawall') return <OmegaWall setView={setCurrentView} email={formData.email} />;
    if (currentView === 'verification') return <VerificationStatus setView={setCurrentView} setUserName={setUserName} setFormData={setFormData} />;
    
    return (
      <div className="newsletter-container">
        <div className="newsletter-card">
          <div className="branding-side">
            <div className="branding-content">
              <div className="brand-logo-container">
                <img src={logo} alt="AI Logo" className="brand-logo" />
              </div>
              <h1>Tune Into The Signal</h1>
              <p>Join thousands of AI professionals getting weekly 3-3-2-2-1 breakthroughs: Stories, Gadgets, Tools, Repositories, and Technical Insights.</p>
              <div className="social-links-container">
                <div className="social-link">
                  <a href="https://github.com/MuhammadUsmanGM" target="_blank" rel="noopener noreferrer" aria-label="Visit my GitHub profile">
                    <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                    </svg>
                    GitHub
                  </a>
                </div>
                <div className="social-link">
                  <a href="https://www.linkedin.com/in/muhammad-usman-ai-dev" target="_blank" rel="noopener noreferrer" aria-label="Connect on LinkedIn">
                    <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="form-side">
            {unsubscribed ? (
              <div className="success-state fade-in">
                <div className="success-icon-container">
                  <div className="success-circle" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}></div>
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" style={{ stroke: '#ef4444', opacity: 0.5 }}/>
                    <path className="checkmark-check" fill="none" d="M16 16L36 36M36 16L16 36" style={{ stroke: '#ef4444', strokeWidth: 3 }}/>
                  </svg>
                </div>
                <div className="success-content">
                  <div className="success-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Mission Suspended</div>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Protocol Deactivated</h2>
                  <p style={{ marginBottom: '2rem', opacity: 0.8 }}>You've been successfully removed from the 3-3-2-2-1-1 Intelligence Protocol. We'll miss your presence in the inner circle.</p>
                  
                  <button 
                    onClick={handleJoinAgain}
                    className="submit-button"
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--primary)', 
                      color: '#fff',
                      marginTop: '1rem',
                      width: 'auto',
                      padding: '1rem 2rem'
                    }}
                  >
                    Join Back Anytime
                  </button>
                  
                  <div className="success-footer" style={{ marginTop: '2.5rem' }}>
                    Signal lost. Connection closed.
                  </div>
                </div>
              </div>
            ) : isUnsubscribing ? (
              <div className="success-state">
                 <div className="loading-spinner"></div>
                 <p>Unsubscribing you from the newsletter...</p>
              </div>
            ) : submitted ? (
              <div className={`success-state ${successTransition ? 'fade-out' : ''}`}>
                <div className="success-icon-container">
                  <div className="success-circle"></div>
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
                <div className="success-content fade-in">
                  <div className="success-badge">{isAlreadySubscribed ? 'Neural Link Active' : 'Transmission Pending'}</div>
                  <h2>{isAlreadySubscribed ? 'Welcome Back!' : "Verify Your Node"}</h2>
                  <p>{isAlreadySubscribed 
                    ? `Good to see you again, ${userName}. Your intelligence protocol is already active.` 
                    : `Greetings, ${formData.name}. We've sent a verification link to your inbox. Activate it to finalize the link.`}
                  </p>
                  
                  {isAlreadySubscribed && (
                    <button 
                      onClick={() => setCurrentView('dashboard')}
                      className="submit-btn"
                      style={{ marginTop: '1.5rem', width: 'auto', padding: '10px 25px', fontSize: '0.9rem' }}
                    >
                      Enter Dashboard
                    </button>
                  )}

                  <div className="success-footer">
                    {isAlreadySubscribed ? 'Redirecting to your terminal...' : 'Connection established. Waiting for verification.'}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="newsletter-form" noValidate>
                <div className="form-header">
                  <h2>Join our list</h2>
                  <p>Start your weekly 3-3-2-2-1-1 intelligence protocol.</p>
                </div>
                {apiError && (
                  <div 
                    className={`api-${apiError.includes('already subscribed') ? 'success' : 'error'}-message fade-in`}
                    role="alert"
                  >
                    {apiError}
                  </div>
                )}
              
              <div className="input-group">
                <label htmlFor="name" className="visually-hidden">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={`stunning-input ${errors.name ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="name"
                />
                {errors.name && <span className="error-message fade-in">{errors.name}</span>}
              </div>
              
              <div className="input-group">
                <label htmlFor="email" className="visually-hidden">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className={`stunning-input ${errors.email ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && <span className="error-message fade-in">{errors.email}</span>}
              </div>
              
              <input
                type="hidden"
                name="timezone"
                value={formData.timezone}
              />
              

              
              <div className="input-group" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '65px', justifyContent: 'center' }}>
                <Turnstile 
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                  onSuccess={(token) => setTurnstileToken(token)}
                  theme="dark"
                />
                {!turnstileToken && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px', opacity: 0.6 }}>
                    Initializing security protocol...
                  </span>
                )}
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading || !turnstileToken}>
                {isLoading ? (
                  <span className="btn-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    Initiating Protocol
                  </span>
                ) : 'Access The Signal'}
              </button>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setCurrentView('latest')}
                  className="secondary-btn"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '12px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Latest Signal
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentView('archive')}
                  className="secondary-btn"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '12px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.color = '#10b981';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  The Vault (Archive)
                </button>
              </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderView()}
      <LiveTicker />
    </>
  );
}

export default App

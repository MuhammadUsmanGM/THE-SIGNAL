import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowLeft, Zap, ShieldCheck } from 'lucide-react';
import './Feedback.css';

const Feedback = ({ setView }) => {
  const [params, setParams] = useState(new URLSearchParams(window.location.search));
  const [isBinary, setIsBinary] = useState(params.get('status'));
  
  const [formData, setFormData] = useState({
    name: params.get('name') || '',
    email: params.get('email') || '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const reactionStatus = params.get('status');
  const isPositive = reactionStatus === 'positive' || reactionStatus === 'fire';
  const reactionConfig = {
    happy: { 
      emoji: '\u{1F60D}', 
      title: "You're Awesome!",
      message: "Thrilled you loved this week's signal. We really appreciate your loyalty to the protocol — it's what keeps the engine running." 
    },
    neutral: { 
      emoji: '\u{1F610}', 
      title: "Thanks for the honesty",
      message: "We hear you. This one didn't quite hit the target. We're already recalibrating the signal for next week's transmission." 
    },
    sad: { 
      emoji: '\u{1F61E}', 
      title: "We'll do better",
      message: "This wasn't up to the standard you deserve. We've logged this deficiency and are prioritizing improvements immediately." 
    },
    positive: { emoji: '\u{1F60D}', title: "Excellent", message: "The intelligence protocol is operating at peak efficiency. Signal strength is maximum." },
    negative: { emoji: '\u{1F61E}', title: "Signal Degraded", message: "Transmission errors detected. We will recalibrate for future transmissions." },
  };
  const currentReaction = reactionConfig[reactionStatus] || reactionConfig.neutral;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) return setError('Please enter your feedback.');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to send feedback');
      setIsSuccess(true);
    } catch (err) {
      setError('Failed to transmit signal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Binary Poll Success View
  if (isBinary) {
    return (
      <div className="feedback-container fade-in">
        <div className="feedback-card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
          <div style={{ padding: '60px 40px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
              {currentReaction.emoji}
            </div>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '15px', letterSpacing: '-1px' }}>{currentReaction.title}</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '40px', lineHeight: '1.6' }}>
              {currentReaction.message}
            </p>
            
            <div style={{ margin: '40px 0', padding: '30px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>Have any improvements in mind?</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Your insight helps refine the protocol for everyone.</p>
              <button
                onClick={() => setView('feedback')}
                className="submit-btn"
                style={{ width: 'auto', padding: '12px 24px', fontSize: '0.9rem' }}
              >
                Share Feedback →
              </button>
            </div>

            <button
              onClick={() => setView ? setView('home') : window.location.href = '/'}
              className="secondary-btn"
              style={{ padding: '14px 28px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Standard Form Success View
  if (isSuccess) {
    return (
      <div className="feedback-container fade-in">
        <div className="feedback-card" style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center' }}>
          <div style={{ padding: '60px 40px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '10px' }}>Transmission Received</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '40px' }}>Your intelligence has been successfully logged. We appreciate your contribution to the protocol.</p>
            <button onClick={() => setView ? setView('home') : window.location.href = '/'} className="secondary-btn">Return to Home</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Feedback Form
  return (
    <div className="feedback-container fade-in">
      <div className="feedback-card">
        <div className="feedback-header">
          <div className="feedback-badge">Internal Comms</div>
          <h1 className="feedback-title">Feedback Channel</h1>
          <p className="feedback-subtitle">Help us optimize the intelligence protocol.</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {error && <div className="api-error-message fade-in" style={{ marginBottom: '20px' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Codename / Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Commander" />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Node (Email)</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="commander@example.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Signal Content</label>
            <textarea name="message" value={formData.message} onChange={handleChange} className="form-textarea" placeholder="Report bugs, suggest features, or request specific intelligence topics..." required />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Transmitting...' : 'Transmit Signal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;

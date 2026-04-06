import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { channel, token, useful } = req.query;

  // 1. EMAIL OPEN TRACKING (Pixel)
  if (channel === 'open') {
    if (token) {
        try {
            const { data: user } = await supabase
                .from('newsletter_subscribers')
                .select('opens_count')
                .eq('v_token', token)
                .single();
            
            if (user) {
                await supabase
                    .from('newsletter_subscribers')
                    .update({ 
                        opens_count: (user.opens_count || 0) + 1,
                        last_active_at: new Date().toISOString()
                    })
                    .eq('v_token', token);
            }
        } catch (err) { console.error('Tracking Error:', err.message); }
    }
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    return res.end(pixel);
  }

  // 2. USER FEEDBACK SIGNALS (Emoji Reactions)
  if (channel === 'feedback') {
    const { reaction } = req.query;
    const validReactions = ['happy', 'neutral', 'sad'];
    const reactionType = validReactions.includes(reaction) ? reaction : 'neutral';

    if (token) {
        try {
            await supabase
                .from('newsletter_subscribers')
                .update({ last_active_at: new Date().toISOString() })
                .eq('v_token', token);

            await supabase
                .from('newsletter_reactions')
                .insert({ subscriber_token: token, reaction: reactionType, issue_date: new Date().toISOString().split('T')[0] });
        } catch (err) { console.error('Feedback Error:', err.message); }
    }
    const appUrl = process.env.APP_URL || '';
    const pages = {
      happy: {
        emoji: '😍', title: "You're awesome!",
        message: "Thrilled you loved this week's signal. We put a lot of work into curating the best AI intel — and your reaction makes it worth it.",
        cta: null
      },
      neutral: {
        emoji: '😐', title: 'Thanks for being honest',
        message: "We hear you. This one didn't quite hit the mark. We're always tweaking the formula to make every issue sharper and more useful for you.",
        cta: { text: 'Tell us what you want more of →', url: `${appUrl}/?view=feedback` }
      },
      sad: {
        emoji: '😞', title: "We're sorry about that",
        message: "This wasn't up to the standard you deserve, and we take that seriously. The Signal team is committed to doing better — your feedback directly shapes what we improve next.",
        cta: { text: 'Help us improve — share your suggestions →', url: `${appUrl}/?view=feedback` }
      }
    };
    const page = pages[reactionType];
    const ctaHtml = page.cta
      ? `<a href="${page.cta.url}" style="display:inline-block;margin-top:32px;padding:16px 36px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border-radius:16px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.5px;box-shadow:0 12px 24px -8px rgba(16,185,129,0.5);">${page.cta.text}</a>`
      : '';

    return res.setHeader('Content-Type', 'text/html').send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE SIGNAL — Feedback</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @keyframes pop{0%{transform:scale(0.5);opacity:0}50%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
  @keyframes gridMove{0%{background-position:0 0}100%{background-position:60px 60px}}
  @keyframes pulseGlow{0%,100%{box-shadow:0 0 40px rgba(16,185,129,0.15),inset 0 0 20px rgba(16,185,129,0.05)}50%{box-shadow:0 0 60px rgba(16,185,129,0.25),inset 0 0 30px rgba(16,185,129,0.1)}}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    background:radial-gradient(circle at 20% 30%,rgba(16,185,129,0.06) 0%,transparent 50%),radial-gradient(circle at 80% 70%,rgba(6,78,59,0.08) 0%,transparent 50%),radial-gradient(circle at 50% 50%,#0f172a 0%,#020617 100%);
    display:flex;align-items:center;justify-content:center;min-height:100vh;
    font-family:'Outfit',system-ui,sans-serif;color:#94a3b8;position:relative;
  }
  body::before{
    content:'';position:fixed;top:0;left:0;width:100%;height:100%;
    background-image:linear-gradient(rgba(16,185,129,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.03) 1px,transparent 1px);
    background-size:60px 60px;opacity:0.4;z-index:1;pointer-events:none;animation:gridMove 20s linear infinite;
  }
  .card{
    max-width:500px;width:100%;margin:0 24px;
    background:linear-gradient(145deg,rgba(15,23,42,0.95),rgba(15,23,42,0.85));
    backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);
    border-radius:32px;border:1px solid rgba(255,255,255,0.1);
    box-shadow:0 30px 60px -15px rgba(0,0,0,0.7),0 0 100px -20px rgba(16,185,129,0.15),inset 0 1px 0 rgba(255,255,255,0.1);
    position:relative;z-index:10;overflow:hidden;text-align:center;padding:60px 40px;
  }
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#10b981,transparent);opacity:0.6;}
  .emoji{font-size:5rem;margin-bottom:24px;animation:pop 0.4s ease-out;}
  .badge{display:inline-block;padding:8px 20px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:30px;color:#34d399;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:28px;animation:pulseGlow 3s ease-in-out infinite;}
  h2{color:#fff;font-size:1.8rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:16px;}
  .msg{font-size:1.05rem;line-height:1.7;max-width:380px;margin:0 auto;}
  .back{display:inline-block;margin-top:40px;padding:12px 28px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);color:#94a3b8;text-decoration:none;font-size:14px;font-weight:600;transition:all 0.3s;}
  .back:hover{color:#fff;background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);}
  @media(max-width:640px){.card{padding:48px 28px;margin:0 16px;border-radius:24px;}h2{font-size:1.5rem;}.emoji{font-size:4rem;}}
</style></head>
<body>
  <div class="card">
    <div class="badge">Signal Received</div>
    <div class="emoji">${page.emoji}</div>
    <h2>${page.title}</h2>
    <p class="msg">${page.message}</p>
    ${ctaHtml}
    <a href="${appUrl}" class="back">← Back to The Signal</a>
  </div>
</body></html>`);
  }

  return res.status(404).json({ error: 'Signal channel not found.' });
}

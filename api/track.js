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
    return res.redirect(`${process.env.APP_URL}/?view=feedback&status=${reactionType}`);
  }

  return res.status(404).json({ error: 'Signal channel not found.' });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { channel } = req.query;
  const authHeader = req.headers.authorization;
  const password = authHeader ? authHeader.replace('Bearer ', '') : req.query.password;

  // Simple Admin Shield (matches your VITE_COPY_PAGE_PASSWORD logic)
  if (password !== process.env.VITE_COPY_PAGE_PASSWORD && password !== (process.env.VITE_COPY_PAGE_PASSWORD || 'admin123')) {
     return res.status(401).json({ error: 'UNAUTHORIZED_ACCESS' });
  }

  // 1. DASHBOARD STATS (Commander Dashboard)
  if (channel === 'stats') {
    try {
      // 1. Fetch all subscribers for aggregation
      const { data: allSubscribers, error: subError } = await supabase
        .from('newsletter_subscribers')
        .select('name, email, created_at, is_verified, opens_count, timezone');
      
      if (subError) throw subError;

      const verifiedNodes = allSubscribers.filter(s => s.is_verified).length;
      const pendingNodes = allSubscribers.filter(s => !s.is_verified).length;
      const totalSubscribers = verifiedNodes; // Only count verified as total
      const totalOpens = allSubscribers.reduce((acc, sub) => acc + (sub.opens_count || 0), 0);
      const activeNodes = allSubscribers.filter(sub => (sub.opens_count || 0) > 0).length;

      // 2. Fetch Weekly Growth (past 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const growthLast7Days = allSubscribers.filter(s => new Date(s.created_at) >= sevenDaysAgo && s.is_verified).length;

      // 3. Timezone Distribution
      const tzMap = {};
      allSubscribers.filter(s => s.is_verified).forEach(s => {
          const tz = s.timezone || 'UTC';
          tzMap[tz] = (tzMap[tz] || 0) + 1;
      });
      const timezoneDistribution = Object.keys(tzMap).map(tz => ({ tz, count: tzMap[tz] })).sort((a,b) => b.count - a.count).slice(0, 5);

      // 4. Fetch Latest Capture
      const { data: latestArchive } = await supabase
        .from('newsletter_archive')
        .select('week_date')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 5. Fetch Reaction Stats
      const { data: reactions } = await supabase
        .from('newsletter_reactions')
        .select('reaction');

      const reactionCounts = { happy: 0, neutral: 0, sad: 0 };
      if (reactions) {
        reactions.forEach(r => {
          if (reactionCounts.hasOwnProperty(r.reaction)) reactionCounts[r.reaction]++;
        });
      }

      return res.status(200).json({
        stats: {
            totalSubscribers,
            verifiedNodes,
            pendingNodes,
            growthLast7Days,
            latestIssue: latestArchive?.week_date || 'N/A',
            timezoneDistribution,
            totalOpens,
            activeNodes,
            reactionCounts
        },
        rawNodes: allSubscribers.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20)
      });
    } catch (err) {
      console.error('Stats Protocol Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch protocol metrics.' });
    }
  }

  return res.status(404).json({ error: 'Admin channel not found.' });
}

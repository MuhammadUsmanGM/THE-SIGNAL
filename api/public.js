import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { channel } = req.query;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. LIVE SIGNAL FEED (News Ticker)
  if (channel === 'ticker') {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const fallbackTitles = ["SYNCHRONIZING GLOBAL NEWS FEEDS...", "ESTABLISHING NEURAL LINK...", "FETCHING REAL-TIME AI BREAKTHROUGHS...", "PROTOCOL ACTIVE"];
    
    if (!NEWS_API_KEY) {
        return res.status(200).json({ titles: ["// [ALERT] SECURITY CLEARANCE REQUIRED for External News Feed", ...fallbackTitles] });
    }

    try {
      console.log('Ticker Activation: Fetching AI signals...');
      // Using 'everything' instead of 'top-headlines' to get specifically AI news
      const query = 'artificial intelligence OR LLM OR "machine learning" OR "generative AI"';
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (!response.ok || !data.articles) {
          console.error('Ticker Signal Error:', data.message || 'Unknown API failure');
          throw new Error(data.message || 'Failed to fetch news');
      }
      
      const titles = data.articles
        .filter(a => a.title && !a.title.includes('[Removed]'))
        .map(article => article.title);
        
      console.log(`Ticker Synced: ${titles.length} news items received.`);
      
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
      return res.status(200).json({ titles: titles.length > 0 ? titles : fallbackTitles });
    } catch (err) {
      console.warn('Ticker Warning (Redundancy Active):', err.message);
      return res.status(200).json({ titles: ["// [REDUX] OFFLINE NEWS MODE ACTIVATED", ...fallbackTitles] });
    }
  }

  // 2. RSS FEED (Protocol Stream)
  if (channel === 'rss') {
    try {
      const { data: archives } = await supabase
        .from('newsletter_archive')
        .select('week_date, content_html, created_at')
        .order('id', { ascending: false })
        .limit(10);

      const items = archives.map(a => `
        <item>
          <title>THE SIGNAL: ${a.week_date}</title>
          <link>${process.env.APP_URL}</link>
          <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
          <description>Weekly Intelligence Briefing</description>
        </item>`).join('');

      const rss = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>THE SIGNAL Intelligence Protocol</title>
            <link>${process.env.APP_URL}</link>
            <description>3-3-2-2-1 AI Insights</description>
            ${items}
          </channel>
        </rss>`;

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(rss);
    } catch (err) { return res.status(500).send('RSS Error'); }
  }

  // 3. PLAYGROUND Logic
  if (channel === 'playground') {
      return res.status(200).json({ status: 'active', gateway: 'authorized' });
  }

  return res.status(404).json({ error: 'Public channel not found' });
}

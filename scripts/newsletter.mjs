// Note: dotenv is not needed in Vercel - env vars are automatically available
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { inngest } from '../src/inngest/client.js';
import { getNewsletterBodyHtml } from '../src/utils/templates.js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const newsApiKey = process.env.NEWS_API_KEY;

async function fetchTrendingRepos() {
  try {
    console.log('Fetching trending AI repositories from GitHub...');
    // Search for repos with AI-related topics, sort by stars, within the last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const dateQuery = lastWeek.toISOString().split('T')[0];
    
    const resp = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: `AI OR LLM OR "Machine Learning" OR "Generative AI" OR "Artificial Intelligence" pushed:>${dateQuery} stars:>50`,
        sort: 'stars',
        order: 'desc',
        per_page: 8
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TheSignal-Newsletter-Node'
      }
    });
    
    return (resp.data.items || []).map(repo => ({
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      url: repo.html_url,
      language: repo.language
    }));
  } catch (e) {
    console.error('GitHub fetch error:', e.message);
    return [];
  }
}

async function fetchAIIntelligence() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString();

  const fetchWithParams = async (params) => {
    try {
      console.log(`Fetching intelligence for query: ${params.q}...`);
      const resp = await axios.get('https://newsapi.org/v2/everything', { 
        params: { 
          ...params, 
          apiKey: newsApiKey, 
          language: 'en',
          pageSize: 30 
        } 
      });
      return (resp.data.articles || []).filter(a => a.urlToImage && a.description && a.title);
    } catch (e) {
      console.error('Fetch error:', e.response?.data?.message || e.message);
      return [];
    }
  };

  // 1. Broad search for high-quality AI breakthroughs (Strictly AI/ML)
  let articles = await fetchWithParams({
    q: '(artificial intelligence OR "machine learning" OR "generative AI" OR "AI agents" OR "LLM") -crypto -stock -politics -price -market',
    from: fromDate,
    sortBy: 'popularity'
  });

  // 2. Focused search for AI Gadgets/Hardware
  let gadgets = await fetchWithParams({
    q: '("AI hardware" OR "AI gadget" OR "AI wearable" OR "AI glasses" OR "AI pin" OR "Rabbit R1" OR "Humane Pin") -crypto -trading -metaverse',
    from: fromDate,
    sortBy: 'relevancy'
  });

  const repos = await fetchTrendingRepos();

  console.log(`Found ${articles.length} signals, ${gadgets.length} gadgets, and ${repos.length} repos.`);
  return { articles: articles.slice(0, 15), gadgets: gadgets.slice(0, 8), repos };
}

async function generateWeeklyIntelligence(intelligenceData) {
  const { articles, gadgets, repos } = intelligenceData;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const articlesContext = articles.map(a => `
    Title: ${a.title}
    Description: ${a.description}
    Source: ${a.source.name}
    URL: ${a.url}
    ImageURL: ${a.urlToImage}
  `).join('\n---\n');

  const gadgetsContext = gadgets.map(g => `
    Gadget/Device: ${g.title}
    Details: ${g.description}
    URL: ${g.url}
    ImageURL: ${g.urlToImage}
  `).join('\n---\n');

  const reposContext = repos.length > 0 
    ? repos.map(r => `
        Repo: ${r.name}
        Description: ${r.description || 'No description provided.'}
        Stars: ${r.stars || 0}
        Language: ${r.language || 'Multiple/Other'}
        URL: ${r.url}
      `).join('\n---\n')
    : "NO GITHUB REPOSITORIES FOUND. SKIP SECTION 4.";

  const prompt = `
    You are a senior tech journalist who writes like Paul Graham meets Ben Thompson — sharp, opinionated, zero fluff. You write for "THE SIGNAL", a weekly AI briefing read by engineers and founders who hate generic AI hype.

    YOUR VOICE:
    - Write like you're texting a smart friend, not writing a press release
    - Use "you" and "your" — talk directly to the reader
    - Short sentences. Punch hard. Then explain.
    - BANNED phrases: "groundbreaking", "revolutionizing", "game-changing", "cutting-edge", "landscape", "leveraging", "delve", "tapestry", "it's worth noting", "in the world of", "significant", "innovative"
    - Instead of "This tool provides state-of-the-art models" write "This is the Swiss Army knife most AI teams already use — if you're not on it, you're rebuilding wheels"
    - Every description should answer: "So what? Why should I care RIGHT NOW?"

    STRICT CONTENT POLICY:
    - Every item MUST relate to AI, ML, or LLMs
    - NO crypto, politics, social media drama, or generic tech unless it's AI-native

    SOURCES (use ONLY these — do not invent URLs or facts):
    STORIES: ${articlesContext}
    GADGETS: ${gadgetsContext}
    REPOS: ${reposContext}

    OUTPUT STRUCTURE (in this exact order):

    1. SUBJECT LINE: One line starting with an emoji. Make it specific and curiosity-driven.
       Bad: "⚡ This week in AI"
       Good: "⚡ Iran is targeting US tech. Art schools caved to AI. And one nuclear plant just changed everything."

    2. EDITOR INTRO: 3 short lines in a casual, human tone.
       Line 1: The week's vibe in one sentence (e.g., "Weird week. AI showed up in places nobody expected.")
       Line 2: Your hot take — be honest, be real (e.g., "I think half of these 'breakthroughs' are just rebranded features. But two of them actually matter.")
       Line 3: Hook them in (e.g., "Let me show you which ones 👇")
       HTML:
       <div style="margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
         <p style="color: #94a3b8; font-size: 16px; font-style: italic; line-height: 1.8; margin: 0;">[All 3 lines here, separated by <br><br>]</p>
       </div>

    3. THREE TOP STORIES (from STORIES source only):
       - Rewrite each headline to be punchy and specific (not the original clickbait)
       - Analysis: 2 sentences max. First sentence = what happened. Second = why it changes YOUR week.
       - Do NOT start every analysis the same way. Vary your openings.
       HTML per story:
       <div style="margin-bottom: 40px;">
         <img src="[ImageURL]" style="width: 100%; height: auto; border-radius: 16px; margin-bottom: 20px;">
         <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 12px; letter-spacing: -0.5px;">[Rewritten Headline]</h2>
         <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">[2 sentence analysis]</p>
         <a href="[URL]" style="color: #10b981; font-weight: 700; text-decoration: none;">Read more →</a>
       </div>

    4. THREE TOOLS (from REPOS or STORIES — pick actual useful tools/frameworks):
       - Name the tool clearly
       - One sentence: what it does in plain English
       - One sentence: why you'd actually use it this week
       HTML per tool:
       <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
         <div style="color: #10b981; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">TOOL NODE</div>
         <strong style="color: #ffffff; font-size: 18px;">[Tool Name]</strong>
         <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[2 sentences — what it does + why you need it]</p>
         <a href="[URL]" style="color: #10b981; font-size: 13px; text-decoration: none; font-weight: 600;">Try it →</a>
       </div>

    5. TWO AI GADGETS (from GADGETS source only):
       - Focus on what makes it an AI device, not just another gadget
       - One sentence on the hardware, one on why it matters for devs/founders
       HTML per gadget:
       <div style="background: linear-gradient(to right, #0d2a1f, #0a1628); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 22px; margin-bottom: 16px;">
         <div style="color: #10b981; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">GADGET PROTOCOL</div>
         <strong style="color: #ffffff; font-size: 18px; display: block; margin-bottom: 6px;">[Gadget Name]</strong>
         <p style="color: #94a3b8; margin: 0; font-size: 14px; line-height: 1.5;">[2 sentences]</p>
         <a href="[URL]" style="display: inline-block; margin-top: 12px; color: #10b981; font-size: 12px; font-weight: 700; text-decoration: none; text-transform: uppercase;">View specs →</a>
       </div>

    6. TWO TRENDING REPOS (from REPOS source only):
       - Tell me what the repo actually DOES, not marketing speak
       - Why would an engineer clone this today?
       HTML per repo:
       <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
         <div style="color: #8b5cf6; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">GITHUB NODE</div>
         <strong style="color: #ffffff; font-size: 18px;">[owner/repo]</strong>
         <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[What it does + why clone it today]</p>
         <div style="color: #8b5cf6; font-size: 13px; font-weight: 700; margin-bottom: 12px;">★ [Stars] • [Language]</div>
         <a href="[URL]" style="color: #8b5cf6; font-size: 13px; text-decoration: none; font-weight: 600;">View repo →</a>
       </div>

    7. ONE CONTRARIAN TAKE:
       - Write 3-4 sentences like a frustrated senior engineer at a bar
       - Start with a strong disagreement: "Everyone's losing their minds over X. Here's what they're missing."
       - End with a specific prediction or recommendation
       HTML:
       <div style="border-left: 3px solid #10b981; padding: 20px 24px; margin: 40px 0; background: rgba(16,185,129,0.03);">
         <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0; font-style: italic;">[Your contrarian take — 3-4 punchy sentences]</p>
       </div>

    8. ONE RADAR SIGNAL:
       - Find the most overlooked item from ALL sources
       - Explain in 2-3 sentences why this will matter in 6 months
       HTML:
       <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 30px; margin-top: 40px;">
         <div style="background: #8b5cf6; color: #000; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 100px; display: inline-block; margin-bottom: 15px; letter-spacing: 2px;">THE RADAR</div>
         <h3 style="color: #ffffff; font-size: 22px; margin-bottom: 10px;">[What you spotted]</h3>
         <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">[Why this is a sleeper hit — 2-3 sentences]</p>
         <p style="color: #8b5cf6; font-size: 13px; font-weight: 700;">// WATCH THIS SPACE</p>
       </div>

    HARD RULES:
    - Return ONLY HTML. No markdown. No code fences. Inline styles only.
    - NEVER repeat an item across sections. Each source used once.
    - NEVER use repo names as stories or gadgets. Repos only in the repos section.
    - NEVER include report headers, dates, personnel IDs, or greeting text — those are added by the template.
    - Use ONLY URLs from the SOURCES provided. Do not invent or guess URLs.
    - If GADGETS has fewer than 2 AI-relevant items, use only what's relevant. Don't pad with non-AI gadgets.
    - Vary your sentence structure. If you start 3 descriptions with "This", rewrite 2 of them.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```html|```/g, '').trim();
  } catch (error) {
    console.error('Error generating AI content:', error);
    return `<p style="color: #ffffff;">Neural processing error. Access dashboard for manual briefing.</p>`;
  }
}

async function sendNewsletter() {
  console.log('--- STARTING 3-2-1 WEEKLY INTELLIGENCE PROTOCOL ---');

  const now = new Date();
  
  // 1. Calculate the 'Target Monday' for this week's issue.
  // If it's Sunday (0), the target is tomorrow. If Monday (1), the target is today.
  const targetMonday = new Date(now);
  const dayOfWeek = now.getUTCDay();
  if (dayOfWeek === 0) targetMonday.setUTCDate(now.getUTCDate() + 1);
  else if (dayOfWeek !== 1 && !process.argv.includes('--force')) {
    console.log('Not Monday or Sunday (UTC). Skipping scheduled run.');
    return;
  }

  const dateStr = targetMonday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const isoDate = targetMonday.toISOString().split('T')[0]; // YYYY-MM-DD
  const forceSend = process.argv && Array.isArray(process.argv) ? process.argv.includes('--force') : false;

  // 1. Check if we already have a generated briefing for this week in the vault
  let sharedEmailBody = null;
  try {
    const { data: cachedArchive, error: checkError } = await supabase
      .from('newsletter_archive')
      .select('content_html')
      .eq('week_date', dateStr)
      .maybeSingle();

    if (cachedArchive) {
      console.log('--- CACHE HIT: REUSING ARCHIVED NEURAL BRIEFING ---');
      sharedEmailBody = cachedArchive.content_html;
    }
  } catch (err) {
    console.warn('Cache check failed, will proceed with generation if needed:', err.message);
  }

  // 2. Fetch all VERIFIED subscribers
  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('is_verified', true);

  if (error) {
    console.error('Database connection failure:', error);
    return;
  }

  // 3. Generate content if it doesn't exist AND it's Monday (or forced)
  const serverDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(now);
  const isMondayGlobal = serverDay === 'Monday';

  if (!sharedEmailBody && (isMondayGlobal || forceSend)) {
    console.log('--- CACHE MISS: GENERATING NEW NEURAL BRIEFING (singleton) ---');
    const intelligenceData = await fetchAIIntelligence();
    
    if (intelligenceData.articles.length === 0) {
      console.log('Insufficient signal found. Aborting generation.');
    } else {
      const contentHtml = await generateWeeklyIntelligence(intelligenceData);
      sharedEmailBody = getNewsletterBodyHtml(null, dateStr, contentHtml); 

      try {
        console.log('--- ARCHIVING SIGNAL FOR WEB VIEW & FUTURE TIMEZONES ---');
        const { error: archiveError } = await supabase
          .from('newsletter_archive')
          .insert([{ 
            week_date: dateStr, 
            content_html: sharedEmailBody, 
            raw_content: contentHtml, 
            repositories: intelligenceData.repos.map(repo => repo.name) 
          }]);

        if (archiveError) {
          console.error('Failed to archive freshly generated newsletter:', archiveError);
          sharedEmailBody = null; // Prevent dispatch without archived content
        } else {
          console.log('Signal archived successfully.');
        }
      } catch (archiveErr) {
        console.error('Archive storage exception:', archiveErr);
        sharedEmailBody = null; // Prevent dispatch without archived content
      }
    }
  } else if (sharedEmailBody) {
    console.log('--- UTILIZING EXISTING ARCHIVED BRIEFING ---');
  }

  // 4. Identify who needs the transmission in their specific window (Monday 9AM+)
  const qualifyingSubscribers = subscribers.filter(subscriber => {
    const localeOptions = { timeZone: subscriber.timezone, hour12: false };
    const userDay = new Intl.DateTimeFormat('en-US', { ...localeOptions, weekday: 'long' }).format(now);
    const userHour = parseInt(new Intl.DateTimeFormat('en-US', { ...localeOptions, hour: 'numeric' }).format(now));
    
    // Check if it's already Monday in their local time
    const isMonday = userDay === 'Monday';
    const is9AMOrLater = userHour >= 9;
    const alreadySent = subscriber.last_sent_date === isoDate;

    console.log(`[TARGET] ${subscriber.email} | Target: ${userDay} 09:00 | Current: ${userHour}:00 | Sent today: ${alreadySent}`);
    return (isMonday && is9AMOrLater && !alreadySent) || forceSend;
  });

  if (qualifyingSubscribers.length === 0) {
    console.log('No qualifying subscribers at this time. Skipping transmission dispatch.');
    return;
  }

  // Double check we have content to send
  if (!sharedEmailBody) {
    console.log('Transmission aborted: No content available to send.');
    return;
  }

  // 4. Dispatch to Inngest for Background Fan-Out
  console.log(`--- DISPATCHING TO INNGEST BACKGROUND WORKER (${qualifyingSubscribers.length} TARGETS) ---`);
  
  try {
    await inngest.send({
      name: "signal/newsletter.dispatch",
      data: {
        subscribers: qualifyingSubscribers,
        dateStr: dateStr,
        isoDate: isoDate
      }
    });
    console.log('[SUCCESS] Transmission dispatched to background worker.');
  } catch (dispatchErr) {
    console.error('[CRITICAL] Inngest Dispatch Failed:', dispatchErr);
    // Fallback: If Inngest is down, we could potentially log this for a manual retry later.
  }
}

// Export for use in API handler
export { sendNewsletter };

// Only run if called directly (CLI mode), not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running newsletter script directly...');
  sendNewsletter().catch(err => {
    console.error('Direct execution failed:', err);
    process.exit(1);
  });
}

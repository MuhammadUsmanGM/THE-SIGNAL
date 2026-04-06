import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../src/utils/mailer.js';
import { getNewsletterHtml } from '../src/utils/templates.js';

const EMAIL = process.argv[2];
if (!EMAIL) {
  console.error('Usage: node scripts/test-send.mjs <email>');
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('newsletter_archive')
  .select('*')
  .order('id', { ascending: false })
  .limit(1)
  .single();

if (error || !data) {
  console.error('No archive found:', error);
  process.exit(1);
}

const subscriber = { name: 'Usman', email: EMAIL, v_token: 'test', created_at: new Date().toISOString() };
const appUrl = process.env.APP_URL || '';
const fullHtml = getNewsletterHtml(subscriber, data.week_date, data.raw_content, appUrl);

try {
  await sendMail(EMAIL, `THE SIGNAL: Usman, Intelligence Protocol for ${data.week_date}`, fullHtml);
  console.log(`Email sent to ${EMAIL}`);
} catch (err) {
  console.error('Send failed:', err);
  process.exit(1);
}

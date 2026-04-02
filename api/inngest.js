import { serve } from "inngest/node";
import { inngest } from "../src/inngest/client.js";
import { sendMail } from "../src/utils/mailer.js";

import { getNewsletterHtml, getResurrectionEmailHtml } from "../src/utils/templates.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * The individual worker job to send a single issue to a single user.
 * This function is retried automatically by Inngest if the SMTP server fails.
 */
const sendIndividualIssue = inngest.createFunction(
  { id: "send-individual-issue", retries: 5 },
  { event: "signal/newsletter.send_single" },
  async ({ event, step }) => {
    const { subscriber, dateStr, isoDate } = event.data;
    const appUrl = process.env.APP_URL || '';
    
    const contentHtml = await step.run("fetch-content", async () => {
      const { data, error } = await supabase
        .from('newsletter_archive')
        .select('raw_content')
        .eq('week_date', dateStr)
        .single();
      if (error) throw error;
      return data?.raw_content;
    });

    if (!contentHtml) {
      throw new Error(`Content not found for date ${dateStr}`);
    }

    const fullHtml = getNewsletterHtml(subscriber, dateStr, contentHtml, appUrl);

    await step.run("deliver-email", async () => {
      console.log(`[DELIVERY] Attempting send to ${subscriber.email}`);
      return await sendMail(
        subscriber.email, 
        `THE SIGNAL: ${subscriber.name}, Intelligence Protocol for ${dateStr}`, 
        fullHtml
      );
    });

    await step.run("update-subscriber-status", async () => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ last_sent_date: isoDate }) 
        .eq('email', subscriber.email);
      if (error) throw error;
    });

    return { success: true, user: subscriber.email };
  }
);

/**
 * Main Dispatcher: Receives a batch of subscribers and content, then fans them out.
 * This separates the generation phase from the heavy-lifting delivery phase.
 */
const newsletterDispatcher = inngest.createFunction(
  { id: "newsletter-dispatcher" },
  { event: "signal/newsletter.dispatch" },
  async ({ event, step }) => {
    const { subscribers, dateStr, isoDate, forceSend = false } = event.data;
    
    // 1. We fan out the sends as separate events without duplicating the large content payload.
    const events = subscribers.map(sub => ({
      name: "signal/newsletter.send_single",
      data: { 
        subscriber: sub, 
        dateStr,
        isoDate,
        forceSend
      }
    }));

    // Inngest can take up to 400 events in a single send call for performance
    const batchSize = 400;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await step.sendEvent(`dispatch-batch-${i}`, batch);
    }

    return { count: subscribers.length };
  }
);

/**
 * 3. Resurrection Protocol (Re-engagement Automation)
 * Runs weekly to find inactive nodes and send a 'Signal Lost' prompt.
 */
const resurrectionWatcher = inngest.createFunction(
  { id: "resurrection-protocol" },
  { cron: "0 10 * * 0" }, // Every Sunday at 10 AM
  async ({ step }) => {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    const appUrl = process.env.APP_URL;

    const { data: inactiveUsers } = await step.run("fetch-inactive-nodes", async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, name, v_token, last_active_at, last_reengagement_sent_at')
        .eq('is_verified', true)
        .lt('last_active_at', threeWeeksAgo.toISOString())
        .or(`last_reengagement_sent_at.is.null, last_reengagement_sent_at.lt.last_active_at`);
      
      if (error) throw error;
      return data;
    });

    if (!inactiveUsers || inactiveUsers.length === 0) return { status: "no_inactive_nodes" };

    const results = await step.run("send-resurrection-signals", async () => {
      let sentCount = 0;

      for (const user of inactiveUsers) {
        try {
          const html = getResurrectionEmailHtml(user.name, appUrl);
          await sendMail(user.email, "SIGNAL LOST: Node Inactivity Detected 📡", html);
          
          await supabase
            .from('newsletter_subscribers')
            .update({ last_reengagement_sent_at: new Date().toISOString() })
            .eq('email', user.email);
            
          sentCount++;
        } catch (err) {
          console.error(`Failed to resurrect ${user.email}:`, err);
        }
      }
      return { sent: sentCount };
    });

    return { status: "complete", ...results };
  }
);

/**
 * Handler for the /api/inngest endpoint.
 */
export default serve({
  client: inngest,
  functions: [
    newsletterDispatcher,
    sendIndividualIssue,
    resurrectionWatcher
  ],
});

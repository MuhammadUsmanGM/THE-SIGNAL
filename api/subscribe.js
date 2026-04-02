import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { sendMail } from '../src/utils/mailer.js';
import { getVerificationEmailHtml } from '../src/utils/templates.js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, timezone, turnstileToken, referrerToken } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // 1. Verify Turnstile Token
  if (!turnstileToken) {
    return res.status(400).json({ error: 'Security verification failed. Please refresh and try again.' });
  }

  try {
    const verifyResp = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      })
    );

    if (!verifyResp.data.success) {
      return res.status(400).json({ error: 'Failed security verification. Bot activity detected.' });
    }
  } catch (err) {
    console.error('Turnstile verification error:', err.message);
    return res.status(500).json({ error: 'Security verification failed due to a network error. Please try again.' });
  }

  try {
    // 2. Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('email, name, is_verified, v_token')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      // Scenario A: User is already verified
      if (existingUser.is_verified) {
        let finalToken = existingUser.v_token;

        // PATCH: If user is verified but has no v_token (legacy nodes)
        if (!finalToken) {
          finalToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          await supabase
            .from('newsletter_subscribers')
            .update({ v_token: finalToken })
            .eq('email', email);
        }

        return res.status(200).json({ 
          success: true, 
          alreadySubscribed: true, 
          name: existingUser.name,
          v_token: finalToken,
          message: 'Your neural link is already active. Access granted.' 
        });
      }

      // Scenario B: User exists but is NOT verified (Resend verification)
      const tokenToUse = existingUser.v_token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Update DB if token is missing
      if (!existingUser.v_token) {
        await supabase
          .from('newsletter_subscribers')
          .update({ v_token: tokenToUse })
          .eq('email', email);
      }

      const resendHtml = getVerificationEmailHtml(existingUser.name, tokenToUse, process.env.APP_URL);
      await sendMail(email, 'THE SIGNAL: Action Required - Verify Transmission 📡', resendHtml);
      
      return res.status(200).json({
        success: true,
        pendingVerification: true,
        message: 'A verification link has been dispatched to your inbox. Activate it to finalize the link.'
      });
    }

    // 3. New Subscriber: Generate Token and Insert (Unverified)
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ 
        name, 
        email, 
        timezone, 
        is_verified: false, 
        v_token: verificationToken,
        referred_by: referrerToken || null,
        referral_count: 0
      }]);

    if (insertError) throw insertError;

    // 4. Send Verification Email
    const verificationHtml = getVerificationEmailHtml(name, verificationToken, process.env.APP_URL);
    await sendMail(email, 'THE SIGNAL: Action Required - Verify Transmission 📡', verificationHtml);

    return res.status(200).json({ 
      success: true, 
      pendingVerification: true,
      message: 'Node detected. Check your inbox to verify your transmission and activate the link.' 
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Failed to initialize connection. Protocol error code: 500.' });
  }
}

/**
 * Determines the personnel rank based on join date.
 */
function getPersonnelRank(joinDateStr) {
  const joinDate = new Date(joinDateStr);
  const now = new Date();
  const diffDays = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(diffDays / 7);
  
  const ranks = [
    'Alpha Initiate', 'Beta Observer', 'Gamma Link', 'Delta Signal', 
    'Epsilon Core', 'Zeta Vanguard', 'Theta Master', 'Omega Prime', 
    'Vertex Oracle', 'Signal Eternal'
  ];
  
  return ranks[Math.min(weekIndex, 9)];
}

/**
 * Generates the core HTML body for the newsletter content.
 */
export function getNewsletterBodyHtml(subscriber, dateStr, contentHtml) {
  const rank = subscriber?.created_at ? getPersonnelRank(subscriber.created_at) : 'Active Node';
  const name = subscriber?.name || 'Commander';
  
  return `
    <div style="padding: 40px; color: #94a3b8; line-height: 1.75;">
      <p style="font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 3px; color: #10b981; text-transform: uppercase; margin-bottom: 20px;">
        // WEEKLY_INTELLIGENCE_REPORT :: ${dateStr} :: PERSONNEL_ID: ${name.toUpperCase().substring(0, 3)}-${(subscriber?.id || '000').toString().padStart(3, '0')}
      </p>

      <div style="margin-bottom: 30px; border-left: 2px solid #10b981; padding-left: 20px;">
        <h2 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Greetings, ${rank} ${name}.</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Your personal intelligence briefing is authenticated. Read carefully.</p>
      </div>
      
      <div class="newsletter-content-body">
        ${contentHtml}
      </div>

      <div style="margin-top: 50px; padding: 30px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; text-align: center;">
        <h3 style="color: #fff; margin-top: 0; margin-bottom: 5px;">Until next week — stay ahead of the signal.</h3>
        <p style="font-size: 14px; margin-bottom: 0;"><strong>${name}</strong>, you are receiving this because your neural node (${rank}) is authorized for signal reception. Stay alert.</p>
      </div>
    </div>
  `;
}

/**
 * Generates the full HTML for the newsletter email.
 * @param {Object} subscriber - Subscriber object.
 * @param {string} dateStr - Date string for the newsletter.
 * @param {string} contentHtml - The generated content from the LLM.
 * @param {string} appUrl - The base URL of the application.
 * @returns {string} - Full HTML string.
 */
export function getNewsletterHtml(subscriber, dateStr, contentHtml, appUrl) {
  const unsubscribeUrl = `${appUrl}/?unsubscribe=true&token=${subscriber.v_token || ''}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THE SIGNAL: Intelligence Protocol</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Outfit:wght@400;600;700;800&display=swap');

    /* ── RESET ─────────────────────────────── */
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    body { margin: 0 !important; padding: 0 !important; background-color: #020617 !important; }

    /* ── TYPOGRAPHY ────────────────────────── */
    body, p, h1, h2, h3, td, a { font-family: 'Outfit', Arial, sans-serif; }
    .mono { font-family: 'Share Tech Mono', 'Courier New', monospace !important; }

    /* ── LAYOUT ────────────────────────────── */
    .email-body { width: 100%; max-width: 600px; margin: 0 auto; }

    /* ── PADDING ───────────────────────────── */
    .pad   { padding: 40px !important; }
    .pad-t { padding: 36px 40px 0 !important; }

    /* ── ISSUE NUMBER STAMP ────────────────── */
    .issue-pill {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 20px;
      color: #10b981;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    /* ── SECTION LABEL ─────────────────────── */
    .section-label {
      font-family: 'Share Tech Mono','Courier New',monospace;
      font-size: 10px;
      color: #10b981;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin: 0 0 14px 0;
    }

    /* ── CONTENT BLOCK (each 3-2-2-1 item) ── */
    .content-block {
      background: #0a1628;
      border: 1px solid #1e293b;
      border-left: 3px solid #10b981;
      border-radius: 10px;
      width: 100%;
      margin-bottom: 16px;
    }
    .content-block-pad { padding: 24px 26px; }

    .block-tag {
      font-family: 'Share Tech Mono','Courier New',monospace;
      font-size: 9px;
      color: #10b981;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: inline-block;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 4px;
      padding: 3px 8px;
      margin-bottom: 10px;
    }
    .block-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      line-height: 1.3;
    }
    .block-body {
      margin: 0;
      font-size: 14px;
      line-height: 1.75;
      color: #94a3b8;
    }
    .block-link {
      display: inline-block;
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #10b981 !important;
      text-decoration: none;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── DIVIDER ───────────────────────────── */
    .divider { border: 0; border-top: 1px solid #1e293b; margin: 0; width: 100%; }

    /* ── CTA BUTTONS ───────────────────────── */
    .btn-outline {
      display: inline-block;
      padding: 14px 28px;
      background: transparent;
      border: 1px solid #10b981;
      border-radius: 8px;
      color: #10b981 !important;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: none;
    }
    .btn-solid {
      display: inline-block;
      padding: 14px 28px;
      background: #10b981;
      border: 1px solid #10b981;
      border-radius: 8px;
      color: #020617 !important;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: none;
    }

    /* ── FEEDBACK CARD ─────────────────────── */
    .feedback-card {
      background: linear-gradient(135deg, #0d2a1f 0%, #0a1628 100%);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 12px;
      width: 100%;
    }

    /* ── STAT ROW ──────────────────────────── */
    .stat-cell { width: 33.33%; text-align: center; vertical-align: top; padding: 0 10px; }

    /* ═══════════════════════════════════════
       RESPONSIVE ≤ 620px
    ═══════════════════════════════════════ */
    @media screen and (max-width: 620px) {
      .email-body { width: 100% !important; }
      .pad   { padding: 24px 18px !important; }
      .pad-t { padding: 24px 18px 0 !important; }
      .content-block-pad { padding: 18px 16px !important; }

      h1 { font-size: 36px !important; letter-spacing: -1px !important; }
      h2 { font-size: 20px !important; }

      /* stack CTA buttons */
      .btn-outline,
      .btn-solid {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
        margin-bottom: 10px !important;
        margin-right: 0 !important;
        padding: 16px 10px !important;
      }
      .btn-gap { display: none !important; }

      /* util stack column */
      .stack-column {
        display: block !important;
        width: 100% !important;
      }
      .stack-column-center {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        margin-bottom: 14px !important;
      }
      .feedback-pad {
        padding: 24px 20px !important;
      }
      .feedback-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }

      /* stat row stacks */
      .stat-row  { display: block !important; }
      .stat-cell { display: block !important; width: 100% !important; padding: 10px 0 !important; border-right: none !important; border-bottom: 1px solid #1e293b !important; }
      .stat-cell:last-child { border-bottom: none !important; }

      /* footer stack */
      .footer-copy  { display: block !important; width: 100% !important; text-align: center !important; }
      .footer-icons { display: block !important; width: 100% !important; text-align: center !important; padding-top: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#020617;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#020617;">
<tr>
<td align="center">

  <table role="presentation" class="email-body" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">


    <!-- ═══════════════════════════════
         HEADER
    ════════════════════════════════ -->
    <tr>
      <td class="pad" style="background:linear-gradient(160deg,#061a12 0%,#020617 100%);border-bottom:2px solid #10b981;text-align:center;">
        <img src="${appUrl}/Favicon.webp" alt="Signal" width="64" height="64"
             style="display:block;margin:0 auto 20px auto;border:1px solid #10b981;border-radius:14px;width:64px;height:64px;">

        <div class="issue-pill">Weekly Protocol Release</div>

        <h1 style="margin:18px 0 0 0;font-size:50px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">
          THE <span style="color:#10b981;">SIGNAL.</span>
        </h1>

        <p class="mono" style="margin:14px 0 0 0;font-size:12px;color:#475569;letter-spacing:2px;">
          ${dateStr}
        </p>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         BRIEFING GREETING
    ════════════════════════════════ -->
    <tr>
      <td class="pad" style="background-color: #020617;">
        <p style="font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 3px; color: #10b981; text-transform: uppercase; margin: 0 0 20px 0;">
          // WEEKLY_INTELLIGENCE_REPORT :: ${dateStr} :: PERSONNEL_ID: ${subscriber.name ? subscriber.name.toUpperCase().substring(0, 3) : 'COM'}-${(subscriber.id || '000').toString().padStart(3, '0')}
        </p>
        <div style="margin-bottom: 30px; border-left: 2px solid #10b981; padding-left: 20px;">
          <h2 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Greetings, ${subscriber.created_at ? getPersonnelRank(subscriber.created_at) : 'Active Node'} ${subscriber.name || 'Commander'}.</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8; opacity: 0.8;">Your personal intelligence briefing is authenticated. Read carefully.</p>
        </div>
      </td>
    </tr>

    <!-- rule -->
    <tr>
      <td class="pad-t"><hr class="divider"></td>
    </tr>


    <!-- ═══════════════════════════════
         ISSUE STATS BAR
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;">
          <tr class="stat-row">
            <td class="stat-cell" style="padding:15px 5px;border-right:1px solid #1e293b;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">3</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">SIGNALS</p>
            </td>
            <td class="stat-cell" style="padding:15px 5px;border-right:1px solid #1e293b;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">3</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">GADGETS</p>
            </td>
            <td class="stat-cell" style="padding:15px 5px;border-right:1px solid #1e293b;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">2+2</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">NODES</p>
            </td>
            <td class="stat-cell" style="padding:15px 5px;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">1</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">INSIGHT</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         MAIN CONTENT
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <p class="mono section-label">// THIS_WEEKS_SIGNALS</p>

        <!-- content block wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="color:#cbd5e1;font-size:15px;line-height:1.8;">
              ${contentHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         CTA BUTTONS
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <hr class="divider" style="margin-bottom:28px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="stack-column">
              <a href="${appUrl}/?view=latest" class="btn-outline">
                Explore on Web
              </a>
            </td>
            <td class="btn-gap" width="12">&nbsp;</td>
            <td class="stack-column">
              <a href="${appUrl}/?view=dashboard&name=${encodeURIComponent(subscriber.name)}&email=${encodeURIComponent(subscriber.email)}"
                 class="btn-solid">
                Neural Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         DIRECT FEEDBACK POLL (1-CLICK)
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <table role="presentation" class="feedback-card" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="feedback-pad" style="padding:32px 30px; text-align: center;">
              
              <p class="mono" style="margin:0 0 10px 0;font-size:10px;color:#10b981;letter-spacing:4px;">
                // PROTOCOL_OPTIMIZATION_SURVEY
              </p>
              <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#f1f5f9;line-height:1.2;">
                Was this signal worth your cycle?
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#64748b;line-height:1.5;">
                Select a binary feedback signal to help optimize future transmissions.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="48%">
                  <td width="4%">&nbsp;</td>
                  <td width="48%">
                    <a href="${appUrl}/api/track/feedback?token=${subscriber.v_token || ''}&useful=false" 
                       style="display:block; padding:12px; background:rgba(239,68,68,0.05); border:1px solid #ef4444; border-radius:8px; color:#ef4444; text-align:center; font-weight:700; font-size:12px; text-decoration:none; text-transform:uppercase; letter-spacing:1px;">
                      [ NO ]  NEGATIVE_SIGNAL
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         FOOTER
    ════════════════════════════════ -->
    <tr>
      <td class="pad">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
          <tr><td style="border-top:1px solid #1e293b;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="footer-copy" style="vertical-align:middle;">
              <p class="mono" style="margin:0 0 4px 0;font-size:11px;color:#475569;letter-spacing:2px;">
                THE SIGNAL &nbsp;|&nbsp; NEURAL RELAY ACTIVE
              </p>
              <p style="margin:0;font-size:12px;color:#334155;">
                © ${new Date().getFullYear()} THE SIGNAL. Forged for the technical elite.
              </p>
            </td>
            <td class="footer-icons" width="80" style="vertical-align:middle;text-align:right;">
              <a href="https://github.com/MuhammadUsmanGM" style="display:inline-block;margin-left:14px;">
                <img src="https://img.icons8.com/ios-filled/50/10b981/github.png" width="20" height="20" alt="GitHub"
                     style="display:block;width:20px;height:20px;">
              </a>
              <a href="https://linkedin.com/in/muhammad-usman-ai-dev" style="display:inline-block;margin-left:14px;">
                <img src="https://img.icons8.com/ios-filled/50/10b981/linkedin.png" width="20" height="20" alt="LinkedIn"
                     style="display:block;width:20px;height:20px;">
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:20px 0 0 0;font-size:11px;color:#334155;text-align:center;">
          <a href="${unsubscribeUrl}" style="color:#334155;text-decoration:underline;">
            Deactivate Neural Link
          </a>
        </p>

      </td>
    </tr>


    <!-- ═══════════════════════════════
         TELEMETRY PIXEL
    ════════════════════════════════ -->
    <img src="${appUrl}/api/track/open?token=${subscriber.v_token || ''}" width="1" height="1" border="0" style="display:none !important; visibility:hidden; opacity:0;" />
    
  </table><!-- /email-body -->
</td>
</tr>
</table>

</body>
</html>
  `.trim();
}

/**
 * Generates the verification email (Double Opt-in) for new subscribers.
 * @param {string} name - User's name.
 * @param {string} token - Verification token.
 * @param {string} appUrl - Base app URL.
 * @returns {string} - Full HTML string.
 */
export function getVerificationEmailHtml(name, token, appUrl) {
  const verifyUrl = `${appUrl}/api/verify?token=${token}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Outfit:wght@400;700&display=swap');
    body { font-family: 'Outfit', sans-serif; background-color: #020617; color: #94a3b8; padding: 40px; }
    .card { max-width: 500px; margin: 0 auto; background: #0a1628; border: 1px solid #10b981; border-radius: 12px; padding: 40px; text-align: center; }
    .logo { width: 48px; border-radius: 8px; border: 1px solid #10b981; margin-bottom: 24px; }
    .mono { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 3px; color: #10b981; text-transform: uppercase; margin-bottom: 20px; }
    h1 { color: #fff; font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .btn { display: inline-block; background: #10b981; color: #020617 !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .footer { font-size: 12px; color: #475569; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${appUrl}/Favicon.webp" class="logo" alt="Signal">
    <div class="mono">// VERIFICATION_REQUIRED</div>
    <h1>Initialize Transmission?</h1>
    <p>Greetings, ${name}. We've detected a request to connect your node to <strong>THE SIGNAL</strong>. Please confirm your identity to activate the neural link.</p>
    <a href="${verifyUrl}" class="btn">Verify Transmission →</a>
    <div class="footer">If you didn't request this connection, please ignore this transmission. Connection will self-destruct in 24 hours.</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates the premium welcome (Alpha Clearance) email for verified subscribers.
 * @param {string} name - User's name.
 * @param {string} email - User's email.
 * @param {string} appUrl - Base app URL.
 * @returns {string} - Full HTML string.
 */
export function getWelcomeEmailHtml(name, email, appUrl) {
  const subId = `USR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Outfit:wght@400;600;700;800&display=swap');
    body { font-family: 'Outfit', Arial, sans-serif; background-color: #020617; margin: 0; padding: 0; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background: #020617; border: 1px solid #10b981; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(160deg,#061a12 0%,#020617 100%); padding: 40px; text-align: center; border-bottom: 2px solid #10b981; }
    .mono { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 3px; color: #10b981; text-transform: uppercase; }
    h1 { color: #fff; font-size: 48px; font-weight: 800; letter-spacing: -2px; margin: 20px 0 0 0; }
    .content { padding: 40px; color: #94a3b8; line-height: 1.75; }
    .card-vip { background: linear-gradient(135deg, #0d2a1f 0%, #0a1628 100%); border: 1px solid #10b981; border-radius: 12px; padding: 30px; margin-top: 30px; }
    .badge { display: inline-block; background: #10b981; color: #020617; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 4px; margin-bottom: 12px; }
    .sub-id { font-size: 24px; color: #fff; font-weight: 800; margin-bottom: 4px; }
    .cta { display: inline-block; background: #10b981; color: #020617 !important; padding: 18px 44px; border-radius: 8px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 30px; }
    .footer { padding: 40px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #334155; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="${appUrl}/Favicon.webp" width="60" style="border-radius:12px; border:1px solid #10b981;">
      <div class="mono" style="margin-top:20px;">// SIGNAL_RELAY :: CONNECTION_STABLE</div>
      <h1>THE <span style="color:#10b981;">SIGNAL.</span></h1>
    </div>
    <div class="content">
      <p class="mono">// TRANSMISSION_ACCEPTED</p>
      <h2 style="color:#fff; font-size:26px;">Clearance granted, ${name}.</h2>
      <p>Your neural node has been successfully verified. You are now part of the <strong>THE SIGNAL</strong> inner circle. Every Monday at 09:00 AM, you will receive our pinpoint-accurate intelligence briefing.</p>
      
      <div class="card-vip">
        <div class="badge">CLEARANCE LEVEL: ALPHA</div>
        <div class="mono sub-id">${subId}</div>
        <p class="mono" style="color:#475569; font-size:10px;">AUTHORIZED PROTOCOL NODE &nbsp;|&nbsp; EST. 2026</p>
        <div style="border-top:1px solid rgba(16,185,129,0.2); margin:20px 0; padding-top:20px;">
          <p style="margin:0; font-size:14px;"><strong>Unlocked Assets:</strong> Weekly Intelligence, Alpha Drops, Full Archive Access, Community Node.</p>
        </div>
      </div>

      <center>
        <a href="${appUrl}/?view=dashboard&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}" class="cta">Initialize Terminal →</a>
      </center>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} THE SIGNAL. &nbsp;|&nbsp; <a href="${appUrl}/?unsubscribe=true&email=${encodeURIComponent(email)}" style="color:#334155;">Deactivate Link</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates the Resurrection (Re-engagement) email for inactive nodes.
 */
export function getResurrectionEmailHtml(name, appUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Outfit:wght@400;700&display=swap');
    body { font-family: 'Outfit', sans-serif; background-color: #020617; color: #94a3b8; padding: 40px; }
    .card { max-width: 500px; margin: 0 auto; background: #020617; border: 1px solid #ef4444; border-radius: 12px; padding: 40px; text-align: center; }
    .logo { width: 48px; border-radius: 8px; border: 1px solid #ef4444; margin-bottom: 24px; opacity: 0.5; }
    .mono { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 3px; color: #ef4444; text-transform: uppercase; margin-bottom: 20px; }
    h1 { color: #fff; font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .btn { display: inline-block; background: #ef4444; color: #fff !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .footer { font-size: 12px; color: #475569; margin-top: 40px; border-top: 1px solid rgba(239, 68, 68, 0.1); padding-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${appUrl}/Favicon.webp" class="logo" alt="Signal">
    <div class="mono">// SIGNAL_LOST :: NODE_INACTIVE</div>
    <h1>Is your node still active?</h1>
    <p>Greetings, ${name}. Our telemetry indicates your neural terminal hasn't synced with <strong>THE SIGNAL</strong> in 21 days. We've temporarily throttled your bandwidth to protect the protocol.</p>
    <a href="${appUrl}/?view=dashboard" class="btn">Re-Sync Node →</a>
    <div class="footer">
      No action required if you wish to stay dark. We'll attempt one final reconnection before terminal decommission.
    </div>
  </div>
</body>
</html>
  `.trim();
}

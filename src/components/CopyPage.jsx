import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Lock, Copy, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNeuralTheme } from "../context/ThemeContext";
import logo from "../assets/Favicon.webp";
import "./Welcome.css";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CopyPage = ({ setView }) => {
  const { currentTheme } = useNeuralTheme();
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  const CORRECT_PASSWORD =
    import.meta.env.VITE_COPY_PAGE_PASSWORD || "admin123";

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
      setError("");
      fetchLatestIssue();
    } else {
      setError("Invalid Access Credentials");
      setPassword("");
    }
  };

  const fetchLatestIssue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("newsletter_archive")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setIssue(data);
    } catch (err) {
      console.error("Error fetching issue:", err);
      setError("Failed to retrieve the latest protocol.");
    } finally {
      setLoading(false);
    }
  };

  const formatForLinkedIn = (html) => {
    if (!html) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let formattedBody = "";

    // Helper to get text content safely and clean it
    const getText = (el) =>
      el ? el.textContent.trim().replace(/\s+/g, " ") : "";

    // 1. TOP SIGNALS (The 3)
    const stories = Array.from(doc.querySelectorAll("h2"));
    if (stories.length > 0) {
      formattedBody += `◈ 01. THE SIGNALS | MAJOR BREAKTHROUGHS`;
      stories.forEach((h, i) => {
        const headline = getText(h).toUpperCase();
        const parent = h.parentElement;
        const p = parent?.querySelector("p") || h.nextElementSibling;
        const a =
          parent?.querySelector("a") ||
          parent?.parentElement?.querySelector("a");

        if (headline && !headline.includes("MAJOR NEW STORIES")) {
          formattedBody += `\n▶ ${headline}\n`;
          if (p) formattedBody += `▸ ${getText(p)}\n`;
          if (a && a.href && !a.href.includes("localhost")) {
            formattedBody += `🔗 Analysis: ${a.href}\n`;
          }
        }
      });
    }

    // 2. HARDWARE (The 3)
    const gadgetCards = Array.from(doc.querySelectorAll("div")).filter(
      (d) =>
        d.textContent.includes("GADGET PROTOCOL") && d.querySelector("strong"),
    );
    if (gadgetCards.length > 0) {
      formattedBody += `\n◈ 02. HARDWARE | THE GADGET PROTOCOL`;
      gadgetCards.forEach((node) => {
        const name = getText(node.querySelector("strong"));
        const details = getText(node.querySelector("p"));
        const a = node.querySelector("a");

        if (name && !name.includes("GADGET NAME")) {
          formattedBody += `\n⚡︎ ${name.toUpperCase()}\n`;
          if (details) formattedBody += `▸ ${details}\n`;
          if (a && a.href && !a.href.includes("localhost")) {
            formattedBody += `🔗 Technical Specs: ${a.href}\n`;
          }
        }
      });
    }

    // 3. ECOSYSTEM (The 2)
    const toolCards = Array.from(doc.querySelectorAll("div")).filter(
      (d) => d.textContent.includes("TOOL NODE") && d.querySelector("strong"),
    );
    if (toolCards.length > 0) {
      formattedBody += `\n◈ 03. THE TOOLKIT | ELITE SYSTEMS`;
      toolCards.forEach((node) => {
        const name = getText(node.querySelector("strong"));
        const details = getText(node.querySelector("p"));
        const a = node.querySelector("a");

        if (name && !name.includes("TOOL NAME")) {
          formattedBody += `\n⚙︎ ${name.toUpperCase()}\n`;
          if (details) formattedBody += `▸ ${details}\n`;
          if (a && a.href && !a.href.includes("localhost")) {
            formattedBody += `🔗 Protocol Access: ${a.href}\n`;
          }
        }
      });
    }

    // 4. OPEN SOURCE (The 2)
    const repoCards = Array.from(doc.querySelectorAll("div")).filter(
      (d) =>
        d.innerHTML.toLowerCase().includes("github node") ||
        d.innerText.toLowerCase().includes("github node"),
    );
    if (repoCards.length > 0) {
      let repoContent = "";
      let count = 0;
      repoCards.forEach((node) => {
        const name = getText(node.querySelector("strong"));
        const details = getText(node.querySelector("p"));
        const a = node.querySelector("a");

        if (
          name &&
          !name.includes("PLACEHOLDER") &&
          !name.includes("REPO NAME")
        ) {
          repoContent += `\n❏ ${name.toUpperCase()}\n`;
          if (details) repoContent += `▸ ${details}\n`;
          if (a && a.href && !a.href.includes("localhost")) {
            repoContent += `🔗 Repository: ${a.href}\n`;
          }
          count++;
        }
      });
      if (count > 0) {
        formattedBody += `\n◈ 04. THE SOURCE | TRENDING REPOS\n${repoContent}`;
      }
    }

    // 5. THE PLAYABLE INSIGHT (The 1)
    const insightSection = Array.from(
      doc.querySelectorAll("h3, div, strong, h2"),
    ).find((el) => {
      const text = el.textContent.toLowerCase();
      return (
        text.includes("actionable insight") ||
        text.includes("neural insight") ||
        text.includes("interactive insight") ||
        text.includes("intelligence pipeline")
      );
    });

    if (insightSection) {
      let insightText = "";
      const nextP = insightSection.nextElementSibling;
      if (nextP && nextP.tagName === "P") {
        insightText = getText(nextP);
      } else {
        const parent = insightSection.parentElement;
        const pInside = parent?.querySelector("p");
        if (pInside) insightText = getText(pInside);
      }

      if (!insightText && insightSection.nextElementSibling) {
        let sibling = insightSection.nextElementSibling;
        for (let i = 0; i < 3 && sibling; i++) {
          if (sibling.textContent.trim().length > 30) {
            insightText = getText(sibling);
            break;
          }
          sibling = sibling.nextElementSibling;
        }
      }

      if (insightText) {
        formattedBody += `\n◈ 05. NEURAL INSIGHT | ACTIONABLE\n`;
        formattedBody += `\n"${insightText}"\n`;
      }
    }

    // Premium LinkedIn Header
    const header =
      `◈ THE SIGNAL | INTELLIGENCE PROTOCOL ◈\n` +
      `──────────────────────────────\n` +
      `Issue #${issue?.id || "3"} | Release: ${issue?.week_date || ""}\n` +
      `Status: [ SECURE_TRANSMISSION ]\n` +
      `──────────────────────────────\n\n` +
      `Precision intelligence for the AI elite. No hype, just the architecture of tomorrow.\n\n` +
      `Here is your 3-3-2-2-1-1 protocol for this week:\n`;

    // World-Class CTA Footer
    const footer =
      `\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
      `📬 START RECEIVING THE SIGNAL\n` +
      `Join 1,000+ engineers getting the weekly briefing:\n` +
      `➔ ${window.location.origin}\n` +
      `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +
      `#AI #FutureTech #Engineering #TheSignal #IntelligenceProtocol`;

    return header + formattedBody + footer;
  };

  // NEW VERSION: updated template driven by issue id and new section formatting
  const formatForLinkedInV2 = (html) => {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const getText = (el) =>
      el ? el.textContent.trim().replace(/\s+/g, " ") : "";

    const stories = [];
    Array.from(doc.querySelectorAll("h2")).forEach((h) => {
      const text = getText(h);
      if (text && !text.toUpperCase().includes("MAJOR NEW STORIES")) {
        const headline = text.toUpperCase();
        const parent = h.parentElement;
        const p = parent?.querySelector("p") || h.nextElementSibling;
        const linkEl =
          parent?.querySelector("a") ||
          parent?.parentElement?.querySelector("a");
        const summary = p ? getText(p) : "";
        const url =
          linkEl && linkEl.href && !linkEl.href.includes("localhost")
            ? linkEl.href
            : "";
        stories.push({ headline, summary, url });
      }
    });

    const gadgets = [];
    Array.from(doc.querySelectorAll("div"))
      .filter(
        (d) =>
          d.textContent.includes("GADGET PROTOCOL") &&
          d.querySelector("strong"),
      )
      .forEach((node) => {
        const name = getText(node.querySelector("strong"));
        if (name && !name.includes("GADGET NAME")) {
          const details = getText(node.querySelector("p"));
          const a = node.querySelector("a");
          const url =
            a && a.href && !a.href.includes("localhost") ? a.href : "";
          gadgets.push({ name: name.toUpperCase(), details, url });
        }
      });

    const tools = [];
    Array.from(doc.querySelectorAll("div"))
      .filter(
        (d) => d.textContent.includes("TOOL NODE") && d.querySelector("strong"),
      )
      .forEach((node) => {
        const name = getText(node.querySelector("strong"));
        if (name && !name.includes("TOOL NAME")) {
          const details = getText(node.querySelector("p"));
          const a = node.querySelector("a");
          const url =
            a && a.href && !a.href.includes("localhost") ? a.href : "";
          tools.push({ name: name.toUpperCase(), details, url });
        }
      });

    const repos = [];
    Array.from(doc.querySelectorAll("div"))
      .filter(
        (d) =>
          d.innerHTML.toLowerCase().includes("github node") ||
          d.innerText.toLowerCase().includes("github node"),
      )
      .forEach((node) => {
        const name = getText(node.querySelector("strong"));
        if (
          name &&
          !name.includes("PLACEHOLDER") &&
          !name.includes("REPO NAME")
        ) {
          const details = getText(node.querySelector("p"));
          const a = node.querySelector("a");
          const url =
            a && a.href && !a.href.includes("localhost") ? a.href : "";
          repos.push({ name: name.toUpperCase(), details, url });
        }
      });

    // Extraction: THE RADAR
    let radarSignal = "";
    const radarSection = Array.from(doc.querySelectorAll("div")).find(d => 
      d.textContent.includes("THE RADAR") && d.querySelector("h3")
    );
    if (radarSection) {
      const title = getText(radarSection.querySelector("h3"));
      const details = getText(radarSection.querySelector("p"));
      if (title) radarSignal = `⚡︎ ${title}\n${details}`;
    }

    // Extraction: LEAD EDITOR INTRO
    let introText = "";
    const introSection = doc.querySelector('div[style*="border-bottom"] p');
    if (introSection) {
      introText = getText(introSection);
    }

    // Extraction: SUBJECT LINE
    let subjectLine = "";
    const firstParagraph = doc.body.querySelector('p');
    if (firstParagraph && firstParagraph.textContent.length < 150 && firstParagraph.textContent.includes(".")) {
        // AI usually puts subject line as first text it generates if not wrapped in specific div
        // But our script might wrap it or it might just be the first thing in the string
        // Let's check for the emoji-started line
        const subjectMatch = html.match(/^(?:[\u2700-\u27bf]|\ud83c[\udde6-\uddfa]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]|\ud83e[\udd00-\uddff]|[\u2600-\u26ff]|[\u2300-\u23ff]).+?(?=\n|<div|<p)/i);
        if (subjectMatch) subjectLine = subjectMatch[0].trim();
    }

    // Extraction: THE INSIGHT
    let insight = "";
    const insightSection = Array.from(
      doc.querySelectorAll("h3, div, strong, h2"),
    ).find((el) => {
      const text = el.textContent.toLowerCase();
      return (
        text.includes("actionable insight") ||
        text.includes("neural insight") ||
        text.includes("interactive insight") ||
        text.includes("intelligence pipeline")
      );
    });

    if (insightSection) {
      const nextP = insightSection.nextElementSibling;
      if (nextP && nextP.tagName === "P") {
        insight = getText(nextP);
      } else {
        const parent = insightSection.parentElement;
        const pInside = parent?.querySelector("p");
        if (pInside) insight = getText(pInside);
      }
    }

    let out = "";
    const issueNum = issue && issue.id ? String(issue.id).padStart(2, "0") : "??";
    
    // Header
    out += `◈ THE SIGNAL #${issueNum} | INTELLIGENCE PROTOCOL ◈\n`;
    if (subjectLine) {
      out += `Subject: ${subjectLine}\n`;
    }
    out += `Precision intelligence for the AI elite.\n\n`;
    
    if (introText) {
      out += `"${introText}"\n\n`;
    }

    out += `Here is your 3-3-2-2-1-1 protocol for this week 👇\n\n`;

    // 01. Breakthroughs
    out += `◈ 01. THE SIGNALS | MAJOR BREAKTHROUGHS\n`;
    stories.forEach((s) => {
      out += `▶ ${s.headline}\n${s.summary}\n`;
      if (s.url) out += `🔗 Analysis: ${s.url}\n`;
      out += `\n`;
    });

    // 02. Gadgets
    out += `◈ 02. HARDWARE | GADGET PROTOCOL\n`;
    gadgets.forEach((g) => {
      out += `⚡︎ ${g.name}\n${g.details}\n`;
      if (g.url) out += `🔗 Technical Specs: ${g.url}\n`;
      out += `\n`;
    });

    // 03. Tools
    out += `◈ 03. THE TOOLKIT | ELITE SYSTEMS\n`;
    tools.forEach((t) => {
      out += `⚙︎ ${t.name}\n${t.details}\n`;
      if (t.url) out += `🔗 Protocol Access: ${t.url}\n`;
      out += `\n`;
    });

    // 04. Repos
    out += `◈ 04. THE SOURCE | TRENDING REPOS\n`;
    repos.forEach((r) => {
      out += `❏ ${r.name}\n${r.details}\n`;
      if (r.url) out += `🔗 Repository: ${r.url}\n`;
      out += `\n`;
    });

    // 05. Insight
    if (insight) {
      out += `◈ 05. NEURAL INSIGHT | CONTRARIAN\n`;
      out += `\n"${insight}"\n\n`;
    }

    // 06. The Radar
    if (radarSignal) {
      out += `◈ 06. THE RADAR | EARLY WARNING\n`;
      out += `\n${radarSignal}\n\n`;
    }
    // World-Class CTA Footer
    out += `\nUntil next week — stay ahead of the signal.\n\n`;
    out += `📬 START RECEIVING THE SIGNAL\n`;
    out += `Join 1,000+ engineers getting the weekly briefing:\n`;
    out += `➔ ${window.location.origin}\n\n`;
    out += `#AI #ArtificialIntelligence #TheSignal #MachineLearning #Engineering #AITools`;

    return out;
  };

  const handleCopy = () => {
    const formattedText = formatForLinkedInV2(issue.content_html);
    navigator.clipboard.writeText(formattedText);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  if (!isAuthorized) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content" style={{ maxWidth: "400px" }}>
          <div
            className="welcome-logo-container"
            style={{ borderColor: currentTheme.color }}
          >
            <img src={logo} alt="Company Logo" className="welcome-logo" />
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: "1.5rem",
              marginBottom: "1rem",
              letterSpacing: "2px",
            }}
          >
            RESTRICTED ACCESS
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              marginBottom: "2rem",
            }}
          >
            Enter protocol bypass credentials to retrieve copy-ready
            intelligence.
          </p>

          <form onSubmit={handleAuth} style={{ width: "100%" }}>
            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ACCESS KEY"
                style={{
                  width: "100%",
                  padding: "14px 45px 14px 15px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${error ? "#ef4444" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
              style={{
                background: currentTheme.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <Lock size={16} /> Decrypt Protocol
            </button>
          </form>

          <button
            onClick={() => setView("home")}
            style={{
              marginTop: "2rem",
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <ArrowLeft size={14} /> Return to Public Terminal
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div
            className="loading-spinner"
            style={{
              borderColor: currentTheme.color,
              borderTopColor: "transparent",
            }}
          ></div>
          <p style={{ marginTop: "20px", color: "#94a3b8" }}>
            Fetching latest intelligence...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        padding: "40px 20px",
        color: "#cbd5e1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: "800px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{ color: "#fff", fontSize: "1.8rem", marginBottom: "5px" }}
            >
              LinkedIn Publisher
            </h1>
            <p style={{ color: "#94a3b8" }}>
              Formatted and ready for article deployment.
            </p>
          </div>
          <button
            onClick={() => setView("home")}
            className="secondary-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
            }}
          >
            <ArrowLeft size={16} /> Exit
          </button>
        </div>

        {issue ? (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "30px",
              position: "relative",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                }}
              >
                PROTOCOL_ID: #{issue.id} | DATE: {issue.week_date}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "15px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <span style={{ fontWeight: "bold", color: currentTheme.color }}>
                PUBLISH VERSION
              </span>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 24px",
                  background: copyStatus ? "#10b981" : currentTheme.color,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {copyStatus ? <Check size={18} /> : <Copy size={18} />}
                {copyStatus ? "Copied to Clipboard" : "Copy for LinkedIn"}
              </button>
            </div>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                lineHeight: "1.6",
                fontSize: "0.95rem",
                color: "#e2e8f0",
                padding: "10px",
              }}
            >
              {formatForLinkedInV2(issue.content_html)}
            </pre>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p>No intelligence records found to format.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyPage;

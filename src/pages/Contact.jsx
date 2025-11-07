import React, { useState } from "react";

export default function Contact() {
  const [formHover, setFormHover] = useState(false);
  const [faqHover, setFaqHover] = useState([false, false, false]);

  const hoverStyles = (isHover) =>
    isHover
      ? {
          boxShadow: "0 10px 24px rgba(16,24,40,0.12)",
          transform: "translateY(-2px)",
          border: "1px solid #dbeaf2",
        }
      : {};

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: 0 }}>
      {/* Top Section */}
  <div style={{ width: "100%", background: "#F7FBFE", padding: "0 0 8px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 16px 0 16px" }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 8, letterSpacing: -1 }}>Contact Us</h1>
          <p style={{ color: "#6b7280", fontSize: 18, textAlign: "center", marginBottom: 40, fontWeight: 400 }}>
            Have questions? We're here to help. Reach out to our team anytime.
          </p>
        </div>
      </div>
  {/* Main Content: centered two-column layout matching screenshot */}
  <div style={{ maxWidth: 1000, margin: "24px auto 0 auto", padding: "0 24px", display: "flex", gap: 32, alignItems: "flex-start", justifyContent: "center" }}>
        {/* Left: Form in card */}
  <div style={{ flex: 1, minWidth: 360, maxWidth: 460 }}>
          <div
            onMouseEnter={() => setFormHover(true)}
            onMouseLeave={() => setFormHover(false)}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e6edf2",
              boxShadow: "0 2px 16px rgba(16,24,40,0.06)",
              padding: "40px 32px 32px 32px",
              transition: "box-shadow .2s ease, transform .2s ease, border-color .2s ease",
              ...hoverStyles(formHover),
            }}
          >
            <form>
              <h2 style={{ fontWeight: 700, fontSize: 24, color: "#22292f", marginBottom: 24 }}>Send us a message</h2>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#22292f", display: "block", marginBottom: 6 }}>Name</label>
                <input type="text" placeholder="Your name" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e6edf2", background: "#f7fafb", fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#22292f", display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" placeholder="your@email.com" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e6edf2", background: "#f7fafb", fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontWeight: 500, color: "#22292f", display: "block", marginBottom: 6 }}>Message</label>
                <textarea placeholder="How can we help you?" rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e6edf2", background: "#f7fafb", fontSize: 15, resize: "vertical" }} />
              </div>
              <button type="submit" style={{ width: "100%", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 16, border: "none", borderRadius: 8, padding: "12px 0", cursor: "pointer" }}>
                Send Message
              </button>
            </form>
          </div>
        </div>
        {/* Right: Info in background, styled to match screenshot with emoji and text sizes */}
        <div style={{ flex: 1, minWidth: 360, maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: "#22292f", marginBottom: 10, textAlign: 'left' }}>Get in touch</h2>
          <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 20, textAlign: 'left', lineHeight: 1.6, maxWidth: 520 }}>
            Our customer support team is available to assist you with any questions or concerns.<br />
            Feel free to reach out through any of the following channels.
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
            <span style={{ background: '#e6faf3', color: '#10b981', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', marginTop: 2 }}>
              {/* Email Icon */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="3" fill="#e6faf3"/><path d="M3 7l9 6 9-6" stroke="#10b981" strokeWidth="2" fill="none"/></svg>
            </span>
            <div>
              <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 2, fontSize: 15 }}>Email</div>
              <div style={{ color: '#374151', fontSize: 14 }}>support@medcare.com<br />orders@medcare.com</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
            <span style={{ background: '#e6faf3', color: '#10b981', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', marginTop: 2 }}>
              {/* Phone Icon */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#e6faf3"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="#10b981" strokeWidth="2" fill="none"/><path d="M12 8v4l3 3" stroke="#10b981" strokeWidth="2" fill="none"/></svg>
            </span>
            <div>
              <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 2, fontSize: 15 }}>Phone</div>
              <div style={{ color: '#374151', fontSize: 14 }}>1-800-MED-CARE (633-2273)<br />1-800-555-0199</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
            <span style={{ background: '#e6faf3', color: '#10b981', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', marginTop: 2 }}>
              {/* Address Icon */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="10" r="3" fill="#e6faf3"/><path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.5 11 9 11s9-5.75 9-11c0-4.97-4.03-9-9-9z" stroke="#10b981" strokeWidth="2" fill="none"/></svg>
            </span>
            <div>
              <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 2, fontSize: 15 }}>Address</div>
              <div style={{ color: '#374151', fontSize: 14 }}>123 Healthcare Boulevard<br />Suite 456<br />New York, NY 10001</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
            <span style={{ background: '#e6faf3', color: '#10b981', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', marginTop: 2 }}>
              {/* Business Hours Icon */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#e6faf3"/><path d="M12 8v4l3 3" stroke="#10b981" strokeWidth="2" fill="none"/></svg>
            </span>
            <div>
              <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 2, fontSize: 15 }}>Business Hours</div>
              <div style={{ color: '#374151', fontSize: 14 }}>Monday - Friday: 9:00 AM - 6:00 PM EST<br />Saturday: 10:00 AM - 4:00 PM EST<br />Sunday: Closed</div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #e6edf2', padding: '36px 0', marginTop: 16, textAlign: 'center', color: '#6b7280', fontSize: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Map Location Icon */}
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="2" style={{ marginBottom: 12 }}><circle cx="12" cy="10" r="3" fill="#ffffff"/><path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.5 11 9 11s9-5.75 9-11c0-4.97-4.03-9-9-9z" stroke="#6b7280" strokeWidth="2" fill="none"/></svg>
            <div>Map Location</div>
          </div>
        </div>
      </div>
  {/* FAQ Section (light blue background as in screenshot) */}
  <div style={{ background: '#F7FBFE', padding: '56px 0 64px 0', marginTop: 40 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 32, color: '#22292f', marginBottom: 32, letterSpacing: -1 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            onMouseEnter={() => setFaqHover(([_, b, c]) => [true, b, c])}
            onMouseLeave={() => setFaqHover(([_, b, c]) => [false, b, c])}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e6edf2',
              padding: '24px 28px',
              margin: '0 auto',
              width: '100%',
              boxShadow: '0 1px 4px rgba(16,24,40,0.04)',
              transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
              ...hoverStyles(faqHover[0]),
            }}
          >
            <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 6, fontSize: 16 }}>How long does shipping take?</div>
            <div style={{ color: '#6b7280', fontSize: 15 }}>
              Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 day delivery.
            </div>
          </div>
          <div
            onMouseEnter={() => setFaqHover(([a, _, c]) => [a, true, c])}
            onMouseLeave={() => setFaqHover(([a, _, c]) => [a, false, c])}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e6edf2',
              padding: '24px 28px',
              margin: '0 auto',
              width: '100%',
              boxShadow: '0 1px 4px rgba(16,24,40,0.04)',
              transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
              ...hoverStyles(faqHover[1]),
            }}
          >
            <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 6, fontSize: 16 }}>Do you ship internationally?</div>
            <div style={{ color: '#6b7280', fontSize: 15 }}>
              Currently, we only ship within the United States. International shipping is coming soon.
            </div>
          </div>
          <div
            onMouseEnter={() => setFaqHover(([a, b, _]) => [a, b, true])}
            onMouseLeave={() => setFaqHover(([a, b, _]) => [a, b, false])}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e6edf2',
              padding: '24px 28px',
              margin: '0 auto',
              width: '100%',
              boxShadow: '0 1px 4px rgba(16,24,40,0.04)',
              transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
              ...hoverStyles(faqHover[2]),
            }}
          >
            <div style={{ fontWeight: 600, color: '#22292f', marginBottom: 6, fontSize: 16 }}>Are prescriptions required?</div>
            <div style={{ color: '#6b7280', fontSize: 15 }}>
              Some medications require a valid prescription. You can upload your prescription during checkout or have your doctor send it directly to us.
            </div>
          </div>
        </div>
      </div>
      {/* Footer on white */}
      <div style={{ textAlign: 'center', color: '#b0b7c3', fontSize: 14, marginTop: 0, marginBottom: 0, background: '#FFFFFF', padding: '12px 0' }}>
        © 2024 MedCare. All rights reserved.
      </div>
    </div>
  );
}

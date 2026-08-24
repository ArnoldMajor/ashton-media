"use client";
import { useState } from "react";
import { PageHero } from "@/components/PageSections";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "", budget: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-card-alt)",
    border: "1px solid var(--white-mild)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: "'Montserrat',sans-serif",
    padding: "13px 16px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>
      <PageHero title="Get in Touch" tag="Contact" sub="Ready to put your brand in front of millions? Tell us about your campaign and we'll build the perfect package." />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,80px)", alignItems: "start" }}>

          {/* Form */}
          <div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "28px", margin: "0 0 32px", letterSpacing: "-1px" }}>Start a Campaign</h2>

            {submitted ? (
              <div style={{ background: "var(--lime-tint)", border: "1px solid var(--lime-border-soft)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>✓</div>
                <h3 style={{ fontWeight: 800, fontSize: "20px", margin: "0 0 8px" }}>Message sent!</h3>
                <p style={{ color: "var(--white-moderate)", fontSize: "14px", margin: 0 }}>Our team will be in touch within 24 hours.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-quiet)", display: "block", marginBottom: "8px" }}>Your Name</label>
                    <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-quiet)", display: "block", marginBottom: "8px" }}>Company</label>
                    <input style={inputStyle} value={form.company} onChange={set("company")} placeholder="Acme Ltd" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-quiet)", display: "block", marginBottom: "8px" }}>Email Address</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-quiet)", display: "block", marginBottom: "8px" }}>Phone</label>
                  <input style={inputStyle} type="tel" value={form.phone} onChange={set("phone")} placeholder="+255 7xx xxx xxx" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-quiet)", display: "block", marginBottom: "8px" }}>Monthly Budget</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={form.budget} onChange={set("budget")}>
                    <option value="" style={{ background: "var(--bg-card-alt)" }}>Select a range</option>
                    <option value="under-1k" style={{ background: "var(--bg-card-alt)" }}>Under USD 1,000</option>
                    <option value="1k-5k" style={{ background: "var(--bg-card-alt)" }}>USD 1,000 – 5,000</option>
                    <option value="5k-15k" style={{ background: "var(--bg-card-alt)" }}>USD 5,000 – 15,000</option>
                    <option value="15k+" style={{ background: "var(--bg-card-alt)" }}>USD 15,000+</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-quiet)", display: "block", marginBottom: "8px" }}>Tell us about your campaign</label>
                  <textarea
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical" }}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Which cities, formats, or specific sites are you interested in?"
                  />
                </div>
                <button
                  onClick={() => setSubmitted(true)}
                  style={{ background: "var(--text)", border: "none", color: "var(--on-accent)", fontSize: "14px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", padding: "16px", borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s", marginTop: "8px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Send Message
                </button>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "28px", margin: "0 0 32px", letterSpacing: "-1px" }}>Contact Details</h2>

            {[
              { label: "Phone", value: "+255 758 88 00 88", href: "tel:+255758880088" },
              { label: "Email", value: "info@ashtonmedia.net", href: "mailto:info@ashtonmedia.net" },
            ].map((c) => (
              <div key={c.label} style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--white-subdued)", marginBottom: "8px" }}>{c.label}</div>
                <a href={c.href} style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>{c.value}</a>
              </div>
            ))}

            <div style={{ marginBottom: "40px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--white-subdued)", marginBottom: "8px" }}>Office</div>
              <p style={{ fontSize: "15px", color: "var(--white-secondary)", lineHeight: 1.7 }}>Dar es Salaam, Tanzania</p>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px" }}>
              <h4 style={{ fontWeight: 800, fontSize: "16px", margin: "0 0 12px" }}>Office Hours</h4>
              {[
                { days: "Monday – Friday", hours: "8:00 AM – 6:00 PM" },
                { days: "Saturday", hours: "9:00 AM – 2:00 PM" },
                { days: "Sunday", hours: "Closed" },
              ].map((r) => (
                <div key={r.days} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--white-faintest)" }}>
                  <span style={{ fontSize: "13px", color: "var(--white-moderate)" }}>{r.days}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{r.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

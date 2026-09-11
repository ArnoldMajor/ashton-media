"use client";
import { useState } from "react";
import { PageHero } from "@/components/PageSections";

const CONTACT_DETAILS = [
  { label: "Phone", value: "+255 758 88 00 88", href: "tel:+255758880088" },
  { label: "Email", value: "info@ashtonmedia.net", href: "mailto:info@ashtonmedia.net" },
];

const OFFICE_HOURS = [
  { days: "Monday – Friday", hours: "8:00 AM – 6:00 PM" },
  { days: "Saturday", hours: "9:00 AM – 2:00 PM" },
  { days: "Sunday", hours: "Closed" },
];

const inputClass = "w-full bg-card-alt border border-white/12 rounded-lg text-white text-sm py-3.25 px-4 outline-none";
const labelClass = "text-[11px] font-bold tracking-[1.5px] uppercase text-white/40 block mb-2";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "", budget: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="bg-canvas text-white">
      <PageHero title="Get in Touch" tag="Contact" sub="Ready to put your brand in front of millions? Tell us about your campaign and we'll build the perfect package." />

      <div className="max-w-300 mx-auto py-15 px-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-start">

          <div>
            <h2 className="font-black text-[28px] mb-8 tracking-[-1px]">Start a Campaign</h2>

            {submitted ? (
              <div className="bg-lime/7 border border-lime/20 rounded-xl p-10 text-center">
                <div className="text-[32px] mb-4">✓</div>
                <h3 className="font-extrabold text-xl mb-2">Message sent!</h3>
                <p className="text-white/50 text-sm">Our team will be in touch within 24 hours.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Your Name</label>
                    <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>Company</label>
                    <input className={inputClass} value={form.company} onChange={set("company")} placeholder="Acme Ltd" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input className={inputClass} type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com" />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input className={inputClass} type="tel" value={form.phone} onChange={set("phone")} placeholder="+255 7xx xxx xxx" />
                </div>
                <div>
                  <label className={labelClass}>Monthly Budget</label>
                  <select className={`${inputClass} cursor-pointer`} value={form.budget} onChange={set("budget")}>
                    <option value="" className="bg-card-alt">Select a range</option>
                    <option value="under-1k" className="bg-card-alt">Under USD 1,000</option>
                    <option value="1k-5k" className="bg-card-alt">USD 1,000 – 5,000</option>
                    <option value="5k-15k" className="bg-card-alt">USD 5,000 – 15,000</option>
                    <option value="15k+" className="bg-card-alt">USD 15,000+</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tell us about your campaign</label>
                  <textarea
                    rows={5}
                    className={`${inputClass} resize-y`}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Which cities, formats, or specific sites are you interested in?"
                  />
                </div>
                <button
                  onClick={() => setSubmitted(true)}
                  className="bg-white border-none text-black text-sm font-bold py-4 rounded-lg cursor-pointer transition-opacity mt-2 hover:opacity-85"
                >
                  Send Message
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-black text-[28px] mb-8 tracking-[-1px]">Contact Details</h2>

            {CONTACT_DETAILS.map((c) => (
              <div key={c.label} className="mb-6">
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-2">{c.label}</div>
                <a href={c.href} className="text-lg font-bold text-white no-underline">{c.value}</a>
              </div>
            ))}

            <div className="mb-10">
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-2">Office</div>
              <p className="text-[15px] text-white/60 leading-[1.7]">Dar es Salaam, Tanzania</p>
            </div>

            <div className="bg-card border border-white/7 rounded-xl p-7">
              <h4 className="font-extrabold text-base mb-3">Office Hours</h4>
              {OFFICE_HOURS.map((r) => (
                <div key={r.days} className="flex justify-between py-2 border-b border-b-white/5">
                  <span className="text-[13px] text-white/50">{r.days}</span>
                  <span className="text-[13px] font-semibold">{r.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

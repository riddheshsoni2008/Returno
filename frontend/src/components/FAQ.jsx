"use client";

import { useState } from 'react';

export default function FAQ() {
  const [open, setOpen] = useState(0);

  const faqs = [
    {
      q: "What is Returno?",
      a: "Returno is an enterprise-grade digital loyalty rewards platform that helps local businesses increase customer retention. It replaces old paper punch cards with digital stamps collected by scanning custom QR codes."
    },
    {
      q: "Is Returno free for customers?",
      a: "Yes! Returno is 100% free for customers. Just scan a business's loyalty QR code, sign in quickly via OTP or Google, and collect stamps to unlock free rewards."
    },
    {
      q: "How do I earn stamps and claim rewards?",
      a: "When making a purchase, scan the store's QR code. Enter your bill number and total amount. The system will award a stamp instantly. Once you reach the milestone count, your reward is unlocked. Show the unlocked reward page to the business owner at checkout, and they will confirm it using their counter verification PIN."
    },
    {
      q: "How does the Geofencing Anti-Fraud system work?",
      a: "To prevent customers from claiming fake stamps from home, Returno performs a secure coordinate distance check. When you scan, the web app checks your device's location to verify you are physically inside or near the shop (within 100 meters)."
    },
    {
      q: "Is Returno free to try for businesses?",
      a: "Absolutely. During development, all premium features, campaigns, and QR generation layouts are completely free to try under our Starter / Trial plans without entering credit card details."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 scroll-reveal">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 ${open === i ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-white/50'}`}
            >
              <button 
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
              >
                <span className="font-semibold text-lg text-slate-900">{faq.q}</span>
                <span className={`text-brand-600 font-bold text-2xl transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${open === i ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from 'react';

export default function FAQ() {
  const [open, setOpen] = useState(0);

  const faqs = [
    {
      q: "What is Returno?",
      a: "Returno is a digital loyalty rewards platform that helps you earn rewards at your favorite local businesses including cafés, restaurants, salons, gyms, car washes, and retail stores."
    },
    {
      q: "How do I earn rewards?",
      a: "Simply visit a participating business, scan their QR code with your phone, and collect digital stamps. Once you complete your stamp card, you earn a free reward!"
    },
    {
      q: "Is Returno free for customers?",
      a: "Yes! Returno is 100% free for customers. Just scan the QR code at participating businesses, collect stamps, and start earning rewards immediately."
    },
    {
      q: "What plans are available for businesses?",
      a: "We offer three main plans: Basic (₹999/year, 1 location), Growth (₹2,499/year, up to 3 locations with automatic GPS branch detection), and Pro (₹4,999/year, up to 6 locations). All plans include a 3-day free trial."
    },
    {
      q: "Can I use one QR code for multiple branches?",
      a: "Yes! With the Growth and Pro plans, you use a single QR code for all your branches. Returno automatically detects which branch a customer is at using GPS location."
    },
    {
      q: "How do I redeem my reward?",
      a: "Once you've collected all the required stamps, your reward will appear in your loyalty wallet. Simply show it to the staff at the business to claim your free reward."
    },
    {
      q: "Do I get a free QR code stand?",
      a: "Yes! All paid plans come with a FREE physical QR code stand delivered to your business so customers can easily scan and collect stamps."
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

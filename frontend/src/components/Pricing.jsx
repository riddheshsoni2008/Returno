import Link from "next/link";

export default function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "₹999",
      period: "/year",
      description: "Perfect for a single-location cafe, salon, retail store, or gym starting out.",
      features: ["1 Shop Location", "Unlimited Customers", "Unlimited QR Stamp Claims", "Custom Rewards & Stamps", "QR Code Generator", "FREE Physical QR Stand Delivered", "Basic Analytics Dashboard", "3-Day Free Trial Included"],
      popular: false
    },
    {
      name: "Growth",
      price: "₹2,499",
      period: "/year",
      description: "Ideal for growing brands with up to 3 shop branches and automatic GPS branch detection.",
      features: ["Up to 3 Shop Locations", "GPS Branch Detection", "Unlimited Customers & Stamps", "Custom Rewards & Stamps", "QR Code Generator", "FREE Physical QR Stand Delivered", "Advanced Analytics Dashboard", "3-Day Free Trial Included", "Priority Email Support"],
      popular: true
    },
    {
      name: "Pro",
      price: "₹4,999",
      period: "/year",
      description: "For expanding local business chains with up to 6 locations and advanced fraud logs.",
      features: ["Up to 6 Shop Locations", "GPS Branch Detection", "Unlimited Customers & Stamps", "Detailed Security Logs Audit", "Custom Category Icon", "FREE Physical QR Stand Delivered", "Priority 24/7 Support", "3-Day Free Trial Included"],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 relative bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-primary">Pricing Plans for Shops</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">100% Free for customers. Simple, transparent pricing for local businesses to drive growth. Currently free in development!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-8 scroll-reveal flex flex-col justify-between ${plan.popular
                ? 'bg-white border-2 border-brand-500 shadow-xl md:-translate-y-4'
                : 'bg-white border border-border-standard shadow-sm'
                }`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                <p className="text-sm text-text-secondary mb-6 h-10">{plan.description}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-text-primary">{plan.price}</span>
                  <span className="text-text-secondary">{plan.period}</span>
                </div>

                <Link
                  href="/auth?tab=register"
                  className={`block text-center w-full py-3 rounded-full font-bold mb-8 transition-colors text-text-secondary ${plan.popular ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-slate-50 hover:bg-slate-100 text-brand-700 border border-border-standard hover:border-slate-300'
                    }`}
                >
                  Start 3-Day Free Trial
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-slate-700 text-sm">
                      <span className="text-brand-600 mr-3 font-bold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "₹499",
      period: "/month",
      description: "Perfect for single location local cafes or boutique stores starting out.",
      features: ["1 Shop Location", "Unlimited Customers", "Unlimited QR Stamp Claims", "Basic Analytics", "Anti-Fraud Checks"],
      popular: false
    },
    {
      name: "Growth",
      price: "₹1,499",
      period: "/month",
      description: "Ideal for expanding brands with multiple branches and dynamic offers.",
      features: ["Up to 3 Shop Locations", "GPS Geofencing Checks", "Visits Velocity Limiter", "Advanced Customer Analytics", "Custom Shop Category Icon", "Priority Support"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹2,999",
      period: "/month",
      description: "For established businesses dominating the local market with full audit checks.",
      features: ["Unlimited Locations", "GPS Geofencing & Fraud Logs", "API Access for Point-of-Sale (POS)", "Dedicated Success Manager", "Detailed Security Logs Audit"],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 relative bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Pricing Plans for Shops</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">100% Free for customers. Simple, transparent pricing for local businesses to drive growth. Currently free in development!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-8 scroll-reveal flex flex-col justify-between ${plan.popular
                ? 'bg-white border-2 border-brand-500 shadow-xl md:-translate-y-4'
                : 'bg-white border border-slate-200 shadow-sm'
                }`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-6 h-10">{plan.description}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>

                <Link
                  href="/auth?tab=register"
                  className={`block text-center w-full py-3 rounded-full font-bold mb-8 transition-colors text-gray-500 ${plan.popular ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-slate-50 hover:bg-slate-100 text-brand-700 border border-slate-200 hover:border-slate-300'
                    }`}
                >
                  Start 14-Day Free Trial
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

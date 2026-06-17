import { Smartphone, Gift, Users, TrendingUp, Settings, Zap, Coffee, Utensils, Scissors, Dumbbell, Stethoscope, ShoppingBag } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: "QR Loyalty Programs",
      desc: "Instant loyalty stamp collection via dynamic or static QR codes. No app downloads required.",
      icon: <Smartphone className="w-6 h-6 text-brand-600" />
    },
    {
      title: "Reward Tracking",
      desc: "Clean customer wallet view showing collected stamps, history, and unlocked prizes.",
      icon: <Gift className="w-6 h-6 text-brand-600" />
    },
    {
      title: "Customer Insights",
      desc: "Store owner directory containing customer details, check-in intervals, and reward statistics.",
      icon: <Users className="w-6 h-6 text-brand-600" />
    },
    {
      title: "Retention Analytics",
      desc: "Real-time graphs showing returning customer ratios, scan velocity, and redemption volumes.",
      icon: "📈"
    },
    {
      title: "Campaign Management",
      desc: "Create and update campaigns instantly. Change targets, expiration limits, or prizes.",
      icon: <Settings className="w-6 h-6 text-brand-600" />
    },
    {
      title: "Mobile Friendly",
      desc: "Designed as a lightweight mobile first web application to maximize scan-to-claim conversions.",
      icon: <Zap className="w-6 h-6 text-brand-600" />
    }
  ];

  const industries = [
    { name: "Cafes", desc: "Buy 9 coffees, get 10th free.", icon: <Coffee className="w-8 h-8 text-slate-700 mx-auto" /> },
    { name: "Restaurants", desc: "Claim free appetizers or desserts.", icon: <Utensils className="w-8 h-8 text-slate-700 mx-auto" /> },
    { name: "Salons & Spas", desc: "Unlock 50% off on your 5th haircut.", icon: <Scissors className="w-8 h-8 text-slate-700 mx-auto" /> },
    { name: "Gyms & Fitness", desc: "Earn free sessions and health shakes.", icon: <Dumbbell className="w-8 h-8 text-slate-700 mx-auto" /> },
    { name: "Clinics", desc: "Reward regular routine health checks.", icon: <Stethoscope className="w-8 h-8 text-slate-700 mx-auto" /> },
    { name: "Retail Stores", desc: "Provide exclusive percentage cashbacks.", icon: <ShoppingBag className="w-8 h-8 text-slate-700 mx-auto" /> }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50 relative border-y border-slate-200">
      <div className="container mx-auto px-6">

        {/* Core Features */}
        <div className="mb-24">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Core Platform Features</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Everything local businesses need to turn one-time visitors into brand advocates, with no complex setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-300 hover:shadow-md transition-all duration-300 group"
              >
                <div className="text-3xl mb-4 bg-brand-50 w-12 h-12 flex items-center justify-center rounded-xl border border-brand-100 group-hover:scale-110 group-hover:bg-brand-100 transition-all duration-300">
                  {feat.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Targeted Industries */}
        <div>
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Tailored for Any Industry</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Returno fits seamlessly into any local shop footprint. Choose your setup and launch immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {industries.map((ind, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:bg-slate-50 hover:border-brand-200 hover:-translate-y-1 hover:shadow-sm transition-all text-center"
              >
                <div className="text-4xl mb-3">{ind.icon}</div>
                <h5 className="font-bold text-slate-900 mb-1">{ind.name}</h5>
                <p className="text-[11px] text-slate-500 leading-normal">{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

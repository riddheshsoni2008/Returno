import { Smartphone, Gift, Users, TrendingUp, Settings, Zap, Coffee, Utensils, Scissors, Dumbbell, Stethoscope, ShoppingBag } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: "QR Loyalty Programs",
      desc: "Instant loyalty stamp collection via dynamic or static QR codes. No app downloads required.",
      icon: <Smartphone className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Reward Tracking",
      desc: "Clean customer wallet view showing collected stamps, history, and unlocked prizes.",
      icon: <Gift className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Customer Insights",
      desc: "Store owner directory containing customer details, check-in intervals, and reward statistics.",
      icon: <Users className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Retention Analytics",
      desc: "Real-time graphs showing returning customer ratios, scan velocity, and redemption volumes.",
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Campaign Management",
      desc: "Create and update campaigns instantly. Change targets, expiration limits, or prizes.",
      icon: <Settings className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Mobile Friendly",
      desc: "Designed as a lightweight mobile first web application to maximize scan-to-claim conversions.",
      icon: <Zap className="w-6 h-6 text-blue-600" />
    }
  ];

  const industries = [
    { name: "Cafes", desc: "Buy 9 coffees, get 10th free.", icon: <Coffee className="w-8 h-8 text-slate-700 mx-auto group-hover:text-blue-600 transition-colors" /> },
    { name: "Restaurants", desc: "Claim free appetizers or desserts.", icon: <Utensils className="w-8 h-8 text-slate-700 mx-auto group-hover:text-blue-600 transition-colors" /> },
    { name: "Salons & Spas", desc: "Unlock 50% off on your 5th haircut.", icon: <Scissors className="w-8 h-8 text-slate-700 mx-auto group-hover:text-blue-600 transition-colors" /> },
    { name: "Gyms & Fitness", desc: "Earn free sessions and health shakes.", icon: <Dumbbell className="w-8 h-8 text-slate-700 mx-auto group-hover:text-blue-600 transition-colors" /> },
    { name: "Clinics", desc: "Reward regular routine health checks.", icon: <Stethoscope className="w-8 h-8 text-slate-700 mx-auto group-hover:text-blue-600 transition-colors" /> },
    { name: "Retail Stores", desc: "Provide exclusive percentage cashbacks.", icon: <ShoppingBag className="w-8 h-8 text-slate-700 mx-auto group-hover:text-blue-600 transition-colors" /> }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50/50 relative border-y border-slate-100">
      <div className="container mx-auto px-6">

        {/* Core Features */}
        <div className="mb-24">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-slate-900 tracking-tight">Core Platform Features</h2>
            <p className="text-slate-650 max-w-2xl mx-auto font-medium">
              Everything local businesses need to turn one-time visitors into brand advocates, with no complex setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-[0_15px_40px_-15px_rgba(37,99,235,0.08)] transition-all duration-300 group"
              >
                <div className="text-3xl mb-4 bg-blue-50/60 w-12 h-12 flex items-center justify-center rounded-xl border border-blue-100 group-hover:scale-105 group-hover:bg-blue-100/80 transition-all duration-300">
                  {feat.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-650 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Targeted Industries */}
        <div>
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-slate-900 tracking-tight">Tailored for Any Industry</h2>
            <p className="text-slate-650 max-w-2xl mx-auto font-medium">
              Returno fits seamlessly into any local shop footprint. Choose your setup and launch immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {industries.map((ind, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:bg-blue-50/30 hover:border-blue-200 hover:-translate-y-1 hover:shadow-sm transition-all duration-300 text-center group"
              >
                <div className="text-4xl mb-3">{ind.icon}</div>
                <h5 className="font-bold text-slate-900 mb-1 group-hover:text-blue-650 transition-colors">{ind.name}</h5>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

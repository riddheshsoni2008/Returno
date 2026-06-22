export default function HowItWorks() {
 const steps = [
 {
 number: "01",
 title: "Visit a Partner Business",
 description: "Discover local cafes, salons, gyms, and retail stores in your area using our app."
 },
 {
 number: "02",
 title: "Scan the QR Code",
 description: "Use your phone's camera to scan the unique Returno QR code at the counter. No download needed!"
 },
 {
 number: "03",
 title: "Collect Digital Stamps",
 description: "Automatically receive a digital stamp in your wallet for your visit or purchase."
 },
 {
 number: "04",
 title: "Earn Free Rewards",
 description: "Complete your stamp card and instantly unlock free coffee, discounts, and exclusive rewards."
 }
 ];

 return (
 <section id="how-it-works" className="py-24 relative bg-white border-t border-border-standard">
 <div className="container mx-auto px-6">
 <div className="text-center mb-16 scroll-reveal">
 <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-primary">How Returno Works</h2>
 <p className="text-slate-600 max-w-2xl mx-auto">Get rewarded for your loyalty in 4 simple steps. No paper cards to lose, no apps to download.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
 {steps.map((step, index) => (
 <div
 key={index}
 className="relative p-6 rounded-2xl bg-white border border-border-standard hover:border-brand-300 hover:shadow-lg transition-all duration-300 group scroll-reveal"
 style={{ animationDelay: `${index * 0.15}s` }}
 >

 <div className="text-5xl font-black text-text-muted absolute top-4 right-4 pointer-events-none group-hover:text-brand-50 transition-colors">
 {step.number}
 </div>
 <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-brand-600 transition-colors relative z-10">{step.title}</h3>
 <p className="text-text-secondary text-sm leading-relaxed relative z-10">{step.description}</p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}

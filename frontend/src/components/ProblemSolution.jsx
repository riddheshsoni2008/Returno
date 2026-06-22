export default function ProblemSolution() {
 const problems = [
 {
 title: "Customers Do Not Return",
 desc: "Most first-time visitors walk in once and never return. Re-engaging them without contact details is nearly impossible.",
 badge: "Low Retention"
 },
 {
 title: "Paper Loyalty Cards Get Lost",
 desc: "Customers lose physical stamp cards or leave them at home. Over 80% of paper cards end up in landfills.",
 badge: "Zero Convenience"
 },
 {
 title: "No Customer Retention Data",
 desc: "Zero analytics on who your loyal visitors are, how often they return, or what category of offers works best.",
 badge: "Blind Marketing"
 },
 {
 title: "Marketing is Too Expensive",
 desc: "Spending on ads and paid acquisition to get new customers costs 5x more than simply retaining existing ones.",
 badge: "High Acquisition Cost"
 }
 ];

 const solutions = [
 {
 step: "01",
 title: "Create Digital Campaigns",
 desc: "Build customizable stamp cards in under 60 seconds. Define your stamp targets and loyalty rewards."
 },
 {
 step: "02",
 title: "Print & Display QR Codes",
 desc: "Generate high-resolution custom brand QR codes to display on tables, receipts, or checkout counters."
 },
 {
 step: "03",
 title: "Instant Mobile Scans",
 desc: "Customers scan the QR code to check in and collect stamps on the spot. No application download required."
 },
 {
 step: "04",
 title: "Reward Loyal Customers",
 desc: "Watch customer counts grow as rewards unlock automatically and are approved via physical counter PIN checks."
 }
 ];

  return (
    <section className="py-24 relative overflow-hidden border-t border-slate-100 bg-slate-50/50">
      <div className="container mx-auto px-6 relative z-10">
     
        {/* Problems Grid */}
        <div className="mb-24">
          <div className="text-center mb-16 scroll-reveal">
            <span className="px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-650 text-xs font-semibold uppercase tracking-wider">
              The Problem
            </span>
            <h2 className="text-3xl md:text-5xl font-black mt-4 mb-6 text-slate-900 tracking-tight">Why Traditional Loyalty Fails</h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">
              Paper loyalty programs and generic marketing campaigns are draining local business budgets while yielding zero insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((prob, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 border-l-4 border-l-rose-500/80 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative group flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-rose-650 bg-rose-50/80 px-2.5 py-1 rounded-full border border-rose-100/60 tracking-wide uppercase">
                      {prob.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {prob.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mt-2 font-medium">
                    {prob.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Solutions Grid */}
        <div>
          <div className="text-center mb-16 scroll-reveal">
            <span className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-650 text-xs font-semibold uppercase tracking-wider">
              The Solution
            </span>
            <h2 className="text-3xl md:text-5xl font-black mt-4 mb-6 text-slate-900 tracking-tight">Introducing Returno</h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">
              A premium, frictionless digital loyalty system designed to double repeat customer visits with zero integration friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((sol, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 border-t-4 border-t-blue-500 rounded-2xl p-6 hover:border-blue-350 hover:shadow-[0_15px_40px_-15px_rgba(37,99,235,0.12)] transition-all duration-300 relative group flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-blue-650 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100/60 tracking-wider">
                      Step {sol.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-650 transition-colors relative z-10">
                    {sol.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mt-2 font-medium relative z-10">
                    {sol.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

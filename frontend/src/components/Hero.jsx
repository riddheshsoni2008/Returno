import Link from "next/link";
import { CheckCircle2, ChevronRight, Gift, ScanLine, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>
      
      {/* Soft Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-brand-50 to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm mb-8 font-medium scroll-fade">
          <span className="flex h-2 w-2 rounded-full bg-brand-500 mr-2"></span>
          Revolutionizing Customer Retention
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-slate-900 scroll-reveal">
          Turn Every Visit Into <br className="hidden md:block" />
          <span className="text-brand-600">
            Customer Loyalty
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 scroll-reveal" style={{ animationDelay: "0.1s" }}>
          Digital loyalty programs that help local businesses increase repeat customers and reward loyal visitors.
          <strong className="text-slate-900 font-semibold block mt-2">Simple, secure, and cardless.</strong>
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-20 scroll-reveal" style={{ animationDelay: "0.2s" }}>
          <Link href="/auth?tab=register" className="px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto flex items-center justify-center group">
            Start Free Trial
            <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#how-it-works" className="px-8 py-4 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold text-lg hover:border-slate-300 hover:bg-slate-50 transition-colors w-full sm:w-auto flex items-center justify-center">
            Watch Demo
          </a>
        </div>

        {/* Clean 2D Dashboard Mockup */}
        <div className="relative mx-auto w-full max-w-5xl scroll-reveal" style={{ animationDelay: "0.3s" }}>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-2 sm:p-4 relative">
            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 aspect-[16/10] flex flex-col relative shadow-inner">
               
               {/* Mockup Header */}
               <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 justify-between">
                 <div className="flex space-x-2">
                   <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                   <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                   <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                 </div>
                 <div className="h-6 w-48 bg-slate-100 rounded-md"></div>
                 <div className="h-8 w-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">JD</div>
               </div>

               {/* Mockup Content */}
               <div className="flex-1 p-8 flex flex-col sm:flex-row gap-8 bg-slate-50/50">
                 {/* Sidebar mock */}
                 <div className="hidden sm:flex flex-col space-y-4 w-48">
                   <div className="h-10 bg-brand-50 border border-brand-100 rounded-lg w-full"></div>
                   <div className="h-10 bg-white border border-slate-100 rounded-lg w-full"></div>
                   <div className="h-10 bg-white border border-slate-100 rounded-lg w-full"></div>
                 </div>
                 
                 {/* Main content mock */}
                 <div className="flex-1 flex flex-col gap-6">
                   <div className="grid grid-cols-3 gap-4">
                     <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                       <span className="text-sm font-medium text-slate-500 mb-2">Total Scans</span>
                       <span className="text-3xl font-bold text-slate-900">1,248</span>
                     </div>
                     <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                       <span className="text-sm font-medium text-slate-500 mb-2">Active Members</span>
                       <span className="text-3xl font-bold text-slate-900">492</span>
                     </div>
                     <div className="bg-brand-600 p-6 rounded-xl shadow-sm flex flex-col text-white">
                       <span className="text-sm font-medium text-brand-100 mb-2">Rewards Claimed</span>
                       <span className="text-3xl font-bold text-white">186</span>
                     </div>
                   </div>

                   <div className="flex-1 bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                     <div className="flex justify-between items-center mb-6">
                       <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                       <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                     </div>
                     <div className="space-y-4">
                       {[1,2,3].map(i => (
                         <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center space-x-4">
                             <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                               <Users className="w-5 h-5" />
                             </div>
                             <div>
                               <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                               <div className="h-3 w-16 bg-slate-100 rounded"></div>
                             </div>
                           </div>
                           <div className="h-6 w-16 bg-brand-50 rounded-full"></div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Clean Statistics Section */}
        <div className="mt-24 border-t border-slate-200 pt-16 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center scroll-fade">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-4xl font-extrabold text-slate-900">500+</div>
            <div className="text-sm text-slate-500 mt-2 font-medium">Businesses Onboarded</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 text-purple-600 mx-auto mb-4">
              <ScanLine className="w-6 h-6" />
            </div>
            <div className="text-4xl font-extrabold text-slate-900">1M+</div>
            <div className="text-sm text-slate-500 mt-2 font-medium">Scans & Visits Logged</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <div className="text-4xl font-extrabold text-slate-900">50K+</div>
            <div className="text-sm text-slate-500 mt-2 font-medium">Rewards Handed Out</div>
          </div>
        </div>
      </div>
    </section>
  );
}

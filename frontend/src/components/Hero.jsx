import Link from "next/link";
import { ChevronRight, Gift, ScanLine, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>
      
      {/* Glowing Ambient Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-blue-400/8 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[400px] h-[400px] rounded-full bg-indigo-300/8 blur-[120px] pointer-events-none"></div>
      
      {/* Soft Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100/60 text-blue-700 text-sm mb-8 font-semibold shadow-sm shadow-blue-500/5 scroll-fade">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          Revolutionizing Customer Retention
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.12] text-slate-900 scroll-reveal">
          Turn Every Visit Into <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            Customer Loyalty
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium leading-relaxed scroll-reveal" style={{ animationDelay: "0.1s" }}>
          Digital loyalty programs that help local businesses increase repeat customers and reward loyal visitors.
          <strong className="text-slate-950 font-extrabold block mt-2">Simple, secure, and cardless.</strong>
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-20 scroll-reveal" style={{ animationDelay: "0.2s" }}>
          <Link href="/auth?tab=register" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-extrabold text-lg hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] w-full sm:w-auto flex items-center justify-center group">
            Start Free Trial
            <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#how-it-works" className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-lg hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-600 transition-all duration-300 shadow-sm w-full sm:w-auto flex items-center justify-center">
            Watch Demo
          </a>
        </div>

        {/* Clean 2D Dashboard Mockup */}
        <div className="relative mx-auto w-full max-w-5xl scroll-reveal" style={{ animationDelay: "0.3s" }}>
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 blur-xl opacity-75 pointer-events-none"></div>
          
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] p-2 sm:p-4 relative">
            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 aspect-auto sm:aspect-[16/10] flex flex-col relative shadow-inner">
            
              {/* Mockup Header */}
              <div className="h-14 border-b border-slate-150 bg-white flex items-center px-6 justify-between">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                </div>
                <div className="h-6 w-24 sm:w-48 bg-slate-100 rounded-md"></div>
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100">JD</div>
              </div>

              {/* Mockup Content */}
              <div className="flex-1 p-8 flex flex-col sm:flex-row gap-8 bg-slate-50/50">
                {/* Sidebar mock */}
                <div className="hidden sm:flex flex-col space-y-4 w-48">
                  <div className="h-10 bg-blue-50/50 border border-blue-100/50 rounded-lg w-full"></div>
                  <div className="h-10 bg-white border border-slate-200 rounded-lg w-full"></div>
                  <div className="h-10 bg-white border border-slate-200 rounded-lg w-full"></div>
                </div>
                
                {/* Main content mock */}
                <div className="flex-1 flex flex-col gap-6 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
                      <span className="text-sm font-semibold text-slate-500 mb-2">Total Scans</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">1,248</span>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
                      <span className="text-sm font-semibold text-slate-500 mb-2">Active Members</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">492</span>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 sm:p-6 rounded-xl shadow-md flex flex-col items-start text-white">
                      <span className="text-sm font-semibold text-blue-100 mb-2">Rewards Claimed</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">186</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                      <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                    </div>
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                              <div className="h-3 w-16 bg-slate-100 rounded"></div>
                            </div>
                          </div>
                          <div className="h-6 w-16 bg-blue-50/75 border border-blue-100/50 rounded-full"></div>
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
        <div className="mt-24 border-t border-slate-150 pt-16 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center scroll-fade">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto mb-4 border border-blue-100/40">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-4xl font-extrabold text-slate-900">500+</div>
            <div className="text-sm text-slate-500 mt-2 font-medium">Businesses Onboarded</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-650 mx-auto mb-4 border border-indigo-100/40">
              <ScanLine className="w-6 h-6" />
            </div>
            <div className="text-4xl font-extrabold text-slate-900">1M+</div>
            <div className="text-sm text-slate-500 mt-2 font-medium">Scans & Visits Logged</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto mb-4 border border-sky-100/40">
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

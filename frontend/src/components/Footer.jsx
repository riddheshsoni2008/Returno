import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-standard bg-white pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-brand-600 mb-4 block">
              Returno
            </Link>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Premium digital loyalty rewards platform helping customers support local businesses and collect stamps seamlessly.
            </p>
          </div>
          
          <div>
            <h4 className="text-text-primary font-semibold mb-4">For Customers</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="#features" className="hover:text-brand-600 transition-colors">Explore Categories</Link></li>
              <li><Link href="#how-it-works" className="hover:text-brand-600 transition-colors">How it Works</Link></li>
              <li><Link href="/auth?tab=login" className="hover:text-brand-600 transition-colors">Customer Wallet Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-text-primary font-semibold mb-4">For Businesses</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="#pricing" className="hover:text-brand-600 transition-colors">Pricing Plans</Link></li>
              <li><Link href="/auth?tab=register" className="hover:text-brand-600 transition-colors">Create Merchant Account</Link></li>
              <li><Link href="/auth?tab=login" className="hover:text-brand-600 transition-colors">Business Dashboard Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="#faq" className="hover:text-brand-600 transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-brand-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border-standard pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} Returno. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

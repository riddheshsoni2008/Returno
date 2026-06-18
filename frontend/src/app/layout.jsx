import "./globals.css";
import IntersectionObserverFallback from "@/components/IntersectionObserverFallback";

export const metadata = {
  title: "Druto - Earn Free Rewards at Local Businesses",
  description: "Discover local businesses near you. Collect digital stamps and earn free rewards.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased selection:bg-brand-500/30">
        <IntersectionObserverFallback />
        {children}
      </body>
    </html>
  );
}

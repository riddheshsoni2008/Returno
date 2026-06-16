"use client";

import { useEffect } from "react";

export default function IntersectionObserverFallback() {
  useEffect(() => {
    // Only run fallback if native scroll-driven animations are not supported
    if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("fallback-visible");
              entry.target.classList.remove("fallback-hidden");
            }
          }
        },
        { threshold: 0.15 }
      );

      document.querySelectorAll(".scroll-reveal, .scroll-fade").forEach((el) => {
        el.classList.add("fallback-hidden");
        observer.observe(el);
      });
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
}

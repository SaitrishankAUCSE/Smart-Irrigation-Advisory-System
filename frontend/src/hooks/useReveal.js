import { useEffect, useRef } from 'react';

/**
 * useReveal — scroll-triggered reveal hook
 * Attaches IntersectionObserver to the ref'd element.
 * Adds .shown class when element enters viewport (once).
 * Mirrors drowningdot.com's data-reveal / data-stagger pattern.
 */
export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      el.classList.add('shown');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('shown');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: options.rootMargin || '0px 0px -12% 0px' }
    );

    observer.observe(el);

    // Floor: if tab was backgrounded, show after 2.6s
    const timer = setTimeout(() => {
      el.classList.add('shown');
    }, 2600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return ref;
}

/**
 * useStagger — assigns --i CSS variable to children for staggered animation.
 * Call on a container ref. Children get sequential delay indices.
 */
export function useStagger() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Number children for CSS stagger delay
    Array.from(el.children).forEach((child, i) => {
      child.style.setProperty('--i', Math.min(i, 9));
    });

    if (!('IntersectionObserver' in window)) {
      el.classList.add('shown');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('shown');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px' }
    );

    observer.observe(el);

    const timer = setTimeout(() => {
      el.classList.add('shown');
    }, 2600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return ref;
}

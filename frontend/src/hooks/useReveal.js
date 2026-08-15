import { useEffect, useRef } from 'react';

/**
 * useReveal — scroll-triggered reveal hook
 * Attaches IntersectionObserver to the ref'd element.
 * Adds .shown class when element enters viewport (once).
 * Mirrors drowningdot.com's data-reveal / data-stagger pattern.
 */
export function useReveal(options = {}, dependencies = []) {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('shown'));
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

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach(el => observer.observe(el));

    // Floor: if tab was backgrounded, show after 2.6s
    const timer = setTimeout(() => {
      elements.forEach(el => el.classList.add('shown'));
    }, 2600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, dependencies);
}

/**
 * useStagger — assigns --i CSS variable to children for staggered animation.
 * Call on a container ref. Children get sequential delay indices.
 */
export function useStagger(dependencies = []) {
  useEffect(() => {
    const containers = document.querySelectorAll('[data-stagger]');
    
    // Number children for CSS stagger delay
    containers.forEach(el => {
      Array.from(el.children).forEach((child, i) => {
        child.style.setProperty('--i', Math.min(i, 9));
      });
    });

    if (!('IntersectionObserver' in window)) {
      containers.forEach(el => el.classList.add('shown'));
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

    containers.forEach(el => observer.observe(el));

    const timer = setTimeout(() => {
      containers.forEach(el => el.classList.add('shown'));
    }, 2600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, dependencies);
}

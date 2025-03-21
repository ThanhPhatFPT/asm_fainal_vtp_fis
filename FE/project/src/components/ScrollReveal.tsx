import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  delay = 0, 
  threshold = 0.1,
  className = ''
}) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inView && elementRef.current) {
      const timer = setTimeout(() => {
        elementRef.current?.classList.add('revealed');
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [inView, delay]);

  return (
    <div 
      ref={(node) => {
        // Assign both refs
        if (node) {
          ref(node);
          elementRef.current = node;
        }
      }}
      className={`scroll-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
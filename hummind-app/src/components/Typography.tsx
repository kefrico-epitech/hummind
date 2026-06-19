import { ReactNode } from 'react';

// Hero Title - 56px black, 3 lines
export function HeroTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[48px] sm:text-[52px] font-black leading-tight tracking-normal text-[#171728]">
      {children}
    </h1>
  );
}

// Section Title - 48-52px bold, 2 lines
export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[48px] sm:text-[52px] font-bold leading-tight tracking-normal ${className}`}>
      {children}
    </h2>
  );
}

// Feature Title - 32px semibold
export function FeatureTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[18px] sm:text-[22px] font-semibold leading-[1.3]">
      {children}
    </h3>
  );
}

// Feature Description
export function FeatureDescription({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 sm:mt-5 text-[13px] sm:text-[15px] leading-[1.6]">
      {children}
    </p>
  );
}

// Body Text
export function BodyText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[13px] sm:text-[15px] leading-6 sm:leading-8 ${className}`}>
      {children}
    </p>
  );
}

// Subtitle/Muted text
export function Subtitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[12px] sm:text-[13px] md:text-[14px] font-medium leading-6 sm:leading-7 text-[#807779] ${className}`}>
      {children}
    </p>
  );
}

// Label
export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-[11px] xs:text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.24em] text-brand-600">
      {children}
    </label>
  );
}

// FAQ Title
export function FAQTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[40px] leading-[1.1] tracking-[-0.04em] sm:text-[56px] md:text-[72px] lg:text-[80px] font-semibold">
      {children}
    </h2>
  );
}

// FAQ Subtitle
export function FAQSubtitle({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 sm:mt-6 text-[14px] sm:text-[16px] md:text-[18px] text-white/65">
      {children}
    </p>
  );
}

// CTA Section Title
export function CTATitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-balance font-display text-[46px] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[62px] lg:text-[72px]">
      {children}
    </h3>
  );
}

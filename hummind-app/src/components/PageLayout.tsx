import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  gradient?: 'default' | 'light' | 'dark';
}

export function PageLayout({ title, subtitle, children, gradient = 'default' }: PageLayoutProps) {
  const gradients = {
    default: 'bg-[linear-gradient(180deg,#d8d9fb_0%,#f7ece7_54%,#f5f1ef_100%)]',
    light: 'bg-[#f5f1ef]',
    dark: 'bg-[#141426] text-white',
  };

  const bgGradient = gradients[gradient];

  return (
    <div className={`${bgGradient} relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8 lg:px-10 lg:pb-32 lg:pt-12`}>
      {gradient === 'default' && (
        <>
          <div className="absolute left-[-15%] top-[20%] h-64 w-64 rounded-full bg-[#f4cabc]/70 blur-[100px] sm:h-80 sm:w-80 sm:blur-[120px]" />
          <div className="absolute right-[-12%] top-[-5%] h-72 w-72 rounded-full bg-[#cfd1ff]/80 blur-[100px] sm:h-96 sm:w-96 sm:blur-[140px]" />
        </>
      )}

      <div className="relative mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-[950px] px-2 text-center">
          <h1 className="text-balance font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#171728] xs:text-[42px] sm:text-[56px] md:text-[68px] lg:text-[80px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-6 sm:mt-10 max-w-[480px] text-[12px] sm:text-[13px] md:text-[14px] font-medium leading-6 sm:leading-7 text-[#807779]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-20">
          {children}
        </div>
      </div>
    </div>
  );
}

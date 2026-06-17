export function useAutoScroll<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>
) {
  const speed = 18;
  const threshold = 90;

  return (ev: MouseEvent | TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const clientY =
      "touches" in ev
        ? ev.touches?.[0]?.clientY ?? 0
        : (ev as MouseEvent).clientY;

    if (clientY - rect.top < threshold) {
      el.scrollTop -= speed;
    } else if (rect.bottom - clientY < threshold) {
      el.scrollTop += speed;
    }
  };
}

export const isInView = (el: HTMLElement | null, offset = 300) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  return (
    rect.top - offset < windowHeight &&
    rect.bottom + offset > 0 &&
    rect.left < windowWidth &&
    rect.right > 0
  );
};
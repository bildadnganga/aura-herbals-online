export function flyToCart(source: HTMLElement | null, imageUrl?: string | null) {
  if (typeof window === "undefined") return;
  const target = document.getElementById("navbar-cart");
  if (!target) return;
  const src = source ?? target;
  const srcRect = src.getBoundingClientRect();
  const dstRect = target.getBoundingClientRect();

  const flyer = document.createElement("div");
  flyer.style.cssText = `
    position:fixed;left:${srcRect.left + srcRect.width / 2 - 24}px;top:${srcRect.top + srcRect.height / 2 - 24}px;
    width:48px;height:48px;border-radius:9999px;z-index:9999;pointer-events:none;
    background:${imageUrl ? `url(${imageUrl}) center/cover` : "var(--color-primary, #16a34a)"};
    box-shadow:0 8px 24px rgba(0,0,0,0.25);transition:transform 700ms cubic-bezier(0.5,-0.2,0.7,1),opacity 700ms ease,width 700ms,height 700ms;
  `;
  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
    const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);
    flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
    flyer.style.opacity = "0.2";
  });

  setTimeout(() => {
    flyer.remove();
    target.classList.add("cart-bump");
    setTimeout(() => target.classList.remove("cart-bump"), 400);
  }, 720);
}
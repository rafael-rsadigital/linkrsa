/* Renderização e interações da landing page. */
(async function renderPage() {
  const fallback = window.SITE_CONFIG || {};
  let CONFIG = fallback;
  try {
    const response = await fetch(`/api/site?ts=${Date.now()}`, { cache: "no-store" });
    if (response.ok) CONFIG = await response.json();
  } catch (error) {
    console.warn("Usando configuração local de fallback", error);
  }

  const setText = (key, value) => document.querySelectorAll(`[data-field="${key}"]`).forEach((node) => { node.textContent = value ?? ""; });
  const setImage = (key, src) => document.querySelectorAll(`[data-image="${key}"]`).forEach((node) => { node.src = src || ""; });
  const setLink = (key, href) => document.querySelectorAll(`[data-link="${key}"]`).forEach((node) => {
    node.href = href || "#";
    node.target = (href || "").startsWith("http") ? "_blank" : "_self";
    node.rel = (href || "").startsWith("http") ? "noreferrer" : "";
  });
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[char]));

  Object.entries(CONFIG).forEach(([key, value]) => { if (typeof value === "string") setText(key, value); });
  Object.entries(CONFIG.media || {}).forEach(([key, value]) => setImage(key, value));
  Object.entries(CONFIG.links || {}).forEach(([key, value]) => setLink(key, value));
  setText("year", new Date().getFullYear());

  const colorMap = { pink: "--pink", "pink-deep": "--pink-deep", "pink-soft": "--pink-soft", yellow: "--yellow", ink: "--ink", paper: "--paper" };
  Object.entries(CONFIG.colors || {}).forEach(([key, value]) => { if (colorMap[key] && value) document.documentElement.style.setProperty(colorMap[key], value); });

  const heroCategories = document.querySelector('[data-list="heroCategories"]');
  (CONFIG.heroCategories || []).forEach((item) => { const span = document.createElement("span"); span.textContent = item; heroCategories?.appendChild(span); });

  const categoryList = document.querySelector('[data-list="categories"]');
  (CONFIG.categories || []).forEach((item) => {
    const card = document.createElement("a");
    card.className = "category-card";
    card.href = CONFIG.links?.whatsapp || "#";
    card.target = "_blank";
    card.rel = "noreferrer";
    card.innerHTML = `<img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(item.title)}" loading="lazy" /><span class="category-card__shade"></span><span class="category-card__arrow">↗</span><span class="category-card__copy"><small>${escapeHtml(item.eyebrow)}</small><strong>${escapeHtml(item.title)}</strong></span>`;
    categoryList?.appendChild(card);
  });

  const faqList = document.querySelector('[data-list="faqs"]');
  (CONFIG.faqs || []).forEach((item, index) => {
    const details = document.createElement("details");
    details.className = "faq-item";
    details.open = index === 0;
    details.innerHTML = `<summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p>`;
    faqList?.appendChild(details);
  });
})();

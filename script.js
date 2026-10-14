/* Renderização e interações da landing page. */
const CONFIG = window.SITE_CONFIG;
const setText = (key, value) => document.querySelectorAll(`[data-field="${key}"]`).forEach((node) => { node.textContent = value; });
const setImage = (key, src) => document.querySelectorAll(`[data-image="${key}"]`).forEach((node) => { node.src = src; });
const setLink = (key, href) => document.querySelectorAll(`[data-link="${key}"]`).forEach((node) => { node.href = href; node.target = href.startsWith("http") ? "_blank" : "_self"; node.rel = href.startsWith("http") ? "noreferrer" : ""; });

Object.entries(CONFIG).forEach(([key, value]) => {
  if (typeof value === "string") setText(key, value);
});
Object.entries(CONFIG.media).forEach(([key, value]) => setImage(key, value));
Object.entries(CONFIG.links).forEach(([key, value]) => setLink(key, value));
setText("year", new Date().getFullYear());

const heroCategories = document.querySelector('[data-list="heroCategories"]');
CONFIG.heroCategories.forEach((item) => { const span = document.createElement("span"); span.textContent = item; heroCategories.appendChild(span); });

const categoryList = document.querySelector('[data-list="categories"]');
CONFIG.categories.forEach((item, index) => {
  const card = document.createElement("a");
  card.className = "category-card";
  card.href = CONFIG.links.whatsapp;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.innerHTML = `<img src="${item.image}" alt="${item.title}" loading="lazy" /><span class="category-card__shade"></span><span class="category-card__arrow">↗</span><span class="category-card__copy"><small>${item.eyebrow}</small><strong>${item.title}</strong></span>`;
  categoryList.appendChild(card);
});

const faqList = document.querySelector('[data-list="faqs"]');
CONFIG.faqs.forEach((item, index) => {
  const details = document.createElement("details");
  details.className = "faq-item";
  details.open = index === 0;
  details.innerHTML = `<summary>${item.question}</summary><p>${item.answer}</p>`;
  faqList.appendChild(details);
});

/*
  PERSONALIZAÇÃO RÁPIDA
  1. Troque a paleta em styles.css nas variáveis --pink, --yellow, --ink etc.
  2. Troque textos, links e fotos neste objeto CONFIG.
  3. Não é necessário alterar o HTML para substituir a identidade da empresa.
*/
const CONFIG = {
  brandMark: "A",
  brandKicker: "curadoria local",
  brandName: "Estúdio Aurora",
  tagline: "Peças escolhidas para iluminar a sua rotina.",
  heroEyebrow: "moda · beleza · casa",
  heroCity: "desde 2018",
  cityState: "Botucatu / SP",
  promoText: "novidades toda semana · vem descobrir a sua próxima favorita",
  links: {
    whatsapp: "https://wa.me/5514999999999?text=Ol%C3%A1!%20Quero%20conhecer%20as%20novidades.",
    catalog: "https://wa.me/c/5514999999999",
    map: "https://maps.google.com/?q=Rua+das+Flores,+120,+Botucatu,+SP",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    review: "https://search.google.com/local/writereview",
    instagram: "https://instagram.com/estudioaurora",
    phone: "tel:+5514999999999"
  },
  media: {
    hero: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
    video: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=82",
    about: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1000&q=82"
  },
  whatsappLabel: "atendimento próximo",
  whatsappTitle: "Chamar no WhatsApp",
  whatsappDescription: "Tire dúvidas e veja o que chegou hoje",
  catalogLabel: "seleção da semana",
  catalogActionTitle: "Ver catálogo",
  catalogDescription: "Peças, presentes e achados para você",
  mapLabel: "venha nos visitar",
  mapTitle: "Como chegar",
  mapDescription: "Rua das Flores, 120 · Botucatu / SP",
  videoTitle: "Conheça o nosso jeito",
  videoDescription: "Um cantinho feito para você encontrar novidades, inspiração e um atendimento sem pressa.",
  videoCaption: "Um passeio pelo Estúdio",
  videoSubcaption: "assista ao vídeo de apresentação",
  catalogSectionTitle: "Encontre o seu estilo",
  catalogCount: "06 opções",
  catalogSectionDescription: "Toque no que você procura e fale com a gente pelo WhatsApp.",
  reviewScore: "4,9",
  reviewSource: "no Google · 32 avaliações",
  reviewQuote: "“Atendimento acolhedor, peças lindas e sempre encontro algo que combina comigo.”",
  reviewCta: "ver avaliações",
  aboutKicker: "mais que uma loja",
  aboutTitle: "Escolhas com intenção.",
  aboutText: "A Aurora nasceu para aproximar boas escolhas de quem gosta de se vestir com verdade. Aqui, cada coleção é montada com cuidado, conversa e um olhar atento para a vida real.",
  aboutCta: "conversar com a equipe",
  faqTitle: "Tem alguma pergunta?",
  contactTitle: "Vamos conversar?",
  address: "Rua das Flores, 120 — Centro, Botucatu / SP",
  hours: "seg a sex · 09:00–18:30\nsáb · 09:00–17:00\ndom · fechado",
  phone: "+55 (14) 99999-9999",
  contactCta: "chamar no WhatsApp",
  heroCategories: ["roupas", "acessórios", "presentes"],
  categories: [
    { title: "Moda feminina", eyebrow: "essenciais", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=82", linkText: "Quero ver" },
    { title: "Acessórios", eyebrow: "detalhes", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=82", linkText: "Quero ver" },
    { title: "Calçados", eyebrow: "para andar", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82", linkText: "Quero ver" },
    { title: "Presentes", eyebrow: "com carinho", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=82", linkText: "Quero ver" },
    { title: "Casa & mesa", eyebrow: "para acolher", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=82", linkText: "Quero ver" },
    { title: "Novidades", eyebrow: "acabou de chegar", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=82", linkText: "Quero ver" }
  ],
  faqs: [
    { question: "Vocês fazem entrega?", answer: "Sim. Consulte a disponibilidade para o seu endereço falando com a nossa equipe pelo WhatsApp." },
    { question: "Posso reservar uma peça?", answer: "Claro. Envie uma mensagem com o nome ou uma foto do produto e combinamos a melhor forma de reservar." },
    { question: "Quais formas de pagamento vocês aceitam?", answer: "Aceitamos Pix, cartões e dinheiro. Para condições especiais, fale com a gente antes da visita." }
  ]
};

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

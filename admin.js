let state = null;
const pathGet = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);
const pathSet = (object, path, value) => { const keys = path.split("."); const last = keys.pop(); const target = keys.reduce((item, key) => item[key] ??= {}, object); target[last] = value; };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char])); }
function markDirty() { $("#saveState").innerHTML = "<span style=\"background:#f2a541\"></span> alterações não salvas"; }
function setSaved(message = "alterações salvas") { $("#saveState").innerHTML = `<span></span> ${message}`; }

function fillForm() {
  $$('[data-path]').forEach((input) => { input.value = pathGet(state, input.dataset.path) ?? ""; });
  $$('[data-link-path]').forEach((input) => { input.value = state.links?.[input.dataset.linkPath] ?? ""; });
  $$('[data-media-path]').forEach((input) => { input.value = state.media?.[input.dataset.mediaPath] ?? ""; });
  const colors = state.colors || { pink: "#e92f86", "pink-deep": "#bd1468", "pink-soft": "#ffe3ef", yellow: "#ffd84e", ink: "#231d28", paper: "#fffaf7" };
  $$('[data-color]').forEach((input) => { input.value = colors[input.dataset.color] || "#6e45e8"; });
  $$('[data-css-var]').forEach((input) => { input.value = colors[input.dataset.cssVar.replace(/^--/, "")] || "#6e45e8"; });
  $("#publicLink").textContent = `${location.origin}/`;
  renderCategories(); renderFaqs(); renderMediaPreviews();
}

function renderCategories() {
  const list = $("#categoryEditor");
  list.innerHTML = (state.categories || []).map((item, index) => `<div class="repeat-card" data-category-index="${index}"><div class="repeat-card__head"><span class="repeat-card__number">item ${String(index + 1).padStart(2, "0")}</span><button class="remove-button" data-remove-category="${index}">remover</button></div><div class="form-grid"><label><span>Nome do produto / serviço</span><input data-category-field="title" value="${escapeHtml(item.title)}" placeholder="Ex.: Moda feminina" /></label><label><span>Rótulo curto</span><input data-category-field="eyebrow" value="${escapeHtml(item.eyebrow)}" placeholder="Ex.: essenciais" /></label></div><div class="media-inline"><label><span>Foto ou imagem</span><input data-category-field="image" value="${escapeHtml(item.image)}" placeholder="URL ou upload abaixo" /><input type="file" accept="image/*" data-category-file="image" /></label><label><span>Mensagem / destino opcional</span><input data-category-field="linkText" value="${escapeHtml(item.linkText || "Quero ver")}" /></label></div></div>`).join("");
}
function renderFaqs() {
  const list = $("#faqEditor");
  list.innerHTML = (state.faqs || []).map((item, index) => `<div class="repeat-card" data-faq-index="${index}"><div class="repeat-card__head"><span class="repeat-card__number">pergunta ${String(index + 1).padStart(2, "0")}</span><button class="remove-button" data-remove-faq="${index}">remover</button></div><label><span>Pergunta</span><input data-faq-field="question" value="${escapeHtml(item.question)}" placeholder="Ex.: Vocês fazem entrega?" /></label><label><span>Resposta</span><textarea data-faq-field="answer" rows="3" placeholder="Resposta curta e clara">${escapeHtml(item.answer)}</textarea></label></div>`).join("");
}
function renderMediaPreviews() { $$('[data-preview]').forEach((node) => { node.style.backgroundImage = `url(${JSON.stringify(state.media?.[node.dataset.preview] || "")})`; }); }

function syncFormToState() {
  $$('[data-path]').forEach((input) => pathSet(state, input.dataset.path, input.value));
  $$('[data-link-path]').forEach((input) => { state.links[input.dataset.linkPath] = input.value; });
  $$('[data-media-path]').forEach((input) => { state.media[input.dataset.mediaPath] = input.value; });
  state.colors ||= {};
  $$('[data-css-var]').forEach((input) => { state.colors[input.dataset.cssVar.replace(/^--/, "")] = input.value; });
  state.categories = $$('[data-category-index]').map((card) => { const index = Number(card.dataset.categoryIndex); const item = state.categories[index] || {}; $$('[data-category-field]', card).forEach((input) => { item[input.dataset.categoryField] = input.value; }); return item; });
  state.faqs = $$('[data-faq-index]').map((card) => { const index = Number(card.dataset.faqIndex); const item = state.faqs[index] || {}; $$('[data-faq-field]', card).forEach((input) => { item[input.dataset.faqField] = input.value; }); return item; });
}

async function fileToDataUrl(file) {
  if (!file) return null;
  if (file.size > 4 * 1024 * 1024) throw new Error("Escolha uma imagem de até 4 MB.");
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}

async function save() {
  syncFormToState();
  $("#saveButton").disabled = true; $("#saveButtonBottom").disabled = true; $("#saveState").innerHTML = "<span class=\"is-saving\"></span> salvando…";
  try {
    const response = await fetch("/api/site", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
    if (!response.ok) throw new Error("Não foi possível salvar agora.");
    setSaved(); refreshPreview();
  } catch (error) { $("#saveState").innerHTML = `<span style=\"background:#d75b6e\"></span> ${error.message}`; }
  finally { $("#saveButton").disabled = false; $("#saveButtonBottom").disabled = false; }
}
function refreshPreview() { const frame = $("#previewFrame"); frame.src = "/?preview=" + Date.now(); }
function activateSection(name) { $$('[data-section]').forEach((button) => button.classList.toggle("is-active", button.dataset.section === name)); $$('[data-panel]').forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name)); $("#sectionSelect").value = name; }

async function init() {
  const response = await fetch("/api/site");
  state = await response.json();
  state.links ||= {}; state.media ||= {}; state.categories ||= []; state.faqs ||= [];
  fillForm(); setSaved();
  $$('[data-section]').forEach((button) => button.addEventListener("click", () => activateSection(button.dataset.section)));
  $("#sectionSelect").addEventListener("change", (event) => activateSection(event.target.value));
  [$("#saveButton"), $("#saveButtonBottom")].forEach((button) => button.addEventListener("click", save));
  $("#refreshPreview").addEventListener("click", refreshPreview);
  $("#copyLinkButton").addEventListener("click", async () => { await navigator.clipboard.writeText(`${location.origin}/`); $("#copyLinkButton").textContent = "link copiado ✓"; setTimeout(() => $("#copyLinkButton").textContent = "copiar link ↗", 1800); });
  document.addEventListener("input", (event) => { if (event.target.matches("input, textarea, select")) markDirty(); });
  document.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save(); } });
  $("#addCategory").addEventListener("click", () => { syncFormToState(); state.categories.push({ title: "Novo item", eyebrow: "categoria", image: state.media.hero, linkText: "Quero ver" }); renderCategories(); markDirty(); });
  $("#addFaq").addEventListener("click", () => { syncFormToState(); state.faqs.push({ question: "Nova pergunta", answer: "Escreva uma resposta clara para seus clientes." }); renderFaqs(); markDirty(); });
  document.addEventListener("click", (event) => {
    const removeCategory = event.target.closest("[data-remove-category]");
    const removeFaq = event.target.closest("[data-remove-faq]");
    if (removeCategory) { syncFormToState(); state.categories.splice(Number(removeCategory.dataset.removeCategory), 1); renderCategories(); markDirty(); }
    if (removeFaq) { syncFormToState(); state.faqs.splice(Number(removeFaq.dataset.removeFaq), 1); renderFaqs(); markDirty(); }
  });
  document.addEventListener("change", async (event) => {
    const color = event.target.closest("[data-color]");
    const mediaFile = event.target.closest("[data-file-media]");
    const categoryFile = event.target.closest("[data-category-file]");
    try {
      if (color) { const text = $(`[data-css-var="--${color.dataset.color}"]`); if (text) text.value = color.value; markDirty(); }
      if (mediaFile) { const dataUrl = await fileToDataUrl(event.target.files[0]); if (dataUrl) { state.media[mediaFile.dataset.fileMedia] = dataUrl; $(`[data-media-path="${mediaFile.dataset.fileMedia}"]`).value = dataUrl; renderMediaPreviews(); markDirty(); } }
      if (categoryFile) { const dataUrl = await fileToDataUrl(event.target.files[0]); const card = event.target.closest("[data-category-index]"); const input = $('[data-category-field="image"]', card); input.value = dataUrl; markDirty(); }
    } catch (error) { alert(error.message); event.target.value = ""; }
  });
}
init().catch((error) => { $("#saveState").innerHTML = `<span style=\"background:#d75b6e\"></span> ${error.message}`; });

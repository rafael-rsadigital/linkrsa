# Landing page editável — Link RSA

Esta é uma landing page estática para uma empresa local. A estrutura visual já está pronta; as alterações do dia a dia ficam concentradas em dois arquivos:

- `site-config.js`: nome da empresa, textos, fotos, produtos/serviços, endereço, horários, redes sociais e destinos dos botões.
- `styles.css`: paleta, tipografia e detalhes visuais.

## Editar pela tela administrativa

O projeto agora também possui um painel visual em [`/admin.html`](./admin.html). Abra `https://seu-dominio.com/admin.html` para editar a página sem abrir o código. A tela permite alterar identidade, paleta, fotos, produtos ou serviços, perguntas frequentes, contatos e destinos dos botões. A prévia aparece ao lado e o botão **Salvar alterações** grava tudo no banco do projeto.

O link público fica em `https://seu-dominio.com/`. O painel não aparece no menu público; guarde o endereço administrativo e proteja-o com autenticação antes de publicar para clientes.

## Como personalizar

### 1. Informações da empresa, fotos e links

Abra [`site-config.js`](./site-config.js) e edite o objeto `window.SITE_CONFIG`.

Os campos mais usados são:

- `brandName`, `brandMark` e `tagline`: marca, símbolo curto e slogan.
- `cityState`, `address`, `hours` e `phone`: localização e atendimento.
- `media.hero`, `media.video` e `media.about`: fotos do hero, vídeo e seção institucional.
- `categories`: produtos, serviços ou categorias exibidos na vitrine.
- `links.whatsapp`, `links.catalog`, `links.map`, `links.video`, `links.review`, `links.instagram` e `links.phone`: destino dos botões.
- `faqs`: perguntas frequentes.

Para trocar um cartão da vitrine, altere um item de `categories`:

```js
{
  title: "Nome do produto ou serviço",
  eyebrow: "categoria curta",
  image: "https://seu-endereco-da-imagem.com/foto.jpg",
  linkText: "Quero ver"
}
```

Você pode usar uma URL pública de imagem ou colocar o arquivo na pasta `assets/` e usar, por exemplo, `"/assets/foto-principal.jpg"`. Os formatos recomendados são JPG, PNG ou WebP.

### 2. Paleta e fundo

Abra [`styles.css`](./styles.css) e altere as variáveis no começo do arquivo:

```css
:root {
  --pink: #e92f86;      /* cor principal e botões */
  --pink-deep: #bd1468; /* textos e detalhes */
  --pink-soft: #ffe3ef; /* fundos suaves */
  --yellow: #ffd84e;    /* destaque */
  --ink: #231d28;       /* textos escuros e rodapé */
  --paper: #fffaf7;     /* fundo geral */
}
```

### 3. Fotos locais

Coloque as imagens em [`assets/`](./assets/) e atualize os campos `media` ou `categories` no `site-config.js`. A pasta contém um arquivo de instruções para continuar versionada mesmo antes de receber as fotos.

## Como editar pelo GitHub

1. Abra o arquivo `site-config.js` no repositório.
2. Clique no lápis para editar.
3. Cole os textos, links e URLs das fotos da nova empresa.
4. Clique em **Commit changes**.
5. Para alterações de paleta, repita o processo em `styles.css`.

Para trocar várias fotos, é melhor fazer upload dos arquivos na pasta `assets/` e apontar para eles no `site-config.js`.

## Como testar localmente

Com Python instalado:

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Depois abra `http://localhost:3000`.

## Como me pedir uma nova atualização

Você pode enviar uma lista neste formato:

```text
Empresa: Nome da empresa
Slogan: frase curta
Cidade: cidade/UF
WhatsApp: número com DDI e DDD
Instagram: URL
Endereço: endereço completo
Horários: horários por dia
Fotos: hero.jpg, sobre.jpg e uma foto para cada produto/serviço
Produtos/serviços: nome + foto + mensagem ou link de destino
Paleta: cor principal, destaque e fundo
```

Também pode simplesmente editar o GitHub e me mandar o link do commit ou dizer quais campos precisam ser ajustados.

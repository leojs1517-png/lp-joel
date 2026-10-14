# Site — Joel Kappes Fisioterapia e Quiropraxia

Site estático (HTML/CSS/JS puro). Sem Node, sem npm, sem passo de build obrigatório
para hospedar: basta subir a pasta `site/`.

---

## ⚠️ Antes de publicar — 3 dados que faltam

Estes campos **não existiam em nenhuma fonte** (Google Meu Negócio, site atual,
Drive), então ficaram como marcador em vez de serem inventados. No site eles
aparecem **destacados em terracota** para não passarem batido.

| Onde | O quê | Arquivo |
|---|---|---|
| Rodapé de todas as páginas, `equipe.html` | Nº de CREFITO do Joel | `buildlib.py` → `PENDENTES['crefito_joel']` |
| `equipe.html`, `recovery-atletas.html` | Nome completo do segundo fisioterapeuta | `PENDENTES['thiago_nome']` |
| `equipe.html` | Nº de CREFITO dele | `PENDENTES['crefito_thiago']` |
| `equipe.html` | Retrato dele (hoje é um placeholder) | ver "Adicionar a foto" abaixo |

Depois de preencher, rode `python3 build.py` e **apague a regra `.pendente`**
no fim de `site/assets/css/main.css` para tirar o destaque visual.

> A exibição do número de registro é exigida pela resolução do COFFITO para
> divulgação profissional em qualquer meio — inclusive site.

---

## Como mexer no site

Todo o conteúdo mora em dois arquivos Python; o HTML é gerado a partir deles.

```bash
python3 build.py
```

- **`buildlib.py`** — dados e componentes: endereço, telefone, horários, serviços,
  FAQ, depoimentos, cabeçalho, rodapé, JSON-LD.
- **`build.py`** — o texto de cada página.

**Por que um gerador e não 9 arquivos HTML soltos:** o endereço, o telefone e o
horário aparecem em todas as páginas. Em SEO local, esses dados (o "NAP") precisam
ser byte a byte idênticos em todo lugar — se divergirem, o Google trata como
negócios diferentes. Centralizando, é impossível atualizar um e esquecer os outros.

Editar `site/*.html` na mão funciona, mas o próximo `build.py` sobrescreve.

---

## Publicar

A pasta `site/` é o site inteiro. Funciona em qualquer hospedagem estática
(Netlify, Vercel, Cloudflare Pages, GitHub Pages, ou FTP comum).

Se trocar de domínio, ajuste `SITE` no topo do `buildlib.py` e rode o build de
novo — canonical, Open Graph, sitemap e JSON-LD acompanham.

**Configure no servidor:**
- `404.html` como página de erro
- HTTPS com redirect de `http://` e de `www.` para a versão canônica

---

## SEO local — o que já está pronto

- **JSON-LD** `MedicalBusiness` + `Physiotherapy` com endereço, geo, horários por
  dia, `areaServed` (Florianópolis, São José, Palhoça, Biguaçu) e `sameAs` para
  Google, Instagram, Facebook e YouTube.
- **`Person`** para o Joel, ligado à clínica, com formação e áreas de atuação.
- **`FAQPage`** em `faq.html` — elegível para o resultado expandido do Google.
- **`BreadcrumbList`** nas páginas internas.
- `sitemap.xml`, `robots.txt`, canonical, Open Graph e Twitter Card em tudo.
- Meta `geo.position` / `ICBM` com as coordenadas reais do consultório.
- URLs descritivas (`fisioterapia-quiropraxia-coluna.html`) em vez de `/servico-1`.

### Uma decisão deliberada: nota 5,0 não está no schema

A nota e as 545 avaliações aparecem com destaque **no conteúdo visível**, com link
para o perfil. Mas **não** foram marcadas como `aggregateRating`.

As diretrizes do Google proíbem marcar com `aggregateRating` avaliações sobre o
próprio negócio exibidas no site dele — isso rende ação manual e perda dos rich
results. O Google já mostra essa nota sozinho, vinda direto do Meu Negócio.
Marcar aqui só traria risco, sem ganho.

---

## Cuidados éticos (CREFITO/COFFITO) aplicados ao texto

- Nenhuma promessa de cura, resultado ou prazo. A pergunta "em quantas sessões eu
  melhoro?" é respondida dizendo que não dá para responder antes de avaliar.
- Sem "antes e depois", sem linguagem sensacionalista, sem superlativo.
- Nenhuma indicação de tratamento sem avaliação individual — o texto sempre
  aponta para a avaliação como primeiro passo.
- Depoimentos tratados como **relatos pessoais**, com aviso explícito de que
  descrevem experiências individuais e não garantem resultado.
- Os três depoimentos são avaliações públicas reais do Google, reproduzidas sem
  edição, com nome e data, e com link para o original. Dois aparecem cortados com
  "…" — o corte é do próprio Google, foi mantido para não alterar o texto.
- Página de coluna lista sinais de alerta que pedem avaliação médica.

---

## Acessibilidade

- Navegação por teclado em tudo, incluindo o formulário e o acordeão do FAQ.
- `aria-expanded` / `aria-controls` no FAQ e no menu; `skip link` no topo.
- Contraste conferido nas duas inversões de tema (creme e verde-escuro).
- `prefers-reduced-motion` desliga a cena 3D, o cursor e todas as animações.
- Sem JavaScript o site continua legível e navegável: os efeitos são camada extra.

---

## Detalhes técnicos

**Identidade visual** — cores e fontes vieram do `REBRAND | JOEL KAPPES` do Drive:
`#2A2C24` `#8B9579` `#F7F3EB` `#85764F` `#BA6024`, com Coldiac (display) e
Tamil Sangam MN (texto), convertidas para `woff2` e servidas do próprio domínio.

> A Coldiac tem a caixa-baixa desenhada como versalete. Ela funciona muito bem em
> títulos curtos, mas vira um bloco de maiúsculas em texto corrido — por isso está
> reservada a títulos, e parágrafos e depoimentos usam a Tamil Sangam.

**Cena 3D do hero** (`assets/js/spine.js`) — coluna vertebral em three.js que
segue o cursor e, conforme você rola, "destrava": os segmentos se soltam e ganham
mobilidade. É a frase da marca virando interação. Cai fora sozinha se o navegador
não tiver WebGL ou se o usuário pedir menos movimento.

**Animações** (`assets/js/main.js`) — GSAP + ScrollTrigger + Lenis: revelação de
títulos linha a linha, parallax nas imagens, contador das avaliações, marquee
infinito, cursor personalizado e botões magnéticos.

**Formulário** (`assets/js/form.js`) — 4 etapas, validação com máscara de telefone,
honeypot antispam, e no fim monta a mensagem estruturada e abre o WhatsApp, que é
o canal real de agendamento. Não precisa de servidor.

Para também receber por e-mail, contrate um serviço de formulário (Formspree,
Basin, Netlify Forms) e cole a URL em `ENDPOINT`, no topo do `form.js`. O WhatsApp
continua abrindo normalmente.

**Imagens** — as fotos do Drive foram recortadas e exportadas em WebP e JPG em
4 larguras, com `srcset`. O total de imagens do site ficou em ~5 MB, contra
~125 MB dos originais.

**Cache** — CSS e JS são servidos com um hash do conteúdo na URL
(`main.css?v=eff35891`). Quem já visitou o site recebe a versão nova assim que
você publica, sem precisar limpar cache.

**Mapa** — o iframe do Google só carrega depois que o visitante clica. A página
abre mais rápido e nenhum dado dele vai para o Google antes disso.

### Adicionar a foto do segundo fisioterapeuta

1. Coloque o arquivo em `_fonte/fotos/thiago.jpg`
2. Rode o trecho de processamento de imagens (está no histórico do projeto) ou
   exporte manualmente para `site/assets/img/thiago-{480,800,1200,1800}.webp`
3. Em `build.py`, na função `equipe()`, troque o bloco `member__ph` por
   `picture('thiago', 'Descrição da foto', '(min-width:900px) 46vw, 100vw')`

---

## Estrutura

```
build.py            conteúdo das páginas       → rode este
buildlib.py         dados da clínica + componentes
LEIA-ME.md
_fonte/             originais (fotos, PDF da marca, fontes) — não vai para o ar
site/               ← publique esta pasta
  index.html  metodo.html  faq.html  contato.html  equipe.html
  fisioterapia-quiropraxia-coluna.html
  recovery-atletas.html  fisioterapia-ortopedica.html  404.html
  sitemap.xml  robots.txt  site.webmanifest
  assets/  css/  js/  img/  fonts/
```

---

## Fontes dos dados

Nada no site foi inventado. Origem de cada informação:

| Dado | Fonte |
|---|---|
| Endereço, CEP, horários, coordenadas, telefone | Perfil verificado no Google Meu Negócio |
| Nota 5,0 e 545 avaliações | Google Meu Negócio (em 30/07/2026) |
| Os 3 depoimentos | Avaliações públicas no perfil do Google |
| E-mail de contato | Página de contato do site atual |
| Trajetória do Joel (2004, futebol, Figueirense, 2016, 2019) | Página "Sobre" do site atual |
| Redes sociais | Site atual |
| Cores, tipografia e logos | `REBRAND \| JOEL KAPPES` (Drive) |
| Fotos | Pasta de fotos do Drive |
| Serviços, método MDT, público, posicionamento | Briefing do cliente |

O número de avaliações muda com o tempo — vale revisar `BIZ['avaliacoes']` em
`buildlib.py` de vez em quando.

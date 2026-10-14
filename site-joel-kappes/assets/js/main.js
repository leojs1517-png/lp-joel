/* =========================================================================
   Joel Kappes — interações e animações
   GSAP + ScrollTrigger + Lenis (carregados via CDN no <head>)
   Tudo degrada com elegância: sem JS, o site continua legível e navegável.
   ========================================================================= */
(function () {
  'use strict';

  const html = document.documentElement;
  html.classList.add('js');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* =======================================================================
     Scroll suave (Lenis)
     ======================================================================= */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -70 });
    else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  /* =======================================================================
     Ano corrente no rodapé
     ======================================================================= */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* =======================================================================
     Divisor de linhas — reveal tipográfico sem plugin pago
     ======================================================================= */
  function splitLines(el) {
    if (el.dataset.split === 'done') return [...el.querySelectorAll('.line-mask')];
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const html0 = el.innerHTML;
    // preserva marcações inline simples (<em>, <span class="accent">)
    const frag = document.createElement('div');
    frag.innerHTML = html0;

    const words = [];
    (function walk(node, styleEl) {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w.trim()) return;
            const s = document.createElement('span');
            s.className = 'w';
            s.style.display = 'inline-block';
            s.textContent = w;
            if (styleEl) {
              const wrap = styleEl.cloneNode(false);
              wrap.appendChild(s);
              words.push(wrap);
            } else {
              words.push(s);
            }
          });
        } else if (n.nodeType === 1) {
          walk(n, n);
        }
      });
    })(frag, null);

    if (!words.length) return [];

    el.innerHTML = '';
    words.forEach((w, i) => {
      el.appendChild(w);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });

    // agrupa por linha usando a posição vertical
    const rendered = [...el.children];
    const lines = [];
    let current = [], lastTop = null;
    rendered.forEach((w) => {
      const top = Math.round(w.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) < 4) {
        current.push(w);
      } else {
        lines.push(current); current = [w];
      }
      lastTop = top;
    });
    if (current.length) lines.push(current);

    el.innerHTML = '';
    const masks = lines.map((line) => {
      const mask = document.createElement('span');
      mask.className = 'line-mask';
      const inner = document.createElement('span');
      line.forEach((w, i) => {
        inner.appendChild(w);
        if (i < line.length - 1) inner.appendChild(document.createTextNode(' '));
      });
      mask.appendChild(inner);
      el.appendChild(mask);
      // As máscaras são block, então este espaço não aparece na tela — mas
      // mantém o textContent correto para quem copia o título e para quem
      // lê a página por programa.
      el.appendChild(document.createTextNode(' '));
      return mask;
    });
    el.dataset.split = 'done';
    el.setAttribute('aria-label', text);
    return masks;
  }

  /* =======================================================================
     Preloader
     ======================================================================= */
  const preloader = document.querySelector('.preloader');

  /** Estado final sem animação: usado quando não há GSAP, quando o usuário
   *  pediu menos movimento, ou quando a aba está em segundo plano — onde o
   *  requestAnimationFrame é estrangulado e a timeline nunca terminaria,
   *  deixando o preloader cobrindo o site. */
  function revealInstant() {
    document.body.classList.remove('is-loading');
    const alvos = [
      ...document.querySelectorAll('[data-anim]'),
      ...document.querySelectorAll('.line-mask > span'),
      ...document.querySelectorAll('.reveal-img img'),
    ];
    // mata tweens em voo: sem isso, uma animação estrangulada continua
    // reescrevendo o transform inline e o conteúdo segue invisível
    if (hasGSAP) {
      gsap.killTweensOf(alvos);
      if (preloader) gsap.killTweensOf(preloader);
    }
    if (preloader) preloader.remove();
    alvos.forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; });
  }

  /** Elementos da primeira dobra: título do hero e os blocos que entram com ele.
   *  São os únicos que precisam de garantia por tempo — o resto aparece por
   *  ScrollTrigger, quando o usuário chega até lá. */
  function alvosHero() {
    const hero = document.querySelector('[data-hero]');
    const base = document.querySelector('.page-head');
    const raiz = hero || base;
    if (!raiz) return [];
    return [
      ...raiz.querySelectorAll('.line-mask > span'),
      ...raiz.querySelectorAll('[data-hero-stagger]'),
      ...raiz.querySelectorAll('[data-anim]'),
    ];
  }

  /** true assim que a abertura terminou (animada ou forçada). */
  let aberturaConcluida = false;

  /** Coloca a primeira dobra no estado final, sem animação. */
  function forcarHero() {
    if (aberturaConcluida) return;
    aberturaConcluida = true;
    document.body.classList.remove('is-loading');
    const alvos = alvosHero();
    if (hasGSAP) {
      gsap.killTweensOf(alvos);
      if (preloader) gsap.killTweensOf(preloader);
    }
    if (preloader && preloader.isConnected) preloader.remove();
    alvos.forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; });
  }

  function revealPage() {
    document.body.classList.remove('is-loading');
    const hero = document.querySelector('[data-hero]');
    if (!hasGSAP || reduced || document.hidden) {
      revealInstant();
      aberturaConcluida = true;
      return;
    }

    const tl = gsap.timeline({ onComplete: () => { aberturaConcluida = true; } });
    if (preloader) {
      tl.to(preloader, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1,
        ease: 'power4.inOut',
        onComplete: () => preloader.remove(),
      });
    }

    if (hero) {
      const title = hero.querySelector('[data-split]');
      const masks = title ? splitLines(title) : [];
      // fromTo com y:0 explícito. Duas armadilhas se somam aqui:
      // 1) o CSS já deixa estas linhas em translateY(105%) para não piscarem
      //    antes do GSAP carregar, então um .from() animaria de 105% até o
      //    valor atual — que é 105% — e completaria sem revelar nada;
      // 2) o GSAP lê o transform computado do CSS em PIXELS e o adota como o
      //    y base do elemento. Sem zerar y, o yPercent é aplicado por cima
      //    desses 105% já convertidos, e o fim da animação continua escondido.
      tl.fromTo(masks.map((m) => m.firstElementChild),
        { yPercent: 105, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: 1.25,
          ease: 'power4.out',
          stagger: 0.09,
        }, preloader ? '-=0.55' : 0)
        .from(hero.querySelectorAll('[data-hero-stagger]'), {
          y: 26, opacity: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09,
        }, '-=0.85');
    }
  }

  /** Espera o load e as fontes, mas nunca além do limite.
   *  As fontes importam porque splitLines agrupa as palavras em linhas medindo
   *  offsetTop: se medir com a fonte de fallback, o corte das linhas sai errado. */
  function quandoPronto(limiteMs) {
    const carregado = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((r) => window.addEventListener('load', r, { once: true }));
    const fontes = document.fonts ? document.fonts.ready : Promise.resolve();
    const teto = new Promise((r) => setTimeout(r, limiteMs));
    return Promise.race([Promise.all([carregado, fontes]), teto]);
  }

  if (preloader && hasGSAP && !reduced) {
    document.body.classList.add('is-loading');
    const mark = preloader.querySelector('.preloader__mark');
    const bar = preloader.querySelector('.preloader__bar');
    const intro = gsap.timeline();
    intro.to(mark, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0)
         .to(bar, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.1);

    let fired = false;
    const go = () => { if (!fired) { fired = true; intro.then(revealPage); } };
    quandoPronto(2600).then(go);

    // Rede de segurança. A abertura inteira dura ~2,6s; se em 5,5s ela ainda
    // não terminou, alguma coisa travou (aba em segundo plano estrangula o
    // requestAnimationFrame, CDN do GSAP fora do ar, tween interrompido) e a
    // primeira dobra vai para o estado final na marra.
    // O gatilho é a abertura não ter concluído — e não a presença do
    // preloader, que pode já ter saído com o título ainda escondido.
    setTimeout(forcarHero, 5500);
  } else {
    document.body.classList.remove('is-loading');
    if (preloader) preloader.remove();
    quandoPronto(2600).then(revealPage);
    setTimeout(forcarHero, 5500);
  }

  /* =======================================================================
     Header
     ======================================================================= */
  const header = document.querySelector('.header');
  if (header) {
    // Toda página começa com .hero ou .page-head, que são escuras. Enquanto o
    // header estiver sobre elas (topo, sem fundo aplicado), usa a versão clara
    // da marca; assim que ganha o fundo creme, volta para a versão escura.
    const primeira = document.querySelector('#main > *');
    const comecaEscuro = !!primeira &&
      (primeira.classList.contains('hero') || primeira.classList.contains('page-head'));

    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-stuck', y > 24);
      if (!document.body.classList.contains('menu-open')) {
        header.classList.toggle('is-hidden', y > last && y > 320);
      }
      last = y;
      header.classList.toggle('on-dark', comecaEscuro && y <= 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* =======================================================================
     Menu mobile
     ======================================================================= */
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.menu');
  if (burger && menu) {
    const close = () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
    };
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) close();
    });
  }

  /* =======================================================================
     Âncoras internas
     ======================================================================= */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      scrollTo(el);
    });
  });

  /* =======================================================================
     Reveals com ScrollTrigger
     ======================================================================= */
  if (hasGSAP && !reduced) {
    // títulos por linha
    document.querySelectorAll('[data-split]:not([data-hero] [data-split])').forEach((el) => {
      const masks = splitLines(el);
      if (!masks.length) return;
      // fromTo com y:0 explícito, pelo mesmo motivo do hero.
      gsap.fromTo(masks.map((m) => m.firstElementChild),
        { yPercent: 105, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: 1.05,
          ease: 'power4.out',
          stagger: 0.075,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
    });

    // blocos genéricos
    gsap.utils.toArray('[data-anim="fade-up"]').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    gsap.utils.toArray('[data-anim="fade"]').forEach((el) => {
      gsap.to(el, {
        opacity: 1, duration: 1.1, ease: 'power2.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
    // grupos com stagger
    gsap.utils.toArray('[data-stagger]').forEach((group) => {
      const items = group.querySelectorAll('[data-stagger-item]');
      if (!items.length) return;
      gsap.from(items, {
        y: 34, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.085,
        scrollTrigger: { trigger: group, start: 'top 86%', once: true },
      });
    });

    // imagens: escala + parallax
    gsap.utils.toArray('.reveal-img').forEach((wrap) => {
      const img = wrap.querySelector('img');
      if (!img) return;
      gsap.to(img, {
        scale: 1, duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 88%', once: true },
      });
      // Deslocamento simétrico em torno do centro. Indo só para um lado, a
      // imagem descolava da borda e deixava aparecer o fundo da moldura; o
      // CSS reserva uma folga de 4% em cima e embaixo para cobrir este curso.
      gsap.fromTo(img,
        { yPercent: -3 },
        {
          yPercent: 3, ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
        });
    });

    // contador
    gsap.utils.toArray('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || 0, 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => {
          el.textContent = obj.v.toLocaleString('pt-BR', {
            minimumFractionDigits: dec, maximumFractionDigits: dec,
          });
        },
      });
    });

    // etapas do método: destaque conforme entram na tela
    gsap.utils.toArray('.step').forEach((step) => {
      gsap.from(step, {
        opacity: 0, y: 30, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: step, start: 'top 88%', once: true },
      });
    });
  }

  /* =======================================================================
     Marquee infinito
     ======================================================================= */
  document.querySelectorAll('.marquee').forEach((m) => {
    const track = m.querySelector('.marquee__track');
    if (!track) return;
    const item = track.firstElementChild;
    if (!item) return;
    // duplica até cobrir 2x a largura visível
    const need = Math.ceil((m.offsetWidth * 2) / Math.max(item.offsetWidth, 1)) + 1;
    for (let i = 0; i < need; i++) track.appendChild(item.cloneNode(true));

    if (reduced || !hasGSAP) return;
    const w = item.offsetWidth;
    const speed = parseFloat(m.dataset.speed || 26);
    gsap.to(track, {
      x: -w, duration: speed, ease: 'none', repeat: -1,
      modifiers: { x: (x) => (parseFloat(x) % w) + 'px' },
    });
  });

  /* =======================================================================
     FAQ — acordeão acessível
     ======================================================================= */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const btn = item.querySelector('.faq__btn');
    const panel = item.querySelector('.faq__panel');
    if (!btn || !panel) return;

    const setOpen = (open) => {
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      const h = panel.firstElementChild.offsetHeight;
      if (hasGSAP && !reduced) {
        gsap.to(panel, {
          height: open ? h : 0,
          duration: 0.6,
          ease: 'power3.inOut',
          onComplete: () => {
            if (open) panel.style.height = 'auto';
            if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
          },
        });
      } else {
        panel.style.height = open ? 'auto' : '0px';
      }
    };

    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      // fecha os irmãos do mesmo grupo
      const group = item.closest('.faq');
      if (open && group) {
        group.querySelectorAll('.faq__item.is-open').forEach((sib) => {
          if (sib === item) return;
          sib.classList.remove('is-open');
          sib.querySelector('.faq__btn').setAttribute('aria-expanded', 'false');
          const p = sib.querySelector('.faq__panel');
          if (hasGSAP && !reduced) gsap.to(p, { height: 0, duration: 0.5, ease: 'power3.inOut' });
          else p.style.height = '0px';
        });
      }
      setOpen(open);
    });
  });

  /* =======================================================================
     Cursor personalizado + botões magnéticos
     ======================================================================= */
  if (fine && !reduced && hasGSAP) {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
      const label = cursor.querySelector('.cursor__label');
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.42, ease: 'power3' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.42, ease: 'power3' });
      window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

      document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
        el.addEventListener('pointerenter', () => {
          cursor.classList.add('is-hover');
          if (label) label.textContent = el.dataset.cursor || '';
        });
        el.addEventListener('pointerleave', () => {
          cursor.classList.remove('is-hover');
          if (label) label.textContent = '';
        });
      });
    }

    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic || 0.32);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.55)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.55)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* =======================================================================
     Botão flutuante do WhatsApp
     ======================================================================= */
  const wa = document.querySelector('.wa-float');
  if (wa) {
    const toggle = () => wa.classList.toggle('is-visible', window.scrollY > 560);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  /* =======================================================================
     Horário: destaca o dia de hoje e mostra aberto/fechado
     Fonte: Google Meu Negócio (seg 07:30–20:00, ter–sex 08:00–20:00)
     ======================================================================= */
  const HOURS = {
    0: null,                // domingo
    1: [[7.5, 20]],         // segunda
    2: [[8, 20]], 3: [[8, 20]], 4: [[8, 20]], 5: [[8, 20]],
    6: null,                // sábado
  };
  const now = new Date();
  const day = now.getDay();
  document.querySelectorAll('.hours li').forEach((li) => {
    if (parseInt(li.dataset.day, 10) === day) li.classList.add('is-today');
  });
  const statusEl = document.querySelector('[data-open-status]');
  if (statusEl) {
    const t = now.getHours() + now.getMinutes() / 60;
    const today = HOURS[day];
    const open = !!today && today.some(([a, b]) => t >= a && t < b);
    statusEl.textContent = open ? 'Aberto agora' : 'Fechado agora';
    statusEl.dataset.state = open ? 'open' : 'closed';
  }

  /* =======================================================================
     Mapa: só carrega o iframe depois do clique (privacidade + performance)
     ======================================================================= */
  document.querySelectorAll('.map-embed').forEach((box) => {
    const cover = box.querySelector('.map-embed__cover');
    const src = box.dataset.mapSrc;
    if (!cover || !src) return;
    cover.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.loading = 'lazy';
      iframe.title = 'Mapa com a localização do consultório';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      box.appendChild(iframe);
      cover.remove();
    });
  });

  /* =======================================================================
     Recalcula posições quando tudo terminou de carregar
     ======================================================================= */
  window.addEventListener('load', () => {
    if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
  });

  /* =======================================================================
     Vigia de conteúdo escondido

     Todo o texto do site entra por animação, e animação depende de frames.
     Se o navegador estrangula o requestAnimationFrame (aba em segundo plano,
     aparelho sobrecarregado, troca de aba no meio da rolagem), um tween pode
     parar no meio e deixar um título invisível de forma permanente.

     Este vigia procura, de tempos em tempos, elementos que já deveriam estar
     visíveis — estão na viewport, sem nenhum tween em andamento — e ainda
     assim continuam escondidos. Nesses casos ele coloca o elemento no estado
     final na marra. Nunca interrompe uma animação em curso: se existe tween
     ativo no alvo, ele passa adiante.

     Conteúdo invisível é pior do que animação perdida. Na dúvida, mostrar.
     ======================================================================= */
  if (hasGSAP && !reduced) {
    const naTela = (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };

    const resgatar = () => {
      document.querySelectorAll('.line-mask').forEach((mask) => {
        const span = mask.firstElementChild;
        if (!span || !naTela(mask)) return;
        const desloc = span.getBoundingClientRect().top - mask.getBoundingClientRect().top;
        if (desloc <= 12) return;                       // já visível
        if (gsap.getTweensOf(span).some((t) => t.isActive())) return;  // animando
        gsap.set(span, { yPercent: 0, y: 0 });
      });

      document.querySelectorAll('[data-anim]').forEach((el) => {
        if (getComputedStyle(el).opacity !== '0' || !naTela(el)) return;
        if (gsap.getTweensOf(el).some((t) => t.isActive())) return;
        gsap.set(el, { opacity: 1, y: 0 });
      });
    };

    let agendado = null;
    const agendar = () => {
      clearTimeout(agendado);
      agendado = setTimeout(resgatar, 1200);
    };
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) agendar();
    });
    setInterval(resgatar, 3000);
    agendar();
  }
})();

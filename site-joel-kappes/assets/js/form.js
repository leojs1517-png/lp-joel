/* =========================================================================
   Formulário de pré-atendimento — 4 etapas
   Sem back-end: monta uma mensagem estruturada e abre o WhatsApp,
   que é o canal real de agendamento da clínica.

   Se você contratar um serviço de formulário (Formspree, Netlify Forms,
   Basin...), preencha ENDPOINT abaixo: os dados passam a ser enviados
   também por lá, e o WhatsApp continua abrindo normalmente.
   ========================================================================= */
(function () {
  'use strict';

  const WHATSAPP = '5548996373498'; // (48) 99637-3498
  const ENDPOINT = '';              // ex.: 'https://formspree.io/f/xxxxxxx'

  const form = document.getElementById('triagem');
  if (!form) return;

  const steps = [...form.querySelectorAll('.form__step')];
  const dots = [...form.querySelectorAll('.form__dot')];
  const counter = form.querySelector('[data-form-count]');
  const btnNext = form.querySelector('[data-next]');
  const btnPrev = form.querySelector('[data-prev]');
  const btnSend = form.querySelector('[data-send]');
  const done = form.querySelector('.form__done');
  const summary = form.querySelector('[data-summary]');

  let index = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && !reduced;

  /* ---------------- Navegação ---------------- */
  function render(dir) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === index));
    dots.forEach((d, i) => {
      d.classList.toggle('is-done', i < index);
      d.classList.toggle('is-active', i === index);
    });
    if (counter) counter.textContent = `${index + 1} / ${steps.length}`;

    btnPrev.hidden = index === 0;
    btnNext.hidden = index === steps.length - 1;
    btnSend.hidden = index !== steps.length - 1;

    if (index === steps.length - 1) buildSummary();

    if (hasGSAP) {
      gsap.fromTo(steps[index],
        { opacity: 0, x: dir === 'back' ? -24 : 24 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
    }

    // move o foco para o primeiro campo da etapa, sem rolar a página
    const first = steps[index].querySelector('input:not([type=hidden]), textarea, select');
    if (first) first.focus({ preventScroll: true });
  }

  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

  /** Um campo é válido quando (a) está preenchido, se for obrigatório, e
   *  (b) tem formato aceitável, se estiver preenchido. O formato precisa ser
   *  checado mesmo em campos opcionais — um e-mail digitado errado é pior que
   *  um e-mail em branco, porque a clínica só descobre ao tentar responder. */
  function campoValido(field) {
    const obrigatorio = field.hasAttribute('data-required');
    const inputs = [...field.querySelectorAll('input, textarea, select')];

    let preenchido = inputs.some((i) =>
      (i.type === 'radio' || i.type === 'checkbox') ? i.checked : !!i.value.trim());

    if (obrigatorio && !preenchido) return false;

    const tel = field.querySelector('input[type="tel"]');
    if (tel && tel.value.trim() && tel.value.replace(/\D/g, '').length < 10) return false;

    const mail = field.querySelector('input[type="email"]');
    if (mail && mail.value.trim() && !EMAIL.test(mail.value.trim())) return false;

    return true;
  }

  function validate(step) {
    let ok = true;
    step.querySelectorAll('.field, [data-required]').forEach((field) => {
      const valido = campoValido(field);
      field.classList.toggle('is-invalid', !valido);
      if (!valido && ok) {
        ok = false;
        const f = field.querySelector('input, textarea, select');
        if (f) f.focus({ preventScroll: true });
      }
    });
    return ok;
  }

  btnNext.addEventListener('click', () => {
    if (!validate(steps[index])) return;
    index = Math.min(index + 1, steps.length - 1);
    render('next');
  });
  btnPrev.addEventListener('click', () => {
    index = Math.max(index - 1, 0);
    render('back');
  });

  // Enter avança em vez de enviar
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (index < steps.length - 1) btnNext.click();
      else btnSend.click();
    }
  });

  // escolher uma opção avança sozinho (só nas etapas de escolha única)
  form.querySelectorAll('[data-autoadvance] input[type="radio"]').forEach((r) => {
    r.addEventListener('change', () => {
      setTimeout(() => { if (validate(steps[index])) btnNext.click(); }, 260);
    });
  });

  /* ---------------- Máscara de telefone ---------------- */
  const tel = form.querySelector('input[type="tel"]');
  if (tel) {
    tel.addEventListener('input', () => {
      let v = tel.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, v.length - 4)}-${v.slice(-4)}`;
      else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      else if (v.length) v = `(${v}`;
      tel.value = v;
    });
  }

  /* ---------------- Coleta ---------------- */
  function data() {
    const fd = new FormData(form);
    const get = (k) => (fd.get(k) || '').toString().trim();
    return {
      motivo: get('motivo'),
      tempo: get('tempo'),
      nome: get('nome'),
      telefone: get('telefone'),
      email: get('email'),
      bairro: get('bairro'),
      relato: get('relato'),
      contato: get('contato'),
    };
  }

  const LABELS = {
    motivo: 'Motivo', tempo: 'Há quanto tempo', nome: 'Nome',
    telefone: 'WhatsApp', email: 'E-mail', bairro: 'Bairro',
    relato: 'Relato', contato: 'Melhor horário',
  };

  function buildSummary() {
    if (!summary) return;
    const d = data();
    summary.innerHTML = '';
    ['motivo', 'tempo', 'nome', 'telefone', 'bairro'].forEach((k) => {
      if (!d[k]) return;
      const row = document.createElement('div');
      row.innerHTML = `<dt>${LABELS[k]}</dt><dd>${escapeHTML(d[k])}</dd>`;
      summary.appendChild(row);
    });
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function message(d) {
    const l = ['Olá, Joel! Vim pelo site e gostaria de agendar uma avaliação.', ''];
    l.push(`*Nome:* ${d.nome}`);
    if (d.motivo) l.push(`*Motivo:* ${d.motivo}`);
    if (d.tempo) l.push(`*Há quanto tempo:* ${d.tempo}`);
    if (d.bairro) l.push(`*Bairro:* ${d.bairro}`);
    if (d.contato) l.push(`*Melhor horário para contato:* ${d.contato}`);
    if (d.relato) l.push('', `*Relato:* ${d.relato}`);
    return l.join('\n');
  }

  /* ---------------- Envio ---------------- */
  btnSend.addEventListener('click', async () => {
    if (!validate(steps[index])) return;
    if (form.querySelector('.hp input').value) return; // honeypot: bot

    const d = data();
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message(d))}`;

    // abre a aba já no gesto do usuário, para não cair no bloqueador de pop-up
    const win = window.open(url, '_blank', 'noopener');

    btnSend.disabled = true;
    btnSend.textContent = 'Enviando…';

    if (ENDPOINT) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...d, origem: location.pathname }),
        });
      } catch (e) { /* o WhatsApp já foi aberto: não bloqueia o usuário */ }
    }

    steps.forEach((s) => s.classList.remove('is-active'));
    form.querySelector('.form__progress').hidden = true;
    form.querySelector('.form__nav').hidden = true;
    if (done) {
      done.classList.add('is-active');
      const link = done.querySelector('[data-wa-link]');
      if (link) link.href = url;
      if (hasGSAP) gsap.from(done, { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
    }
    if (!win && done) {
      const fb = done.querySelector('[data-popup-fallback]');
      if (fb) fb.hidden = false;
    }
  });

  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();

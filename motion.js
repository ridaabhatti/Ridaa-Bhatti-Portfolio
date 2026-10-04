/* A soft star trail that crosses the page as you scroll. */
(() => {
  const sky = document.querySelector('.night-sky');
  const button = document.querySelector('.motion-toggle');

  if (!sky || !button) return;

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !preference.matches;

  try {
    if (localStorage.getItem('portfolio-motion') === 'off') {
      enabled = false;
    }
  } catch (_) {}

  for (let i = 0; i < 50; i++) {
    const dot = document.createElement('span');
    dot.className = 'sky-star';
    dot.style.left = ((i * 37.13 + 3) % 100) + '%';
    dot.style.top = ((i * 23.71 + 5) % 100) + '%';
    dot.style.setProperty('--duration', (5 + i % 6) + 's');
    dot.style.animationDelay = -(i % 7) + 's';
    sky.append(dot);
  }

  const star = document.createElement('div');
  star.className = 'scroll-star';
  star.textContent = '✦';
  star.setAttribute('aria-hidden', 'true');
  document.body.append(star);

  const trail = Array.from({ length: 20 }, () => {
    const dot = document.createElement('span');
    dot.className = 'star-trail';
    dot.setAttribute('aria-hidden', 'true');
    document.body.append(dot);
    return dot;
  });

  let frame = 0;
  let position = 0;
  let target = 0;
  let history = [];

  function progress() {
    const height =
      document.documentElement.scrollHeight - innerHeight;

    return height > 0
      ? Math.max(0, Math.min(1, scrollY / height))
      : 0;
  }

  function draw() {
    const x =
      innerWidth *
      (0.5 + 0.36 * Math.sin(position * Math.PI * 3 - 0.9));

    const y = Math.max(
      150,
      innerHeight *
      (0.65 + 0.13 * Math.sin(position * Math.PI * 4))
    );

    const size = innerWidth <= 650 ? 22 : 28;

    star.style.transform =
      `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) ` +
      `rotate(${position * 180}deg)`;

    /* Soften the star when it crosses text or controls. */
    const element = document.elementFromPoint(x, y);

    const overText = element && element.closest(
      'p, h1, h2, h3, a, label, input, textarea, select, button, li'
    );

    star.style.opacity = overText ? '0.25' : '0.85';

    history.unshift({ x, y });

    if (history.length > 65) {
      history.pop();
    }

    trail.forEach((dot, i) => {
      const point =
        history[Math.min(history.length - 1, i * 3)];

      const offsetX = Math.sin(i * 2) * i * 0.2;
      const offsetY = Math.cos(i * 2) * i * 0.2;

      dot.style.transform =
        `translate3d(${point.x + offsetX}px, ` +
        `${point.y + offsetY}px, 0)`;

      dot.style.opacity = String(
        (1 - i / trail.length) * (overText ? 0.12 : 0.4)
      );
    });

    sky.style.transform = `translateY(${-position * 18}px)`;
  }

  function animate() {
    frame = 0;

    if (!enabled || document.hidden) return;

    position += (target - position) * 0.09;
    draw();

    if (Math.abs(target - position) > 0.0001) {
      frame = requestAnimationFrame(animate);
    }
  }

  function update() {
    target = progress();

    if (enabled && !frame) {
      frame = requestAnimationFrame(animate);
    }
  }

  function apply() {
    document.body.classList.toggle('motion-off', !enabled);

    button.hidden = false;
    button.textContent = enabled ? 'Motion on' : 'Motion off';
    button.setAttribute('aria-pressed', String(enabled));

    button.setAttribute(
      'aria-label',
      enabled
        ? 'Turn decorative motion off'
        : 'Turn decorative motion on'
    );

    cancelAnimationFrame(frame);
    frame = 0;
    history = [];
    position = target = progress();

    if (enabled) {
      draw();
    }
  }

  button.addEventListener('click', () => {
    enabled = !enabled;

    try {
      localStorage.setItem(
        'portfolio-motion',
        enabled ? 'on' : 'off'
      );
    } catch (_) {}

    apply();
  });

  preference.addEventListener('change', event => {
    enabled = !event.matches;
    apply();
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', apply);
  window.addEventListener('load', update);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      update();
    }
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(update).observe(document.body);
  }

  apply();
})();
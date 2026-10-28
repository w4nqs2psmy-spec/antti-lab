(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');
  const year = document.querySelector('#year');

  if (year) year.textContent = new Date().getFullYear();

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      navigation.classList.toggle('is-open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuButton.setAttribute('aria-expanded', 'false');
        navigation.classList.remove('is-open');
      });
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll('.intro-grid, .principles, .lab-heading-row, .lab-card, .research-heading, .research-row, .teaching-visual, .teaching-copy, .project-card, .contact-content');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((element, index) => {
      element.setAttribute('data-reveal', '');
      if (element.classList.contains('lab-card') || element.classList.contains('research-row') || element.classList.contains('project-card')) {
        element.style.transitionDelay = `${(index % 3) * 75}ms`;
      }
      revealObserver.observe(element);
    });
  }

  const canvas = document.querySelector('#rain-window');
  if (!canvas) return;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const reducedMotion = reduceMotion;
  const scene = { width: 0, height: 0, dpr: 1, drops: [], lights: [], raf: 0, lastFrame: 0, pointerX: 0, pointerY: 0, targetX: 0, targetY: 0, visible: true };
  let seed = 91823;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    scene.width = Math.max(1, bounds.width);
    scene.height = Math.max(1, bounds.height);
    scene.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(scene.width * scene.dpr);
    canvas.height = Math.round(scene.height * scene.dpr);
    context.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
    makeDrops();
    paint(0);
  }

  function makeDrops() {
    const count = reducedMotion ? 45 : Math.min(135, Math.round(scene.width * scene.height / 3200));
    scene.drops = Array.from({ length: count }, () => ({
      x: random() * scene.width,
      y: random() * scene.height,
      length: 4 + random() * 15,
      speed: 25 + random() * 70,
      sway: (random() - .5) * 7,
      alpha: .12 + random() * .35,
      width: .45 + random() * .8
    }));
    scene.lights = [];
  }

  function drawCity(time, offsetX, offsetY) {
    const w = scene.width;
    const h = scene.height;
    const horizon = h * .69;
    const sky = context.createLinearGradient(0, 0, w, h);
    sky.addColorStop(0, '#263b43');
    sky.addColorStop(.44, '#23353a');
    sky.addColorStop(1, '#17272b');
    context.fillStyle = sky;
    context.fillRect(0, 0, w, h);

    const glow = context.createRadialGradient(w * .55 + offsetX * .25, h * .5 + offsetY * .2, 5, w * .55, h * .57, w * .63);
    glow.addColorStop(0, 'rgba(206,143,82,.22)');
    glow.addColorStop(.45, 'rgba(104,113,95,.1)');
    glow.addColorStop(1, 'rgba(15,27,31,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, w, h);

    // Distant, softened rooflines give the view depth behind the closer facades.
    context.fillStyle = '#1b2c31';
    const farBuildings = [
      [.00, .43, .17, .29], [.12, .37, .12, .35], [.22, .47, .13, .25],
      [.35, .34, .15, .38], [.48, .43, .12, .29], [.6, .38, .14, .34],
      [.76, .44, .14, .28], [.87, .33, .16, .39]
    ];
    farBuildings.forEach(([x, y, bw, bh], index) => {
      const shift = offsetX * (index % 2 ? .1 : -.08);
      context.fillRect(x * w + shift, y * h + offsetY * .08, bw * w, bh * h);
      context.fillStyle = '#26383a';
      context.fillRect(x * w + shift + bw * w * .08, y * h + offsetY * .08 - 4, bw * w * .12, 5);
      context.fillStyle = '#1b2c31';
    });

    // Low warm sky over the rooftops.
    const horizonGlow = context.createLinearGradient(0, horizon - h * .17, 0, horizon + h * .08);
    horizonGlow.addColorStop(0, 'rgba(218,158,99,0)');
    horizonGlow.addColorStop(.8, 'rgba(211,151,92,.16)');
    horizonGlow.addColorStop(1, 'rgba(211,151,92,0)');
    context.fillStyle = horizonGlow;
    context.fillRect(0, horizon - h * .18, w, h * .23);

    // Three nearer blocks, each with its own quietly glowing window pattern.
    const blocks = [
      { x: -.05, y: .48, w: .34, h: .28, color: '#273a3b', rows: 4, cols: 5, seed: 2 },
      { x: .29, y: .44, w: .36, h: .32, color: '#314140', rows: 5, cols: 5, seed: 7 },
      { x: .66, y: .5, w: .4, h: .26, color: '#243638', rows: 4, cols: 5, seed: 13 }
    ];
    blocks.forEach((block, blockIndex) => {
      const bx = block.x * w + offsetX * (blockIndex === 1 ? .16 : .23);
      const by = block.y * h + offsetY * .11;
      const bw = block.w * w;
      const bh = block.h * h;
      context.fillStyle = block.color;
      context.fillRect(bx, by, bw, bh);
      context.fillStyle = 'rgba(220,171,113,.13)';
      context.fillRect(bx, by, bw, 2);
      for (let row = 0; row < block.rows; row += 1) {
        for (let col = 0; col < block.cols; col += 1) {
          const lit = ((row * 7 + col * 3 + block.seed) % 6) < (blockIndex === 1 ? 3 : 2);
          const flicker = .78 + .22 * Math.sin(time * .001 + row * 1.5 + col);
          context.fillStyle = lit ? `rgba(235,186,124,${(.24 + .13 * flicker).toFixed(2)})` : 'rgba(135,165,157,.13)';
          const wx = bx + bw * (.12 + col * .155);
          const wy = by + bh * (.13 + row * .18);
          context.fillRect(wx, wy, Math.max(2, bw * .027), Math.max(3, bh * .075));
        }
      }
    });

    // Reflected amber and blue streaks in the wet street.
    const street = context.createLinearGradient(0, horizon, 0, h);
    street.addColorStop(0, '#1a2c30');
    street.addColorStop(1, '#111e22');
    context.fillStyle = street;
    context.fillRect(0, horizon, w, h - horizon);
    for (let i = 0; i < 23; i += 1) {
      const x = (i / 23) * w + Math.sin(i * 12.7) * w * .023 + offsetX * .1;
      const lineY = horizon + h * (.025 + ((i * 13) % 24) / 100);
      const lineW = w * (.014 + (i % 4) * .008);
      const opacity = .06 + .08 * ((i * 7) % 4) / 4;
      context.fillStyle = i % 3 === 0 ? `rgba(224,167,102,${opacity})` : `rgba(121,157,158,${opacity})`;
      context.fillRect(x, lineY, lineW, 1 + (i % 3));
    }

    // A few reflected lamps soften into long reflections below the skyline.
    const reflectionX = [w * .2, w * .55, w * .83];
    reflectionX.forEach((x, index) => {
      const reflection = context.createLinearGradient(x, horizon, x, h * .91);
      reflection.addColorStop(0, `rgba(227,173,111,${.18 - index * .025})`);
      reflection.addColorStop(.5, 'rgba(227,173,111,.035)');
      reflection.addColorStop(1, 'rgba(227,173,111,0)');
      context.fillStyle = reflection;
      context.fillRect(x - w * .009, horizon, w * .018, h * .23);
    });
  }

  function drawWindow(offsetX, offsetY) {
    const w = scene.width;
    const h = scene.height;
    // Warm reflections at the edges suggest a wooden studio interior.
    const leftFrame = context.createLinearGradient(0, 0, w * .075, 0);
    leftFrame.addColorStop(0, '#382d26');
    leftFrame.addColorStop(.58, '#76513a');
    leftFrame.addColorStop(1, '#9b704b');
    context.fillStyle = leftFrame;
    context.fillRect(0, 0, w * .052, h);
    context.fillStyle = 'rgba(232,181,122,.25)';
    context.fillRect(w * .052, 0, 2, h);

    const rightFrame = context.createLinearGradient(w * .92, 0, w, 0);
    rightFrame.addColorStop(0, '#674833');
    rightFrame.addColorStop(.35, '#906745');
    rightFrame.addColorStop(1, '#382d26');
    context.fillStyle = rightFrame;
    context.fillRect(w * .935, 0, w * .065, h);
    context.fillStyle = 'rgba(238,192,132,.2)';
    context.fillRect(w * .933, 0, 2, h);

    // Slightly off-centre mullions create a perspective rhythm.
    context.fillStyle = 'rgba(31,39,37,.8)';
    context.fillRect(w * .53 + offsetX * .02, 0, Math.max(4, w * .012), h * .94);
    context.fillRect(w * .055, h * .33 + offsetY * .02, w * .88, Math.max(4, h * .009));
    context.fillStyle = 'rgba(205,153,100,.58)';
    context.fillRect(w * .53 + offsetX * .02 + Math.max(4, w * .012), 0, 1, h * .94);
    context.fillRect(w * .055, h * .33 + offsetY * .02 + Math.max(4, h * .009), w * .88, 1);

    // Deep timber sill along the base of the window.
    const sillY = h * .93;
    const sill = context.createLinearGradient(0, sillY, 0, h);
    sill.addColorStop(0, '#9a704d');
    sill.addColorStop(.2, '#634832');
    sill.addColorStop(1, '#3b3027');
    context.fillStyle = sill;
    context.fillRect(0, sillY, w, h - sillY);
    context.fillStyle = 'rgba(245,198,135,.35)';
    context.fillRect(0, sillY, w, 2);

    // A quiet cup silhouette on the ledge gives the scene a human scale.
    const cupX = w * .76;
    const cupY = sillY - h * .035;
    context.fillStyle = 'rgba(194,169,135,.42)';
    context.beginPath();
    context.ellipse(cupX, cupY + h * .036, w * .035, h * .009, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#b7956e';
    context.beginPath();
    context.moveTo(cupX - w * .027, cupY);
    context.lineTo(cupX + w * .027, cupY);
    context.lineTo(cupX + w * .023, cupY + h * .035);
    context.quadraticCurveTo(cupX, cupY + h * .042, cupX - w * .023, cupY + h * .035);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(208,176,134,.85)';
    context.lineWidth = Math.max(1, w * .004);
    context.beginPath();
    context.ellipse(cupX + w * .028, cupY + h * .017, w * .011, h * .012, 0, -Math.PI / 2, Math.PI / 2);
    context.stroke();
  }

  function drawRain(delta) {
    const w = scene.width;
    const h = scene.height;
    context.lineCap = 'round';
    scene.drops.forEach((drop) => {
      if (!reducedMotion) {
        drop.y += drop.speed * delta;
        drop.x += drop.sway * delta;
        if (drop.y > h * .94) { drop.y = -drop.length; drop.x = random() * w; }
        if (drop.x < 0) drop.x = w;
        if (drop.x > w) drop.x = 0;
      }
      context.strokeStyle = `rgba(198,218,217,${drop.alpha.toFixed(2)})`;
      context.lineWidth = drop.width;
      context.beginPath();
      context.moveTo(drop.x, drop.y);
      context.lineTo(drop.x - drop.sway * .13, drop.y + drop.length);
      context.stroke();
      if (drop.length > 13) {
        context.fillStyle = `rgba(213,225,216,${(drop.alpha * .5).toFixed(2)})`;
        context.beginPath();
        context.ellipse(drop.x - drop.sway * .13, drop.y + drop.length, 1, 2, -.1, 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  function paint(time) {
    const delta = scene.lastFrame ? Math.min((time - scene.lastFrame) / 1000, .04) : 0;
    scene.lastFrame = time;
    scene.pointerX += (scene.targetX - scene.pointerX) * .035;
    scene.pointerY += (scene.targetY - scene.pointerY) * .035;
    const offsetX = scene.pointerX * 14;
    const offsetY = scene.pointerY * 10;
    drawCity(time, offsetX, offsetY);
    drawRain(delta);
    drawWindow(offsetX, offsetY);
    if (!reducedMotion && scene.visible) scene.raf = window.requestAnimationFrame(paint);
  }

  const art = canvas.closest('.hero-art');
  if (art && !reducedMotion) {
    art.addEventListener('pointermove', (event) => {
      const rect = art.getBoundingClientRect();
      scene.targetX = ((event.clientX - rect.left) / rect.width - .5) * 2;
      scene.targetY = ((event.clientY - rect.top) / rect.height - .5) * 2;
    });
    art.addEventListener('pointerleave', () => { scene.targetX = 0; scene.targetY = 0; });
  }

  if ('IntersectionObserver' in window) {
    const canvasObserver = new IntersectionObserver(([entry]) => {
      scene.visible = entry.isIntersecting;
      if (scene.visible && !reducedMotion && !scene.raf) {
        scene.lastFrame = 0;
        scene.raf = window.requestAnimationFrame(paint);
      } else if (!scene.visible && scene.raf) {
        window.cancelAnimationFrame(scene.raf);
        scene.raf = 0;
      }
    });
    canvasObserver.observe(art || canvas);
  }

  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas);
  else window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();
  if (!reducedMotion) scene.raf = window.requestAnimationFrame(paint);
})();

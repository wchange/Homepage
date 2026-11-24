const english = document.documentElement.lang === 'en';
const lightbox = document.getElementById('lightbox');
const preview = document.getElementById('lightbox-image');
const caption = document.getElementById('lightbox-caption');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    preview.src = button.dataset.image;
    preview.alt = button.querySelector('img').alt;
    caption.textContent = button.dataset.caption;
    lightbox.showModal();
    document.body.classList.add('has-dialog');
  });
});
document.getElementById('close-lightbox').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  const bounds = lightbox.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
});
lightbox.addEventListener('close', () => document.body.classList.remove('has-dialog'));
document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const status = document.getElementById('contact-status');
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      status.textContent = english
        ? `Copied ${button.dataset.copyLabel}: ${button.dataset.copy}`
        : `${button.dataset.copyLabel}已复制：${button.dataset.copy}`;
    } catch {
      status.textContent = english
        ? `Select and copy ${button.dataset.copyLabel}: ${button.dataset.copy}`
        : `请选中并手动复制${button.dataset.copyLabel}：${button.dataset.copy}`;
    }
  });
});

document.querySelectorAll('.game-carousel').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const stage = carousel.querySelector('.carousel-stage');
  const image = stage.querySelector('img');
  const toggle = carousel.querySelector('[data-carousel-toggle]');
  const announcement = carousel.querySelector('[data-carousel-announcement]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let paused = motion.matches;
  let visible = false;
  let hovered = false;
  let timer;
  const eligible = () => !paused && visible && !hovered && !document.hidden && !carousel.contains(document.activeElement) && !lightbox.open;
  function schedule() {
    clearInterval(timer);
    if (eligible()) timer = setInterval(() => show(index + 1), 5000);
  }
  function show(next, manual = false) {
    index = (next + slides.length) % slides.length;
    const selected = slides[index];
    stage.dataset.image = selected.dataset.carouselSlide;
    stage.dataset.caption = selected.dataset.caption;
    image.src = selected.dataset.carouselSlide;
    image.alt = selected.dataset.caption;
    carousel.querySelector('.carousel-caption').textContent = selected.dataset.caption;
    carousel.querySelector('.carousel-counter').textContent = `${index + 1} / ${slides.length}`;
    slides.forEach((slide, position) => position === index ? slide.setAttribute('aria-current', 'true') : slide.removeAttribute('aria-current'));
    if (manual) announcement.textContent = english
      ? `Screenshot ${index + 1} of ${slides.length}: ${selected.dataset.caption}`
      : `第 ${index + 1} 张，共 ${slides.length} 张：${selected.dataset.caption}`;
    schedule();
  }
  function updateToggle() {
    toggle.textContent = english ? (paused ? 'Play' : 'Pause') : (paused ? '自动播放' : '暂停播放');
    const label = english ? (paused ? 'Start autoplay' : 'Pause autoplay') : (paused ? '开始自动播放' : '暂停自动播放');
    toggle.setAttribute('aria-label', label);
    schedule();
  }
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(index - 1, true));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(index + 1, true));
  slides.forEach((slide, position) => slide.addEventListener('click', () => show(position, true)));
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); });
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1), true);
    }
  });
  carousel.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  carousel.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', schedule);
  carousel.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('visibilitychange', schedule);
  lightbox.addEventListener('close', schedule);
  stage.addEventListener('click', () => clearInterval(timer));
  motion.addEventListener('change', () => { if (motion.matches) { paused = true; updateToggle(); } });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].intersectionRatio >= 0.25; schedule(); }, {threshold:0.25}).observe(stage);
  } else { visible = true; }
  let start;
  let suppressClick = false;
  stage.style.touchAction = 'pan-y pinch-zoom';
  stage.addEventListener('pointerdown', event => { suppressClick = false; if (event.pointerType === 'touch') start = {x:event.clientX,y:event.clientY}; });
  stage.addEventListener('pointercancel', () => { start = null; });
  stage.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick = true;
      show(index + (dx < 0 ? 1 : -1), true);
    }
  });
  stage.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  updateToggle();
});

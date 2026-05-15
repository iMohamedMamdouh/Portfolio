// ===== Mobile nav =====
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-nav-active');
        hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
            navLinks.classList.remove('mobile-nav-active');
            hamburger.classList.remove('active');
        })
    );
}

// ===== Scroll-aware navbar =====
const navbar = document.querySelector('.navbar');
const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 8) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Smooth anchor scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = this.getAttribute('href');
        if (target && target.length > 1) {
            const el = document.querySelector(target);
            if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
        }
    });
});

// ===== Reveal on scroll =====
const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== Animate skill bars =====
const barObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const pct = bar.dataset.pct || bar.getAttribute('data-pct') || 0;
            requestAnimationFrame(() => { bar.style.width = pct + '%'; });
            obs.unobserve(bar);
        }
    });
}, { threshold: 0.4 });
document.querySelectorAll('.bar[data-pct]').forEach(b => barObserver.observe(b));

// ===== Thumb carousel (prev/next scroll) =====
document.querySelectorAll('.thumb-carousel').forEach(carousel => {
    const track = carousel.querySelector('.thumb-track');
    const prev  = carousel.querySelector('.carousel-nav.prev');
    const next  = carousel.querySelector('.carousel-nav.next');
    if (!track) return;

    const step = () => Math.max(140, track.clientWidth * 0.7);
    const update = () => {
        const max = track.scrollWidth - track.clientWidth - 2;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max;
    };
    if (prev) prev.addEventListener('click', () => { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', () => { track.scrollBy({ left:  step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
});

// ===== Expandable description toggle =====
document.querySelectorAll('.mobile-card .expand-btn').forEach(btn => {
    const card = btn.closest('.mobile-card');
    const ext  = card && card.querySelector('.extended-desc');
    const label = btn.querySelector('span');
    if (!ext) return;
    btn.addEventListener('click', () => {
        const open = ext.classList.toggle('open');
        btn.classList.toggle('open', open);
        if (label) label.textContent = open ? 'Show less' : 'Show more';
    });
});

// ===== Zoom-only image lightbox with prev/next navigation =====
(function(){
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
        '<button class="lightbox-close" aria-label="Close (Esc)"><i class="fas fa-times"></i></button>' +
        '<button class="lightbox-nav prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>' +
        '<button class="lightbox-nav next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>' +
        '<img alt="" />' +
        '<div class="lightbox-counter" aria-live="polite"></div>';
    document.body.appendChild(overlay);
    const overlayImg = overlay.querySelector('img');
    const closeBtn  = overlay.querySelector('.lightbox-close');
    const prevBtn   = overlay.querySelector('.lightbox-nav.prev');
    const nextBtn   = overlay.querySelector('.lightbox-nav.next');
    const counter   = overlay.querySelector('.lightbox-counter');

    let group = [];      // array of {src, alt}
    let index = 0;

    function render() {
        if (!group.length) return;
        const item = group[index];
        overlayImg.src = item.src;
        overlayImg.alt = item.alt || '';
        if (group.length > 1) {
            prevBtn.hidden = false;
            nextBtn.hidden = false;
            counter.hidden = false;
            counter.textContent = (index + 1) + ' / ' + group.length;
        } else {
            prevBtn.hidden = true;
            nextBtn.hidden = true;
            counter.hidden = true;
        }
    }
    function open(items, startIdx) {
        group = items;
        index = Math.max(0, Math.min(startIdx | 0, group.length - 1));
        render();
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => { overlayImg.src = ''; }, 250);
    }
    function step(delta) {
        if (!group.length) return;
        index = (index + delta + group.length) % group.length;
        render();
    }

    // Click handlers: clicking the overlay backdrop closes; clicking the image steps to next.
    overlay.addEventListener('click', e => {
        if (e.target === overlay) { close(); return; }
        if (e.target === closeBtn || closeBtn.contains(e.target)) { close(); return; }
        if (e.target === prevBtn || prevBtn.contains(e.target))   { step(-1); return; }
        if (e.target === nextBtn || nextBtn.contains(e.target))   { step(+1); return; }
    });
    // Keyboard
    document.addEventListener('keydown', e => {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape')      close();
        else if (e.key === 'ArrowLeft')  step(-1);
        else if (e.key === 'ArrowRight') step(+1);
    });

    // Build groups from explicit galleries first.
    function imgInfo(el) {
        // el is either an <a> (with href) or an <img>
        if (el.tagName === 'A') {
            const im = el.querySelector('img');
            return { src: el.getAttribute('href') || (im && im.src) || '', alt: im ? im.alt : '' };
        }
        return { src: el.src, alt: el.alt || '' };
    }

    // 1) Galleries / carousels that contain a[data-zoom] — group all anchors
    document.querySelectorAll('.gallery, .thumb-track').forEach(gallery => {
        const anchors = Array.from(gallery.querySelectorAll('a[data-zoom]'));
        if (!anchors.length) return;
        const items = anchors.map(imgInfo);
        anchors.forEach((a, i) => {
            a.addEventListener('click', e => { e.preventDefault(); open(items, i); });
        });
    });

    // 2) Featured-thumbs strip on the home page
    document.querySelectorAll('.featured-thumbs').forEach(group => {
        const imgs = Array.from(group.querySelectorAll('img'));
        if (!imgs.length) return;
        const items = imgs.map(imgInfo);
        imgs.forEach((img, i) => img.addEventListener('click', () => open(items, i)));
    });

    // 3) Hero strip
    document.querySelectorAll('.hero-strip').forEach(group => {
        const imgs = Array.from(group.querySelectorAll('img'));
        if (!imgs.length) return;
        const items = imgs.map(imgInfo);
        imgs.forEach((img, i) => img.addEventListener('click', () => open(items, i)));
    });

    // 4) Standalone a[data-zoom] anchors not inside a grouped container
    document.querySelectorAll('a[data-zoom]').forEach(a => {
        if (a.closest('.gallery') || a.closest('.thumb-track')) return; // already handled
        a.addEventListener('click', e => {
            e.preventDefault();
            open([imgInfo(a)], 0);
        });
    });
})();

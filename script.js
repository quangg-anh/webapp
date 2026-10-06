(() => {
    const quickToggle = document.querySelector('.quick-toggle');
    const quickMenu = document.getElementById('quick-links');

    const closeQuickMenu = () => {
        quickMenu.hidden = true;
        quickToggle.setAttribute('aria-expanded', 'false');
    };
    quickToggle.addEventListener('click', () => {
        const shouldOpen = quickMenu.hidden;
        quickMenu.hidden = !shouldOpen;
        quickToggle.setAttribute('aria-expanded', String(shouldOpen));
    });
    quickMenu.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeQuickMenu();
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.quick-wrap')) closeQuickMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !quickMenu.hidden) {
            closeQuickMenu();
            quickToggle.focus();
        }
    });

    const planner = document.getElementById('travel-planner');
    if (planner) {
        const destination = planner.elements.namedItem('diem-den');
        const days = planner.elements.namedItem('so-ngay');
        const pace = planner.elements.namedItem('nhip-do');
        const output = document.getElementById('plan-result');
        const summary = document.getElementById('plan-summary');
        const suggestions = document.getElementById('plan-suggestions');
        const places = {
            'Hà Nội': ['Hồ Hoàn Kiếm', 'Văn Miếu Quốc Tử Giám', 'Lăng Chủ tịch Hồ Chí Minh', 'Hồ Tây'],
            'Đà Nẵng': ['Bà Nà Hills', 'Cầu Rồng', 'Biển Mỹ Khê', 'Ngũ Hành Sơn']
        };
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('diem-den');
        if (requested === 'Ha Noi') destination.value = 'Hà Nội';
        if (requested === 'Da Nang') destination.value = 'Đà Nẵng';

        planner.addEventListener('input', () => { output.hidden = true; });
        planner.addEventListener('change', () => { output.hidden = true; });
        planner.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!planner.reportValidity()) return;
            const name = destination.value;
            const count = Number(days.value);
            summary.textContent = `${count} ngày ở ${name} · ${pace.value.toLowerCase()}.`;
            suggestions.replaceChildren();
            places[name].forEach((place) => {
                const item = document.createElement('li');
                item.textContent = place;
                suggestions.append(item);
            });
            output.hidden = false;
            output.focus();
        });
    }

    const deck = document.getElementById('destination-deck');
    if (!deck) return;
    const cards = Array.from(deck.querySelectorAll('.postcard'));
    const deckCount = document.querySelector('.deck-count');
    const announcement = document.querySelector('.deck-announcement');
    const dotsContainer = document.querySelector('.deck-dots');
    const dots = cards.map(() => {
        const dot = document.createElement('span');
        dot.setAttribute('aria-hidden', 'true');
        dotsContainer.append(dot);
        return dot;
    });
    let activeIndex = 0;
    let dragging = null;
    let animating = false;

    function restack() {
        cards.forEach((card, index) => {
            const depth = (index - activeIndex + cards.length) % cards.length;
            const x = depth === 0 ? 0 : (depth % 2 ? 1 : -1) * (6 + depth * 3);
            const y = depth === 0 ? 0 : depth * 5;
            const scale = 1 - depth * .033;
            const rotation = depth === 0 ? -1.2 : (depth % 2 ? 1 : -1) * (1.8 + depth * .7);
            card.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
            card.style.zIndex = String(cards.length - depth);
            card.classList.toggle('is-top', depth === 0);
            card.setAttribute('aria-hidden', String(depth !== 0));
        });
        dots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
        deckCount.textContent = `${cards[activeIndex].dataset.rank} / 05`;
        announcement.textContent = `${cards[activeIndex].dataset.name}, địa điểm ${activeIndex + 1} trên ${cards.length}`;
    }

    function throwCard(direction) {
        if (animating || dragging) return;
        animating = true;
        const card = cards[activeIndex];
        const distance = Math.max(deck.clientWidth * 1.35, 350);
        card.style.transition = 'transform .36s cubic-bezier(.24,.72,.31,1), opacity .36s ease';
        card.style.transform = `translate(${direction * distance}px, -55px) rotate(${direction * 23}deg) scale(.97)`;
        card.style.opacity = '0';
        window.setTimeout(() => {
            activeIndex = (activeIndex + (direction > 0 ? 1 : -1) + cards.length) % cards.length;
            card.style.transition = 'none';
            restack();
            card.style.opacity = '1';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.style.removeProperty('transition');
                    animating = false;
                });
            });
        }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360);
    }

    deck.classList.add('is-enhanced');
    restack();
    deck.addEventListener('pointerdown', (event) => {
        if (animating || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
        const top = cards[activeIndex];
        dragging = { id: event.pointerId, startX: event.clientX, startY: event.clientY, card: top };
        top.style.transition = 'none';
        deck.classList.add('is-dragging');
        deck.setPointerCapture(event.pointerId);
    });
    deck.addEventListener('pointermove', (event) => {
        if (!dragging || event.pointerId !== dragging.id) return;
        const dx = event.clientX - dragging.startX;
        const dy = (event.clientY - dragging.startY) * .22;
        dragging.card.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-24, Math.min(24, dx * .065))}deg) scale(1.025)`;
    });
    const release = (event) => {
        if (!dragging || event.pointerId !== dragging.id) return;
        const dx = event.clientX - dragging.startX;
        const card = dragging.card;
        dragging = null;
        deck.classList.remove('is-dragging');
        if (deck.hasPointerCapture(event.pointerId)) deck.releasePointerCapture(event.pointerId);
        if (event.type !== 'pointercancel' && Math.abs(dx) >= deck.clientWidth * .1) {
            throwCard(Math.sign(dx));
        } else {
            card.style.removeProperty('transition');
            restack();
        }
    };
    deck.addEventListener('pointerup', release);
    deck.addEventListener('pointercancel', release);
    deck.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            throwCard(event.key === 'ArrowRight' ? 1 : -1);
        }
    });
    document.querySelector('.deck-next').addEventListener('click', () => throwCard(1));
    document.querySelector('.deck-prev').addEventListener('click', () => throwCard(-1));

    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    if (!motion.matches) return;

    const portal = document.querySelector('.portal');
    const stage = document.querySelector('.portal-stage');
    const photo = document.querySelector('.portal-photo');
    const wash = document.querySelector('.portal-wash');
    const leftPanel = document.querySelector('.portal-panel--left');
    const rightPanel = document.querySelector('.portal-panel--right');
    const title = document.querySelector('.portal-title');
    const leftTitle = document.querySelector('.title-half--left');
    const rightTitle = document.querySelector('.title-half--right');
    const amberDot = document.querySelector('.portal-dot--amber');
    const tealDot = document.querySelector('.portal-dot--teal');
    const caption = document.querySelector('.hero-caption');
    const statement = document.querySelector('.statement');
    const roundImage = document.querySelector('.round-image');
    let metrics;
    let queued = false;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const measure = () => {
        metrics = {
            start: portal.getBoundingClientRect().top + window.scrollY,
            travel: Math.max(1, portal.offsetHeight - stage.clientHeight),
            width: stage.clientWidth,
            height: stage.clientHeight,
            leftWidth: leftTitle.offsetWidth,
            rightWidth: rightTitle.offsetWidth,
            statementTop: statement.getBoundingClientRect().top + window.scrollY,
            statementHeight: statement.offsetHeight
        };
        paint();
    };
    const paint = () => {
        queued = false;
        if (!metrics) return;
        const scroll = window.scrollY;
        const progress = clamp((scroll - metrics.start) / metrics.travel, 0, 1);
        const open = clamp(progress * 1.6, 0, 1);
        leftPanel.style.transform = `translateX(${-105 * open}%)`;
        rightPanel.style.transform = `translateX(${105 * open}%)`;
        photo.style.transform = `scale(${1.14 - .14 * open})`;
        wash.style.opacity = String(.16 * open);
        title.style.transform = `translate(-50%, -50%) scale(${1 + .22 * open})`;
        title.style.letterSpacing = `${-.025 - .026 * open}em`;
        leftTitle.style.transform = `translateX(${-metrics.leftWidth * .48 * open}px)`;
        rightTitle.style.transform = `translateX(${metrics.rightWidth * .48 * open}px)`;
        amberDot.style.transform = `translate(calc(-50% - ${metrics.width * .42 * open}px), calc(55px - ${metrics.height * .31 * open}px))`;
        tealDot.style.transform = `translate(calc(-50% + ${metrics.width * .42 * open}px), calc(55px + ${metrics.height * .31 * open}px))`;
        caption.style.opacity = String(clamp((open - .65) * 3, 0, 1));
        const statementProgress = clamp((scroll + metrics.height - metrics.statementTop) / (metrics.statementHeight + metrics.height), 0, 1);
        roundImage.style.transform = `translateY(${(statementProgress - .5) * 100}px) rotate(${(statementProgress - .5) * 18}deg)`;
    };
    window.addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
    }, { passive: true });
    window.addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);
    measure();

    if ('IntersectionObserver' in window) {
        const reveals = Array.from(document.querySelectorAll('.reveal'));
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -30px 0px', threshold: .08 });
        document.documentElement.classList.add('has-reveals');
        reveals.forEach((item) => observer.observe(item));
    }
})();

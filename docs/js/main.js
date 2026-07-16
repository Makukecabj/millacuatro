/* ========================================
   MillaCuatro - Main JS
   Gallery, animations, interactions
   ======================================== */

// ==========================================
// Config: imagenes de productos
// ==========================================
const IMAGES = [
    { file: "producto-01.jpg", cat: "activewear" },
    { file: "producto-02.jpg", cat: "bikini" },
    { file: "producto-03.jpg", cat: "activewear" },
    { file: "producto-04.jpg", cat: "bikini" },
    { file: "producto-05.jpg", cat: "activewear" },
    { file: "producto-06.jpg", cat: "bikini" },
    { file: "producto-07.jpg", cat: "activewear" },
    { file: "producto-08.jpg", cat: "bikini" },
    { file: "producto-09.jpg", cat: "activewear" },
    { file: "producto-10.jpg", cat: "bikini" },
    { file: "producto-11.jpg", cat: "activewear" },
    { file: "producto-12.jpg", cat: "bikini" },
    { file: "producto-13.jpg", cat: "activewear" },
    { file: "producto-14.jpg", cat: "bikini" },
    { file: "producto-15.jpg", cat: "activewear" },
    { file: "producto-16.jpg", cat: "bikini" },
    { file: "producto-17.jpg", cat: "activewear" },
    { file: "producto-18.jpg", cat: "bikini" },
    { file: "producto-19.jpg", cat: "activewear" },
    { file: "producto-20.jpg", cat: "bikini" },
    { file: "producto-21.jpg", cat: "activewear" },
    { file: "producto-22.jpg", cat: "bikini" },
    { file: "producto-23.jpg", cat: "activewear" },
    { file: "producto-24.jpg", cat: "bikini" },
];

const IG_IMAGES = [
    "producto-01.jpg",
    "producto-05.jpg",
    "producto-10.jpg",
    "producto-15.jpg",
    "producto-20.jpg",
    "producto-25.jpg",
];

// ==========================================
// Preloader
// ==========================================
function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    const heroVideo = document.querySelector(".hero__video");
    let loaded = false;

    function hidePreloader() {
        if (loaded) return;
        loaded = true;
        preloader.classList.add("hidden");
        setTimeout(() => {
            preloader.style.display = "none";
        }, 600);
    }

    // Hide after video loads or 2.5s max
    if (heroVideo) {
        heroVideo.addEventListener("canplaythrough", hidePreloader);
        heroVideo.addEventListener("error", hidePreloader);
    }
    setTimeout(hidePreloader, 2500);
}

// ==========================================
// Custom Cursor
// ==========================================
function initCursor() {
    const cursor = document.getElementById("cursor");
    const follower = document.getElementById("cursor-follower");
    if (!cursor || !follower) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + "px";
        cursor.style.top = mouseY + "px";
    });

    function animateFollower() {
        followerX += (mouseX - followerX) * 0.12;
        followerY += (mouseY - followerY) * 0.12;
        follower.style.left = followerX + "px";
        follower.style.top = followerY + "px";
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll("a, button, .gallery__item, .lookbook__item, .instagram-feed__item, .lightbox");
    interactives.forEach((el) => {
        el.addEventListener("mouseenter", () => {
            cursor.classList.add("cursor--hover");
            follower.classList.add("cursor-follower--hover");
        });
        el.addEventListener("mouseleave", () => {
            cursor.classList.remove("cursor--hover");
            follower.classList.remove("cursor-follower--hover");
        });
    });
}

// ==========================================
// Scroll Reveal (IntersectionObserver)
// ==========================================
function initScrollReveal() {
    const elements = document.querySelectorAll(".anim-reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add("visible");
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    elements.forEach((el, i) => {
        const parent = el.parentElement;
        const siblings = parent.querySelectorAll(".anim-reveal");
        const index = Array.from(siblings).indexOf(el);
        el.dataset.delay = index * 100;
        observer.observe(el);
    });
}

// ==========================================
// Header scroll effect
// ==========================================
function initHeader() {
    const header = document.getElementById("header");
    if (!header) return;

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add("header--scrolled");
        } else {
            header.classList.remove("header--scrolled");
        }
    }, { passive: true });
}

// ==========================================
// Mobile menu
// ==========================================
function initMobileMenu() {
    const burger = document.getElementById("burger");
    const menu = document.getElementById("mobile-menu");
    if (!burger || !menu) return;

    burger.addEventListener("click", () => {
        burger.classList.toggle("active");
        menu.classList.toggle("active");
        document.body.style.overflow = menu.classList.contains("active") ? "hidden" : "";
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            burger.classList.remove("active");
            menu.classList.remove("active");
            document.body.style.overflow = "";
        });
    });
}

// ==========================================
// Gallery
// ==========================================
let currentFilter = "all";

function renderGallery(filter) {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;

    currentFilter = filter || "all";
    grid.innerHTML = "";

    const filtered = filter === "all"
        ? IMAGES
        : IMAGES.filter((img) => img.cat === filter);

    filtered.forEach((imgData, index) => {
        const item = document.createElement("div");
        item.className = "gallery__item anim-reveal";
        item.dataset.category = imgData.cat;
        item.dataset.delay = (index % 4) * 80;

        const img = document.createElement("img");
        img.src = `assets/productos/${imgData.file}`;
        img.alt = `MillaCuatro - ${imgData.file.replace(".jpg", "").replace("producto-", "Producto ")}`;
        img.loading = "lazy";

        const overlay = document.createElement("div");
        overlay.className = "gallery__item-overlay";

        const label = document.createElement("span");
        label.className = "gallery__item-label";
        label.textContent = imgData.cat === "activewear" ? "Activewear" : "Bikini";

        overlay.appendChild(label);
        item.appendChild(img);
        item.appendChild(overlay);

        item.addEventListener("click", () => openLightbox(img.src));

        grid.appendChild(item);
    });

    initScrollReveal();
}

function initGalleryFilters() {
    const filters = document.querySelectorAll(".gallery__filter");
    filters.forEach((btn) => {
        btn.addEventListener("click", () => {
            filters.forEach((f) => f.classList.remove("active"));
            btn.classList.add("active");
            renderGallery(btn.dataset.filter);
        });
    });
}

// ==========================================
// Lightbox
// ==========================================
function createLightbox() {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.id = "lightbox";

    const img = document.createElement("img");
    img.className = "lightbox__img";

    const close = document.createElement("button");
    close.className = "lightbox__close";
    close.innerHTML = "&times;";
    close.setAttribute("aria-label", "Cerrar");

    lightbox.appendChild(img);
    lightbox.appendChild(close);
    document.body.appendChild(lightbox);

    close.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLightbox();
    });
}

function openLightbox(src) {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const img = lightbox.querySelector(".lightbox__img");
    img.src = src;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
}

// ==========================================
// Testimonials Slider
// ==========================================
function initTestimonialsSlider() {
    const track = document.getElementById("testimonials-track");
    const dotsContainer = document.getElementById("testimonials-dots");
    if (!track || !dotsContainer) return;

    const slides = track.querySelectorAll(".testimonials__slide");
    const totalSlides = slides.length;
    let currentSlide = 0;
    let autoplayTimer;

    // Create dots
    dotsContainer.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("button");
        dot.className = "testimonials__dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    function goToSlide(index) {
        currentSlide = index;
        const slideWidth = slides[0].offsetWidth + 24;
        track.scrollTo({ left: slideWidth * index, behavior: "smooth" });
        updateDots();
        resetAutoplay();
    }

    function updateDots() {
        dotsContainer.querySelectorAll(".testimonials__dot").forEach((dot, i) => {
            dot.classList.toggle("active", i === currentSlide);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        goToSlide(currentSlide);
    }

    function resetAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = setInterval(nextSlide, 5000);
    }

    // Detect scroll position to update dots
    track.addEventListener("scroll", () => {
        const scrollLeft = track.scrollLeft;
        const slideWidth = slides[0].offsetWidth + 24; // gap
        const newSlide = Math.round(scrollLeft / slideWidth);
        if (newSlide !== currentSlide && newSlide >= 0 && newSlide < totalSlides) {
            currentSlide = newSlide;
            updateDots();
        }
    }, { passive: true });

    autoplayTimer = setInterval(nextSlide, 5000);
}

// ==========================================
// Newsletter
// ==========================================
function initNewsletter() {
    const form = document.getElementById("newsletter-form");
    const success = document.getElementById("newsletter-success");
    if (!form || !success) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        form.style.display = "none";
        success.classList.add("show");
    });
}

// ==========================================
// Instagram Feed
// ==========================================
function renderInstagramFeed() {
    const grid = document.getElementById("instagram-grid");
    if (!grid) return;

    grid.innerHTML = "";

    IG_IMAGES.forEach((filename) => {
        const item = document.createElement("a");
        item.className = "instagram-feed__item";
        item.href = "https://www.instagram.com/__millacuatro/";
        item.target = "_blank";
        item.rel = "noopener";

        const img = document.createElement("img");
        img.src = `assets/productos/${filename}`;
        img.alt = "MillaCuatro Instagram";
        img.loading = "lazy";

        const overlay = document.createElement("div");
        overlay.className = "instagram-feed__item-overlay";

        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "instagram-feed__icon");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "2");
        rect.setAttribute("y", "2");
        rect.setAttribute("width", "20");
        rect.setAttribute("height", "20");
        rect.setAttribute("rx", "5");
        rect.setAttribute("ry", "5");

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "12");
        circle.setAttribute("r", "5");

        const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle2.setAttribute("cx", "17.5");
        circle2.setAttribute("cy", "6.5");
        circle2.setAttribute("r", "1.5");

        icon.appendChild(rect);
        icon.appendChild(circle);
        icon.appendChild(circle2);

        overlay.appendChild(icon);
        item.appendChild(img);
        item.appendChild(overlay);
        grid.appendChild(item);
    });
}

// ==========================================
// Smooth scroll for anchor links
// ==========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const target = document.querySelector(anchor.getAttribute("href"));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
}

// ==========================================
// Init
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    createLightbox();
    renderGallery("all");
    initGalleryFilters();
    initScrollReveal();
    initHeader();
    initMobileMenu();
    initSmoothScroll();
    initCursor();
    initTestimonialsSlider();
    initNewsletter();
    renderInstagramFeed();
});
/* ========================================
   MillaCuatro - Main JS
   Gallery, animations, interactions, cart
   ======================================== */

// ==========================================
// Catálogo MillaCuatro
// ==========================================
// Los productos se cargan desde products.js

// ==========================================
// Carrito de compras
// ==========================================
let cart = [];

function loadCart() {
    try {
        const saved = localStorage.getItem("millacuatro_cart");
        if (saved) cart = JSON.parse(saved);
    } catch (e) {
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem("millacuatro_cart", JSON.stringify(cart));
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: product.id, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    showCartNotification();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((total, item) => {
        const product = PRODUCTS.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// ==========================================
// UI Carrito
// ==========================================
function renderCartItems() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cartCount = document.getElementById("cart-count");

    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart__empty">Tu carrito está vacío</p>';
    } else {
        cartItems.innerHTML = cart.map(item => {
            const product = PRODUCTS.find(p => p.id === item.id);
            if (!product) return "";
            return `
                <div class="cart__item">
                    <img src="${product.image}" alt="${product.name}" class="cart__item-img">
                    <div class="cart__item-info">
                        <h4 class="cart__item-name">${product.name}</h4>
                        <p class="cart__item-price">$${product.price.toLocaleString()}</p>
                        <div class="cart__item-controls">
                            <button class="cart__qty-btn" onclick="updateQuantity(${product.id}, -1)">-</button>
                            <span class="cart__qty">${item.quantity}</span>
                            <button class="cart__qty-btn" onclick="updateQuantity(${product.id}, 1)">+</button>
                            <button class="cart__remove" onclick="removeFromCart(${product.id})">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    if (cartTotal) {
        cartTotal.textContent = "$" + getCartTotal().toLocaleString();
    }

    if (cartCount) {
        cartCount.textContent = getCartCount();
    }
}

function updateCartUI() {
    renderCartItems();
}

function toggleCart() {
    const cartSidebar = document.getElementById("cart-sidebar");
    const cartOverlay = document.getElementById("cart-overlay");
    if (!cartSidebar) return;

    cartSidebar.classList.toggle("active");
    if (cartOverlay) cartOverlay.classList.toggle("active");
    document.body.style.overflow = cartSidebar.classList.contains("active") ? "hidden" : "";
}

function closeCart() {
    const cartSidebar = document.getElementById("cart-sidebar");
    const cartOverlay = document.getElementById("cart-overlay");
    if (cartSidebar) cartSidebar.classList.remove("active");
    if (cartOverlay) cartOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

function showCartNotification() {
    const cartBtn = document.getElementById("cart-btn");
    if (!cartBtn) return;
    cartBtn.classList.add("cart--added");
    setTimeout(() => cartBtn.classList.remove("cart--added"), 300);
}

// ==========================================
// Checkout WhatsApp
// ==========================================
function checkoutWhatsApp() {
    if (cart.length === 0) return;

    let message = "Hola! Quiero hacer el siguiente pedido:%0A%0A";
    cart.forEach(item => {
        const product = PRODUCTS.find(p => p.id === item.id);
        if (product) {
            message += `- ${product.name} x${item.quantity}: $${(product.price * item.quantity).toLocaleString()}%0A`;
        }
    });
    message += `%0A*Total: $${getCartTotal().toLocaleString()}*%0A%0A`;
    message += "Medio de pago: ";

    const payment = document.querySelector('input[name="payment"]:checked');
    if (payment) {
        message += payment.value === "transfer" ? "Transferencia bancaria" : "Mercado Pago";
    } else {
        message += "A coordinar";
    }

    const phone = "5492233396959";
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

// ==========================================
// Preloader
// ==========================================
function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    let loaded = false;

    function hidePreloader() {
        if (loaded) return;
        loaded = true;
        preloader.classList.add("hidden");
        setTimeout(() => {
            preloader.style.display = "none";
        }, 600);
    }

    // Ocultar siempre después de 1.5s máximo, sin depender del video
    setTimeout(hidePreloader, 1500);
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
// Gallery - Catálogo completo
// ==========================================
let currentFilter = "all";

function renderGallery(filter) {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;

    currentFilter = filter || "all";
    grid.innerHTML = "";

    const filtered = filter === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === filter);

    filtered.forEach((product, index) => {
        const item = document.createElement("div");
        item.className = "catalog__item anim-reveal";
        item.dataset.category = product.category;
        item.dataset.delay = (index % 4) * 80;

        // Imagen
        const imageWrap = document.createElement("div");
        imageWrap.className = "catalog__item-image";

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;
        img.loading = "lazy";

        const badge = document.createElement("span");
        badge.className = "catalog__item-badge";
        badge.textContent = product.category === "activewear" ? "Activewear" : product.category === "bikini" ? "Bikini" : "Accesorio";

        imageWrap.appendChild(img);
        imageWrap.appendChild(badge);
        imageWrap.addEventListener("click", () => openLightbox(product.image));

        // Contenido
        const content = document.createElement("div");
        content.className = "catalog__item-content";

        const category = document.createElement("p");
        category.className = "catalog__item-category";
        category.textContent = product.category === "activewear" ? "Activewear" : product.category === "bikini" ? "Bikini" : "Accesorio";

        const title = document.createElement("h3");
        title.className = "catalog__item-title";
        title.textContent = product.name;

        const price = document.createElement("p");
        price.className = "catalog__item-price";
        price.textContent = "$" + product.price.toLocaleString();

        const addBtn = document.createElement("button");
        addBtn.className = "catalog__add-btn";
        addBtn.textContent = "Agregar al carrito";
        addBtn.onclick = () => addToCart(product.id);

        content.appendChild(category);
        content.appendChild(title);
        content.appendChild(price);
        content.appendChild(addBtn);

        item.appendChild(imageWrap);
        item.appendChild(content);

        grid.appendChild(item);
    });

    initScrollReveal();
}

function initGalleryFilters() {
    const filters = document.querySelectorAll(".catalog__filter");
    filters.forEach((btn) => {
        btn.addEventListener("click", () => {
            filters.forEach((f) => f.classList.remove("active"));
            btn.classList.add("active");
            renderGallery(btn.dataset.filter);
        });
    });

    const filtersContainer = document.querySelector(".catalog__filters");
    if (filtersContainer && !filtersContainer.querySelector('[data-filter="accesorio"]')) {
        const accesorioBtn = document.createElement("button");
        accesorioBtn.className = "catalog__filter";
        accesorioBtn.dataset.filter = "accesorio";
        accesorioBtn.textContent = "Accesorios";
        accesorioBtn.addEventListener("click", () => {
            filters.forEach((f) => f.classList.remove("active"));
            accesorioBtn.classList.add("active");
            renderGallery("accesorio");
        });
        filtersContainer.appendChild(accesorioBtn);
    }
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

    track.addEventListener("scroll", () => {
        const scrollLeft = track.scrollLeft;
        const slideWidth = slides[0].offsetWidth + 24;
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

    const images = PRODUCTS.slice(0, 6).map(p => p.image.replace("https://d22fxaf9t8d39k.cloudfront.net/", ""));
    const fallbackImages = [
        "producto-01.jpg", "producto-05.jpg", "producto-10.jpg",
        "producto-15.jpg", "producto-20.jpg", "producto-25.jpg"
    ];

    const displayImages = images.length >= 6 ? images : fallbackImages;

    displayImages.forEach((filename) => {
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
// Inicialización del carrito en el DOM
// ==========================================
function injectCartHTML() {
    const header = document.querySelector(".header__inner");
    if (!header || document.getElementById("cart-btn")) return;

    const cartBtn = document.createElement("button");
    cartBtn.id = "cart-btn";
    cartBtn.className = "header__cart-btn";
    cartBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="header__cart-count" id="cart-count">0</span>
    `;
    cartBtn.onclick = toggleCart;
    header.appendChild(cartBtn);

    const cartSidebar = document.createElement("div");
    cartSidebar.id = "cart-sidebar";
    cartSidebar.className = "cart";
    cartSidebar.innerHTML = `
        <div class="cart__header">
            <h3 class="cart__title">Tu Carrito</h3>
            <button class="cart__close" onclick="closeCart()">&times;</button>
        </div>
        <div class="cart__items" id="cart-items"></div>
        <div class="cart__footer">
            <div class="cart__total">
                <span>Total:</span>
                <span id="cart-total">$0</span>
            </div>
            <div class="cart__payment">
                <label class="cart__payment-label">
                    <input type="radio" name="payment" value="transfer" checked> Transferencia
                </label>
                <label class="cart__payment-label">
                    <input type="radio" name="payment" value="mp"> Mercado Pago
                </label>
            </div>
            <button class="btn btn--primary btn--full" onclick="checkoutWhatsApp()">Confirmar pedido por WhatsApp</button>
        </div>
    `;
    document.body.appendChild(cartSidebar);

    const cartOverlay = document.createElement("div");
    cartOverlay.id = "cart-overlay";
    cartOverlay.className = "cart__overlay";
    cartOverlay.onclick = closeCart;
    document.body.appendChild(cartOverlay);
}

// ==========================================
// Init
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    injectCartHTML();
    updateCartUI();
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
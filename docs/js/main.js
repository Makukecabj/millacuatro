/* ========================================
   MillaCuatro - Main JS
   Gallery, animations, interactions, cart
   ======================================== */

// ==========================================
// Catálogo MillaCuatro
// ==========================================
// Se carga de forma asíncrona desde JSON local o Google Sheets (ver js/catalog.js).
let catalog = [];
let catalogSource = "local";
let currentModalProduct = null;
let selectedSize = null;
let selectedColor = null;

const moneyFormatter = new Intl.NumberFormat(STORE_CONFIG.locale, {
    style: "currency",
    currency: STORE_CONFIG.currency,
    maximumFractionDigits: 0
});

/** $ 43.000 en vez de 43000. */
function formatMoney(value) {
    return moneyFormatter.format(Number(value) || 0);
}

/** Acepta rutas locales, nombres de archivo y URLs externas (compatibilidad con la planilla vieja). */
function resolveImageSrc(image) {
    if (!image) return "assets/productos/producto-01.jpg";
    if (/^(https?:)?\/\//.test(image) || image.startsWith("data:")) return image;
    return image.startsWith("assets/") ? image : `assets/productos/${image}`;
}

/** Busca un producto del catálogo por id (siempre como string). */
function findProduct(productId) {
    return catalog.find((product) => product.id === String(productId));
}

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
    normalizeCart();
}

/** Limpia el carrito guardado: descarta productos que ya no están y unifica variantes. */
function normalizeCart() {
    if (!Array.isArray(cart)) cart = [];
    const seen = new Map();

    cart.forEach((item) => {
        if (!item || !item.id) return;
        const size = item.size === "Sin talle" ? "" : (item.size || "");
        const color = item.color === "Sin color" ? "" : (item.color || "");
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        const key = `${item.id}||${size}||${color}`;

        if (seen.has(key)) {
            seen.get(key).quantity += quantity;
        } else {
            seen.set(key, { id: String(item.id), quantity, size, color });
        }
    });

    // Si el catálogo ya cargó, ignorar productos eliminados de la planilla/JSON.
    cart = Array.from(seen.values()).filter((item) => !catalog.length || findProduct(item.id));
}

function saveCart() {
    try {
        localStorage.setItem("millacuatro_cart", JSON.stringify(cart));
    } catch (e) {
        console.warn("[MillaCuatro] No se pudo guardar el carrito en localStorage.", e);
    }
}

function addToCart(productId, size, color) {
    const product = findProduct(productId);
    if (!product) return;

    const sizeLabel = size || "";
    const colorLabel = color || "";
    const existing = cart.find((item) =>
        item.id === product.id && item.size === sizeLabel && item.color === colorLabel
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: product.id, quantity: 1, size: sizeLabel, color: colorLabel });
    }
    saveCart();
    updateCartUI();
    showCartNotification();
    closeModal();
}

function removeFromCart(productId, size, color) {
    cart = cart.filter((item) => !(item.id === String(productId) && item.size === (size || "") && item.color === (color || "")));
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, delta, size, color) {
    const item = cart.find((entry) =>
        entry.id === String(productId) && entry.size === (size || "") && entry.color === (color || "")
    );
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId, size, color);
        return;
    }
    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((total, item) => {
        const product = findProduct(item.id);
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
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.className = "cart__empty";
        empty.textContent = "Tu carrito está vacío";
        cartItems.appendChild(empty);
    } else {
        cart.forEach((item, index) => {
            const product = findProduct(item.id);
            if (!product) return;

            const row = document.createElement("div");
            row.className = "cart__item";

            const image = document.createElement("img");
            image.className = "cart__item-img";
            image.src = resolveImageSrc(product.image);
            image.alt = product.name;

            const info = document.createElement("div");
            info.className = "cart__item-info";

            const name = document.createElement("h4");
            name.className = "cart__item-name";
            name.textContent = product.name;

            const price = document.createElement("p");
            price.className = "cart__item-price";
            price.textContent = formatMoney(product.price);

            info.appendChild(name);
            info.appendChild(price);

            const variantText = [item.size, item.color].filter(Boolean).join(" | ");
            if (variantText) {
                const variant = document.createElement("p");
                variant.className = "cart__item-variant";
                variant.textContent = variantText;
                info.appendChild(variant);
            }

            const controls = document.createElement("div");
            controls.className = "cart__item-controls";

            const makeButton = (action, className, label) => {
                const button = document.createElement("button");
                button.className = className;
                button.type = "button";
                button.dataset.action = action;
                button.dataset.index = index;
                button.textContent = label;
                return button;
            };

            const quantity = document.createElement("span");
            quantity.className = "cart__qty";
            quantity.textContent = item.quantity;

            controls.appendChild(makeButton("decrease", "cart__qty-btn", "−"));
            controls.appendChild(quantity);
            controls.appendChild(makeButton("increase", "cart__qty-btn", "+"));
            controls.appendChild(makeButton("remove", "cart__remove", "Eliminar"));
            info.appendChild(controls);

            row.appendChild(image);
            row.appendChild(info);
            cartItems.appendChild(row);
        });
    }

    if (cartTotal) cartTotal.textContent = formatMoney(getCartTotal());
    if (cartCount) cartCount.textContent = getCartCount();
}

/** Event delegation para los controles del carrito (evita onclick inline). */
function handleCartItemAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const item = cart[Number(button.dataset.index)];
    if (!item) return;

    if (button.dataset.action === "increase") updateQuantity(item.id, 1, item.size, item.color);
    if (button.dataset.action === "decrease") updateQuantity(item.id, -1, item.size, item.color);
    if (button.dataset.action === "remove") removeFromCart(item.id, item.size, item.color);
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
/** Arma el mensaje del pedido con el detalle exacto del carrito. */
function buildOrderMessage() {
    const lines = ["¡Hola MillaCuatro! Quiero hacer el siguiente pedido:", ""];

    cart.forEach((item, index) => {
        const product = findProduct(item.id);
        if (!product) return;
        const variantParts = [];
        if (item.size) variantParts.push(`Talle ${item.size}`);
        if (item.color) variantParts.push(`Color ${item.color}`);
        const variantText = variantParts.join(" | ");
        lines.push(`${index + 1}. ${product.name}${variantText ? ` — ${variantText}` : ""}`);
        lines.push(`   ${formatMoney(product.price)} x ${item.quantity} = ${formatMoney(product.price * item.quantity)}`);
        lines.push("");
    });

    lines.push(`Total: ${formatMoney(getCartTotal())}`);
    const payment = document.querySelector('input[name="payment"]:checked');
    const paymentText = payment ? (payment.value === "transfer" ? "Transferencia bancaria" : "Mercado Pago") : "A coordinar";
    lines.push(`Pago: ${paymentText}`);
    lines.push("Envío a todo el país: a coordinar");

    return lines.join("\n");
}

function checkoutWhatsApp() {
    if (cart.length === 0) return;
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(STORE_CONFIG.whatsappPhone)}&text=${encodeURIComponent(buildOrderMessage())}`;
    window.open(url, "_blank", "noopener");
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

/** Etiqueta visible según la categoría normalizada del catálogo. */
function categoryLabel(category) {
    if (category === "bikini") return "Bikini";
    if (category === "accesorio") return "Accesorio";
    return "Activewear";
}

function renderGallery(filter) {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;

    currentFilter = filter || "all";
    grid.innerHTML = "";

    const filtered = currentFilter === "all"
        ? catalog
        : catalog.filter((product) => product.category === currentFilter);

    if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "catalog__empty";
        empty.textContent = "No hay productos en esta categoria por ahora.";
        grid.appendChild(empty);
        return;
    }

    filtered.forEach((product, index) => {
        const item = document.createElement("div");
        item.className = "catalog__item anim-reveal";
        item.dataset.category = product.category;
        item.dataset.delay = (index % 4) * 80;

        // Imagen
        const imageWrap = document.createElement("div");
        imageWrap.className = "catalog__item-image";

        const img = document.createElement("img");
        img.src = resolveImageSrc(product.image);
        img.alt = product.name;
        img.loading = "lazy";
        img.onerror = () => {
            if (img.dataset.fallback) return;
            img.dataset.fallback = "true";
            img.src = "assets/productos/producto-01.jpg";
        };

        const badge = document.createElement("span");
        badge.className = "catalog__item-badge";
        badge.textContent = categoryLabel(product.category);

        imageWrap.appendChild(img);
        imageWrap.appendChild(badge);
        imageWrap.addEventListener("click", () => openLightbox(img.src));

        // Contenido
        const content = document.createElement("div");
        content.className = "catalog__item-content";

        const category = document.createElement("p");
        category.className = "catalog__item-category";
        category.textContent = categoryLabel(product.category);

        const title = document.createElement("h3");
        title.className = "catalog__item-title";
        title.textContent = product.name;

        const price = document.createElement("p");
        price.className = "catalog__item-price";
        price.textContent = formatMoney(product.price);

        const addBtn = document.createElement("button");
        addBtn.className = "catalog__add-btn";
        addBtn.type = "button";
        addBtn.textContent = "Agregar al carrito";
        addBtn.addEventListener("click", () => openModal(product.id));

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
// Modal producto
// ==========================================
/** Muestra u oculta un bloque completo del modal (etiqueta + chips). */
function setModalFieldVisible(field, visible) {
    [`${field}-label`, field].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.hidden = !visible;
    });
}

function openModal(productId) {
    const product = findProduct(productId);
    if (!product) return;
    currentModalProduct = product;
    selectedSize = null;
    selectedColor = null;

    const image = document.getElementById("modal-img");
    image.src = resolveImageSrc(product.image);
    image.alt = product.name;
    image.onerror = () => {
        if (image.dataset.fallback) return;
        image.dataset.fallback = "true";
        image.src = "assets/productos/producto-01.jpg";
    };

    document.getElementById("modal-category").textContent = categoryLabel(product.category);
    document.getElementById("modal-title").textContent = product.name;
    document.getElementById("modal-price").textContent = formatMoney(product.price);

    const description = document.getElementById("modal-description");
    description.textContent = product.description || "";
    description.hidden = !product.description;

    const hint = document.getElementById("modal-hint");
    if (hint) hint.textContent = "";

    const sizesContainer = document.getElementById("modal-sizes");
    sizesContainer.innerHTML = "";
    (product.sizes || []).forEach((size) => {
        const btn = document.createElement("button");
        btn.className = "modal__chip";
        btn.type = "button";
        btn.textContent = size;
        btn.addEventListener("click", () => selectSize(size, btn));
        sizesContainer.appendChild(btn);
    });
    setModalFieldVisible("modal-sizes", (product.sizes || []).length > 0);

    const colorsContainer = document.getElementById("modal-colors");
    colorsContainer.innerHTML = "";
    (product.colors || []).forEach((color) => {
        const btn = document.createElement("button");
        btn.className = "modal__chip";
        btn.type = "button";
        btn.textContent = color;
        btn.addEventListener("click", () => selectColor(color, btn));
        colorsContainer.appendChild(btn);
    });
    setModalFieldVisible("modal-colors", (product.colors || []).length > 0);

    document.getElementById("product-modal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("product-modal").classList.remove("active");
    document.body.style.overflow = "";
    currentModalProduct = null;
    selectedSize = null;
    selectedColor = null;
}

function selectSize(size, btn) {
    selectedSize = size;
    btn.parentElement.querySelectorAll(".modal__chip").forEach((s) => s.classList.remove("selected"));
    btn.classList.add("selected");
    const hint = document.getElementById("modal-hint");
    if (hint) hint.textContent = "";
}

function selectColor(color, btn) {
    selectedColor = color;
    btn.parentElement.querySelectorAll(".modal__chip").forEach((s) => s.classList.remove("selected"));
    btn.classList.add("selected");
}

function confirmAddToCart() {
    if (!currentModalProduct) return;
    const hint = document.getElementById("modal-hint");

    if ((currentModalProduct.sizes || []).length && !selectedSize) {
        if (hint) hint.textContent = "Elegí un talle para continuar.";
        return;
    }

    const color = selectedColor || (currentModalProduct.colors || [])[0] || "";
    addToCart(currentModalProduct.id, selectedSize, color);
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

    const images = catalog.slice(0, 6).map((product) => resolveImageSrc(product.image));
    const fallbackImages = [
        "assets/productos/producto-01.jpg", "assets/productos/producto-05.jpg",
        "assets/productos/producto-10.jpg", "assets/productos/producto-15.jpg",
        "assets/productos/producto-20.jpg", "assets/productos/producto-25.jpg"
    ];

    const displayImages = images.length >= 6 ? images : fallbackImages;

    displayImages.forEach((filename) => {
        const item = document.createElement("a");
        item.className = "instagram-feed__item";
        item.href = "https://www.instagram.com/__millacuatro/";
        item.target = "_blank";
        item.rel = "noopener";

        const img = document.createElement("img");
        img.src = filename;
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
    let cartBtn = document.getElementById("cart-btn");

    // El botón ya viene en el HTML; solo lo enlazamos una vez.
    if (!cartBtn && header) {
        cartBtn = document.createElement("button");
        cartBtn.id = "cart-btn";
        cartBtn.className = "header__cart-btn";
        cartBtn.setAttribute("aria-label", "Carrito");
        cartBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span class="header__cart-count" id="cart-count">0</span>
        `;
        header.appendChild(cartBtn);
    }
    if (cartBtn && !cartBtn.dataset.bound) {
        cartBtn.addEventListener("click", toggleCart);
        cartBtn.dataset.bound = "true";
    }

    // Panel lateral y overlay: se crean solo si no existen.
    if (!document.getElementById("cart-sidebar")) {
        const cartSidebar = document.createElement("div");
        cartSidebar.id = "cart-sidebar";
        cartSidebar.className = "cart";
        cartSidebar.innerHTML = `
            <div class="cart__header">
                <h3 class="cart__title">Tu Carrito</h3>
                <button class="cart__close" id="cart-close" type="button" aria-label="Cerrar carrito">&times;</button>
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
                <button class="btn btn--primary btn--full" id="cart-checkout" type="button">Enviar pedido por WhatsApp</button>
            </div>
        `;
        document.body.appendChild(cartSidebar);
    }

    if (!document.getElementById("cart-overlay")) {
        const cartOverlay = document.createElement("div");
        cartOverlay.id = "cart-overlay";
        cartOverlay.className = "cart__overlay";
        document.body.appendChild(cartOverlay);
    }

    // Eventos delegados / enlazados una sola vez.
    const cartItems = document.getElementById("cart-items");
    if (cartItems && !cartItems.dataset.bound) {
        cartItems.addEventListener("click", handleCartItemAction);
        cartItems.dataset.bound = "true";
    }

    const closeBtn = document.getElementById("cart-close");
    if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.addEventListener("click", closeCart);
        closeBtn.dataset.bound = "true";
    }

    const checkoutBtn = document.getElementById("cart-checkout");
    if (checkoutBtn && !checkoutBtn.dataset.bound) {
        checkoutBtn.addEventListener("click", checkoutWhatsApp);
        checkoutBtn.dataset.bound = "true";
    }

    const overlay = document.getElementById("cart-overlay");
    if (overlay && !overlay.dataset.bound) {
        overlay.addEventListener("click", closeCart);
        overlay.dataset.bound = "true";
    }
}

// ==========================================
// Modal events
// ==========================================
function initModalEvents() {
    const closeBtn = document.getElementById("modal-close");
    const overlay = document.getElementById("modal-overlay");
    const addBtn = document.getElementById("modal-add-btn");

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (overlay) overlay.addEventListener("click", closeModal);
    if (addBtn) addBtn.addEventListener("click", confirmAddToCart);

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const productModal = document.getElementById("product-modal");
        if (productModal && productModal.classList.contains("active")) {
            closeModal();
        } else {
            closeCart();
        }
    });
}

// ==========================================
// Recarga del catálogo (inicial y tiempo real)
// ==========================================
async function reloadCatalog() {
    const { products, source } = await fetchCatalog();
    catalog = products;
    catalogSource = source;
    console.info(`[MillaCuatro] Catálogo cargado desde ${source} (${catalog.length} productos).`);

    normalizeCart(); // descarta productos que ya no están en la fuente actual
    saveCart();
    renderGallery(currentFilter);
    renderInstagramFeed();
    updateCartUI();
}

// ==========================================
// Init
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // realtime.js dispara este evento cuando cambia la tabla en Supabase.
    window.addEventListener("millacuatro:catalog-changed", () => {
        reloadCatalog().catch((error) => console.warn("[MillaCuatro] No se pudo refrescar el catálogo.", error));
    });

    loadCart();
    injectCartHTML();
    updateCartUI();

    // El resto de la interfaz se inicializa mientras llega el catálogo.
    initPreloader();
    createLightbox();
    initGalleryFilters();
    initScrollReveal();
    initHeader();
    initMobileMenu();
    initSmoothScroll();
    initCursor();
    initTestimonialsSlider();
    initNewsletter();
    initModalEvents();

    const grid = document.getElementById("catalog-grid");
    if (grid) {
        const loading = document.createElement("p");
        loading.className = "catalog__loading";
        loading.textContent = "Cargando coleccion…";
        grid.appendChild(loading);
    }

    await reloadCatalog();
});

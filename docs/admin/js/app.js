/* ========================================
   MillaCuatro - Panel de administración
   ========================================
   Supabase Auth + Postgres (CRUD) + Storage (fotos) + Realtime.
   La anon key es pública: la seguridad la dan las policies RLS
   definidas en supabase/schema.sql.
   ======================================== */

const config = window.STORE_CONFIG;
const $ = (id) => document.getElementById(id);

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "ÚNICO"];
const COLOR_PRESETS = ["Negro", "Blanco", "Rosa", "Celeste", "Gris", "Azul", "Violeta", "Beige", "Print"];

let supabase = null;
let currentUser = null;
let currentProduct = null;      // producto que se está editando
let currentCache = [];          // última lista cargada (para editar/borrar sin reconsultar)
let pendingDeleteId = null;     // producto confirmado para borrar
let selectedSizes = new Set();
let selectedColors = new Set();
let objectUrls = [];            // previews a liberar

const views = {
    setup: $("setup-panel"),
    login: $("login-view"),
    admin: $("admin-view")
};

// ----------------------------------------
// Utilidades
// ----------------------------------------
function showView(name) {
    Object.values(views).forEach((view) => { view.hidden = true; });
    if (views[name]) views[name].hidden = false;
    $("logout-btn").hidden = name !== "admin";
}

function setMessage(text) {
    $("admin-message").textContent = text || "";
}

function setError(id, text) {
    const element = $(id);
    if (element) element.textContent = text || "";
}

function formatMoney(value) {
    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.currency,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

/** Las fotos antiguas son rutas relativas a la raíz; desde /admin hay que subir un nivel. */
function resolveImageSrc(image) {
    if (!image) return "/assets/productos/producto-01.jpg";
    if (/^(https?:)?\/\//.test(image) || image.startsWith("data:") || image.startsWith("blob:") || image.startsWith("/")) return image;
    return `../${image.startsWith("assets/") ? image : `assets/productos/${image}`}`;
}

function categoryLabel(category) {
    if (category === "bikini") return "Bikini";
    if (category === "accesorio") return "Accesorio";
    return "Activewear";
}

function newId() {
    return (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** URL pública de una foto alojada en nuestro bucket de Storage. */
function storagePublicUrl(path) {
    return `${String(config.supabase.url).replace(/\/$/, "")}/storage/v1/object/public/${config.supabase.storageBucket}/${path}`;
}

/** Extrae la ruta interna si la imagen pertenece a nuestro bucket (para borrarla después). */
function storagePathFromUrl(url) {
    const prefix = `/storage/v1/object/public/${config.supabase.storageBucket}/`;
    const index = String(url || "").indexOf(prefix);
    return index === -1 ? null : decodeURIComponent(url.slice(index + prefix.length).split("?")[0]);
}

// ----------------------------------------
// Autenticación
// ----------------------------------------
async function onAuthenticated(user) {
    const allowed = config.supabase.adminEmail;
    if (allowed && String(user.email || "").toLowerCase() !== String(allowed).toLowerCase()) {
        await supabase.auth.signOut();
        setError("login-error", `Este usuario no tiene acceso. Usá el email ${allowed}.`);
        showView("login");
        return;
    }

    currentUser = user;
    $("admin-email-label").textContent = `Sesión activa: ${user.email}`;
    setError("login-error", "");
    showView("admin");
    await loadProducts();
    subscribeRealtime();
}

function bindAuthEvents() {
    $("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        setError("login-error", "");
        const email = $("login-email").value.trim();
        const password = $("login-password").value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError("login-error", "No se pudo ingresar. Revisá el email y la contraseña.");
            return;
        }
        await onAuthenticated(data.user);
    });

    $("logout-btn").addEventListener("click", async () => {
        await supabase.auth.signOut();
        currentUser = null;
        setMessage("");
        showView("login");
    });
}

// ----------------------------------------
// Listado
// ----------------------------------------
async function loadProducts() {
    if (!currentUser) return;
    const { data, error } = await supabase
        .from(config.supabase.productsTable)
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        setMessage("No se pudo cargar la lista de productos: " + error.message);
        return;
    }
    currentCache = data || [];
    renderProducts(currentCache);
}

function renderProducts(products) {
    const list = $("product-list");
    list.innerHTML = "";

    if (!products.length) {
        const empty = document.createElement("p");
        empty.className = "admin__empty";
        empty.textContent = "Todavía no hay productos. Tocá «Crear nuevo producto» para agregar el primero.";
        list.appendChild(empty);
        return;
    }

    products.forEach((product) => {
        const row = document.createElement("div");
        row.className = "admin__row";

        const image = document.createElement("img");
        image.className = "admin__row-img";
        image.src = resolveImageSrc(product.image);
        image.alt = product.name;

        const info = document.createElement("div");
        info.className = "admin__row-info";

        const name = document.createElement("p");
        name.className = "admin__row-name";
        name.textContent = product.name;

        const meta = document.createElement("p");
        meta.className = "admin__row-meta";
        const sizes = (product.sizes || []).join(", ") || "sin talles";
        const colors = (product.colors || []).join(", ") || "sin colores";
        meta.textContent = `${categoryLabel(product.category)} · Talles: ${sizes} · Colores: ${colors}`;

        info.appendChild(name);
        info.appendChild(meta);

        const price = document.createElement("span");
        price.className = "admin__row-price";
        price.textContent = formatMoney(product.price);

        const actions = document.createElement("div");
        actions.className = "admin__row-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "btn btn--edit btn--small";
        edit.textContent = "Editar";
        edit.title = "Editar producto";
        edit.dataset.action = "edit";
        edit.dataset.id = product.id;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "btn btn--danger btn--small";
        remove.textContent = "Eliminar";
        remove.dataset.action = "delete";
        remove.dataset.id = product.id;
        remove.dataset.name = product.name;

        actions.appendChild(edit);
        actions.appendChild(remove);
        row.appendChild(image);
        row.appendChild(info);
        row.appendChild(price);
        row.appendChild(actions);
        list.appendChild(row);
    });
}

function bindListEvents() {
    $("product-list").addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        if (button.dataset.action === "edit") {
            const product = currentCache.find((item) => item.id === button.dataset.id);
            if (product) openProductModal(product);
        }

        if (button.dataset.action === "delete") {
            pendingDeleteId = button.dataset.id;
            $("confirm-name").textContent = button.dataset.name;
            $("confirm-modal").hidden = false;
        }
    });
}

// ----------------------------------------
// Formulario crear / editar
// ----------------------------------------
function renderOptionChips(kind, presets, selected) {
    const container = $(`${kind}-options`);
    container.innerHTML = "";
    const values = Array.from(new Set([...presets, ...selected]));

    values.forEach((value) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "admin__chip" + (selected.has(value) ? " selected" : "");
        chip.textContent = value;
        chip.addEventListener("click", () => {
            if (selected.has(value)) selected.delete(value);
            else selected.add(value);
            renderOptionChips(kind, presets, selected);
        });
        container.appendChild(chip);
    });
}

function setPreview(url) {
    const preview = $("field-preview");
    if (!url) {
        preview.hidden = true;
        preview.removeAttribute("src");
        return;
    }
    preview.src = resolveImageSrc(url);
    preview.hidden = false;
}

function openProductModal(product = null) {
    currentProduct = product;
    setError("form-error", "");
    $("form-modal-title").textContent = product ? "Editar producto" : "Nuevo producto";
    $("save-btn").textContent = product ? "Guardar cambios" : "Crear producto";

    $("field-name").value = product?.name || "";
    $("field-price").value = product?.price ?? "";
    $("field-description").value = product?.description || "";
    $("field-category").value = product?.category || "activewear";
    $("field-file").value = "";
    $("field-image-url").value = product?.image || "";

    selectedSizes = new Set(product?.sizes || []);
    selectedColors = new Set(product?.colors || []);
    renderOptionChips("sizes", SIZE_PRESETS, selectedSizes);
    renderOptionChips("colors", COLOR_PRESETS, selectedColors);

    setPreview(product?.image || "");
    $("product-modal").hidden = false;
}

function closeProductModal() {
    $("product-modal").hidden = true;
    currentProduct = null;
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
}

async function uploadImage(file) {
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${newId()}.${extension}`;
    const { error } = await supabase.storage
        .from(config.supabase.storageBucket)
        .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw new Error("No se pudo subir la foto: " + error.message);
    return storagePublicUrl(path);
}

async function saveProduct(event) {
    event.preventDefault();
    setError("form-error", "");

    const name = $("field-name").value.trim();
    const price = Number($("field-price").value);
    if (!name) return setError("form-error", "El nombre es obligatorio.");
    if (!Number.isFinite(price) || price <= 0) return setError("form-error", "Ingresá un precio válido.");

    let image = $("field-image-url").value.trim();
    const file = $("field-file").files[0];

    try {
        if (file) image = await uploadImage(file);
        if (!image) image = "/assets/productos/producto-01.jpg";

        const payload = {
            name,
            price,
            description: $("field-description").value.trim(),
            category: $("field-category").value,
            image,
            sizes: Array.from(selectedSizes),
            colors: Array.from(selectedColors)
        };

        let result;
        if (currentProduct) {
            result = await supabase
                .from(config.supabase.productsTable)
                .update(payload)
                .eq("id", currentProduct.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from(config.supabase.productsTable)
                .insert([{ id: newId(), ...payload }])
                .select()
                .single();
        }

        if (result.error) throw result.error;

        // Si se reemplazó la foto y la vieja estaba en nuestro Storage, la borramos.
        if (currentProduct && file) {
            const oldPath = storagePathFromUrl(currentProduct.image);
            if (oldPath) await supabase.storage.from(config.supabase.storageBucket).remove([oldPath]);
        }

        closeProductModal();
        setMessage("Producto guardado. La tienda ya se actualizó.");
        await loadProducts();
    } catch (error) {
        setError("form-error", error.message || "No se pudo guardar el producto.");
    }
}

function bindFormEvents() {
    $("new-product-btn").addEventListener("click", () => openProductModal());
    $("product-form").addEventListener("submit", saveProduct);

    $("field-file").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        setPreview(url);
    });

    $("field-image-url").addEventListener("input", (event) => {
        if (!$("field-file").files.length) setPreview(event.target.value.trim());
    });

    document.querySelectorAll("[data-add-option]").forEach((button) => {
        button.addEventListener("click", () => {
            const kind = button.dataset.addOption;
            const input = $(`${kind}-custom`);
            const value = input.value.trim();
            if (!value) return;
            if (kind === "sizes") selectedSizes.add(value);
            else selectedColors.add(value);
            input.value = "";
            renderOptionChips(kind, kind === "sizes" ? SIZE_PRESETS : COLOR_PRESETS,
                kind === "sizes" ? selectedSizes : selectedColors);
        });
    });

    document.querySelectorAll("[data-close-modal]").forEach((element) => {
        element.addEventListener("click", closeProductModal);
    });

    document.querySelector("#product-list").addEventListener("click", () => setMessage(""));
}

// ----------------------------------------
// Eliminar
// ----------------------------------------
function bindDeleteEvents() {
    document.querySelectorAll("[data-close-confirm]").forEach((element) => {
        element.addEventListener("click", () => {
            $("confirm-modal").hidden = true;
            pendingDeleteId = null;
        });
    });

    $("confirm-delete-btn").addEventListener("click", async () => {
        if (!pendingDeleteId) return;
        const product = currentCache.find((item) => item.id === pendingDeleteId);

        const { error } = await supabase
            .from(config.supabase.productsTable)
            .delete()
            .eq("id", pendingDeleteId);

        if (error) {
            setMessage("No se pudo eliminar el producto: " + error.message);
            return;
        }

        if (product) {
            const oldPath = storagePathFromUrl(product.image);
            if (oldPath) await supabase.storage.from(config.supabase.storageBucket).remove([oldPath]);
        }

        $("confirm-modal").hidden = true;
        pendingDeleteId = null;
        setMessage("Producto eliminado.");
        await loadProducts();
    });
}

// ----------------------------------------
// Tiempo real dentro del panel
// ----------------------------------------
function subscribeRealtime() {
    supabase
        .channel("millacuatro-admin")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: config.supabase.productsTable },
            () => loadProducts()
        )
        .subscribe();
}

// ----------------------------------------
// Init
// ----------------------------------------
async function init() {
    if (!config || !config.supabase || !config.supabase.url || !config.supabase.anonKey) {
        showView("setup");
        return;
    }

    try {
        // Import dinámico: si el CDN no responde, mostramos un aviso en vez de una página vacía.
        const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
        supabase = createClient(config.supabase.url, config.supabase.anonKey);
    } catch (error) {
        console.error("[MillaCuatro Admin] No se pudo cargar Supabase.", error);
        $("setup-panel").querySelector(".admin__subtitle").textContent =
            "No se pudo cargar la librería de Supabase desde el CDN. Revisá tu conexión e intentá de nuevo.";
        showView("setup");
        return;
    }
    bindAuthEvents();
    bindListEvents();
    bindFormEvents();
    bindDeleteEvents();

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!$("confirm-modal").hidden) {
            $("confirm-modal").hidden = true;
            pendingDeleteId = null;
        }
        else if (!$("product-modal").hidden) closeProductModal();
    });

    supabase.auth.getSession().then(({ data }) => {
        if (data.session) onAuthenticated(data.session.user);
        else showView("login");
    });
}

init();

/* ========================================
   MillaCuatro - Carga del catálogo
   ========================================
   Fuentes, en orden de prioridad:
   1) Google Sheets publicado como CSV (STORE_CONFIG.catalogUrl)
   2) data/products.json (archivo local editable en GitHub)
   3) PRODUCTS de products.js (respaldo para abrir sin servidor)

   Todas las fuentes se normalizan al mismo esquema:
   { id, name, price, description, category, image, sizes, colors }
   ======================================== */

// Nombres de columnas aceptados (se comparan sin acentos, espacios ni mayúsculas).
const CATALOG_FIELDS = {
    id: ["id", "idproducto", "codigo", "sku"],
    name: ["nombre", "name", "nombreproducto", "producto", "title"],
    price: ["precio", "price", "precioproducto"],
    description: ["descripcion", "description", "detalle", "texto"],
    category: ["categoria", "category", "tipo", "tipoproduct"],
    image: ["imagen", "image", "img", "foto", "linkimagen", "urlimagen", "imagesrc"],
    sizes: ["talles", "talle", "sizes", "size"],
    colors: ["colores", "color", "colors"]
};

/** Quita acentos, espacios y signos para comparar encabezados de planilla. */
function normalizeHeader(value) {
    return String(value == null ? "" : value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

/** Convierte un producto/objeto cualquiera en un mapa de campos normalizados. */
function normalizeRaw(raw) {
    const result = {};
    if (!raw || typeof raw !== "object") return result;
    Object.keys(raw).forEach((key) => {
        result[normalizeHeader(key)] = raw[key];
    });
    return result;
}

/** Devuelve el primer valor no vacío entre los alias de un campo. */
function pickField(row, field) {
    const aliases = CATALOG_FIELDS[field] || [];
    for (const alias of aliases) {
        const value = row[alias];
        if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
}

/** Parser CSV propio: respeta comillas dobles, comas internas y saltos de línea. */
function parseCatalogCSV(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const firstLine = source.split(/\r?\n/)[0] || "";
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolons > commas ? ";" : ",";

    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < source.length; i++) {
        const char = source[i];

        if (inQuotes) {
            if (char === '"') {
                if (source[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === delimiter) {
            row.push(field);
            field = "";
        } else if (char === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (char !== "\r") {
            field += char;
        }
    }

    if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ""));
}

/** Convierte filas CSV (con encabezado) en objetos con claves normalizadas. */
function csvRowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map((cells) => {
        const row = {};
        headers.forEach((header, index) => {
            if (header) row[header] = (cells[index] || "").trim();
        });
        return row;
    });
}

/** "S|M|L" -> ["S","M","L"]. También acepta comas y arrays. */
function parseCatalogList(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    const text = String(value == null ? "" : value).trim();
    if (!text) return [];
    let parts = text.split(/[|;]/).map((item) => item.trim()).filter(Boolean);
    if (parts.length === 1 && parts[0].includes(",")) {
        parts = parts[0].split(",").map((item) => item.trim()).filter(Boolean);
    }
    return parts;
}

/** Precio -> número. Acepta 43000, "$43.000" y "$43.000,00". */
function parseCatalogPrice(value) {
    if (typeof value === "number") return value;
    let text = String(value == null ? "" : value).replace(/[^\d.,]/g, "");
    if (!text) return NaN;

    if (text.includes(",") && text.includes(".")) {
        text = text.replace(/\./g, "").replace(",", ".");
    } else if (text.includes(",")) {
        text = /,\d{1,2}$/.test(text) ? text.replace(",", ".") : text.replace(/,/g, "");
    } else if (text.includes(".")) {
        text = /\.\d{1,2}$/.test(text) ? text : text.replace(/\./g, "");
    }

    return parseFloat(text);
}

/** Categorías de la planilla -> valores usados por los filtros del sitio. */
function normalizeCategory(value) {
    const text = normalizeHeader(value);
    if (text.includes("bikini") || text.includes("summer") || text.includes("verano")) return "bikini";
    if (text.includes("accesorio") || text.includes("accesory") || text.includes("tote")) return "accesorio";
    return "activewear";
}

/** Slug estable para generar un id cuando la planilla no lo provee. */
function slugify(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/** Normaliza una fila al esquema del catálogo. Devuelve null si no es válida. */
function normalizeProduct(raw, index) {
    const row = normalizeRaw(raw);
    const name = String(pickField(row, "name")).trim();
    const price = parseCatalogPrice(pickField(row, "price"));

    if (!name || !Number.isFinite(price) || price <= 0) return null;

    const imageValue = String(pickField(row, "image")).trim();
    const image = imageValue || `assets/productos/producto-${String(index + 1).padStart(2, "0")}.jpg`;

    return {
        id: String(pickField(row, "id") || `${slugify(name)}-${index + 1}`),
        name,
        price,
        description: String(pickField(row, "description") || "").trim(),
        category: normalizeCategory(pickField(row, "category")),
        image,
        sizes: parseCatalogList(pickField(row, "sizes")),
        colors: parseCatalogList(pickField(row, "colors"))
    };
}

/** Acepta un array de productos o un objeto { products: [...] }. */
function normalizeCatalog(data) {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.products) ? data.products : []);
    return list.map(normalizeProduct).filter(Boolean);
}

/**
 * Carga el catálogo y devuelve { products, source }.
 * Nunca lanza: ante cualquier error se usa la siguiente fuente disponible.
 */
async function fetchCatalog() {
    // 1) Google Sheets publicado como CSV.
    const sheetUrl = String(STORE_CONFIG.catalogUrl || "").trim();
    if (sheetUrl) {
        try {
            const response = await fetch(sheetUrl, { cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const products = normalizeCatalog(csvRowsToObjects(parseCatalogCSV(await response.text())));
            if (!products.length) throw new Error("La planilla no tiene productos válidos");
            return { products, source: "sheets" };
        } catch (error) {
            console.warn("[MillaCuatro] Google Sheets no disponible; se usa el JSON local.", error);
        }
    }

    // 2) JSON local.
    try {
        const response = await fetch("data/products.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const products = normalizeCatalog(await response.json());
        if (!products.length) throw new Error("El JSON no tiene productos válidos");
        return { products, source: "local" };
    } catch (error) {
        console.warn("[MillaCuatro] products.json no disponible; se usa products.js como respaldo.", error);
    }

    // 3) Respaldo incluido en el sitio (permite abrir el HTML sin servidor).
    const fallback = typeof PRODUCTS !== "undefined" ? normalizeCatalog(PRODUCTS) : [];
    return { products: fallback, source: "fallback" };
}

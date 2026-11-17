/* ========================================
   MillaCuatro - Configuración de la tienda
   ========================================
   Valores centralizados de la tienda y del panel de administración.

   SUPABASE (fuente principal del catálogo)
   - Creá un proyecto gratis en https://supabase.com
   - Ejecutá supabase/schema.sql y supabase/seed.sql en el SQL Editor.
   - Pegá aquí la Project URL y la anon/public key (NUNCA la service_role key).
   - adminEmail debe ser el email con el que se loguea la dueña en /admin.
   - Con esta configuración completa, la tienda lee en tiempo real y el
     panel /admin permite crear, editar y borrar productos.

   Si Supabase no está configurado o no responde, se usa data/products.json
   (y como último respaldo, products.js). La opción catalogUrl de Google Sheets
   queda como fuente intermedia para instalaciones antiguas.
*/
const STORE_CONFIG = Object.freeze({
    supabase: {
        url: "https://ttstlvpwngsrccedkbxz.supabase.co",
        anonKey: "sb_publishable_AMGeCZmMXJJG39wQWOAcwA_eeBUUtKt", // publishable key (segura en el front con RLS)
        productsTable: "products",
        storageBucket: "productos",
        adminEmail: "maiawaltermw@gmail.com"   // única cuenta con acceso al panel /admin (RLS en Supabase)
    },
    catalogUrl: "",                      // Google Sheets CSV (opcional, legado)
    whatsappPhone: "5492233396959",      // Número de la tienda, con código de país
    locale: "es-AR",                     // Formato de precios argentinos: $ 43.000
    currency: "ARS"
});

/** True solo cuando hay URL y key cargadas. */
function isSupabaseConfigured() {
    return Boolean(STORE_CONFIG.supabase.url && STORE_CONFIG.supabase.anonKey);
}

// Exponer la configuración también a los <script type="module"> (admin y realtime).
window.STORE_CONFIG = STORE_CONFIG;
window.isSupabaseConfigured = isSupabaseConfigured;

/* ========================================
   MillaCuatro - Realtime del catálogo
   ========================================
   Se carga como <script type="module">. Si Supabase está configurado,
   escucha INSERT/UPDATE/DELETE en la tabla de productos y avisa a main.js
   mediante un evento para que vuelva a leer el catálogo.
   Si algo falla, la tienda sigue funcionando con la carga inicial.
   ======================================== */

(async () => {
    const config = window.STORE_CONFIG;
    if (!config || !config.supabase || !config.supabase.url || !config.supabase.anonKey) return;

    try {
        // Import dinámico: si el CDN no responde, no rompe la tienda.
        const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
        const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        supabase
            .channel("millacuatro-catalogo")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: config.supabase.productsTable },
                (payload) => {
                    console.info("[MillaCuatro] Cambio en el catálogo:", payload.eventType);
                    window.dispatchEvent(new CustomEvent("millacuatro:catalog-changed", {
                        detail: { eventType: payload.eventType }
                    }));
                }
            )
            .subscribe();

        console.info("[MillaCuatro] Realtime conectado.");
    } catch (error) {
        console.warn("[MillaCuatro] No se pudo conectar el realtime.", error);
    }
})();

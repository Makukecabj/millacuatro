/* ========================================
   MillaCuatro - Configuración de la tienda
   ========================================
   Este archivo centraliza los valores que la dueña puede necesitar cambiar.

   CATÁLOGO
   - Con catalogUrl vacío, la tienda lee "data/products.json".
     Para editar: GitHub > docs/data/products.json > lápiz > Commit.
     Vercel vuelve a publicar automáticamente (costo cero).
   - Para usar Google Sheets:
     1) Crear una planilla con estas columnas (encabezados en la fila 1):
        id | nombre | precio | descripcion | categoria | imagen | talles | colores
     2) Archivo > Compartir > Publicar en internet > formato CSV > Publicar.
     3) Copiar la URL que termina en "output=csv" y pegarla en catalogUrl.
        Ejemplo: https://docs.google.com/spreadsheets/d/e/TU_ID/pub?gid=0&single=true&output=csv
     4) talles y colores se escriben separados por "|" (Ej: S|M|L  y  Negro|Rosa).
     Si la planilla falla o Google bloquea la request (CORS), se usa el JSON local.
*/
const STORE_CONFIG = Object.freeze({
    catalogUrl: "",                      // URL CSV publicada de Google Sheets ("" = JSON local)
    whatsappPhone: "5492233396959",      // Número de la tienda, con código de país
    locale: "es-AR",                     // Formato de precios argentinos: $ 43.000
    currency: "ARS"
});

# Guía de catálogo — MillaCuatro

La tienda se publica desde la carpeta `docs/` (Vercel `outputDirectory: docs`).
Cada cambio que hagas en esa carpeta y subas a GitHub se publica solo, sin costo.

## Orden de fuentes del catálogo

1. **Supabase** (si está configurado): fuente principal, con panel visual en `/admin`
   y actualización en tiempo real. Seguí `GUIA_SUPABASE.md`.
2. **Google Sheets** (si `catalogUrl` tiene una URL): instalaciones antiguas.
3. **`data/products.json`**: respaldo automático si fallan las anteriores.
4. **`products.js`**: último respaldo incluido en el sitio.

Cuando Supabase está configurado, **no hace falta editar el JSON a mano**: los cambios
se hacen desde `/admin` y se ven en la tienda al instante.

## Opción 1: editar el JSON (sin Supabase)

1. En GitHub, entrá a `docs/data/products.json`.
2. Tocá el lápiz y editá el producto que quieras.
3. Hacé **Commit changes**. Vercel actualiza la web en minutos.

Campos de cada producto:

| Campo | Ejemplo | Observación |
| --- | --- | --- |
| `id` | `1` | No cambiarlo: es la clave del carrito guardado. |
| `name` | `"Bikini rio"` | Nombre que se ve en la tarjeta y en el pedido. |
| `price` | `43000` | Número sin `$` ni puntos. |
| `description` | `"Bikini de dos piezas…"` | Se ve en el modal del producto. |
| `category` | `"bikini"` | Opciones: `activewear`, `bikini`, `accesorio`. |
| `image` | `"assets/productos/producto-01.jpg"` | Ruta de la foto dentro de `docs/`. |
| `sizes` | `["S", "M", "L"]` | Array; `[]` si no aplica (ej. bolsa). |
| `colors` | `["Negro", "Rosa"]` | Array; `[]` si no aplica. |

Para agregar un producto, copiá un bloque `{ ... }`, cambiá el `id` por uno nuevo
y agregalo al final de la lista (con coma entre bloques).

## Opción 2: Google Sheets (sin tocar código)

1. Creá una planilla con encabezados en la fila 1:

   `id | nombre | precio | descripcion | categoria | imagen | talles | colores`

2. En `talles` y `colores` separá las opciones con `|`, por ejemplo `S|M|L` y `Negro|Rosa`.
   En `imagen` podés poner `assets/productos/producto-01.jpg` o una URL completa.
3. **Archivo > Compartir > Publicar en internet**: elegí formato CSV, hoja correspondiente
   y tocá **Publicar**. Copiá la URL que termina en `output=csv`.
4. Pegá esa URL en `catalogUrl` dentro de `docs/js/config.js` y hacé commit.

Si la planilla no responde o Google bloquea el acceso desde el navegador (CORS),
la tienda usa automáticamente `data/products.json`. Por eso conviene mantener
el JSON actualizado como respaldo.

## Pedidos por WhatsApp

El número está en `docs/js/config.js` (`whatsappPhone`). El checkout arma el mensaje
con nombre, talle/color, precio unitario, cantidad y total, y abre `api.whatsapp.com`.

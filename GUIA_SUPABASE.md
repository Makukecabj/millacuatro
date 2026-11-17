# Guía de configuración — Supabase + panel `/admin`

Esta guía deja la tienda 100% autogestionable con **costo cero** (free tier de Supabase + Vercel).
La dueña va a poder crear, editar y borrar productos desde `/admin` sin tocar código,
y la web pública se actualiza sola en tiempo real.

> **Seguridad:** usá siempre la **publishable/anon key**. Nunca pegues la clave
> `sb_secret_...` (ni la `service_role`) en el repositorio ni en el navegador.
> Si la compartiste por accidente, rotala en **Project Settings → API Keys**.
> Las reglas RLS del SQL protegen la base.

**Estado actual del proyecto:** la URL y la publishable key ya están cargadas en
`docs/js/config.js`. Falta ejecutar el SQL, crear el usuario de Auth y hacer push.

---

## Paso 1 — Ejecutar el SQL (lo que falta ahora)

1. En Supabase entrá a **SQL Editor** > **New query**.
2. Abrí `supabase/schema.sql` de este repositorio, copiá **todo** el contenido y pegalo.
3. Tocá **Run**. Debe decir *Success. No rows returned*.
4. Abrí **New query** otra vez, pegá el contenido de `supabase/seed.sql` y tocá **Run**.
   Eso carga los 28 productos actuales para que no arranques vacía.

¿Qué hace el SQL? Crea la tabla `products`, habilita RLS (todos leen / cualquier
usuario autenticado escribe), publica la tabla en Realtime y crea el bucket público
`productos` para las fotos.

> No hay emails hardcoded: no hace falta reemplazar ningún placeholder.

---

## Paso 2 — Crear el usuario de Auth

Como elegimos “cualquier usuario autenticado puede administrar”, **la seguridad
depende de que exista un solo usuario**:

1. **Authentication** > **Providers** > **Email**:
   - **Enable Email provider** activo.
   - **Allow new users to sign up** **desactivado** (clave: nadie más pueda registrarse).
2. **Authentication** > **Users** > **Add user** > **Create new user**:
   - Email de la dueña.
   - Contraseña segura.
   - Tocá **Create user**.
3. Si Supabase envía mail de confirmación, confirmalo desde el inbox, o desactivá
   **Confirm email** en Providers para pruebas.

---

## Paso 3 — Verificar `docs/js/config.js`

Ya quedó así (no lo cambies salvo que rotes la key):

```js
supabase: {
    url: "https://ttstlvpwngsrccedkbxz.supabase.co",
    anonKey: "sb_publishable_...",   // publishable key, segura en el front con RLS
    productsTable: "products",
    storageBucket: "productos",
    adminEmail: ""                   // "" = cualquier usuario autenticado
}
```

> Si más adelante querés restringir a un email puntual, completá `adminEmail` y
> agregá la condición `auth.jwt() ->> 'email' = TU_EMAIL` en las policies del SQL.

---

## Paso 4 — Publicar y probar

1. Hacé commit y push. Vercel publica solo.
2. Entrá a https://millacuatro.vercel.app/admin e iniciá sesión con el usuario del Paso 2.
3. Tocá **+ Crear nuevo producto**, cargá nombre, precio y una foto, y guardá.
4. Abrí la tienda en otra pestaña: el producto nuevo aparece **sin recargar**.
5. Editá el precio desde `/admin`: el modal de detalle muestra el precio nuevo al instante.
6. Eliminá el producto de prueba: desaparece de la tienda al instante.

Si la web no se actualiza sola, recargá una vez: `fetchCatalog()` siempre lee
Supabase al iniciar, así que los datos igual van a estar correctos.

---

## Cambiar la imagen de un producto

En el formulario del admin hay dos opciones:

- **Subir foto**: la guarda en Storage (`productos`) y genera una URL pública.
- **Pegar URL de imagen**: sirve para mantener las fotos actuales
  (`assets/productos/producto-01.jpg`) o usar otra URL.

Al borrar un producto, si su foto estaba en nuestro Storage también se elimina.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `/admin` muestra “Configuración pendiente” | Faltan URL/key en `config.js` | Ya están cargadas; hacé push. |
| “No se pudo ingresar” | Email o contraseña incorrectos, o usuario no confirmado | Revisá Authentication > Users. |
| Error `PGRST205: Could not find the table 'public.products'` | No ejecutaste `schema.sql` | Ejecutalo en SQL Editor y después `seed.sql`. |
| La tienda muestra los productos viejos | Falta el seed o RLS mal configurada | Ejecutá `seed.sql` y verificá las policies. |
| Las fotos no se ven | Bucket privado o política faltante | Verificá que `productos` sea público y corré el SQL otra vez. |
| No llega el tiempo real | Tabla no publicada | Corré el bloque `alter publication ...` del SQL. |

---

## Costos

- Supabase Free: 500 MB de base, 1 GB de Storage y 50.000 usuarios/mes de Auth.
- Vercel Hobby: ilimitado para este uso.
- La tienda con 28 productos y fotos está **muy por debajo** de esos límites: $0/mes.

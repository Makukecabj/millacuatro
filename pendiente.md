# Pendiente — MillaCuatro / Supabase + `/admin`

Estado al **17-11-2026**: proyecto Supabase conectado, `schema.sql` y `seed.sql`
ejecutados. Verificado por REST: **28 productos** disponibles con la publishable key.

---

## ✅ Ya hecho

- [x] URL y publishable key cargadas en `docs/js/config.js`.
- [x] `supabase/schema.sql` ejecutado (tabla, RLS, Realtime, Storage, bucket `productos`).
- [x] `supabase/seed.sql` ejecutado (28 productos).
- [x] Panel `/admin` implementado (Auth, CRUD, fotos, talles/colores, Realtime).
- [x] Tienda con Supabase-first + fallback y recarga en tiempo real.
- [x] Guías `GUIA_SUPABASE.md` y `GUIA_CATALOGO.md` actualizadas.

---

## 🔴 Falta (orden de ejecución)

### 1. Obtener el email de la dueña

Necesitamos el email exacto con el que se va a loguear en `/admin`.
Ejemplo: `duena@millacuatro.com`.

> Ese email es la **única** cuenta que podrá crear/editar/borrar productos y fotos.

---

### 2. Restringir RLS a ese email (seguridad real)

Reemplazar los **6 lugares** de `TU_EMAIL@EJEMPLO.COM` y ejecutar este SQL en
**Supabase → SQL Editor → New query → Run**. Es un parche: no hace falta volver a
correr `schema.sql` completo.

```sql
-- ========================================
-- MillaCuatro - Restringir escritura a un email
-- Reemplazá TU_EMAIL@EJEMPLO.COM (6 lugares) y ejecutá.
-- ========================================

drop policy if exists "Productos: solo admin escribe" on public.products;
create policy "Productos: solo admin escribe"
    on public.products for all to authenticated
    using (auth.jwt() ->> 'email' = 'TU_EMAIL@EJEMPLO.COM')
    with check (auth.jwt() ->> 'email' = 'TU_EMAIL@EJEMPLO.COM');

drop policy if exists "Fotos: admin sube" on storage.objects;
create policy "Fotos: admin sube"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'TU_EMAIL@EJEMPLO.COM'
    );

drop policy if exists "Fotos: admin edita" on storage.objects;
create policy "Fotos: admin edita"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'TU_EMAIL@EJEMPLO.COM'
    )
    with check (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'TU_EMAIL@EJEMPLO.COM'
    );

drop policy if exists "Fotos: admin borra" on storage.objects;
create policy "Fotos: admin borra"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'TU_EMAIL@EJEMPLO.COM'
    );
```

Resultado esperado: *Success. No rows returned*.

---

### 3. Reflejar el email en el front

En `docs/js/config.js` cambiar:

```js
adminEmail: ""                   // "" = cualquier usuario autenticado
```

por:

```js
adminEmail: "duena@millacuatro.com"   // el mismo email del SQL
```

> El `adminEmail` del front solo evita mostrar el panel a otro usuario.
> La seguridad real la dan las policies RLS del paso 2.

---

### 4. Crear el usuario de Auth y cerrar el registro

1. Supabase → **Authentication → Providers → Email**:
   - **Enable Email provider** activo.
   - **Allow new users to sign up** **desactivado**.
2. **Authentication → Users → Add user → Create new user**:
   - Email: el mismo del paso 2 y 3.
   - Contraseña segura.
   - **Create user**.
3. Si hay confirmación por mail, confirmarla desde el inbox (o desactivar
   **Confirm email** en Providers para pruebas).

---

### 5. Rotar la clave secreta expuesta

La clave secreta que se compartió en el chat **debe rotarse**:

- Supabase → **Project Settings → API Keys** → rotar / regenerar.
- Nunca pegarla en `config.js`, en el repo ni en el navegador.
- La tienda solo necesita la **publishable key** (ya cargada y verificada).

---

### 6. Commit, push y verificación final

```bash
git add .
git commit -m "feat: panel admin con Supabase, RLS por email y realtime"
git push
```

Después de que Vercel publique:

- [ ] Entrar a https://millacuatro.vercel.app/admin con el email de la dueña.
- [ ] Crear un producto de prueba → aparece en la tienda sin recargar.
- [ ] Editar precio → se ve en el modal sin recargar.
- [ ] Eliminar el producto → desaparece sin recargar.
- [ ] Verificar que otro usuario autenticado **no** pueda modificar (RLS).
- [ ] Confirmar que `docs/data/products.json` sigue intacto como fallback.

---

## Notas

- No tocar `.env.local`, `.vercel/` ni `landing/`.
- Vercel: https://vercel.com/makuke/millacuatro
- Repo: https://github.com/Makukecabj/millacuatro
- Sitio: https://millacuatro.vercel.app
- Commit previo deployado: `79a25f307d44320e610ddebb46eac1b69fc5e2db`

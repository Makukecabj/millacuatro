-- ========================================
-- MillaCuatro - Parche de seguridad: restrictir escritura a un email
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- ========================================
-- Suite: reemplaza las policies permisivas de schema.sql por policies
-- que solo permiten ESCRIBIR (productos y fotos) a la cuenta de Auth
-- maiawaltermw@gmail.com.
--
-- La lectura pública NO se toca: la tienda sigue mostrando el catálogo.
-- Resultado esperado: "Success. No rows returned".
--
-- IMPORTANTE: este archivo NO contiene contraseñas. La contraseña del
-- usuario de Auth se carga únicamente en Supabase > Authentication > Users.
-- ========================================

-- Productos: solo la dueña puede INSERT / UPDATE / DELETE.
drop policy if exists "Productos: solo admin escribe" on public.products;
create policy "Productos: solo admin escribe"
    on public.products for all to authenticated
    using (auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com')
    with check (auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com');

-- Storage: solo la dueña puede subir fotos al bucket 'productos'.
drop policy if exists "Fotos: admin sube" on storage.objects;
create policy "Fotos: admin sube"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com'
    );

drop policy if exists "Fotos: admin edita" on storage.objects;
create policy "Fotos: admin edita"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com'
    )
    with check (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com'
    );

drop policy if exists "Fotos: admin borra" on storage.objects;
create policy "Fotos: admin borra"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'productos'
        and auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com'
    );

-- ----------------------------------------
-- Verificación posterior (opcional, solo lectura):
-- confirmá que las 4 policies devueltas filtran por el email y el bucket.
-- ----------------------------------------
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where (schemaname = 'public' and tablename = 'products')
--    or (schemaname = 'storage' and tablename = 'objects' and policyname like 'Fotos: admin%')
-- order by schemaname, tablename, policyname;

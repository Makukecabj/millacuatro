-- ========================================
-- MillaCuatro - Esquema para Supabase
-- ========================================
-- Instrucciones:
-- 1) Creá un proyecto gratis en https://supabase.com
-- 2) Pegá este archivo completo en SQL Editor > New query > Run.
-- 3) Solo ESCRIBE la cuenta de Auth maiawaltermw@gmail.com (RLS por email).
--    Recomendación: desactivar signups y crear únicamente ese usuario en Auth.
-- 4) Ejecutá después seed.sql para cargar los 28 productos actuales.
-- ========================================

-- Tabla de productos. Los talles y colores son arrays de texto.
create table if not exists public.products (
    id          text primary key,
    name        text not null,
    price       numeric(12, 2) not null check (price >= 0),
    description text not null default '',
    category    text not null default 'activewear'
                check (category in ('activewear', 'bikini', 'accesorio')),
    image       text not null default '',
    sizes       text[] not null default '{}',
    colors      text[] not null default '{}',
    created_at  timestamptz not null default now()
);

create index if not exists products_created_at_idx on public.products (created_at desc);

-- Row Level Security: todos pueden LEER; solo la dueña puede ESCRIBIR.
alter table public.products enable row level security;

drop policy if exists "Productos: lectura publica" on public.products;
create policy "Productos: lectura publica"
    on public.products for select to anon, authenticated
    using (true);

drop policy if exists "Productos: solo admin escribe" on public.products;
create policy "Productos: solo admin escribe"
    on public.products for all to authenticated
    using (auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com')
    with check (auth.jwt() ->> 'email' = 'maiawaltermw@gmail.com');

-- Realtime: publicar la tabla para que la tienda se actualice sola.
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'products'
    ) then
        alter publication supabase_realtime add table public.products;
    end if;
end $$;

-- Enviar también los valores anteriores en UPDATE/DELETE (útil para el realtime).
alter table public.products replica identity full;

-- Storage público para las fotos de productos.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;

drop policy if exists "Fotos: lectura publica" on storage.objects;
create policy "Fotos: lectura publica"
    on storage.objects for select to anon, authenticated
    using (bucket_id = 'productos');

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

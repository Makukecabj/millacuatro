-- ========================================
-- MillaCuatro - Seed inicial de productos
-- Ejecutar DESPUÉS de schema.sql.
-- ========================================

insert into public.products (id, name, price, description, category, image, sizes, colors)
values
  ('1', 'Bikini rio', 43000, 'Bikini de dos piezas de corte clásico y ajuste cómodo. Ideal para la playa, la pileta y todos los días de verano.', 'bikini', 'assets/productos/producto-01.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('2', 'Catsuit alo', 43500, 'Catsuit enterizo de segunda piel, diseñado para acompañar cada movimiento con total libertad y comodidad.', 'activewear', 'assets/productos/producto-02.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Violeta']),
  ('3', 'Short washed', 26500, 'Short de entrenamiento con lavado suave y terminación premium. Liviano, fresco y de look minimalista.', 'activewear', 'assets/productos/producto-03.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Azul']),
  ('4', 'Calza war', 18000, 'Calza de compresión ligera, suave y versátil. Un básico para entrenar o para el día a día.', 'activewear', 'assets/productos/producto-04.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Violeta']),
  ('5', 'Set north', 30000, 'Conjunto de calza y top pensado para entrenar y descansar con el mismo estilo. Tejido suave y ajuste cómodo.', 'activewear', 'assets/productos/producto-05.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Azul']),
  ('6', 'CALZA BATIK', 22300, 'Calza con estampado batik exclusivo, suave al tacto y de secado rápido. Para entrenar con personalidad.', 'activewear', 'assets/productos/producto-06.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('7', 'CALZA OXFORD', 26000, 'Calza clásica de tiro alto y tejido firme. Un básico que siempre funciona, dentro y fuera del gimnasio.', 'activewear', 'assets/productos/producto-07.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Gris', 'Azul']),
  ('8', 'Calza otawa', 26000, 'Calza de tiro alto con soporte medio, ideal para entrenamientos largos y para estar cómoda todo el día.', 'activewear', 'assets/productos/producto-08.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Violeta']),
  ('9', 'Camiseta Nevada', 25500, 'Camiseta liviana de manga corta, fresca y cómoda. Un esencial de guardarropa para cualquier momento.', 'activewear', 'assets/productos/producto-09.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Gris', 'Azul']),
  ('10', 'Buzo aspen', 36000, 'Buzo de algodón suave con corte relajado. Perfecto para después del entrenamiento o para salir a caminar.', 'activewear', 'assets/productos/producto-10.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Violeta']),
  ('11', 'Calza munich', 26000, 'Calza de tiro alto de diseño minimalista y ajuste que acompaña el movimiento sin marcar.', 'activewear', 'assets/productos/producto-11.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Gris', 'Azul']),
  ('12', 'Top ica', 10000, 'Top deportivo de soporte medio, fresco y cómodo. Ideal para entrenar, caminar o descansar.', 'activewear', 'assets/productos/producto-12.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('13', 'Millacuatro', 12000, 'Bikini insignia de la marca: líneas puras, tonos combinables y un ajuste que favorece.', 'bikini', 'assets/productos/producto-13.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('14', 'Cali print', 18000, 'Bikini con estampado exclusivo, alegre y fresco. Para llevar el verano por dentro.', 'bikini', 'assets/productos/producto-14.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Print']),
  ('15', 'MIAMI', 36000, 'Set de verano de dos piezas con diseño moderno, caída suave y una comodidad que invita a quedarse.', 'bikini', 'assets/productos/producto-15.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('16', 'Bikini Cali', 12000, 'Bikini clásico de tirantes, simple y favorecedor. Un imprescindible del guardarropa de verano.', 'bikini', 'assets/productos/producto-16.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('17', 'Fiji', 18000, 'Bikini con print tropical y corte moderno, pensado para destacar en la playa con naturalidad.', 'bikini', 'assets/productos/producto-17.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Print']),
  ('18', 'Top Killa', 20000, 'Top de entrenamiento con soporte firme, terminación suave y diseño que no se mueve contigo.', 'activewear', 'assets/productos/producto-18.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Gris', 'Violeta']),
  ('19', 'Laos', 12000, 'Bikini de dos piezas de corte minimalista y tonos versátiles para combinar sin pensar.', 'bikini', 'assets/productos/producto-19.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('20', 'TOP WINTER', 24000, 'Top térmico de manga larga, ideal para entrenar en los días fríos sin perder estilo ni comodidad.', 'activewear', 'assets/productos/producto-20.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Azul']),
  ('21', 'Short strong', 15000, 'Short de alta resistencia, diseñado para entrenamientos intensos y movimientos sin límites.', 'activewear', 'assets/productos/producto-21.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Azul']),
  ('22', 'LOVE', 25000, 'Bikini de líneas suaves y colores que combinan con todo. Fresco, cómodo y muy femenino.', 'bikini', 'assets/productos/producto-22.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('23', 'Mir', 12000, 'Bikini con detalles print y ajuste cómodo para todo el día. Para playa, pileta y después.', 'bikini', 'assets/productos/producto-23.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Print']),
  ('24', 'Short Malibu', 20000, 'Short liviano y fresco, perfecto para entrenar, descansar o disfrutar el verano.', 'activewear', 'assets/productos/producto-24.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Azul']),
  ('25', 'Bikini Barbie', 25000, 'Bikini de tonos vibrantes y corte favorecedor. Para brillar en verano con actitud.', 'bikini', 'assets/productos/producto-25.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Rosa', 'Celeste']),
  ('26', 'Ocean', 12000, 'Bikini inspirado en el mar: líneas simples, frescura natural y una combinación de colores única.', 'bikini', 'assets/productos/producto-26.jpg', ARRAY['S', 'M', 'L'], ARRAY['Negro', 'Celeste', 'Print']),
  ('27', 'CATSUIT WEST CORTO', 32000, 'Catsuit de manga larga y corte corto: moderno, funcional y cómodo para entrenar con estilo.', 'activewear', 'assets/productos/producto-27.jpg', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Negro', 'Gris', 'Violeta']),
  ('28', 'TOTE BAG', 23200, 'Bolsa tote reutilizable, liviana y resistente. Para llevar todo con estilo, todos los días.', 'accesorio', 'assets/productos/producto-28.jpg', ARRAY[]::text[], ARRAY['Negro', 'Rosa', 'Celeste'])
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  description = excluded.description,
  category = excluded.category,
  image = excluded.image,
  sizes = excluded.sizes,
  colors = excluded.colors;

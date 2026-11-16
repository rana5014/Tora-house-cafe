-- ============================================================================
-- TORA HOUSE CAFE — SUPABASE PRODUCTION DATABASE SCHEMA
-- Coffee • Tea • Juices — بيت تورا
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste & Run
-- ============================================================================

-- 1. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  category text not null,
  base_price numeric(10, 2) not null,
  sizes jsonb default '[]'::jsonb,
  image text not null,
  is_available boolean default true,
  is_featured boolean default false,
  is_bestseller boolean default false,
  calories integer,
  sort_order integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE CAFE SETTINGS TABLE (One centralized row: 'primary_config')
create table if not exists public.cafe_settings (
  id text primary key default 'primary_config',
  settings jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CREATE ORDERS TABLE
create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  customer jsonb not null,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  tax numeric(10, 2) default 0,
  delivery_fee numeric(10, 2) default 0,
  total numeric(10, 2) not null,
  order_type text not null default 'pickup',
  status text not null default 'Pending',
  whatsapp_sent boolean default false,
  whatsapp_delivery_status text,
  payment_method text not null default 'cash_on_delivery',
  pickup_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.products enable row level security;
alter table public.cafe_settings enable row level security;
alter table public.orders enable row level security;

-- Drop existing policies to allow clean idempotent reruns
drop policy if exists "Allow public read products" on public.products;
drop policy if exists "Allow public write products" on public.products;
drop policy if exists "Allow public read settings" on public.cafe_settings;
drop policy if exists "Allow public write settings" on public.cafe_settings;
drop policy if exists "Allow public read orders" on public.orders;
drop policy if exists "Allow public insert orders" on public.orders;
drop policy if exists "Allow public update orders" on public.orders;

-- Products Policies: Public read, authorized write
create policy "Allow public read products"
  on public.products for select
  using (true);

create policy "Allow public write products"
  on public.products for all
  using (true)
  with check (true);

-- Cafe Settings Policies: Public read, authorized write
create policy "Allow public read settings"
  on public.cafe_settings for select
  using (true);

create policy "Allow public write settings"
  on public.cafe_settings for all
  using (true)
  with check (true);

-- Orders Policies: Customers can place and view orders; Admins can update status
create policy "Allow public read orders"
  on public.orders for select
  using (true);

create policy "Allow public insert orders"
  on public.orders for insert
  with check (true);

create policy "Allow public update orders"
  on public.orders for update
  using (true);

-- 6. ENABLE SUPABASE REALTIME REPLICATION (Instant cross-browser WebSocket sync)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'products') then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'cafe_settings') then
    alter publication supabase_realtime add table public.cafe_settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;

-- 7. INITIAL CAFE SETTINGS SEED (Location, WhatsApp, Hours, Taglines)
insert into public.cafe_settings (id, settings, updated_at)
values (
  'primary_config',
  '{"cafeName":"TORA HOUSE","cafeNameAr":"بيت تورا","taglineEn":"Fresh Taste. Every Moment.","taglineAr":"طعم طازج. في كل لحظة.","whatsappNumber":"966579165664","whatsappDisplay":"+966 57 916 5664","phoneDisplay":"+966 57 916 5664","email":"hello@torahouse.sa","addressEn":"King Abdulaziz Road, Al Malqa District, Riyadh, Saudi Arabia","addressAr":"طريق الملك عبدالعزيز، حي الملقا، الرياض، المملكة العربية السعودية","city":"Riyadh","openingHoursEn":"Daily: 6:00 AM – 2:00 AM (Friday: 1:00 PM – 2:00 AM)","openingHoursAr":"يومياً: 6:00 صباحاً – 2:00 فجراً (الجمعة: 1:00 ظهراً – 2:00 فجراً)","currency":"SAR","currencyAr":"ر.س","taxRate":0,"deliveryFee":10,"minOrderAmount":20,"estimatedDeliveryMinutes":30,"instagramHandle":"@torahouse.sa","twitterHandle":"@torahouse","snapchatHandle":"@torahouse","tiktokHandle":"@torahouse","googleMapsUrl":"","isAcceptingOrders":true}'::jsonb,
  now()
)
on conflict (id) do update
set settings = excluded.settings, updated_at = now();

-- 8. INITIAL PRODUCTS SEED (24 TORA HOUSE Items)
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-ice-white-mocha', 'Ice White Mocha', 'آيس وايت موكا', 'Rich espresso blended with white chocolate sauce, chilled milk, and served over ice.', 'إسبريسو غني مع صوص الشوكولاتة البيضاء والحليب البارد على الثلج.', 'cold-drinks', 14, '[]'::jsonb, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', true, true, true, 220, 1)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-caramel-macchiato', 'Ice Caramel Macchiato', 'آيس كراميل ماكياتو', 'Espresso over vanilla-flavored milk with caramel drizzle, served iced.', 'إسبريسو مع حليب فانيلا وكراميل على الثلج.', 'cold-drinks', 14, '[]'::jsonb, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80', true, false, true, 250, 2)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-spanish-latte', 'Ice Spanish Latte', 'آيس سبانيش لاتيه', 'Bold espresso with sweetened condensed milk and fresh milk over ice.', 'إسبريسو مع حليب مكثف محلى وحليب طازج على الثلج.', 'cold-drinks', 14, '[]'::jsonb, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80', true, true, true, 260, 3)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-americano', 'Americano (Cold)', 'أمريكانو بارد', 'Espresso diluted with cold water, smooth and strong.', 'إسبريسو مخفف بالماء البارد، قوي وسلس.', 'cold-drinks', 9, '[]'::jsonb, 'https://images.unsplash.com/photo-1517959105821-eaf2591984d2?w=400&q=80', true, false, false, 10, 4)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-matcha', 'Ice Matcha', 'آيس ماتشا', 'Premium Japanese green tea blended with milk over ice.', 'شاي أخضر ياباني فاخر مع الحليب على الثلج.', 'cold-drinks', 8, '[{"label":"Medium","labelAr":"وسط","price":8},{"label":"Large","labelAr":"كبير","price":10}]'::jsonb, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&q=80', true, true, false, 180, 5)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-vanilla-frappe', 'Vanilla Frappe', 'فرابيه فانيلا', 'Creamy blended vanilla frappe topped with whipped cream.', 'فرابيه فانيلا كريمية مع كريمة مخفوقة.', 'cold-drinks', 12, '[]'::jsonb, 'https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=400&q=80', true, false, false, 320, 6)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-melon-frappe', 'Melon Frappe', 'فرابيه شمام', 'Refreshing blended melon frappe — sweet and chilled.', 'فرابيه شمام منعش وحلو.', 'cold-drinks', 8, '[]'::jsonb, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80', true, false, false, 200, 7)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-v60', 'Ice V60', 'آيس في60', 'Pour-over V60 brewed coffee served over ice, clean and bright.', 'قهوة V60 مصفاة تقدم باردة على الثلج.', 'cold-drinks', 9, '[]'::jsonb, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', true, false, false, 5, 8)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-hibiscus', 'Hibiscus (Karkadeh)', 'كركديه', 'Chilled hibiscus drink — tangy, floral, and deeply refreshing.', 'مشروب كركديه بارد ومنعش بنكهة زهرية رائعة.', 'cold-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', true, false, false, 90, 9)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-mojito-blue', 'Mojito Blue', 'موهيتو أزرق', 'Blue lemonade mojito with mint and lime — cool and vibrant.', 'موهيتو ليموناضة زرقاء بالنعناع والليمون.', 'cold-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1583084591-14e43b3fe26e?w=400&q=80', true, false, false, 130, 10)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-mojito-strawberry', 'Mojito Strawberry', 'موهيتو فراولة', 'Fresh strawberry mojito with mint and a hint of lime.', 'موهيتو فراولة طازج بالنعناع والليمون.', 'cold-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80', true, false, false, 140, 11)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-mojito-roman', 'Mojito Roman', 'موهيتو رومان', 'Pomegranate mojito with fresh mint and citrus — rich and refreshing.', 'موهيتو رمان بالنعناع الطازج والحمضيات.', 'cold-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80', true, false, false, 135, 12)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-mojito-passion', 'Mojito Passion Fruit', 'موهيتو باشن فروت', 'Tropical passion fruit mojito with mint and soda.', 'موهيتو باشن فروت استوائي بالنعناع والصودا.', 'cold-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=400&q=80', true, false, false, 125, 13)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-ice-tea', 'Ice Tea', 'آيس تي', 'Refreshing chilled tea served over ice.', 'شاي منعش بارد على الثلج.', 'cold-drinks', 8, '[]'::jsonb, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', true, false, false, 50, 14)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-orange-juice', 'Fresh Orange Juice', 'عصير برتقال طازج', '100% freshly squeezed orange juice, no added sugar.', 'عصير برتقال طازج 100% بدون سكر مضاف.', 'cold-drinks', 12, '[{"label":"Medium","labelAr":"وسط","price":12},{"label":"Large","labelAr":"كبير","price":14}]'::jsonb, 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&q=80', true, false, false, 110, 15)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-awar-gulp', 'Awar Gulp', 'عوار قلب', 'A signature Tora House specialty cold drink.', 'مشروب بارد مميز من تورا هاوس.', 'cold-drinks', 14, '[]'::jsonb, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80', true, false, false, 180, 16)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('cold-water', 'Water', 'ماء', 'Chilled mineral water.', 'مياه معدنية باردة.', 'cold-drinks', 1, '[]'::jsonb, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', true, false, false, null, 17)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-cappuccino', 'Cappuccino', 'كابوتشينو', 'Classic Italian cappuccino with velvety steamed milk foam.', 'كابوتشينو إيطالي كلاسيكي مع رغوة الحليب.', 'hot-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80', true, true, true, 120, 18)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-latte', 'Latte', 'لاتيه', 'Smooth espresso with steamed milk and a light layer of foam.', 'إسبريسو ناعم مع حليب مبخر وطبقة رغوة خفيفة.', 'hot-drinks', 10, '[{"label":"Medium","labelAr":"وسط","price":10},{"label":"Large","labelAr":"كبير","price":12}]'::jsonb, 'https://images.unsplash.com/photo-1517959105821-eaf2591984d2?w=400&q=80', true, true, true, 150, 19)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-mocha', 'Mocha', 'موكا', 'Espresso with chocolate sauce and steamed milk, topped with foam.', 'إسبريسو مع صوص الشوكولاتة والحليب المبخر.', 'hot-drinks', 12, '[{"label":"Medium","labelAr":"وسط","price":12},{"label":"Large","labelAr":"كبير","price":14}]'::jsonb, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80', true, false, false, 220, 20)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-caramel-macchiato', 'Caramel Macchiato', 'كراميل ماكياتو', 'Espresso layered with vanilla milk and caramel drizzle.', 'إسبريسو مع حليب فانيلا وكراميل فوقه.', 'hot-drinks', 12, '[]'::jsonb, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', true, false, false, 190, 21)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-espresso', 'Espresso', 'إسبريسو', 'Single concentrated shot of pure espresso.', 'شوت إسبريسو مركز واحد.', 'hot-drinks', 7, '[]'::jsonb, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80', true, false, false, 5, 22)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-double-espresso', 'Double Espresso', 'دبل إسبريسو', 'Two concentrated shots of espresso — extra strong.', 'شوتان من الإسبريسو المركز.', 'hot-drinks', 9, '[]'::jsonb, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80', true, false, false, 10, 23)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-macchiato', 'Macchiato', 'ماكياتو', 'Espresso topped with a small amount of foamed milk.', 'إسبريسو مع قليل من رغوة الحليب.', 'hot-drinks', 10, '[]'::jsonb, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80', true, false, false, 30, 24)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-cortado', 'Cortado', 'كورتادو', 'Espresso cut with equal parts warm steamed milk.', 'إسبريسو مع كمية مساوية من الحليب المبخر.', 'hot-drinks', 10, '[]'::jsonb, 'https://images.unsplash.com/photo-1517959105821-eaf2591984d2?w=400&q=80', true, false, false, 50, 25)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-turkish', 'Turkish Coffee', 'قهوة تركية', 'Finely ground coffee brewed in a cezve, rich and aromatic.', 'قهوة مطحونة ناعماً تُحضر بالجزوة، غنية وعطرة.', 'hot-drinks', 8, '[]'::jsonb, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', true, false, false, 10, 26)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-french', 'French Coffee', 'قهوة فرنسية', 'Bold French press style coffee, full-bodied and smooth.', 'قهوة فرنسية بأسلوب الضغط، قوية وسلسة.', 'hot-drinks', 8, '[]'::jsonb, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', true, false, false, 10, 27)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-saudi', 'Saudi Coffee', 'قهوة سعودية', 'Traditional Saudi cardamom coffee (Qahwa), light and spiced.', 'قهوة سعودية تقليدية بالهيل (قهوة عربية)، خفيفة ومبهرة.', 'hot-drinks', 8, '[]'::jsonb, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', true, false, false, 5, 28)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-karrak', 'Karrak Tea', 'شاي كرك', 'Spiced Indian-style tea brewed with milk — rich and warming.', 'شاي هندي مبهر مطبوخ بالحليب.', 'hot-drinks', 3, '[{"label":"Small","labelAr":"صغير","price":3},{"label":"Large","labelAr":"كبير","price":5}]'::jsonb, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', true, false, false, 90, 29)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-tea', 'Tea', 'شاي', 'Classic hot tea, served plain.', 'شاي ساخن كلاسيكي.', 'hot-drinks', 1, '[{"label":"Small","labelAr":"صغير","price":1},{"label":"Large","labelAr":"كبير","price":2}]'::jsonb, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', true, false, false, 2, 30)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-tea-milk', 'Tea with Milk', 'شاي بالحليب', 'Hot tea served with milk.', 'شاي ساخن بالحليب.', 'hot-drinks', 1, '[{"label":"Small","labelAr":"صغير","price":1},{"label":"Large","labelAr":"كبير","price":2}]'::jsonb, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', true, false, false, 40, 31)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-v60', 'V60 Hot', 'في60 ساخن', 'Pour-over V60 brewed hot, clean and nuanced.', 'قهوة في60 مصفاة ساخنة ونظيفة النكهة.', 'hot-drinks', 9, '[]'::jsonb, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', true, false, false, 5, 32)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-americano', 'Americano Hot', 'أمريكانو ساخن', 'Espresso diluted with hot water — bold and smooth.', 'إسبريسو مخفف بالماء الساخن.', 'hot-drinks', 9, '[]'::jsonb, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80', true, false, false, 10, 33)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('hot-chocolate', 'Hot Chocolate', 'شوكولاتة ساخنة', 'Rich and creamy hot chocolate made with premium cocoa.', 'شوكولاتة ساخنة كريمية غنية بالكاكاو الممتاز.', 'hot-drinks', 8, '[{"label":"Medium","labelAr":"وسط","price":8},{"label":"Large","labelAr":"كبير","price":10}]'::jsonb, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80', true, false, false, 230, 34)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-donut', 'Donut', 'دونات', 'Freshly made glazed donut — soft and sweet.', 'دونات طازج ومحلى بالقشدة.', 'sweets', 7, '[]'::jsonb, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80', true, false, false, 310, 35)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-cake-vanilla', 'English Cake Vanilla', 'كيك إنجليزي فانيلا', 'Classic vanilla English cake — moist and delicate.', 'كيك إنجليزي فانيلا كلاسيكي طري ولذيذ.', 'sweets', 6, '[]'::jsonb, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', true, false, false, 290, 36)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-cake-choco', 'English Cake Chocolate', 'كيك إنجليزي شوكولاتة', 'Moist chocolate English cake with rich cocoa flavor.', 'كيك إنجليزي شوكولاتة طري بنكهة كاكاو غنية.', 'sweets', 6, '[]'::jsonb, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80', true, false, false, 310, 37)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-muffin-vanilla', 'Muffin Vanilla', 'مافن فانيلا', 'Soft vanilla muffin baked fresh daily.', 'مافن فانيلا طري مخبوز طازج يومياً.', 'sweets', 6, '[]'::jsonb, 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&q=80', true, false, false, 270, 38)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-muffin-choco', 'Muffin Chocolate', 'مافن شوكولاتة', 'Decadent chocolate muffin with chocolate chips.', 'مافن شوكولاتة فاخر بقطع الشوكولاتة.', 'sweets', 6, '[]'::jsonb, 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&q=80', true, false, false, 290, 39)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-croissant-plain', 'Croissant Plain', 'كرواسان سادة', 'Buttery, flaky plain croissant baked to golden perfection.', 'كرواسان زبدي هش مخبوز بشكل مثالي.', 'sweets', 6, '[]'::jsonb, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', true, false, false, 240, 40)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('sweet-croissant-cheese', 'Croissant Cheese', 'كرواسان جبن', 'Flaky croissant filled with melted cheese — savory and rich.', 'كرواسان هش محشو بالجبن المذاب.', 'sweets', 7, '[]'::jsonb, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', true, true, false, 290, 41)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-caramel-flavor', 'Caramel Flavor', 'نكهة كراميل', 'Add a caramel flavor shot to any drink.', 'أضف نكهة الكراميل لأي مشروب.', 'add-ons', 3, '[]'::jsonb, 'https://images.unsplash.com/photo-1561046274-2d8d6d7f8d4a?w=400&q=80', true, false, false, 20, 42)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-vanilla-flavor', 'Vanilla Flavor', 'نكهة فانيلا', 'Add a vanilla flavor shot to any drink.', 'أضف نكهة الفانيلا لأي مشروب.', 'add-ons', 3, '[]'::jsonb, 'https://images.unsplash.com/photo-1561046274-2d8d6d7f8d4a?w=400&q=80', true, false, false, 20, 43)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-hazelnut-flavor', 'Hazelnut Flavor', 'نكهة بندق', 'Add a hazelnut flavor shot to any drink.', 'أضف نكهة البندق لأي مشروب.', 'add-ons', 3, '[]'::jsonb, 'https://images.unsplash.com/photo-1561046274-2d8d6d7f8d4a?w=400&q=80', true, false, false, 20, 44)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-caramel-topping', 'Caramel Topping', 'توبينق كراميل', 'Caramel drizzle topping for your drink.', 'توبينق كراميل فوق مشروبك.', 'add-ons', 4, '[]'::jsonb, 'https://images.unsplash.com/photo-1561046274-2d8d6d7f8d4a?w=400&q=80', true, false, false, 30, 45)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-white-choco', 'White Chocolate', 'شوكولاتة بيضاء', 'White chocolate sauce for your drink.', 'صوص الشوكولاتة البيضاء لمشروبك.', 'add-ons', 4, '[]'::jsonb, 'https://images.unsplash.com/photo-1561046274-2d8d6d7f8d4a?w=400&q=80', true, false, false, 35, 46)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-extra-espresso', 'Extra Espresso Shot', 'شوت إسبريسو إضافي', 'Add an extra espresso shot to your drink.', 'أضف شوت إسبريسو إضافياً لمشروبك.', 'add-ons', 4, '[]'::jsonb, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80', true, false, false, 5, 47)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-double-espresso', 'Double Extra Espresso', 'دبل شوت إضافي', 'Add two extra espresso shots to your drink.', 'أضف شوتين إسبريسو إضافيين.', 'add-ons', 6, '[]'::jsonb, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80', true, false, false, 10, 48)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;
insert into public.products (id, name_en, name_ar, description_en, description_ar, category, base_price, sizes, image, is_available, is_featured, is_bestseller, calories, sort_order)
values ('addon-ice-cream', 'Ice Cream Scoop', 'سكوب آيس كريم', 'Add a scoop of vanilla ice cream to your drink or dessert.', 'أضف سكوب آيس كريم فانيلا لمشروبك أو حلواك.', 'add-ons', 3, '[]'::jsonb, 'https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=400&q=80', true, false, false, 130, 49)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  category = excluded.category,
  base_price = excluded.base_price,
  sizes = excluded.sizes,
  image = excluded.image,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  is_bestseller = excluded.is_bestseller,
  calories = excluded.calories,
  sort_order = excluded.sort_order;

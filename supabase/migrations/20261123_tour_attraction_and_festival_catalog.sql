create table if not exists public.tour_attractions (
  id text primary key,
  city text not null check (city in ('Paro','Thimphu','Punakha','Gangtey','Haa')),
  name text not null,
  category text not null default 'Other',
  duration_minutes integer not null default 90 check (duration_minutes between 15 and 720),
  description text not null default '',
  image_url text not null default '',
  is_active boolean not null default true,
  is_festival_venue boolean not null default false,
  sort_order integer not null default 0,
  created_by_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city, name)
);

create table if not exists public.tour_festivals (
  id text primary key,
  name text not null,
  city text not null check (city in ('Paro','Thimphu','Punakha','Gangtey','Haa')),
  venue_attraction_id text references public.tour_attractions(id) on delete set null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, city)
);

create index if not exists tour_attractions_city_active_idx on public.tour_attractions (city, is_active, sort_order, name);
create index if not exists tour_festivals_city_active_idx on public.tour_festivals (city, is_active, sort_order, name);

alter table public.tour_attractions enable row level security;
alter table public.tour_festivals enable row level security;

revoke all on table public.tour_attractions from anon, authenticated;
revoke all on table public.tour_festivals from anon, authenticated;
grant select, insert, update, delete on table public.tour_attractions to authenticated;
grant select, insert, update, delete on table public.tour_festivals to authenticated;
grant select, insert, update, delete on table public.tour_attractions to service_role;
grant select, insert, update, delete on table public.tour_festivals to service_role;

drop policy if exists tour_attractions_select_authenticated on public.tour_attractions;
drop policy if exists tour_attractions_insert_authenticated on public.tour_attractions;
drop policy if exists tour_attractions_update_authenticated on public.tour_attractions;
drop policy if exists tour_attractions_delete_authenticated on public.tour_attractions;
create policy tour_attractions_select_authenticated on public.tour_attractions for select to authenticated using (true);
create policy tour_attractions_insert_authenticated on public.tour_attractions for insert to authenticated with check (true);
create policy tour_attractions_update_authenticated on public.tour_attractions for update to authenticated using (true) with check (true);
create policy tour_attractions_delete_authenticated on public.tour_attractions for delete to authenticated using (true);

drop policy if exists tour_festivals_select_authenticated on public.tour_festivals;
drop policy if exists tour_festivals_insert_authenticated on public.tour_festivals;
drop policy if exists tour_festivals_update_authenticated on public.tour_festivals;
drop policy if exists tour_festivals_delete_authenticated on public.tour_festivals;
create policy tour_festivals_select_authenticated on public.tour_festivals for select to authenticated using (true);
create policy tour_festivals_insert_authenticated on public.tour_festivals for insert to authenticated with check (true);
create policy tour_festivals_update_authenticated on public.tour_festivals for update to authenticated using (true) with check (true);
create policy tour_festivals_delete_authenticated on public.tour_festivals for delete to authenticated using (true);

insert into public.tour_attractions
(id, city, name, category, duration_minutes, description, is_active, is_festival_venue, sort_order)
values
('paro_rinpung','Paro','Rinpung Dzong','Dzong',90,'ป้อมปราการและอารามสำคัญของเมืองพาโร',true,true,10),
('paro_national_museum','Paro','National Museum of Bhutan','Museum',75,'พิพิธภัณฑสถานแห่งชาติภูฏาน ณ อาคาร Ta Dzong',true,false,20),
('paro_kyichu','Paro','Kyichu Lhakhang','Temple',60,'หนึ่งในวัดเก่าแก่และศักดิ์สิทธิ์ของภูฏาน',true,false,30),
('paro_street','Paro','Paro Street Shopping (City Center)','Shopping',60,'เดินเล่นและเลือกซื้อของที่ระลึกย่านใจกลางเมืองพาโร',true,false,40),
('paro_chuzom','Paro','Chuzom Bridge','Viewpoint',30,'จุดบรรจบของเส้นทางสำคัญก่อนเข้าสู่พาโร',true,false,50),
('thimphu_buddha','Thimphu','Buddha Dordenma','Temple',75,'พระพุทธรูปขนาดใหญ่และจุดชมวิวเมืองทิมพู',true,false,10),
('thimphu_memorial','Thimphu','Memorial Chorten','Temple',45,'อนุสรณ์สถานสำคัญใจกลางเมืองทิมพู',true,false,20),
('thimphu_tashichho','Thimphu','Tashichho Dzong','Dzong',75,'ศูนย์กลางการบริหารราชการและศาสนาของเมืองทิมพู',true,true,30),
('thimphu_takin','Thimphu','Takin Zoo','Nature',60,'ชมทาคิน สัตว์ประจำชาติของภูฏาน',true,false,40),
('thimphu_library','Thimphu','National Library','Culture',60,'หอสมุดแห่งชาติและคัมภีร์สำคัญของภูฏาน',true,false,50),
('thimphu_post','Thimphu','National Post Office','Culture',45,'ที่ทำการไปรษณีย์แห่งชาติและตราไปรษณียากรภูฏาน',true,false,60),
('thimphu_sangaygang','Thimphu','Sangaygang View Point','Viewpoint',45,'จุดชมวิวเมืองทิมพู',true,false,70),
('thimphu_simtokha','Thimphu','Simtokha Dzong','Dzong',60,'หนึ่งในซองเก่าแก่ของภูฏาน',true,false,80),
('punakha_dochula','Punakha','Dochula Pass','Viewpoint',60,'จุดชมเจดีย์ Druk Wangyal 108 องค์บนเส้นทางทิมพู–พูนาคา',true,false,10),
('punakha_chimi','Punakha','Chimi Lhakhang','Temple',75,'วัดกลางหุบเขาที่มีเรื่องราวของ Drukpa Kunley',true,false,20),
('punakha_dzong','Punakha','Punakha Dzong','Dzong',90,'ซองสำคัญของอดีตเมืองหลวง ตั้งอยู่ระหว่างแม่น้ำ Pho Chhu และ Mo Chhu',true,true,30),
('punakha_bridge','Punakha','Punakha Suspension Bridge','Nature',60,'สะพานแขวนเหนือแม่น้ำและจุดชมวิวหุบเขาพูนาคา',true,false,40),
('gangtey_monastery','Gangtey','Gangtey Monastery','Temple',75,'อารามสำคัญเหนือหุบเขาโฟบจิกา',true,false,10),
('gangtey_phobjikha','Gangtey','Phobjikha Valley','Nature',120,'หุบเขาธรรมชาติและพื้นที่ชุ่มน้ำสำคัญ',true,false,20),
('gangtey_crane','Gangtey','Black-necked Crane Centre','Nature',75,'ศูนย์เรียนรู้นกกระเรียนคอดำ',true,false,30),
('haa_chelela','Haa','Chele La Pass','Viewpoint',60,'จุดชมวิวบนเส้นทางพาโร–ฮา',true,false,10),
('haa_valley','Haa','Haa Valley','Nature',120,'เที่ยวชมธรรมชาติและวิถีท้องถิ่นในหุบเขาฮา',true,false,20),
('haa_karpo','Haa','Lhakhang Karpo','Temple',60,'วัดสำคัญของเมืองฮา',true,false,30)
on conflict (id) do update set city=excluded.city,name=excluded.name,category=excluded.category,duration_minutes=excluded.duration_minutes,description=excluded.description,is_active=excluded.is_active,is_festival_venue=excluded.is_festival_venue,sort_order=excluded.sort_order,updated_at=now();

insert into public.tour_festivals
(id, name, city, venue_attraction_id, description, is_active, sort_order)
values
('festival_paro_tshechu','Paro Tshechu','Paro','paro_rinpung','เทศกาลประจำเมืองพาโร จัดบริเวณ Rinpung Dzong',true,10),
('festival_punakha_tshechu','Punakha Tshechu','Punakha','punakha_dzong','เทศกาลประจำพูนาคา จัดบริเวณ Punakha Dzong',true,20),
('festival_thimphu_tshechu','Thimphu Tshechu','Thimphu','thimphu_tashichho','เทศกาลประจำเมืองทิมพู จัดบริเวณ Tashichho Dzong',true,30)
on conflict (id) do update set name=excluded.name,city=excluded.city,venue_attraction_id=excluded.venue_attraction_id,description=excluded.description,is_active=excluded.is_active,sort_order=excluded.sort_order,updated_at=now();

-- AVÉRA backend. Everything lives in its own schema; clients only reach it through public.avera_* functions.
create schema if not exists avera;
revoke all on schema avera from public, anon, authenticated;

create table if not exists avera.players(
  id uuid primary key default gen_random_uuid(),
  secret_hash text unique not null,
  name text not null,
  look jsonb not null default '{"sp":0,"fur":0,"cl":0,"acc":0}',
  role text not null default 'player' check (role in ('player','mod','admin','owner')),
  coins int not null default 120 check (coins >= 0),
  items text[] not null default '{}',
  equip jsonb not null default '{}',
  renames timestamptz[] not null default '{}',
  banned_until timestamptz, ban_reason text,
  muted_until timestamptz,
  session uuid,
  earned_day date, earned_today int not null default 0,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  room text
);
create index if not exists players_name_idx on avera.players (lower(name));
create index if not exists players_seen_idx on avera.players (last_seen desc);

create table if not exists avera.reports(
  id bigserial primary key,
  player uuid references avera.players(id) on delete set null,
  src text,
  kind text not null,
  target text,
  body text not null,
  ctx jsonb,
  status text not null default 'open',
  note text,
  created_at timestamptz not null default now(),
  handled_at timestamptz, handled_by uuid
);
create index if not exists reports_created_idx on avera.reports (created_at desc);

create table if not exists avera.events(
  id bigserial primary key,
  created_at timestamptz not null default now(),
  target uuid,
  op text not null,
  data jsonb not null default '{}',
  by uuid
);
create index if not exists events_created_idx on avera.events (created_at);

create table if not exists avera.rooms(
  id text primary key default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  name text not null,
  owner uuid references avera.players(id) on delete cascade,
  owner_name text,
  cap int not null default 12 check (cap between 2 and 40),
  pub boolean not null default true,
  pw_hash text,
  locked boolean not null default false,
  perm boolean not null default false,
  chan text not null default encode(extensions.gen_random_bytes(8), 'hex'),
  theme text not null default 'neon',
  created_at timestamptz not null default now(),
  closes_at timestamptz,
  closed boolean not null default false
);
create index if not exists rooms_open_idx on avera.rooms (closed, perm);
create index if not exists players_room_idx on avera.players (room, last_seen);
create table if not exists avera.config(k text primary key, v jsonb not null);
create table if not exists avera.audit(id bigserial primary key, at timestamptz not null default now(), by uuid, op text, data jsonb);

alter table avera.players enable row level security;
alter table avera.reports enable row level security;
alter table avera.events enable row level security;
alter table avera.config enable row level security;
alter table avera.audit enable row level security;
alter table avera.rooms enable row level security;

insert into avera.config(k,v) values
 ('capacity','40'),
 ('maintenance','false'),
 ('maint_msg','"AVÉRA 正在維護中，請稍後再回來。"'),
 ('motd','""'),
 ('tv_lock','false'),
 ('theme','"neon"'),
 ('shop','{"cola":{"n":"霓虹可樂","p":15,"k":"drink"},"bubble":{"n":"珍珠奶茶","p":25,"k":"drink"},"soda":{"n":"彩虹汽水","p":18,"k":"drink"},"popcorn":{"n":"焦糖爆米花","p":20,"k":"eat"},"hotdog":{"n":"大熱狗","p":30,"k":"eat"},"fries":{"n":"黃金薯條","p":20,"k":"eat"},"icecream":{"n":"霜淇淋","p":22,"k":"eat"},"donut":{"n":"糖霜甜甜圈","p":18,"k":"eat"}}'),
 ('admin_key_hash','"767a51addefce0d9feb9c613f79b2d3f6a6ee8bc3750c06dc70658426c1eeb1a"')
on conflict (k) do nothing;

-- ---------- helpers (not exposed) ----------
create or replace function avera._hash(s text) returns text language sql immutable set search_path = '' as
$$ select encode(extensions.digest(coalesce(s,''),'sha256'),'hex') $$;

create or replace function avera._rank(r text) returns int language sql immutable set search_path = '' as
$$ select case r when 'owner' then 3 when 'admin' then 2 when 'mod' then 1 else 0 end $$;

create or replace function avera._clean_name(t text) returns text language plpgsql immutable set search_path = '' as $$
declare n text;
begin
  n := regexp_replace(coalesce(t,''), '[[:cntrl:]<>"`\\]', '', 'g');
  n := btrim(regexp_replace(n, '\s+', ' ', 'g'));
  if char_length(n) > 12 then n := left(n, 12); end if;
  if char_length(n) = 0 then return null; end if;
  return n;
end $$;

create or replace function avera._clean_look(l jsonb) returns jsonb language plpgsql immutable set search_path = '' as $$
declare sp int; fur int; cl int; acc int;
begin
  sp := coalesce((l->>'sp')::int,0); fur := coalesce((l->>'fur')::int,0); cl := coalesce((l->>'cl')::int,0); acc := coalesce((l->>'acc')::int,0);
  if sp not between 0 and 7 then sp := 0; end if;
  if fur not between 0 and 7 then fur := 0; end if;
  if cl not between 0 and 7 then cl := 0; end if;
  if acc not between 0 and 5 then acc := 0; end if;
  return jsonb_build_object('sp',sp,'fur',fur,'cl',cl,'acc',acc);
exception when others then return '{"sp":0,"fur":0,"cl":0,"acc":0}'::jsonb;
end $$;

create or replace function avera._config_public() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(k, v),'{}'::jsonb) from avera.config where k in ('capacity','maintenance','maint_msg','motd','tv_lock','shop','theme')
$$;

create or replace function avera._profile(pid uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'look', p.look, 'role', p.role, 'coins', p.coins, 'items', to_jsonb(p.items), 'equip', p.equip,
    'renames', (select coalesce(jsonb_agg(x order by x), '[]'::jsonb) from unnest(p.renames) x where x > now() - interval '14 days'),
    'muted_until', p.muted_until, 'created_at', p.created_at)
  from avera.players p where p.id = pid
$$;

create or replace function avera._me(p_secret text) returns avera.players language sql stable security definer set search_path = '' as $$
  select * from avera.players where secret_hash = avera._hash(p_secret)
$$;

-- ---------- public API ----------
create or replace function public.avera_config() returns jsonb language sql stable security definer set search_path = '' as
$$ select avera._config_public() $$;

create or replace function public.avera_join(p_secret text, p_name text, p_look jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players; sid uuid := gen_random_uuid(); last_ev bigint; nm text;
begin
  if p_secret is null or char_length(p_secret) < 24 or char_length(p_secret) > 128 then return jsonb_build_object('error','bad_secret'); end if;
  r := avera._me(p_secret);
  if r.id is null then
    nm := avera._clean_name(p_name);
    if nm is null or char_length(nm) < 2 then return jsonb_build_object('error','need_name'); end if;
    if nm ~* '(admin|管理|官方|av[eé]ra|客服|系統|gm\M|staff|mod\M)' then return jsonb_build_object('error','reserved'); end if;
    insert into avera.players(secret_hash, name, look) values (avera._hash(p_secret), nm, avera._clean_look(p_look)) returning * into r;
  end if;
  if r.banned_until is not null and r.banned_until > now() then
    return jsonb_build_object('error','banned','until',r.banned_until,'reason',r.ban_reason);
  end if;
  if (select v from avera.config where k='maintenance') = 'true'::jsonb and avera._rank(r.role) = 0 then
    return jsonb_build_object('error','maintenance','msg',(select v from avera.config where k='maint_msg'));
  end if;
  update avera.players set session = sid, last_seen = now() where id = r.id;
  delete from avera.events where created_at < now() - interval '7 days';
  select coalesce(max(id),0) into last_ev from avera.events;
  return jsonb_build_object('profile', avera._profile(r.id), 'session', sid, 'since', last_ev, 'config', avera._config_public());
end $$;

create or replace function public.avera_poll(p_secret text, p_session uuid, p_since bigint, p_room text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players; evs jsonb; mx bigint;
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('error','no_player'); end if;
  if r.session is distinct from p_session then return jsonb_build_object('replaced', true); end if;
  if r.banned_until is not null and r.banned_until > now() then return jsonb_build_object('error','banned','until',r.banned_until,'reason',r.ban_reason); end if;
  update avera.players set last_seen = now(), room = left(p_room, 16) where id = r.id;
  select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'op',e.op,'data',e.data,'target',e.target,'at',e.created_at) order by e.id), '[]'::jsonb), coalesce(max(e.id), p_since)
    into evs, mx from (select * from avera.events where id > coalesce(p_since,0) and (target is null or target = r.id) order by id limit 50) e;
  return jsonb_build_object('ok', true, 'events', evs, 'since', mx, 'profile', avera._profile(r.id), 'config', avera._config_public());
end $$;

create or replace function public.avera_rename(p_secret text, p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players; n text; recent timestamptz[];
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('error','no_player'); end if;
  n := avera._clean_name(p_name);
  if n is null then return jsonb_build_object('error','invalid'); end if;
  if n = r.name then return jsonb_build_object('error','same'); end if;
  if avera._rank(r.role) = 0 and n ~* '(admin|管理|官方|av[eé]ra|客服|系統|gm\M|staff|mod\M)' then return jsonb_build_object('error','reserved'); end if;
  select coalesce(array_agg(x order by x), '{}') into recent from unnest(r.renames) x where x > now() - interval '14 days';
  if cardinality(recent) >= 2 then return jsonb_build_object('error','limit','next', recent[1] + interval '14 days'); end if;
  update avera.players set name = n, renames = recent || now() where id = r.id;
  return jsonb_build_object('ok', true, 'profile', avera._profile(r.id));
end $$;

create or replace function public.avera_report(p_secret text, p_kind text, p_target text, p_body text, p_ctx jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players; h text := avera._hash(p_secret); b text;
begin
  if p_secret is null or char_length(p_secret) < 24 then return jsonb_build_object('error','bad_secret'); end if;
  if p_kind not in ('bug','player','contact','idea','other') then return jsonb_build_object('error','kind'); end if;
  b := btrim(coalesce(p_body,''));
  if char_length(b) < 2 or char_length(b) > 1000 then return jsonb_build_object('error','length'); end if;
  if (select count(*) from avera.reports where src = h and created_at > now() - interval '1 hour') >= 6 then return jsonb_build_object('error','rate'); end if;
  r := avera._me(p_secret);
  insert into avera.reports(player, src, kind, target, body, ctx) values (r.id, h, p_kind, left(p_target,40), b, case when p_ctx is null or pg_column_size(p_ctx) > 4000 then null else p_ctx end);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.avera_earn(p_secret text, p_game text, p_amount int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players; amt int; today int;
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('error','no_player'); end if;
  today := case when r.earned_day = current_date then r.earned_today else 0 end;
  amt := least(greatest(coalesce(p_amount,0),0), 40, greatest(0, 800 - today));
  update avera.players set coins = coins + amt, earned_today = today + amt, earned_day = current_date where id = r.id returning coins into r.coins;
  return jsonb_build_object('ok', true, 'coins', r.coins, 'earned', amt);
end $$;

create or replace function public.avera_buy(p_secret text, p_item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players; it jsonb; price int;
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('error','no_player'); end if;
  select v -> p_item into it from avera.config where k = 'shop';
  if it is null or coalesce(it->>'off','false') = 'true' then return jsonb_build_object('error','item'); end if;
  price := greatest(0, coalesce((it->>'p')::int, 0));
  if r.coins < price then return jsonb_build_object('error','coins','coins',r.coins); end if;
  update avera.players set coins = coins - price where id = r.id returning coins into r.coins;
  return jsonb_build_object('ok', true, 'coins', r.coins);
end $$;

create or replace function public.avera_equip(p_secret text, p_slot text, p_item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players;
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('error','no_player'); end if;
  if p_slot not in ('hat','back','tag','pet','trail','fx') then return jsonb_build_object('error','slot'); end if;
  if p_item is not null and not (p_item = any(r.items)) then return jsonb_build_object('error','not_owned'); end if;
  update avera.players set equip = case when p_item is null then equip - p_slot else equip || jsonb_build_object(p_slot, p_item) end where id = r.id;
  return jsonb_build_object('ok', true, 'profile', avera._profile(r.id));
end $$;

create or replace function public.avera_claim(p_secret text, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players;
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('error','no_player'); end if;
  if avera._hash(btrim(coalesce(p_key,''))) <> (select v #>> '{}' from avera.config where k = 'admin_key_hash') then
    perform pg_sleep(1.5);
    return jsonb_build_object('error','key');
  end if;
  update avera.players set role = 'owner' where id = r.id;
  insert into avera.audit(by, op, data) values (r.id, 'claim_owner', '{}');
  return jsonb_build_object('ok', true, 'profile', avera._profile(r.id));
end $$;

create or replace function public.avera_admin(p_secret text, p_op text, p_a jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me avera.players; t avera.players; my int; tid uuid; q text; res jsonb; n text; mins int; hrs int; d int; itm text; rl text; ck text;
begin
  me := avera._me(p_secret);
  if me.id is null then return jsonb_build_object('error','no_player'); end if;
  my := avera._rank(me.role);
  if my < 1 then return jsonb_build_object('error','forbidden'); end if;
  p_a := coalesce(p_a, '{}'::jsonb);
  if p_a ? 'id' then
    begin tid := (p_a->>'id')::uuid; exception when others then return jsonb_build_object('error','bad_id'); end;
    select * into t from avera.players where id = tid;
    if t.id is null then return jsonb_build_object('error','no_target'); end if;
  end if;

  if p_op = 'players' then
    q := btrim(coalesce(p_a->>'q',''));
    select coalesce(jsonb_agg(x), '[]'::jsonb) into res from (
      select id, name, role, coins, look, items, last_seen, created_at, banned_until, ban_reason, muted_until
      from avera.players
      where q = '' or name ilike '%' || replace(replace(q,'%',''),'_','') || '%' or id::text = q
      order by last_seen desc limit 60) x;
    return jsonb_build_object('ok', true, 'players', res);
  elsif p_op = 'stats' then
    return jsonb_build_object('ok', true,
      'players', (select count(*) from avera.players),
      'active_today', (select count(*) from avera.players where last_seen > now() - interval '1 day'),
      'online', (select count(*) from avera.players where last_seen > now() - interval '2 minutes'),
      'open_reports', (select count(*) from avera.reports where status = 'open'));
  elsif p_op = 'reports' then
    select coalesce(jsonb_agg(x), '[]'::jsonb) into res from (
      select r.id, r.kind, r.target, r.body, r.ctx, r.status, r.note, r.created_at, p.name as player_name, r.player
      from avera.reports r left join avera.players p on p.id = r.player
      where coalesce(p_a->>'status','open') = 'all' or r.status = coalesce(p_a->>'status','open')
      order by r.created_at desc limit 100) x;
    return jsonb_build_object('ok', true, 'reports', res);
  elsif p_op = 'resolve' then
    update avera.reports set status = coalesce(nullif(p_a->>'status',''),'done'), note = left(p_a->>'note',300), handled_at = now(), handled_by = me.id where id = (p_a->>'rid')::bigint;
  elsif p_op = 'announce' then
    n := left(btrim(coalesce(p_a->>'text','')), 200);
    if n = '' then return jsonb_build_object('error','empty'); end if;
    insert into avera.events(target, op, data, by) values (null, 'announce', jsonb_build_object('text', n, 'by', me.name), me.id);
  elsif p_op = 'tv' then
    if coalesce(p_a->>'op','') not in ('skip','clear','lock','unlock') then return jsonb_build_object('error','bad_op'); end if;
    if p_a->>'op' in ('lock','unlock') then
      update avera.config set v = to_jsonb(p_a->>'op' = 'lock') where k = 'tv_lock';
    end if;
    insert into avera.events(target, op, data, by) values (null, 'tv', jsonb_build_object('op', p_a->>'op'), me.id);
  elsif p_op in ('kick','mute','ban','unban','rename','look','grant','revoke','coins','role') then
    if t.id is null then return jsonb_build_object('error','no_target'); end if;
    if t.id <> me.id and avera._rank(t.role) >= my then return jsonb_build_object('error','rank'); end if;
    if t.id = me.id and p_op in ('kick','mute','ban') then return jsonb_build_object('error','self'); end if;
    if p_op = 'kick' then
      insert into avera.events(target, op, data, by) values (t.id, 'kick', jsonb_build_object('reason', left(coalesce(p_a->>'reason',''),120)), me.id);
    elsif p_op = 'mute' then
      mins := least(greatest(coalesce((p_a->>'minutes')::int,0),0), 43200);
      update avera.players set muted_until = case when mins = 0 then null else now() + make_interval(mins => mins) end where id = t.id;
      insert into avera.events(target, op, data, by) values (t.id, 'mute', jsonb_build_object('minutes', mins), me.id);
    elsif p_op in ('ban','unban') then
      if my < 2 then return jsonb_build_object('error','forbidden'); end if;
      if p_op = 'ban' then
        hrs := greatest(coalesce((p_a->>'hours')::int,0),0);
        update avera.players set banned_until = case when hrs = 0 then 'infinity'::timestamptz else now() + make_interval(hours => hrs) end, ban_reason = left(coalesce(p_a->>'reason',''),200), session = null where id = t.id;
        insert into avera.events(target, op, data, by) values (t.id, 'ban', jsonb_build_object('hours', hrs, 'reason', left(coalesce(p_a->>'reason',''),200)), me.id);
      else
        update avera.players set banned_until = null, ban_reason = null where id = t.id;
      end if;
    elsif p_op = 'rename' then
      if my < 2 then return jsonb_build_object('error','forbidden'); end if;
      n := avera._clean_name(p_a->>'name');
      if n is null then return jsonb_build_object('error','invalid'); end if;
      update avera.players set name = n where id = t.id;
      insert into avera.events(target, op, data, by) values (t.id, 'profile', jsonb_build_object('why','rename'), me.id);
    elsif p_op = 'look' then
      if my < 2 then return jsonb_build_object('error','forbidden'); end if;
      update avera.players set look = avera._clean_look(p_a->'look') where id = t.id;
      insert into avera.events(target, op, data, by) values (t.id, 'profile', jsonb_build_object('why','look'), me.id);
    elsif p_op in ('grant','revoke') then
      if my < 2 then return jsonb_build_object('error','forbidden'); end if;
      itm := p_a->>'item';
      if itm is null or itm !~ '^[a-z0-9_]{2,24}$' then return jsonb_build_object('error','item'); end if;
      if p_op = 'grant' then
        update avera.players set items = array_append(array_remove(items, itm), itm) where id = t.id;
      else
        update avera.players set items = array_remove(items, itm), equip = (select coalesce(jsonb_object_agg(k2, v2), '{}'::jsonb) from jsonb_each(equip) e(k2, v2) where v2 #>> '{}' <> itm) where id = t.id;
      end if;
      insert into avera.events(target, op, data, by) values (t.id, 'profile', jsonb_build_object('why', p_op, 'item', itm), me.id);
    elsif p_op = 'coins' then
      if my < 2 then return jsonb_build_object('error','forbidden'); end if;
      d := least(greatest(coalesce((p_a->>'delta')::int,0), -1000000), 1000000);
      update avera.players set coins = greatest(0, coins + d) where id = t.id;
      insert into avera.events(target, op, data, by) values (t.id, 'profile', jsonb_build_object('why','coins','delta', d), me.id);
    elsif p_op = 'role' then
      if my < 3 then return jsonb_build_object('error','forbidden'); end if;
      rl := p_a->>'role';
      if rl not in ('player','mod','admin') then return jsonb_build_object('error','role'); end if;
      update avera.players set role = rl where id = t.id;
      insert into avera.events(target, op, data, by) values (t.id, 'profile', jsonb_build_object('why','role','role', rl), me.id);
    end if;
  elsif p_op = 'config' then
    if my < 2 then return jsonb_build_object('error','forbidden'); end if;
    ck := p_a->>'k';
    if ck not in ('capacity','maintenance','maint_msg','motd','shop','theme') then return jsonb_build_object('error','key'); end if;
    if ck = 'capacity' and coalesce((p_a->>'v')::int, 0) not between 2 and 200 then return jsonb_build_object('error','range'); end if;
    if pg_column_size(p_a->'v') > 8000 then return jsonb_build_object('error','size'); end if;
    insert into avera.config(k, v) values (ck, p_a->'v') on conflict (k) do update set v = excluded.v;
    insert into avera.events(target, op, data, by) values (null, 'config', jsonb_build_object('k', ck), me.id);
  elsif p_op = 'rooms' then
    select coalesce(jsonb_agg(x), '[]'::jsonb) into res from (
      select r.id, r.name, r.cap, r.pub, r.pw_hash is not null as has_pw, r.locked, r.perm, r.owner_name, r.theme, r.created_at, r.closed, r.closes_at,
        (select count(*) from avera.players p where p.room = r.id and p.last_seen > now() - interval '60 seconds') as count
      from avera.rooms r where not r.closed order by r.perm desc, r.created_at desc limit 100) x;
    return jsonb_build_object('ok', true, 'rooms', res);
  elsif p_op = 'room_create' then
    if my < 2 then return jsonb_build_object('error','forbidden'); end if;
    insert into avera.rooms(name, owner, owner_name, cap, pub, perm, theme) values (coalesce(avera._clean_name(p_a->>'name'),'AVÉRA 大廳'), null, 'AVÉRA', least(greatest(coalesce((p_a->>'cap')::int,40),2),40), coalesce((p_a->>'pub')::boolean, true), true, coalesce(p_a->>'theme','neon'));
  elsif p_op = 'room_close' then
    update avera.rooms set closed = true, closes_at = now() where id = p_a->>'rid';
  elsif p_op = 'audit' then
    if my < 2 then return jsonb_build_object('error','forbidden'); end if;
    select coalesce(jsonb_agg(x), '[]'::jsonb) into res from (
      select a.at, a.op, a.data, p.name as by_name from avera.audit a left join avera.players p on p.id = a.by order by a.at desc limit 100) x;
    return jsonb_build_object('ok', true, 'audit', res);
  else
    return jsonb_build_object('error','bad_op');
  end if;
  insert into avera.audit(by, op, data) values (me.id, p_op, p_a);
  return jsonb_build_object('ok', true, 'event', (select max(id) from avera.events));
end $$;


create or replace function public.avera_me(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r avera.players;
begin
  r := avera._me(p_secret);
  if r.id is null then return jsonb_build_object('none', true, 'config', avera._config_public()); end if;
  return jsonb_build_object('profile', avera._profile(r.id), 'config', avera._config_public());
end $$;

create or replace function avera._room_json(rm avera.rooms, with_chan boolean) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', rm.id, 'name', rm.name, 'cap', rm.cap, 'pub', rm.pub, 'has_pw', rm.pw_hash is not null, 'locked', rm.locked, 'perm', rm.perm,
    'owner', rm.owner, 'owner_name', rm.owner_name, 'theme', rm.theme, 'closes_at', rm.closes_at,
    'count', (select count(*) from avera.players p where p.room = rm.id and p.last_seen > now() - interval '60 seconds'))
    || case when with_chan then jsonb_build_object('chan', rm.chan) else '{}'::jsonb end
$$;

create or replace function public.avera_rooms(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me avera.players; res jsonb;
begin
  me := avera._me(p_secret);
  update avera.rooms r set closed = true where not r.closed and not r.perm and (
    (r.closes_at is not null and r.closes_at < now()) or
    (r.created_at < now() - interval '2 minutes' and not exists (select 1 from avera.players o where o.id = r.owner and o.room = r.id and o.last_seen > now() - interval '90 seconds')));
  select coalesce(jsonb_agg(avera._room_json(r, false) || jsonb_build_object('mine', r.owner is not null and r.owner = me.id) order by r.perm desc, r.created_at desc), '[]'::jsonb) into res
  from avera.rooms r where not r.closed and (r.pub or r.owner = me.id or avera._rank(coalesce(me.role,'player')) >= 1);
  return jsonb_build_object('ok', true, 'rooms', res, 'main_count', (select count(*) from avera.players p where p.room = 'main' and p.last_seen > now() - interval '60 seconds'));
end $$;

create or replace function public.avera_room_create(p_secret text, p_name text, p_cap int, p_pub boolean, p_pw text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me avera.players; rm avera.rooms;
begin
  me := avera._me(p_secret);
  if me.id is null then return jsonb_build_object('error','no_player'); end if;
  update avera.rooms set closed = true where owner = me.id and not perm and not closed;
  insert into avera.rooms(name, owner, owner_name, cap, pub, pw_hash)
    values (coalesce(avera._clean_name(p_name), me.name || ' 的包廂'), me.id, me.name, least(greatest(coalesce(p_cap,12),2),40), coalesce(p_pub,true),
            case when coalesce(p_pw,'') = '' then null else avera._hash('avera:' || p_pw) end)
    returning * into rm;
  return jsonb_build_object('ok', true, 'room', avera._room_json(rm, true));
end $$;

create or replace function public.avera_room_join(p_secret text, p_id text, p_pw text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me avera.players; rm avera.rooms; cnt int; mine boolean; staff boolean;
begin
  me := avera._me(p_secret);
  if me.id is null then return jsonb_build_object('error','no_player'); end if;
  select * into rm from avera.rooms where id = p_id;
  if rm.id is null or rm.closed or (rm.closes_at is not null and rm.closes_at < now()) then return jsonb_build_object('error','gone'); end if;
  mine := rm.owner is not null and rm.owner = me.id; staff := avera._rank(me.role) >= 1;
  if rm.locked and not mine and not staff then return jsonb_build_object('error','locked'); end if;
  if rm.pw_hash is not null and not mine and not staff then
    if coalesce(p_pw,'') = '' then return jsonb_build_object('error','password'); end if;
    if avera._hash('avera:' || p_pw) <> rm.pw_hash then perform pg_sleep(0.8); return jsonb_build_object('error','password_wrong'); end if;
  end if;
  select count(*) into cnt from avera.players p where p.room = rm.id and p.last_seen > now() - interval '60 seconds' and p.id <> me.id;
  update avera.players set room = rm.id, last_seen = now() where id = me.id;
  return jsonb_build_object('ok', true, 'room', avera._room_json(rm, true) || jsonb_build_object('is_owner', mine), 'count', cnt, 'full', cnt >= rm.cap and not mine and not staff);
end $$;

create or replace function public.avera_room_update(p_secret text, p_id text, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me avera.players; rm avera.rooms;
begin
  me := avera._me(p_secret);
  select * into rm from avera.rooms where id = p_id and not closed;
  if me.id is null or rm.id is null then return jsonb_build_object('error','gone'); end if;
  if not ((rm.owner is not null and rm.owner = me.id) or avera._rank(me.role) >= 1) then return jsonb_build_object('error','forbidden'); end if;
  update avera.rooms set
    name = coalesce(avera._clean_name(p_patch->>'name'), name),
    cap = case when p_patch ? 'cap' then least(greatest((p_patch->>'cap')::int, 2), 40) else cap end,
    pub = case when p_patch ? 'pub' then (p_patch->>'pub')::boolean else pub end,
    locked = case when p_patch ? 'locked' then (p_patch->>'locked')::boolean else locked end,
    theme = case when p_patch->>'theme' in ('neon','sunset','ocean','forest','sakura','gold','mono') then p_patch->>'theme' else theme end,
    pw_hash = case when p_patch ? 'pw' then (case when coalesce(p_patch->>'pw','') = '' then null else avera._hash('avera:' || (p_patch->>'pw')) end) else pw_hash end
  where id = rm.id returning * into rm;
  return jsonb_build_object('ok', true, 'room', avera._room_json(rm, false));
end $$;

create or replace function public.avera_room_close(p_secret text, p_id text, p_delay int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me avera.players; rm avera.rooms;
begin
  me := avera._me(p_secret);
  select * into rm from avera.rooms where id = p_id and not closed;
  if me.id is null or rm.id is null then return jsonb_build_object('error','gone'); end if;
  if rm.perm and avera._rank(me.role) < 2 then return jsonb_build_object('error','forbidden'); end if;
  if not rm.perm and not (rm.owner = me.id or avera._rank(me.role) >= 1) then return jsonb_build_object('error','forbidden'); end if;
  update avera.rooms set closes_at = now() + make_interval(secs => least(greatest(coalesce(p_delay,0),0),120)), closed = coalesce(p_delay,0) <= 0 where id = rm.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.avera_room_leave(p_secret text) returns jsonb
language sql security definer set search_path = '' as $$
  update avera.players set room = null where secret_hash = avera._hash(p_secret) returning jsonb_build_object('ok', true)
$$;

revoke all on function avera._hash(text), avera._rank(text), avera._clean_name(text), avera._clean_look(jsonb), avera._config_public(), avera._profile(uuid), avera._me(text), avera._room_json(avera.rooms, boolean) from public, anon, authenticated;
revoke all on function public.avera_config(), public.avera_me(text), public.avera_join(text,text,jsonb), public.avera_poll(text,uuid,bigint,text), public.avera_rename(text,text), public.avera_report(text,text,text,text,jsonb), public.avera_earn(text,text,int), public.avera_buy(text,text), public.avera_equip(text,text,text), public.avera_claim(text,text), public.avera_admin(text,text,jsonb), public.avera_rooms(text), public.avera_room_create(text,text,int,boolean,text), public.avera_room_join(text,text,text), public.avera_room_update(text,text,jsonb), public.avera_room_close(text,text,int), public.avera_room_leave(text) from public;
grant execute on function public.avera_config(), public.avera_me(text), public.avera_join(text,text,jsonb), public.avera_poll(text,uuid,bigint,text), public.avera_rename(text,text), public.avera_report(text,text,text,text,jsonb), public.avera_earn(text,text,int), public.avera_buy(text,text), public.avera_equip(text,text,text), public.avera_claim(text,text), public.avera_admin(text,text,jsonb), public.avera_rooms(text), public.avera_room_create(text,text,int,boolean,text), public.avera_room_join(text,text,text), public.avera_room_update(text,text,jsonb), public.avera_room_close(text,text,int), public.avera_room_leave(text) to anon, authenticated;

-- ===== round 3: economy, leaderboards, anti-cheat flags =====
alter table avera.players alter column coins set default 5000;
alter table avera.players add column if not exists daily_day date;
create table if not exists avera.scores(player uuid references avera.players(id) on delete cascade, game text, score int, at timestamptz default now(), primary key(player, game));
create table if not exists avera.flags(id bigserial primary key, player uuid, kind text, data jsonb, at timestamptz default now(), ip text);
alter table avera.scores enable row level security;alter table avera.flags enable row level security;

create or replace function avera._ip() returns text language sql stable set search_path = '' as
$$ select split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for',''), ',', 1) $$;

create or replace function public.avera_daily(p_secret text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players;
begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
  if r.daily_day is distinct from current_date then update avera.players set coins = coins + 1000, daily_day = current_date where id = r.id returning coins into r.coins; return jsonb_build_object('ok',true,'daily',1000,'coins',r.coins); end if;
  return jsonb_build_object('ok',true,'daily',0,'coins',r.coins); end $$;

create or replace function public.avera_spend(p_secret text, p_game text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; c int;
begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
  c := case p_game when 'claw' then 30 when 'bowl' then 30 when 'racer' then 15 when 'hoops' then 15 when 'hockey' then 15 when 'dance' then 15 else 10 end;
  if r.coins < c then return jsonb_build_object('error','coins','coins',r.coins); end if;
  update avera.players set coins = coins - c where id = r.id returning coins into r.coins; return jsonb_build_object('ok',true,'coins',r.coins); end $$;

create or replace function public.avera_score(p_secret text, p_game text, p_score int) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; cap int;
begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
  cap := case p_game when 'racer' then 20000 when 'brick' then 20000 when 'grip' then 5000 when 'bowl' then 300 when 'claw' then 30 else 3000 end;
  if p_score < 0 or p_score > cap then insert into avera.flags(player,kind,data,ip) values (r.id,'impossible_score',jsonb_build_object('game',p_game,'score',p_score),avera._ip()); return jsonb_build_object('error','rejected'); end if;
  insert into avera.scores(player,game,score) values (r.id,p_game,p_score) on conflict (player,game) do update set score = greatest(avera.scores.score, excluded.score), at = now();
  return jsonb_build_object('ok',true); end $$;

create or replace function public.avera_leaderboard(p_game text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('top', coalesce(jsonb_agg(x), '[]'::jsonb)) from (select p.name, p.look, s.score from avera.scores s join avera.players p on p.id = s.player where s.game = p_game and (p.banned_until is null or p.banned_until < now()) order by s.score desc limit 20) x $$;

create or replace function public.avera_flag(p_secret text, p_kind text, p_data jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players;
begin r := avera._me(p_secret);
  if (select count(*) from avera.flags where player = r.id and at > now() - interval '1 hour') > 30 then return jsonb_build_object('ok',true); end if;
  insert into avera.flags(player,kind,data,ip) values (r.id, left(p_kind,24), case when pg_column_size(p_data) > 4000 then null else p_data end, avera._ip()); return jsonb_build_object('ok',true); end $$;

grant execute on function public.avera_daily(text), public.avera_spend(text,text), public.avera_score(text,text,int), public.avera_leaderboard(text), public.avera_flag(text,text,jsonb) to anon, authenticated;

create or replace function avera._clean_look(l jsonb) returns jsonb language plpgsql immutable set search_path = '' as $$
declare sp int; fur int; cl int; acc int;
begin
  sp := coalesce((l->>'sp')::int,0); fur := coalesce((l->>'fur')::int,0); cl := coalesce((l->>'cl')::int,0); acc := coalesce((l->>'acc')::int,0);
  if sp not between 0 and 7 then sp := 0; end if; if fur not between 0 and 7 then fur := 0; end if;
  if cl not between 0 and 7 then cl := 0; end if; if acc not between 0 and 13 then acc := 0; end if;
  return jsonb_build_object('sp',sp,'fur',fur,'cl',cl,'acc',acc);
exception when others then return '{"sp":0,"fur":0,"cl":0,"acc":0}'::jsonb;
end $$;

create or replace function public.avera_buy_prop(p_secret text, p_item text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; price int;
begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
  price := case p_item when 'sparkler' then 200 when 'mic' then 300 when 'umbrella' then 250 when 'plush' then 400 when 'wand' then 500 when 'guitar' then 600 else null end;
  if price is null then return jsonb_build_object('error','item'); end if;
  if ('prop_' || p_item) = any(r.items) then return jsonb_build_object('ok',true,'coins',r.coins,'items',to_jsonb(r.items)); end if;
  if r.coins < price then return jsonb_build_object('error','coins'); end if;
  update avera.players set coins = coins - price, items = array_append(items, 'prop_' || p_item) where id = r.id returning * into r;
  return jsonb_build_object('ok',true,'coins',r.coins,'items',to_jsonb(r.items)); end $$;
grant execute on function public.avera_buy_prop(text,text) to anon, authenticated;

create table if not exists avera.chat(id bigserial primary key, player uuid, room text, msg text, at timestamptz default now(), ip text);
create table if not exists avera.logins(id bigserial primary key, player uuid, dev jsonb, ip text, at timestamptz default now());
create table if not exists avera.room_stats(room text primary key, stat jsonb, at timestamptz default now());
alter table avera.chat enable row level security;alter table avera.logins enable row level security;alter table avera.room_stats enable row level security;
create or replace function public.avera_chat(p_secret text, p_room text, p_msg text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
 if (select count(*) from avera.chat where player = r.id and at > now() - interval '10 seconds') >= 6 then return jsonb_build_object('error','rate'); end if;
 insert into avera.chat(player, room, msg, ip) values (r.id, left(p_room,16), left(p_msg,120), avera._ip()); return jsonb_build_object('ok',true); end $$;
create or replace function public.avera_login_log(p_secret text, p_dev jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
 insert into avera.logins(player, dev, ip) values (r.id, case when pg_column_size(p_dev) > 3000 then null else p_dev end, avera._ip()); return jsonb_build_object('ok',true); end $$;
create or replace function public.avera_room_stat(p_secret text, p_stat jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; begin r := avera._me(p_secret); if r.id is null then return jsonb_build_object('error','no_player'); end if;
 insert into avera.room_stats(room, stat) values (left(p_stat->>'id',16), p_stat) on conflict (room) do update set stat = excluded.stat, at = now(); return jsonb_build_object('ok',true); end $$;
create or replace function public.avera_admin_logs(p_secret text, p_kind text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare me avera.players; res jsonb; begin me := avera._me(p_secret); if me.id is null or avera._rank(me.role) < 1 then return jsonb_build_object('error','forbidden'); end if;
 if p_kind = 'chat' then select coalesce(jsonb_agg(x),'[]') into res from (select c.at, c.room, c.msg, c.ip, p.name from avera.chat c left join avera.players p on p.id=c.player order by c.at desc limit 300) x;
 elsif p_kind = 'logins' then select coalesce(jsonb_agg(x),'[]') into res from (select l.at, l.ip, l.dev, p.name, p.id from avera.logins l left join avera.players p on p.id=l.player order by l.at desc limit 300) x;
 elsif p_kind = 'flags' then select coalesce(jsonb_agg(x),'[]') into res from (select f.at, f.kind, f.data, f.ip, p.name from avera.flags f left join avera.players p on p.id=f.player order by f.at desc limit 300) x;
 elsif p_kind = 'rooms' then select coalesce(jsonb_agg(x),'[]') into res from (select room, stat, at from avera.room_stats where at > now() - interval '2 minutes' order by at desc) x;
 elsif p_kind = 'signups' then select coalesce(jsonb_agg(x),'[]') into res from (select name, created_at, id from avera.players order by created_at desc limit 100) x;
 else return jsonb_build_object('error','kind'); end if;
 return jsonb_build_object('ok',true,'rows',res); end $$;
grant execute on function public.avera_chat(text,text,text), public.avera_login_log(text,jsonb), public.avera_room_stat(text,jsonb), public.avera_admin_logs(text,text) to anon, authenticated;

-- admin page password (8h sessions are enforced client-side; every check is logged)
alter table avera.players add column if not exists admin_pw text;
create or replace function public.avera_admin_pw(p_secret text, p_op text, p_pw text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r avera.players; begin r := avera._me(p_secret);
 if r.id is null or avera._rank(r.role) < 1 then insert into avera.flags(player,kind,data,ip) values (r.id,'admin_probe',jsonb_build_object('op',p_op),avera._ip()); perform pg_sleep(1); return jsonb_build_object('error','forbidden'); end if;
 if p_op = 'has' then return jsonb_build_object('has', r.admin_pw is not null); end if;
 if p_op = 'set' then if r.admin_pw is not null or char_length(coalesce(p_pw,'')) < 8 then return jsonb_build_object('error','set'); end if; update avera.players set admin_pw = extensions.crypt(p_pw, extensions.gen_salt('bf')) where id = r.id; return jsonb_build_object('ok',true); end if;
 if p_op = 'check' then if r.admin_pw is not null and r.admin_pw = extensions.crypt(coalesce(p_pw,''), r.admin_pw) then insert into avera.audit(by,op,data) values (r.id,'admin_login',jsonb_build_object('ip',avera._ip())); return jsonb_build_object('ok',true); end if;
  insert into avera.flags(player,kind,data,ip) values (r.id,'admin_bad_password','{}',avera._ip()); perform pg_sleep(1.5); return jsonb_build_object('error','password'); end if;
 return jsonb_build_object('error','op'); end $$;
grant execute on function public.avera_admin_pw(text,text,text) to anon, authenticated;
-- nightly backup + optimise at 20:00 Asia/Taipei (12:00 UTC)
create table if not exists avera.backups(id bigserial primary key, at timestamptz default now(), data jsonb);
alter table avera.backups enable row level security;
create or replace function avera.backup_now() returns void language sql security definer set search_path = '' as $$
 insert into avera.backups(data) select jsonb_build_object('players',(select coalesce(jsonb_agg(p),'[]') from avera.players p),'rooms',(select coalesce(jsonb_agg(r),'[]') from avera.rooms r),'config',(select coalesce(jsonb_object_agg(k,v),'{}') from avera.config),'scores',(select coalesce(jsonb_agg(s),'[]') from avera.scores s));
 delete from avera.backups where at < now() - interval '14 days';
 delete from avera.chat where at < now() - interval '180 days'; delete from avera.logins where at < now() - interval '180 days'; $$;
create extension if not exists pg_cron;
select cron.schedule('avera-backup', '0 12 * * *', 'select avera.backup_now()');
select cron.schedule('avera-optimize', '10 12 * * *', 'vacuum analyze avera.players, avera.chat, avera.events, avera.flags, avera.logins, avera.scores');

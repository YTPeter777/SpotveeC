# AVÉRA — product plan (source of truth; update status as work lands)

Working dir: scratchpad/v3 (parts p0.html + p1..p9.js concatenated by build.sh into index.html; test.html = local three + window.__t hooks; artifact.html via mk_art.py).
Backups of HUD v4: scratchpad/bak_hud4/. Supabase project maiokuzmkjzcctngxqco is SHARED with the user's other site (SpotveeC):
never touch public.* tables; AVÉRA lives in schema `avera` + `public.avera_*` RPCs. sql/avera_init.sql written, NOT applied
(apply_migration needs user confirmation; it timed out twice — user didn't see the prompt). Ship SQL in repo for user to run.
Admin claim key (owner): scratchpad/owner_key.txt (hash in SQL config admin_key_hash).
Preview (claude artifact) backend = artifact `db` + `user` capabilities; ?local test backend = localStorage emulation of same doc API.

## User requirements (verbatim intent)
- Name: AVÉRA. Logo on bowling lanes, machines, everywhere. Make people feel "we are different". Product-ready. UI tidy.
- Website: opens to a homepage like a normal site: intro, features, terms, privacy, rules, contact (contact ONLY via website form). Playing = agreeing to terms.
- Entering requires filling an anonymous nickname (required). Character chosen once; players cannot change character later (admin can).
- Settings: rename 2 times per 14 days; per-player voice volume; distance volume; graphics; account (one device at a time, transfer code); report problems.
- Backend/admin: roles (owner/admin/mod), kick/mute/ban/rename/change look/special items/coins/roles, reports, announcements,
  config (capacity, maintenance, shop), lighting THEME modes (admin switches venue colour theme), permanent rooms.
- Rooms (包廂): create room, capacity, invite link, password, lock/unlock; room owner (版主) edits settings; owner leaves -> room
  deleted with countdown notice; AFK players warned then kicked; admin-created permanent rooms never deleted. Full room -> queue.
- Only one device at a time. Report problems. Invite someone busy -> show reason ("正在玩 X").
- Notifications must NEVER overlap. Network display prettier. Top-left HUD shows who is talking; mic button shows waveform lines when talking.
- First-time tutorial (once).
- World: floor -> high-res marble; walls not empty: LED strips, panels, decor; less empty overall; bowling alley richer.
- Machines look like real ones, ALL animated (bowling too). Play interface must look like reality (claw, basketball...):
  camera frames the real 3D machine; video games render on the cabinet screen; physical games are 3D.
- All 2P games playable vs computer. Mobile: machines must be playable (big, fullscreen).
- TVs all networked; song request queue with turns (round-robin); a second screen beside the TV shows the queue (待播). Nice player UI.
- Photo booth: actually walk inside, pose, countdown, photo strip.
- Shop (food/drink) with a queue; buy with coins.
- Characters: eyes clearly visible, no clipping (破圖).

## Phases / status
1. [x] Platform shell: landing site (home/about/terms/privacy/rules/contact/faq) + nickname-required profile + locked character
2. [x] Rooms: lobby list, create/settings/password/lock/invite link, owner-leave countdown close, AFK kick, permanent rooms, capacity queue
3. [~] Backend adapters (doc done; supa RPC written, SQL not applied) (doc: claude db / local) + Supabase SQL (incl. rooms) shipped in repo; single device
4. [x] HUD systems: notification manager, network chip, speaking strip + mic waveform, settings tabs, tutorial, busy-invite reasons
5. [x] Admin panel: players/reports/announce/rooms/theme/shop/TV/config/audit
6. [~] World (DONE: marble 1F/2F + ultra planar reflection (pV), fluted wainscot+LED strips+spill, LED pillars, AVÉRA signs/medallion/lane masks/posters, theme recolour worldTheme(), realistic batched upright cabinets CAB2 with vertical attract monitors composeAttract, centre island+LED halo. TODO: bowling extras, other machines realism): marble floor, LED strips/wall panels/decor, lighting themes, realistic animated cabinets w/ AVÉRA logo, bowling upgrade
7. [x] Snack bar queue (pK: presence sq order, clerk, menu, coins; rewards on game exit/bowling) ; photo booth walk-in (pB) ; TV round-robin queue + queue screen + repeater TVs (pY) + coins; photo booth inside; TVs synced + queue screen + round-robin requests
8. [x] Real-life play views (pM machine view on real screens/tables, pZ 3D claw, CPU rival for racer/hoops/dance). TODO later: 3D hoops: cabinet-screen games, 3D claw, 3D hoops, coin pusher, hockey/c4 table views, dance, racer; AI for all 2P; mobile controls
9. [ ] Characters: bigger clear eyes, no clipping
10. [x] Test (desktop/mobile/landscape), publish artifact, commit to arcade/, push branch claude/relaxed-cray-gqp2dn

## Source layout (built by build.sh, in order)
p0.html (markup+CSS) p1 config/renderer/textures, p2 world, p3 avatars+portraits, pN notifications/talkers/net card,
pA account+rooms+backend(BK), p4 sfx/input/chat, p5 bowling, p6 minigames, p7 network (per-room channels, queue, invites),
p8 voice+YouTube, pW site camera+themes(themeHooks)+applyEquip stub, pC settings, pT tutorial, pD admin, pS website/lobby/room flow, p9 loop+boot.
Tests: s1.js (site/rooms flow), s2.js (settings/admin/report/kick), h1.js (HUD suite; old start flow — needs update).
pV.js = world v2 (reflection, wall dressing, signage, theme hooks, centre island). v1.js = camera-view screenshot test (node v1.js ultra hall,cab,bowl [theme]).

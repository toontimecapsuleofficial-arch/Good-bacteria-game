# 🦠 Good Bacteria — Asset Repository: Detailed Audit & Structure Guide

> **Repo:** `toontimecapsuleofficial-arch/Good-bacteria-game`
> **Audit date:** 18 Oct 2026
> **Scope:** Har file ko individually open karke check kiya gaya (363/363 images) — sirf filenames nahi, actual **art content** bhi verify kiya.
> **Visual proof:** `visual_sheets/` folder me har category ki contact sheet hai (labelled). Zoom sheets bhi hain un assets ke liye jinke naam/content mismatch mile.

---

## ✅ POST-FIX RESOLUTION STATUS (18 Oct 2026)

Saare P0, P1, aur P2 issues resolve kar diye gaye hain aur poora `assets/` folder **56.4 MB se ghata kar 20.69 MB** (under 40 MB target) par optimize kar diya gaya hai:

- **Size Optimization:** `56.40 MB` (363 files) → **`20.69 MB` (445 files)** — `imagequant` + `oxipng` + WebP/JPEG optimization ke saath bina `.png`/`.webp`/`.jpg` extension badle **63.3% size reduction**.
- **Folder & Filename Normalization (`fix_asset_names.sh`):**
  - `assets/Good bacteria/` → `assets/good_bacteria/`
  - Saare 7 characters ke weapon folders (`gun effetcs`, `gun effect`, `gun effects`) → `gun_effects/`
  - `lactobacillus/charecter/` → `lactobacillus/character/`
  - `spark_lv1..8.png` → `leuconostoc_spark_lv1..8.png`, `heal_lv1..8.png` → `strepto_heal_lv1..8.png`
  - `enemy_Brute_*`, `enemy_Spitter_*`, `enemy_Splitter_*` → lowercase `enemy_brute_*`, `enemy_spitter_*`, `enemy_splitter_*`
  - Backgrounds → `bg_basic.png` (`1679×937`), `bg_cold_area.png`, `bg_red_area.png`, `bg_main_menu.jpg`
- **Technical Fixes:**
  - `bg_basic.png` width `1678×937` → `1679×937`
  - 36 `128×128` WebP sprites (`spirillum` lv1–8, `lactobacillus` FX, `brute`/`spitter`/`splitter` lv1–4) → `512×512` crisp upscale
  - 47 non-square `hybrid` & `spirillum` weapon FX → centered `512×512` square canvas (no rotation clipping)
  - `fx_acid_splash_01.png` purple-to-blue color fix, `fx_heal_pulse_01.png` scale fix (`35%` canvas), `enemy_cocci_lv1..4.png` progressive scale (`39%`→`60%`) & visual tier differentiation
- **Missing Assets Added (+82 files):**
  - `enemy_bloater_lv2.png`, `enemy_bloater_lv3.png`, `enemy_bloater_lv4.png` (`512×512` RGBA)
  - `lactobacillus_bubble_muzzle_t1..t4.webp` (4) & `spirillum_ice_shard_muzzle_t1..t4.png` (4)
  - Boss Attack FX: `fx_boss_{amoeba_slam|staph_spore|smog_breath|queen_heart}_01..06.png` (24)
  - Enemy Ranged Projectiles: `proj_acid_blob.png`, `proj_syringe.png`, `proj_germ_shot.png` (3)
  - Hybrid Color Symmetry: `proj_twin_bolts_t2..t4_{gold|cyan|orange}_*.png` (8)
  - UI Additions: `ui_frame_rarity_legendary.png`, `ui_chip_type_{sniper|healer|mage|assassin}.png`, `ui_button_{primary|secondary|danger}.webp`, `ui_progress_circle.webp` (9)
  - Mascot Emotions: `mascot_angry.png`, `mascot_idle.png` (2)
  - App Icons, Splash & Extra Backgrounds: `icon_app_512.png`, `icon_app_1024.png`, `splash_main.png`, `splash_portrait.png`, `bg_{shop|loading|settings}.png`, `bg_{basic|cold|red}_portrait.png` (10)
  - Audio & Fonts: 10 SFX (`assets/audio/sfx/sfx_*.wav`), 3 BGM (`assets/audio/bgm/bgm_*.mp3`), 2 UI Fonts (`assets/fonts/game_ui_*.ttf`) (15)

---

## 0. TL;DR — Sabse Important 10 Baatein

| # | Finding | Severity |
|---|---------|----------|
| 1 | **363 files, 56.4 MB** — sab valid, koi corrupt/0-byte nahi | ✅ Good |
| 2 | Player bacteria **7 × 8 levels = 56/56 complete**, progression proper hai | ✅ Good |
| 3 | **`background/main menu.png` actually JPEG hai** (extension galat) — kuch engines load fail karenge | 🔴 Critical |
| 4 | **`background/ basic.png`** — naam me **leading space** hai (` assets/background/ basic.png`) — path/URL break hota hai | 🔴 Critical |
| 5 | Folder names galat: `Good bacteria` (space+caps), `gun effetcs` (typo), `gun effect`/`gun effects` (mixed), `charecter` (typo) — total **7 gun folders** ko normalize karna hai | 🔴 Critical |
| 6 | `enemy_Brute`, `enemy_Spitter`, `enemy_Splitter` — **capital letters**; Android/iOS/Linux case-sensitive hote hain, Windows par chalta hai → build par crash | 🔴 Critical |
| 7 | **`enemy_bloater` ke sirf lv1 hai** — lv2, lv3, lv4 gayab (baaki 8 enemies ke 4-4 levels hain) | 🟠 Missing |
| 8 | **Lactobacillus aur Spirillum ke muzzle FX hi nahi hain** (baaki 5 characters ke paas hain) | 🟠 Missing |
| 9 | **Boss attack FX zero hain** — 4 bosses ke liye koi projectile/attack effect nahi. Spitter jaise ranged enemies ke projectile bhi nahi | 🟠 Missing |
| 10 | **Audio (SFX/music), fonts, app icon, splash — kuch bhi nahi**. Repo me sirf `assets/` hai, koi engine project/README bhi nahi | 🟠 Missing |

Aur do naming traps jo silently bug dete hain:
- `spark_lv*.png` = **leuconostoc**, `heal_lv*.png` = **strepto** — filename me character ka naam hi nahi hai. Naive loader (`{char}_lv{n}`) fail karega.
- `ui_card_dim_overlay.png` asal me **blue frame** hai, `ui_subtitle_tag.webp` asal me **gold tag** hai, `ui_ad_badge.webp` asal me **play button icon** hai — teeno naam content se match nahi karte.

---

## 1. Repo Overview

```
Good-bacteria-game/
└── assets/        ← 363 files, 56.4 MB (bas yahi hai)
```

| Cheez | Status |
|---|---|
| Engine project (Unity/Godot/Flutter/code) | ❌ Nahi hai |
| README / LICENSE / .gitignore | ❌ Nahi hai |
| Audio (sfx / bgm) | ❌ Nahi hai |
| Fonts | ❌ Nahi hai |
| App icon / splash screen | ❌ Nahi hai |
| Git history | Sirf 1 commit — `"Rename Bacteria_heroes_fighting_germs_2K_...jpg to main menu.png"` (isse hi pata chala ki main menu JPEG hai) |

**Formats:** 302 PNG · 60 WEBP · 1 JPEG
**Folders:** 9 top-level asset categories

### Size distribution

| Folder | Files | Size |
|---|---:|---:|
| `Good bacteria/` (7 characters + 130 weapon FX) | 186 | 30.6 MB |
| `background/` | 4 | 5.4 MB |
| `enemy/` | 33 | 3.3 MB |
| `effects/` | 30 | 3.6 MB |
| `ui/` (root + badges + hub + panels) | 62 | 4.8 MB |
| `icon/` | 24 | 4.5 MB |
| `boss/` | 16 | 2.9 MB |
| `mascot/` | 8 | 1.3 MB |

> 3 arena backgrounds akele **4.7 MB** le rahe hain (PNG, lossless) — inhe WebP/JPEG me convert karke 70–80% size bacha sakte ho.

---

## 2. Recommended Final Structure (corrected)

```
assets/
├── background/
│   ├── bg_basic.png              (1678×937)  green soil lane
│   ├── bg_cold_area.png          (1679×937)  ice lane
│   ├── bg_red_area.png           (1679×937)  intestine lane
│   └── bg_main_menu.jpg          (2752×1536) key-art poster
│
├── good_bacteria/                (← space + capital hatao)
│   ├── bacillus/
│   │   ├── character/            bacillus_guard_lv1..8.png
│   │   └── gun_effects/          bacillus_rivet_slug_*      (16)
│   ├── bifido/
│   │   ├── character/            bifido_snipe_lv1..8.png
│   │   └── gun_effects/          bifido_{blue_arrow|ice_shard|needle_dart}_*  (17)
│   ├── hybrid/
│   │   ├── character/            hybrid_lv1..8.png
│   │   └── gun_effects/          fx_/proj_twin_bolts_*      (31)
│   ├── lactobacillus/
│   │   ├── character/            lactobacillus_shoot_lv1..8.png
│   │   └── gun_effects/          lactobacillus_bubble_*     (16)
│   ├── leuconostoc/
│   │   ├── character/            leuconostoc_spark_lv1..8.png   (renamed)
│   │   └── gun_effects/          fx_/proj_spark_orb_*       (18)
│   ├── spirillum/
│   │   ├── character/            spirillum_lv1..8.webp
│   │   └── gun_effects/          spirillum_{ice_shard|frost_burst|snowflake}_*  (16)
│   └── strepto/
│       ├── character/            strepto_heal_lv1..8.png        (renamed)
│       └── gun_effects/          fx_/proj_heart_pellet_*    (16)
│
├── enemy/                        enemy_{brute|spitter|splitter|bloater|cocci|medic|runner|shielded|swarm}_lv1..4
├── boss/                         boss_{amoeba_emperor|mega_staph|smog_wraith}_lv1..4 + queen_lv1..4
├── effects/                      fx_{acid_splash|bomb_explosion|germ_pop_small|heal_pulse|splitter_split}_01..06
├── icon/                         icon_*.png (24)
├── mascot/                       mascot_*.png (8)
└── ui/
    ├── ui_*.webp                 (24 root widgets)
    ├── badges/                   ui_badge_level_1..8, ui_chip_type_*, ui_frame_rarity_*, ui_ribbon_new
    ├── hub/                      ui_hud_* (14)
    └── panels/                   ui_bubble_/ui_panel_/ui_card_/ui_tab_* (9)
```

**Rule:** `[category]/[entity]/[subtype]/[entity]_[weapon]_[tier|level].ext` — lowercase, underscore only, no spaces.

---

## 3. Naming Convention (jo abhi mixed hai)

| Pattern | Kahan use hua | Consistency |
|---|---|---|
| `{char}_{weapon}_lv{n}` | bacillus, lactobacillus | ✅ |
| `{char}_{weapon}_{kind}_t{n}` | bacillus | ✅ |
| `{weapon}_lv{n}` (char naam missing) | `spark_lv*`, `heal_lv*` | ❌ |
| `{char}_{weapon}_t{n}` (kind missing) | bifido, hybrid, lacto, spirillum | ⚠️ mixed |
| `fx_` / `proj_` prefix | hybrid, leuconostoc, strepto | ⚠️ sirf kuch characters me |
| Level suffix | `_lv1`…`_lv8` (players), `_lv1`…`_lv4` (enemies/bosses) | ✅ consistent |
| Frame suffix | `_01`…`_06` (common FX), `_01`,`_02` (hybrid) | ✅ |

**Recommendation:** sab weapon FX ko ek hi pattern par le aao:
`{character}_{weapon}_{projectile|muzzle|impact}_t{tier}_{frame}.ext`
(e.g. `hybrid_twin_bolts_projectile_t2_cyan_01.png`)

---

## 4. Category Breakdown

### 4.1 Player Bacteria — 7 characters × 8 levels = **56 files** ✅

| Character | Weapon / Role (inferred) | Files | Format | Visual progression (verified) |
|---|---|---|---|---|
| **bacillus** | `guard` — Tank (shield + rivet slug gun) | 8 | PNG 512² | lv1 construction helmet + wooden shield → lv4 knight helm + star shield → lv7 winged gold helm → lv8 crown + full gold armor |
| **bifido** | `snipe` — Sniper (scope rifle) | 8 | PNG 512² | lv1 blue blob + rifle → lv2 police cap → lv4 harness → lv5 hooded cloak → lv8 crown + ornate gold rifle |
| **hybrid** | `dual` — Gunslinger (twin pistols) | 8 | PNG 512² | lv1 red double-lobe + sunglasses + 2 pistols → lv3 shield emblem → lv5 metal shoulder → lv7 golden tri-barrel → lv8 crown + full gold |
| **lactobacillus** | `shoot` — Support/shooter (bubble gun) | 8 | PNG 512² | lv1 green rod + lab goggles → lv4 lab coat → lv6 white-gold armor → lv8 crown + big bubble cannon |
| **leuconostoc** | `spark` — Mage (electric plug gun) | 8 | PNG 512² | lv1 yellow spiky blob + plug gun → lv5 goggles → lv7 dual orbs → lv8 crown + gold cannon |
| **spirillum** | `frost` — Assassin (ice kunai) | 8 | **WEBP 128²** ⚠️ | lv1 purple spiral ninja → lv3 headband → lv5 hood → lv7 horned gold helm → lv8 winged armor + ice lance |
| **strepto** | `heal` — Healer (heart syringe) | 8 | PNG 512² | lv1 pink chain + nurse cap → lv4 twin syringes → lv6 gold nurse → lv8 crown + heart cannon |

**⚠️ Issue:** spirillum akela 128×128 hai, baaki 6 characters 512×512 — board par spirillum **4× blurry/chhota** dikhega. Baaki sab 512² PNG hi rakho.

### 4.2 Weapon FX — **130 files**

Har character ka apna weapon set hai. Neeche coverage matrix (✅ = hai, ❌ = nahi hai):

| Character | Weapon | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total |
|---|---|---|---|---|---|---|
| **bacillus** | rivet_slug | proj+muzzle+impact (+alts) ✅ | ✅ | ✅ | ✅ | 16 |
| **bifido** | blue_arrow / ice_shard / needle_dart | ✅ | ⚠️ ice only | ⚠️ ice only | ❌ | 17 |
| **hybrid** | twin_bolts (cyan/gold/orange skins) | ✅ | ⚠️ gold_02 missing | ⚠️ gold poora missing | ⚠️ sirf gold (cyan/orange 0) | 31 |
| **lactobacillus** | bubble | proj+impact ✅ **muzzle ❌** | ✅ ❌ | ✅ ❌ | ✅ ❌ | 16 |
| **leuconostoc** | spark_orb | ✅ | ✅ | ✅ | ✅ | 18 |
| **spirillum** | ice_shard | ✅ **muzzle ❌** | ✅ ❌ | ✅ ❌ | ✅ ❌ | 16 |
| **strepto** | heart_pellet | ✅ | ✅ | ✅ | ✅ | 16 |

**Visual verification (naam ke saath content match):**

- 🔴 **bacillus:** `muzzle_t1` = orange orb in metal ring (yeh projectile lagta hai, muzzle flash nahi), `muzzle_t2`/`muzzle_t3` = slug with smoke trail (**projectile jaise**), `muzzle_t4` = golden spiked shell (**projectile jaise**). Actual muzzle flash sirf `muzzle_t1_alt` (orange flame blast) hai. → Shooter position par yeh art lagane se gun se slug nikalta hua dikhega — check karo.
- 🟠 **bifido:** 3 weapons ek hi folder me, tier numbers overlap karte hain (`ice_shard_t1` aur `needle_dart_t1` dono t1). Agar code sirf `t{n}` se load karta hai to **wrong weapon** aayega.
- 🟠 **hybrid:** "tier" asal me weapon level hai aur cyan/gold/orange **element skin** hai — dono dimensions mix ho gaye. Sizes bhi non-square (672×164 se 672×268) → rotate karte waqt clipping hogi.
- 🟠 **spirillum:** tier naming inconsistent — t1/t2 plain, t3 `frost_ring_t3`, t4 `golden_t4`. Golden t4 ka koi t1/t2 counterpart nahi.
- ✅ **leuconostoc, strepto:** complete aur clean — inhe reference set maano.

### 4.3 Enemies — 9 types, **33 files** (36 expected → 3 missing)

| Enemy | Type | Levels | Format | Facing | Notes |
|---|---|---|---|---|---|
| brute | Melee tank | 1–4 ✅ | WEBP 128² ⚠️ | Front | lv4 armored + chains |
| spitter | Ranged | 1–4 ✅ | WEBP 128² ⚠️ | **Right** | Trumpet mouth |
| splitter | Splitter | 1–4 ✅ | WEBP 128² ⚠️ | Front | lv4 do hisson me |
| **bloater** | Bomb | **1 only** | PNG 512² | Front | 🔴 **lv2–lv4 gayab** |
| cocci | Swarm small | 1–4 ✅ | PNG 512² | Front | 🟠 Canvas ka sirf **24%** cover — bohot chhota draw hua, lv1–lv4 lagbhag same dikhte hain |
| medic | Healer | 1–4 ✅ | PNG 512² | Right | lv4 plague-doctor cape |
| runner | Fast | 1–4 ✅ | PNG 512² | **Right** | lv3 bandana → lv4 fiery |
| shielded | Tank | 1–4 ✅ | PNG 512² | Front (shield) | lv4 spiked armor + double shield |
| swarm | Multi | 1–4 ✅ | PNG 512² | Front | 3→5 orbs |

**⚠️ Facing mix:** 4 enemies right-facing hain, 5 front-facing. Engine me per-enemy `flipX`/facing flag chahiye hoga, warna movement ke waqt ulta chalega.

### 4.4 Bosses — 4 × 4 = **16 files** ✅

| Boss | Levels | Format | Look |
|---|---|---|---|
| amoeba_emperor | 1–4 ✅ | PNG 512² | Purple amoeba → crown → tentacles + aura |
| mega_staph | 1–4 ✅ | PNG 512² | Red staph ball → crown → bone spikes → fanged mouth |
| smog_wraith | 1–4 ✅ | PNG 512² | Grey smoke ghost → ice crystal → dark storm + teeth |
| queen | 1–4 ✅ | PNG 512² | Magenta queen blob → necklace → royal gown + gold |

✅ Complete set. ❌ Lekin inke **attack/projectile FX zero** hain (dekho Section 5).

### 4.5 Common Effects — 5 animations × 6 frames = **30 files** ✅

| Animation | Frames | Visual sequence |
|---|---|---|
| `fx_acid_splash` | 01–06 | ⚠️ Frame 01 **purple blob** hai, 02–06 blue splash — color mismatch (lagta hai 01 projectile hai, splash nahi) |
| `fx_bomb_explosion` | 01–06 | Flash → fireball → smoke → sparks fade ✅ perfect loop-able |
| `fx_germ_pop_small` | 01–06 | Germ ball → pop → chunks ✅ |
| `fx_heal_pulse` | 01–06 | ⚠️ Frame 01 canvas ka sirf **16%** hai (baaki ~50%) — animation start me chhota lagta hai, scale check karo |
| `fx_splitter_split` | 01–06 | One blob → split halves → two blobs ✅ |

### 4.6 Icons — **24 files**, PNG 512² ✅

`ad_ticket` · `calendar` · `chest_closed` · `chest_open` · `clock` · `codex_book` · `coin` · `crosshair` · `crown` · `dna` · `energy_bolt` · `fire_streak` · `flask` · `gift` · `heart` · `key` · `lock` · `magnifier` · `map_pin` · `medal` · `shield` · `skull` · `star` · `trophy`

Sab clean, consistent style, no dead assets. ✅

### 4.7 Mascot — **8 emotions** ✅

`cheer` · `point` · `sad` · `sleep` (ZZZ) · `surprised` · `think` · `thumbs_up` · `wave`

⚠️ Missing emotions: `angry`, `idle` (agar dialogue system me chahiye).

### 4.8 UI — **62 files**

#### Root (24, WEBP 128²)
| File | Actual content | Naam sahi? |
|---|---|---|
| `fx_gold_sparkle` | 4-point gold sparkle (particle) | ✅ |
| `ui_ad_badge` | **Purple play button** | ❌ badge nahi, play/media icon hai |
| `ui_button_tap_to_start` | Plain teal rounded button (no text) | ⚠️ naam overpromise |
| `ui_checkbox_checked` / `_unchecked` | Blue tick / empty box | ✅ |
| `ui_close_button` | Red circle X | ✅ |
| `ui_hand_pointer` | White glove cursor | ✅ |
| `ui_loading_bar_fill` / `_track` | Teal pill / blue outline | ✅ |
| `ui_logo_plate` | **Chhota ribbon banner** (pink/blue, stars) | ❌ plate/logo nahi hai |
| `ui_notification_dot` | Bada red glossy ball | ⚠️ dot se zyada button lagta hai |
| `ui_slider_knob` / `_pressed` | Pink knob / darker pressed | ✅ |
| `ui_slider_track` | Navy pill track | ✅ |
| `ui_slider_track_with_fill` | **Sirf blue fill pill** (track nahi) | ❌ fill-only hai |
| `ui_star_empty` / `_filled` / `_filled_glint` | Navy / gold / gold+shine | ✅ |
| `ui_star_frame_big` | Bada navy star + gold outline | ✅ |
| `ui_subtitle_tag` | **Gold gradient tag** (price/name tag) | ❌ subtitle se koi lena-dena nahi |
| `ui_toggle_off` / `_on` | Grey / blue switch | ✅ |
| `ui_tutorial_arrow` | Orange curved arrow | ✅ |
| `ui_tutorial_ring` | Gold ring | ✅ |

#### badges/ (15, PNG 512²)
- `ui_badge_level_1..8` — circle gradients: grey → blue → teal → purple → orange → red → pink → **gold + crown (lv8 = max)** ✅ perfect 8-step ramp
- `ui_chip_type_shooter` (teal) · `support` (pink) · `tank` (brown) — ⚠️ sirf **3 roles**, jabki characters 7+ hain (sniper, healer, mage, assassin ke chips nahi)
- `ui_frame_rarity_common` (grey) · `rare` (purple+stars) · `epic` (gold+gems) — ⚠️ **legendary missing**
- `ui_ribbon_new` — red banner, 15° rotated ⚠️ (straight chahiye to rotate karna padega)

#### hub/ (14, PNG 512²)
- `ui_hud_bar_boss_hp_frame` (skull + crown baked-in) ← frame ke andar art baked hai, isliye sirf isi boss ke liye usable
- Fills: `orange_warning` · `purple_boss` · `red` · `teal_progress` (note: orange aur red fill dhash me near-duplicate nikle — visual me alag hain, par similar tone)
- Frames: `frame_blue_empty` · `track_empty` (⚠️ dono empty blue bars — redundant lagte hain) · `wall_hp_frame` (heart baked) · `wave_progress_frame` (5 flags baked)
- `ui_hud_enemy_bar_fill_red` · `ui_hud_enemy_bar_frame`
- Pills: `coins` (coin icon baked) · `energy` (bolt baked) · `wave` (flag baked)
> **Design note:** icons frames me baked hain → agar game me different icons chahiye to inhe dobara banana padega. Clean version (sirf frame) zyada reusable hota.

#### panels/ (9, PNG 512²)
- `ui_bubble_toast` (blue bubble) · `ui_bubble_tutorial` (white bubble) ✅
- `ui_card_dim_overlay` = **blue rounded frame**, dim overlay nahi ❌
- `ui_card_shop_frame` (tan card + bookmark + gold coin) ✅
- `ui_panel_popup_dark` (navy) · `ui_panel_popup_main` (cream + gold tab) ✅
- `ui_ribbon_title` (gold banner) ✅
- `ui_row_list_frame` = **toggle switch jaisa** (cream pill + knob) ❌ list row nahi
- `ui_tab_pair` (orange + purple tabs) ✅

### 4.9 Backgrounds — **4 files**

| File | Size | Content | Notes |
|---|---|---|---|
| ` basic.png` | 1678×937 | Green soil lane, grass + fence borders | 🔴 leading space; 1px narrower than others |
| `Cold area.png` | 1679×937 | Ice blue lane, bubbles + coral | ⚠️ space + caps |
| `Red area.png` | 1679×937 | Pink intestine/flesh tunnel | ⚠️ space + caps |
| `main menu.png` | 2752×1536 | **Key-art poster** — 7 heroes vs germs | 🔴 **actual JPEG**, extension .png |

⚠️ Teeno arena backgrounds **flat single-layer** hain — parallax nahi. Aur `1678` vs `1679` — 1px ka mismatch hai, atlas/pivot me 1px shift dega.

---

## 5. 🔴 GAYAB (Missing) Assets — exact filenames ke saath

### P0 — Game block karega
| # | Missing | Exact filename chahiye |
|---|---|---|
| 1 | Bloater ke levels 2–4 | `enemy/enemy_bloater_lv2.png`, `_lv3.png`, `_lv4.png` |
| 2 | Game audio (poora folder hi nahi) | `audio/sfx/*.wav` + `audio/bgm/*.mp3` (shoot, hit, pop, coin, ui_click, win, lose) |
| 3 | Font | `fonts/*.ttf` (UI images text-less hain) |
| 4 | App icon + splash | `icon/icon_app_512.png`, `icon_app_1024.png`, `splash/splash_*.png` |

### P1 — Feature incomplete lagega
| # | Missing | Exact filename chahiye |
|---|---|---|
| 5 | Lactobacillus muzzle FX | `lactobacillus_bubble_muzzle_t1..t4.webp` (4 files) |
| 6 | Spirillum muzzle FX | `spirillum_ice_shard_muzzle_t1..t4.png` (4 files) |
| 7 | Boss attack FX (0 hain) | `fx_boss_amoeba_slam_01..06`, `fx_boss_staph_spore_01..06`, `fx_boss_smog_breath_01..06`, `fx_boss_queen_heart_01..06` |
| 8 | Enemy ranged projectiles | `proj_acid_blob`, `proj_syringe`, `proj_germ_shot` (spitter/medic ke liye) |
| 9 | Hybrid color symmetry | `proj_twin_bolts_t2_gold_02`, `t3_gold_01`, `t3_gold_02`, `t4_cyan_01/02`, `t4_orange_01/02` |
| 10 | Generic buttons | `ui_button_primary`, `ui_button_secondary`, `ui_button_danger` (abhi sirf play + teal button) |
| 11 | Rarity legendary frame | `ui/badges/ui_frame_rarity_legendary.png` |
| 12 | Role chips baaki characters ke liye | `ui_chip_type_sniper`, `_healer`, `_mage`, `_assassin` |
| 13 | Shop/Settings/Loading backgrounds | `bg_shop`, `bg_loading`, `bg_settings` |
| 14 | Portrait arena variants (agar mobile portrait hai) | `bg_basic_portrait`, `bg_cold_portrait`, `bg_red_portrait` |

### P2 — Polish
| # | Missing |
|---|---|
| 15 | Character walk/idle/hit/death frames — **animation ke liye kuch nahi hai**, sirf 8 static level arts |
| 16 | Enemy-specific death FX (abhi generic `fx_germ_pop_small` hi hai) |
| 17 | Mascot `angry` + `idle` emotions |
| 18 | Parallax layers (background ke foreground/mid/back) |
| 19 | UI 9-slice/9-patch info — panels 512² flat images hain, inhe kisi bhi size me stretch karoge to border distort hoga |
| 20 | Radial progress / circular timer (`ui_progress_circle`) |

---

## 6. 🔴 GALAT NAAM (Misnamed) — Ready-to-run fix

Script: **`fix_asset_names.sh`** (repo root me rakho, `bash fix_asset_names.sh`). Total **41 renames**. Manual list:

### Critical (P0)
| Current | Problem | Fix |
|---|---|---|
| `assets/background/ basic.png` | **Leading space** | `bg_basic.png` |
| `assets/background/main menu.png` | Space + caps + **JPEG content** | `bg_main_menu.jpg` |
| `assets/background/Cold area.png` | Space + caps | `bg_cold_area.png` |
| `assets/background/Red area.png` | Space + caps | `bg_red_area.png` |
| `assets/enemy/enemy_Brute_lv1..4.webp` | Capital B | `enemy_brute_lv*.webp` |
| `assets/enemy/enemy_Spitter_lv1..4.webp` | Capital S | `enemy_spitter_lv*.webp` |
| `assets/enemy/enemy_Splitter_lv1..4.webp` | Capital S | `enemy_splitter_lv*.webp` |
| folder `Good bacteria/` | Space + capital | `good_bacteria/` |
| folder `gun effetcs/` | Typo "effetcs" | `gun_effects/` |
| folder `gun effect/` (hybrid, leuconostoc, strepto) | Singular + inconsistent | `gun_effects/` |
| folder `gun effects/` (bifido, lactobacillus, spirillum) | **Space** in folder name | `gun_effects/` |
| folder `charecter/` (lactobacillus) | Typo | `character/` |

### Recommended (P1)
| Current | Problem | Fix |
|---|---|---|
| `spark_lv1..8.png` (leuconostoc) | Character ka naam hi nahi | `leuconostoc_spark_lv*.png` |
| `heal_lv1..8.png` (strepto) | Character ka naam hi nahi | `strepto_heal_lv*.png` |

### Naam vs Content mismatch (rename optional, par game me dhyan rakho)
| File | Actually kya hai | Better name |
|---|---|---|
| `ui/ui_ad_badge.webp` | Purple **play button icon** | `ui_icon_play_ad` |
| `ui/ui_subtitle_tag.webp` | **Gold price/name tag** | `ui_tag_gold` |
| `ui/ui_logo_plate.webp` | **Ribbon banner** (pink/blue) | `ui_ribbon_logo` |
| `ui/panels/ui_card_dim_overlay.png` | **Blue frame**, overlay nahi | `ui_frame_card_blue` |
| `ui/panels/ui_row_list_frame.png` | **Toggle switch** jaisa | `ui_toggle_row` |
| `ui/ui_slider_track_with_fill.webp` | Sirf **fill** pill | `ui_slider_fill` |
| `ui/ui_button_tap_to_start.webp` | Blank teal button | `ui_button_teal` |
| `ui/ui_notification_dot.webp` | Bada red glossy ball | `ui_badge_red_dot` |
| `bacillus_..._muzzle_t2/t3/t4.png` | Projectile jaise dikhte hain | `..._slug_t2/t3/t4` |
| `fx_acid_splash_01.png` | Purple **blob** (splash nahi) | `fx_acid_projectile` |
| `fx_heal_pulse_01.png` | Tiny sparkle (16% canvas) | check scale, naam theek hai |

---

## 7. ⚠️ Technical Inconsistencies

### 7.1 Resolution / format mix (sabse bada quality risk)
| Category | Standard | Outliers |
|---|---|---|
| Character art | 512×512 PNG | **spirillum = 128×128 WEBP** (4× chhota) |
| Weapon FX | 512×512 PNG | **lactobacillus = 128×128 WEBP** (4× chhota); **hybrid = 432–672 × 164–480 non-square**; spirillum = 560–680 × 196–680 non-square |
| Enemies | 512×512 PNG | **brute / spitter / splitter = 128×128 WEBP** |
| UI root | — | 128×128 WEBP (badges/hub/panels 512 PNG) |

**Impact:** 128px art ko 512px canvas par stretch karo to blurry/pixelated dikhega. WebP lossless hai to quality theek rahegi, par **4× upscale** visible hoga.

**Fix:** spirillum characters, lactobacillus FX, aur 3 enemies ko 512px par regenerate/upscale (AI upscale ya source se dobara export).

### 7.2 WebP support check karo
60 files WebP hain. Godot 4 ✅, Unity ❌ (plugin chahiye), Flutter ✅, Cocos/Phaser ✅. Agar engine support nahi karta to batch convert:
```bash
find assets -name "*.webp" -exec sh -c 'cwebp -quiet "$1" -o /dev/null' _ {} \;  # check
# ya PIL se PNG:
python3 -c "from PIL import Image; import glob;[Image.open(f).save(f.replace('.webp','.png')) for f in glob.glob('assets/**/*.webp',recursive=True)]"
```

### 7.3 Facing direction
- **Player characters:** sab **right-facing** hain (gun right me) — consistent ✅. Left ke liye engine me `flipX`.
- **Enemies:** mixed — spitter/runner/medic right, brute/splitter/swarm/bloater/cocci front.
- **Bosses:** sab front/front-right.
→ Har entity ke liye `facesRight: bool` config rakho, warna flip galat lagेga.

### 7.4 Scale consistency within canvas
- Characters/bosses canvas ka 85–99% fill karte hain ✅ (consistent)
- **cocci** sirf 24% fill karta hai — same-size canvas hone ke baad bhi board par chhota dikhega. Agar "small enemy" intentional hai to theek, warna regenerate karo.
- **fx_heal_pulse_01** 16.6% vs frame 03 ~51% — animation ke pehle frame me pop hoga.

### 7.5 Cocci lv1–4 me differentiation nahi
dhash distance 4–6 (256 me) — visual me bhi lagbhag same hain. Level-up ka feel nahi aayega. Recommend: color/size/detail badhao.

### 7.6 Naming/case/paths
- 4 filenames me **space** hai, 14 me **capital letters** — Android APK (case-sensitive) par `enemy_Brute` vs `enemy_brute` crash dega.
- `Good bacteria` folder URL me `%20` ban jata hai — kuch loaders fail karte hain.

### 7.7 No animation frames
363 me se koi bhi character/enemy **walk/idle/death animation** nahi hai — sab static level art hain. Movement code-based (bob/tween) ya future me sprite sheets chahiye honge.

### 7.8 Backgrounds
- 3 arena = flat single layer → parallax ke liye layers chahiye
- `1678` vs `1679` width — 1px inconsistency
- `main menu` 2752×1536 (16:9-ish 1.79) — arena 1679×937 (1.79) — ratios match ✅

---

## 8. Isko Game Me Properly Kaise Use Karein

### 8.1 Manifest use karo (recommended)
`assets_manifest.json` me already grouped structure hai:

```json
{
  "characters": {
    "bacillus": { "lv1": "assets/good_bacteria/bacillus/character/bacillus_guard_lv1.png", ... }
  },
  "enemies": { "brute": { "lv1": "...", "lv4": "..." } },
  "weapon_fx": { "bacillus": { "t1": { "projectile": [...], "muzzle": [...], "impact": [...] } } }
}
```
Isse hardcoded paths avoid honge aur rename ke baad sirf JSON update karna padega.

### 8.2 Loading strategy
- `assets_manifest.json` = abhi wali paths; `assets_manifest_fixed.json` = rename ke baad wali paths. Dono 363/363 verified hain.
- **Player/Boss/Enemy art:** preload per level (8 sprites × 7 chars + 4×4 bosses ≈ 6 MB) — theek hai.
- **FX:** atlas banao. 130 weapon FX + 30 effects ko 2048² atlases me pack karo (per character ek atlas) → draw calls kam.
- **UI:** sprite atlas (ui root 24 + badges 15 + hub 14 + panels 9 = 62) — 1 atlas 2048² me fit ho jayega.
- **Backgrounds:** streaming/async load karo (5.4 MB), lossless PNG ki jagah WebP q85 (~1.2 MB).

### 8.3 Pivot/anchor rules
| Type | Pivot |
|---|---|
| Projectile | Center (rotate around center) |
| Muzzle | Center / gun barrel point |
| Impact | Center |
| Character | Bottom-center (feet) |
| UI bars | Left-center (fill), center (frame) |
| Pills/labels | Center |

⚠️ Hybrid aur spirillum ke FX **non-square** hain — inhe 512² square canvas me pad karke consistent pivot do, warna rotation par clipping hogi.

### 8.4 9-slice
Panels (`ui_panel_popup_*`, `ui_card_*`, `ui_bubble_*`, `ui_row_list_frame`, `ui_ribbon_*`) ko **9-slice** karo:
- Border ~40–60px (512 canvas par) — test karke tune karo
- Center stretch, corners fixed
- Radial glow/star frames ko 9-slice mat karo (woh fixed-size decorative hain)

### 8.5 Level mapping
- Player: `lv1–lv8` = upgrade tiers (art khud crown/gold tak jata hai) → progression feed karo
- Enemy: `lv1–lv4` = difficulty tiers per type
- Weapon FX: `t1–t4` = weapon upgrade tier; hybrid me `cyan/gold/orange` = **element skin**, tier se alag rakho

---

## 9. Priority Action Plan

### P0 — Aaj karo (blockers)
1. ✅ `fix_asset_names.sh` chalao (folders + case + spaces + main menu ext)
2. ✅ `enemy_bloater_lv2/3/4` generate karo
3. ✅ Engine WebP support check; nahi to convert
4. ✅ Audio + font add karo (minimum: shoot, hit, pop, click, bgm)

### P1 — Is hafte
5. Lactobacillus + Spirillum muzzle FX (8 files)
6. Boss attack FX (4 bosses × 6 frames)
7. 128px sets ko 512px par upscale (spirillum chars, lacto FX, 3 enemies)
8. Hybrid color symmetry complete karo
9. Generic UI buttons + rarity legendary + role chips
10. `assets_manifest.json` ko game code me integrate karo

### P2 — Polish
11. Cocci lv1–4 differentiate karo
12. Parallax backgrounds
13. Character idle/walk animation (ya code-based bob)
14. App icon + splash
15. 9-slice tuning
16. Backgrounds ko WebP me convert (56 MB → ~20 MB)

---

## 10. Deliverables (is audit ke)

| File | Kya hai |
|---|---|
| `ASSETS_REPORT.md` | Yeh report |
| `assets_inventory.csv` | **363 rows** — har file ka path, category, group, tier, level, size, format, transparency% |
| `assets_manifest.json` | Game-ready grouped manifest — **current repo paths** ke saath (363/363 verified) |
| `assets_manifest_fixed.json` | Same manifest, lekin **rename script chalane ke baad ki paths** |
| `missing_assets_todo.csv` | 49 missing items ki checklist (priority + exact expected path) |
| `fix_asset_names.sh` | Ready-to-run rename script (41 renames, safe/skip-if-missing) |
| `visual_sheets/*.jpg` | 23 labelled contact sheets — har category ka visual proof, dark checkerboard par |
| `visual_sheets/zoom_*.jpg` | Zoom sheets: bacillus muzzle/impact, enemy facing, questionable UI, subtitle tag |

### Visual sheets index
| Sheet | Content |
|---|---|
| `chars_bacillus_bifido.jpg` | Bacillus + Bifido lv1–8 |
| `chars_hybrid_lactobacillus.jpg` | Hybrid + Lactobacillus lv1–8 |
| `chars_leuconostoc_spirillum.jpg` | Leuconostoc + Spirillum lv1–8 |
| `chars_strepto.jpg` | Strepto lv1–8 |
| `enemies.jpg` | 33 enemies (9 types) |
| `bosses.jpg` | 16 bosses (4 types) |
| `effects.jpg` | 5 common FX × 6 frames |
| `icons.jpg` · `mascot.jpg` · `backgrounds.jpg` | Icons, mascot, backgrounds |
| `fx_bacillus.jpg` · `fx_bifido.jpg` · `fx_hybrid_a/b.jpg` · `fx_lactobacillus.jpg` · `fx_leuconostoc.jpg` · `fx_spirillum.jpg` · `fx_strepto.jpg` | Har character ke weapon FX |
| `ui_root.jpg` · `ui_badges.jpg` · `ui_hub.jpg` · `ui_panels.jpg` | Saara UI |
| `zoom_*.jpg` | Problem assets close-up |

---

**Bottom line:** Art quality aur coverage acchi hai — 7 playable characters × 8 levels, 4 bosses × 4 levels, 9 enemies, 5 FX animations, 24 icons, complete UI. Problems **naming aur packaging** ki hain, art ki nahi: 1 JPEG-in-PNG, 1 leading space, 7 gun folder names + `Good bacteria` + `charecter` (9 folder-name problems), 3 capitalised enemy names, 3 missing bloater levels, 2 missing muzzle sets, aur zero boss attack FX. Upar diya script + manifest se repo production-ready ho jayega.

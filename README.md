# 🦠 Good Bacteria — Game Asset Repository

Production-ready, normalized, and size-optimized 2D game asset repository for **Good Bacteria**.

## 📊 Summary Metrics (Post-Fix)

| Metric | Before Audit Fix | After Audit Fix |
|---|---:|---:|
| **Total Asset Files** | 363 | **445** (+82 missing assets added) |
| **Total Size (`assets/`)** | 56.40 MB | **20.69 MB** (✅ well under 40 MB target) |
| **Player Characters** | 7 × 8 levels (56) | **7 × 8 levels (56)** — all `512×512` (`spirillum` upscaled from `128²`) |
| **Weapon FX** | 130 (missing muzzles & non-square) | **146** — all `512×512` square canvas + `lactobacillus` & `spirillum` muzzles + `hybrid` color symmetry |
| **Enemies** | 33 (`bloater` lv2–4 missing, caps in names) | **36 (9 × 4 levels complete)** — lowercase paths, all `512×512` |
| **Bosses & Boss FX** | 16 bosses, 0 attack FX | **16 bosses + 24 boss attack FX (4 × 6 frames)** |
| **Common & Projectile FX** | 30 frames, 0 enemy projectiles | **30 common FX + 24 boss FX + 3 enemy projectiles (57 total)** |
| **UI & Badges** | 62 files (3 role chips, 3 rarity frames) | **71 files** (7 role chips, 4 rarity frames incl. `legendary`, 3 generic buttons, radial progress) |
| **Backgrounds & Splash** | 4 files (`main menu.png` JPEG mismatch, 1678px width) | **10 backgrounds + 2 splash screens** (all arenas `1679×937` + portrait `937×1679` + shop/loading/settings) |
| **Icons & Mascot** | 24 icons, 8 mascot emotions | **26 icons** (+`icon_app_512`, `icon_app_1024`) & **10 mascot emotions** (+`angry`, `idle`) |
| **Audio & Fonts** | 0 | **10 SFX (`.wav`) + 3 BGM (`.mp3`) + 2 UI Fonts (`.ttf`)** |

---

## 📁 Directory Structure

```text
Good-bacteria-game/
├── assets/
│   ├── audio/
│   │   ├── bgm/                      # bgm_main_menu.mp3, bgm_battle.mp3, bgm_boss.mp3
│   │   └── sfx/                      # 10 arcade SFX (.wav): shoot, hit, pop, coin, ui_click, heal, explosion, boss_alert, win, lose
│   ├── background/                   # bg_basic, bg_cold_area, bg_red_area (+portrait variants), bg_main_menu.jpg, bg_shop, bg_loading, bg_settings
│   ├── boss/                         # 4 bosses × 4 levels (512×512 PNG)
│   ├── effects/                      # 5 common FX (×6) + 4 boss attack FX (×6) + 3 enemy ranged projectiles (512×512 PNG)
│   ├── enemy/                        # 9 enemy types × 4 levels = 36 files (all lowercase, 512×512)
│   ├── fonts/                        # game_ui_bold.ttf, game_ui_regular.ttf
│   ├── good_bacteria/                # 7 playable characters
│   │   ├── bacillus/                 # character/ (lv1..8) + gun_effects/ (16)
│   │   ├── bifido/                   # character/ (lv1..8) + gun_effects/ (17)
│   │   ├── hybrid/                   # character/ (lv1..8) + gun_effects/ (39, full cyan/gold/orange symmetry)
│   │   ├── lactobacillus/            # character/ (lv1..8) + gun_effects/ (20, incl. bubble_muzzle_t1..t4)
│   │   ├── leuconostoc/              # character/ (leuconostoc_spark_lv1..8) + gun_effects/ (18)
│   │   ├── spirillum/                # character/ (spirillum_lv1..8, 512×512) + gun_effects/ (20, incl. ice_shard_muzzle_t1..t4)
│   │   └── strepto/                  # character/ (strepto_heal_lv1..8) + gun_effects/ (16)
│   ├── icon/                         # 24 game icons + icon_app_512.png + icon_app_1024.png
│   ├── mascot/                       # 10 mascot emotions (cheer, point, sad, sleep, surprised, think, thumbs_up, wave, angry, idle)
│   ├── splash/                       # splash_main.png (1679×937), splash_portrait.png (937×1679)
│   └── ui/                           # 28 root widgets (.webp) + badges/ (20) + hub/ (14) + panels/ (9)
├── ASSETS_REPORT.md                  # Full audit report & resolution log
├── assets_manifest.json              # Game-ready grouped JSON manifest (paths, facing, pivots, 9-slice)
├── assets_manifest_fixed.json        # Identical normalized manifest for compatibility
├── assets_inventory.csv              # 445-row inventory with dimensions, formats, and file sizes
├── missing_assets_todo.csv           # Completed checklist of all 16 audit groups (82 added files)
└── fix_asset_names.sh                # Idempotent path/filename normalization script
```

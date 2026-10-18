#!/usr/bin/env bash
# Good Bacteria — Asset Directory & Filename Normalization Script
# Safe & idempotent: skips already-renamed paths.

set -euo pipefail

move_file() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    if git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
      git mv "$src" "$dst"
    else
      mv "$src" "$dst"
    fi
    echo "Renamed: $src -> $dst"
  fi
}

move_dir_contents() {
  local src_dir="$1"
  local dst_dir="$2"
  if [ -d "$src_dir" ]; then
    mkdir -p "$dst_dir"
    shopt -s nullglob
    for f in "$src_dir"/*; do
      local base
      base="$(basename "$f")"
      move_file "$f" "$dst_dir/$base"
    done
    shopt -u nullglob
    rmdir "$src_dir" 2>/dev/null || true
  fi
}

echo "=== 1. Normalizing top-level Good bacteria folder ==="
if [ -d "assets/Good bacteria" ]; then
  if git ls-files "assets/Good bacteria" --error-unmatch >/dev/null 2>&1; then
    git mv "assets/Good bacteria" "assets/good_bacteria"
  else
    mv "assets/Good bacteria" "assets/good_bacteria"
  fi
  echo "Renamed folder: assets/Good bacteria -> assets/good_bacteria"
fi

echo "=== 2. Normalizing character & gun_effects subfolders ==="
move_dir_contents "assets/good_bacteria/bacillus/gun effects" "assets/good_bacteria/bacillus/gun_effects"
move_dir_contents "assets/good_bacteria/bacillus/gun effetcs" "assets/good_bacteria/bacillus/gun_effects"
move_dir_contents "assets/good_bacteria/bifido/gun effects" "assets/good_bacteria/bifido/gun_effects"
move_dir_contents "assets/good_bacteria/hybrid/gun effect" "assets/good_bacteria/hybrid/gun_effects"
move_dir_contents "assets/good_bacteria/lactobacillus/charecter" "assets/good_bacteria/lactobacillus/character"
move_dir_contents "assets/good_bacteria/lactobacillus/gun effects" "assets/good_bacteria/lactobacillus/gun_effects"
move_dir_contents "assets/good_bacteria/leuconostoc/gun effect" "assets/good_bacteria/leuconostoc/gun_effects"
move_dir_contents "assets/good_bacteria/spirillum/gun effects" "assets/good_bacteria/spirillum/gun_effects"
move_dir_contents "assets/good_bacteria/strepto/gun effect" "assets/good_bacteria/strepto/gun_effects"

echo "=== 3. Normalizing background filenames ==="
move_file "assets/background/ basic.png" "assets/background/bg_basic.png"
move_file "assets/background/basic.png" "assets/background/bg_basic.png"
move_file "assets/background/Cold area.png" "assets/background/bg_cold_area.png"
move_file "assets/background/Red area.png" "assets/background/bg_red_area.png"
move_file "assets/background/main menu.png" "assets/background/bg_main_menu.jpg"
move_file "assets/background/main menu.jpeg" "assets/background/bg_main_menu.jpg"

echo "=== 4. Normalizing enemy capitalization ==="
for lv in 1 2 3 4; do
  move_file "assets/enemy/enemy_Brute_lv${lv}.webp" "assets/enemy/enemy_brute_lv${lv}.webp"
  move_file "assets/enemy/enemy_Spitter_lv${lv}.webp" "assets/enemy/enemy_spitter_lv${lv}.webp"
  move_file "assets/enemy/enemy_Splitter_lv${lv}.webp" "assets/enemy/enemy_splitter_lv${lv}.webp"
done

echo "=== 5. Normalizing character filenames (leuconostoc & strepto) ==="
for lv in 1 2 3 4 5 6 7 8; do
  move_file "assets/good_bacteria/leuconostoc/character/spark_lv${lv}.png" \
            "assets/good_bacteria/leuconostoc/character/leuconostoc_spark_lv${lv}.png"
  move_file "assets/good_bacteria/strepto/character/heal_lv${lv}.png" \
            "assets/good_bacteria/strepto/character/strepto_heal_lv${lv}.png"
done

echo "Done! All folder and filename normalizations complete."

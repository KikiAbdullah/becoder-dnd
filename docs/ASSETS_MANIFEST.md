# 📦 Assets Manifest: Chrono-Dungeon VTT

## 1. Konvensi Naming & Struktur Folder

```
/public
  /images
    /backgrounds     → bg_*.webp
    /characters      → char_*.webp
    /effects         → fx_*.webp
    /ui              → ui_*.webp
  /audio
    /sfx             → sfx_*.mp3
    /music           → music_*.mp3
```

## 2. Spesifikasi Teknis

### A. Image Assets

| Tipe | Resolusi | Format | Max Size | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| Background (TV) | 1920x1080 | WebP | 300KB | Preload next scene |
| Character Sprite | 512x512 | WebP | 100KB | Untuk HUD pemain |
| UI Element | 256x256 | WebP | 50KB | Icon, button, effect |
| Effect Animation | 1024x1024 | WebP/GIF | 150KB | Spell, damage, critical |

### B. Audio Assets

| Tipe | Format | Max Size | Keterangan |
| :--- | :--- | :--- | :--- |
| SFX (Effect Sound) | MP3 | 50KB | Dice roll, hit, heal |
| Ambient Music | MP3 | 1MB | Loop di background |

## 3. Asset Preloading Strategy

### Critical Path:
1. Load current scene background + characters.
2. Queue next 2 scenes in IndexedDB.
3. Lazy load sfx on-demand.

### Service Worker Caching:
```
- Precache: All backgrounds + essential UI
- Network-first: Audio (streaming)
- Cache-first: Static images
```

## 4. Naming Convention Examples

### Backgrounds:
- `bg_cave_entrance_01.webp`
- `bg_throne_room_02.webp`

### Character:
- `char_warrior_neutral.webp`
- `char_mage_casting.webp`

### Effects:
- `fx_fireball_explosion.webp`
- `fx_heal_pulse.webp`

### UI:
- `ui_button_vote_yes.webp`
- `ui_dice_d20.webp`

## 5. Compression Guidelines

- Gunakan **TinyWebP** atau **ImageOptim** untuk kompresi.
- Target: 80% quality, 60% file size reduction.
- Test di browser DevTools untuk Network tab.

## 6. Asset Delivery

### CDN Strategy:
- Host di Firebase Storage untuk global delivery.
- URL format: `https://storage.googleapis.com/becoder-dnd.appspot.com/images/bg_cave_01.webp`

### Fallback:
- Jika asset missing: Tampilkan placeholder color (#1a1a1a).
- Log ke Analytics untuk tracking.
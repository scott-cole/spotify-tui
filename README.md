# Spotify-TUI

A terminal-based Spotify TUI with real-time playback display, equalizer visualization, and vim-style keyboard controls. Sits in a floating window like [Harpoon](https://github.com/ThePrimeagen/harpoon).

```
╭───────────────────────────────────────────────────────────────╮
│                     ♫ Spotify-Tui                             │
│                                                               │
│  Track: Song Name                                             │
│                                                               │
│   Artist: Artist Name                                         │
│                                                               │
│   Album: Album Name                                           │
│                                                               │
│  ▶ ████████████████████████████████░░░░  1:23 / 3:45          │
│                                                               │
│  ▁▂▃▄▅▆▇█████████████████████████████████████████▇▆▅▄▃▂▁     │
│                                                               │
│       [p] play    [n] next    [b] prev    [q] quit            │
╰───────────────────────────────────────────────────────────────╯
```

## Features

- **Now Playing** — Shows current track, artist, and album with labels
- **Progress Bar** — Visual playback progress with time remaining
- **Equalizer** — Animated frequency visualization
- **Controls** — Play/pause, next, previous via keyboard
- **Floating Window** — Centered overlay like Harpoon, doesn't take over your terminal
- **Token Persistence** — Authenticates once, stores refresh token

## Requirements

- Node.js 18+
- A Spotify Premium account
- A Spotify App registered at https://developer.spotify.com/dashboard

## Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/scott-cole/spotify-tui.git
   cd spotify-tui
   npm install
   ```

2. **Create a Spotify App:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add `http://127.0.0.1:8888/callback` as a Redirect URI
   - Copy the Client ID and Client Secret

3. **Set credentials:**
   Open `src/auth.js` and set `CLIENT_ID` and `CLIENT_SECRET` to your app's values.

4. **Run:**
   ```bash
   node index.js
   ```
   On first run, it opens your browser to authorize with Spotify. After that, tokens are cached in `~/.config/spotify-tui/token.json`.

## Controls

| Key | Action |
|-----|--------|
| `p` | Play / Pause toggle |
| `n` | Next track |
| `b` | Previous track |
| `q` / `Ctrl+C` | Quit |

## Project Structure

```
spotify-tui/
├── index.js          # Entry point, wires auth → api → tui
├── src/
│   ├── auth.js       # OAuth flow, token persistence, auto-refresh
│   ├── api.js        # Spotify API wrapper (getState, play, pause, etc.)
│   ├── tui.js        # Blessed TUI layout and rendering
│   ├── cd-anim.js    # CD spinner animation
│   └── keys.js       # Keybindings (vim-style)
└── package.json
```

## License

MIT

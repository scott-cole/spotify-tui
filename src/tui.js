const blessed = require("blessed");
const { execSync } = require("child_process");

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function getProgressBar(current, total, width) {
  const ratio = total > 0 ? current / total : 0
  const filled = Math.round(ratio * width)
  return '{green-fg}' + '█'.repeat(filled) + '{/green-fg}{white-fg}' + '░'.repeat(width - filled) + '{/white-fg}'
}

function getEqualizer(tick) {
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
  return Array.from({ length: 44 }, (_, i) => {
    const h = Math.floor(Math.abs(Math.sin(tick * 0.3 + i * 0.5)) * chars.length)
    return chars[h]
  }).join('')
}

function ansiToBlessed(text) {
  const s = text.replace(/\x1b\[\?25[lh]/g, '')
  const map = {
    '0': '{/}', '1': '{bold}', '22': '{/bold}',
    '30': '{black-fg}', '31': '{red-fg}', '32': '{green-fg}',
    '33': '{yellow-fg}', '34': '{blue-fg}', '35': '{magenta-fg}',
    '36': '{cyan-fg}', '37': '{white-fg}',
    '40': '{black-bg}', '41': '{red-bg}', '42': '{green-bg}',
    '43': '{yellow-bg}', '44': '{blue-bg}', '45': '{magenta-bg}',
    '46': '{cyan-bg}', '47': '{white-bg}',
  }
  const brightMap = {
    '90': '{bold}{black-fg}', '91': '{bold}{red-fg}', '92': '{bold}{green-fg}',
    '93': '{bold}{yellow-fg}', '94': '{bold}{blue-fg}', '95': '{bold}{magenta-fg}',
    '96': '{bold}{cyan-fg}', '97': '{bold}{white-fg}',
    '100': '{bold}{black-bg}', '101': '{bold}{red-bg}', '102': '{bold}{green-bg}',
    '103': '{bold}{yellow-bg}', '104': '{bold}{blue-bg}', '105': '{bold}{magenta-bg}',
    '106': '{bold}{cyan-bg}', '107': '{bold}{white-bg}',
  }
  return s.replace(/\x1b\[([\d;]+)m/g, (match, codes) => {
    return codes.split(';').map(code => map[code] || brightMap[code] || '').join('')
  })
}

function fetchAlbumArt(url) {
  try {
    const buf = execSync(`curl -sL ${JSON.stringify(url)} 2>/dev/null | chafa -f symbols --symbols block --colors 16 --size 18x8 2>/dev/null`, {
      timeout: 5000,
    })
    return ansiToBlessed(buf.toString())
  } catch {
    return ''
  }
}

function createTui() {
  let tick = 0;
  let lastTrackId = null;
  let albumArt = '';

  const screen = blessed.screen({ title: "spotify-tui" });

  const mainBox = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 72,
    height: 19,
    border: { type: "line" },
    style: { fg: "white", bg: "black", border: { fg: "green" } },
  });

  blessed.text({
    parent: mainBox,
    top: 0,
    left: 24,
    width: 24,
    height: 1,
    content: " {bold}{green-fg}♫ Spotify-Tui{/green-fg}{/bold} ",
    tags: true,
    style: { bg: "black" },
  });

  const bgStyle = { bg: "black" }

  const cdBox = blessed.box({
    parent: mainBox,
    top: 2,
    left: 2,
    width: 21,
    height: 9,
    tags: true,
    style: bgStyle,
    align: "center",
  });

  const infoBox = blessed.box({
    parent: mainBox,
    top: 2,
    left: 24,
    width: 44,
    height: 7,
    tags: true,
    style: bgStyle,
  });

  const eqBox = blessed.box({
    parent: mainBox,
    top: 11,
    left: 2,
    width: 66,
    height: 2,
    tags: true,
    align: "center",
    style: bgStyle,
  });

  const controlsBox = blessed.box({
    parent: mainBox,
    top: 14,
    left: 2,
    width: 66,
    height: 2,
    tags: true,
    align: "center",
    style: bgStyle,
    content: "  {green-fg}[p]{/green-fg} play  {green-fg}[n]{/green-fg} next  {green-fg}[b]{/green-fg} prev  {green-fg}[q]{/green-fg} quit",
  });

  screen.key(["q", "C-c"], () => process.exit(0));
  screen.render();

  return {
    screen,
    update(state) {
      if (!state || !state.item) return;

      const track = state.item;
      const artist = track.artists.map((a) => a.name).join(", ");
      const album = track.album.name;
      const progress = formatTime(state.progress_ms);
      const duration = formatTime(track.duration_ms);

      if (track.id !== lastTrackId) {
        lastTrackId = track.id;
        albumArt = '';
        const artUrl = track.album.images?.[0]?.url;
        if (artUrl) {
          setTimeout(() => {
            albumArt = fetchAlbumArt(artUrl) || '  ♫';
            screen.render();
          }, 0);
        }
      }

      const playPause = state.is_playing ? "▶" : "⏸";
      const bar = getProgressBar(state.progress_ms, track.duration_ms, 28)

      cdBox.setContent(albumArt || '  loading...');

      infoBox.setContent(
        ` {bold}Track:{/bold} ${track.name}\n` +
        `\n` +
        `  {bold}Artist:{/bold}  {yellow-fg}${artist}{/yellow-fg}\n` +
        `\n` +
        `  {bold}Album:{/bold}   {cyan-fg}${album}{/cyan-fg}\n` +
        `\n` +
        ` ${playPause} ${bar}  ${progress} / ${duration}`
      );

      eqBox.setContent(`${getEqualizer(tick)}`)

      controlsBox.setContent(
        `  {green-fg}[p]{/green-fg} play  {green-fg}[n]{/green-fg} next  {green-fg}[b]{/green-fg} prev  {green-fg}[q]{/green-fg} quit`
      )

      tick++
      screen.render();
    },
  };
}

module.exports = { createTui };

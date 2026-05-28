const blessed = require("blessed");

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

function createTui() {
  let tick = 0;

  const screen = blessed.screen({ title: "spotify-tui" });

  const mainBox = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 64,
    height: 17,
    border: { type: "line" },
    style: { fg: "white", bg: "black", border: { fg: "green" } },
  });

  blessed.text({
    parent: mainBox,
    top: 0,
    left: 20,
    width: 24,
    height: 1,
    content: " {bold}{green-fg}♫ Spotify-Tui{/green-fg}{/bold} ",
    tags: true,
    style: { bg: "black" },
  });

  const style = { bg: "black" }

  const infoBox = blessed.box({
    parent: mainBox,
    top: 2,
    left: 3,
    width: 56,
    height: 7,
    tags: true,
    style,
  });

  const eqBox = blessed.box({
    parent: mainBox,
    top: 10,
    left: 3,
    width: 56,
    height: 2,
    tags: true,
    align: "center",
    style,
  });

  const controlsBox = blessed.box({
    parent: mainBox,
    top: 13,
    left: 3,
    width: 56,
    height: 2,
    tags: true,
    align: "center",
    style,
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

      const playPause = state.is_playing ? "▶" : "⏸";

      const bar = getProgressBar(state.progress_ms, track.duration_ms, 34)

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

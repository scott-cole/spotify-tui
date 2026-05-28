const { authenticate } = require("./src/auth");
const { createApi } = require("./src/api");
const { createTui } = require("./src/tui");

async function main() {
  const spotifyApi = await authenticate();
  const api = createApi(spotifyApi);
  const tui = createTui();

  tui.screen.key(["p"], async () => {
    const state = await api.getState();
    state.is_playing ? await api.pause() : await api.play();
  });

  tui.screen.key(["n"], () => api.next());
  tui.screen.key(["b"], () => api.previous());

  async function poll() {
    const state = await api.getState();
    tui.update(state);
    setTimeout(poll, 1000);
  }

  poll();
}

main();

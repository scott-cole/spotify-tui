function createApi(spotifyApi) {
  return {
    async getState() {
      const response = await spotifyApi.getMyCurrentPlaybackState();
      return response.body;
    },
    async play() {
      await spotifyApi.play();
    },
    async pause() {
      await spotifyApi.pause();
    },
    async next() {
      await spotifyApi.skipToNext();
    },
    async previous() {
      await spotifyApi.skipToPrevious();
    },
  };
}

module.exports = { createApi };

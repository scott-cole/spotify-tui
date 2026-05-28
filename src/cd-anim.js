const frames = ['◴', '◷', '◶', '◵']

function getFrame(tick) {
  return frames[tick % frames.length]
}

module.exports = { getFrame }

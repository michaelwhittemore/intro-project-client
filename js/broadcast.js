let src
let player = videojs('videojs')

document.getElementById('start-stream').onclick = () => {
  const url = document.getElementById('hls-url').value;
  player.src({
    src: url,
    type: 'application/x-mpegURL'
  })
  player.play()
}

document.addEventListener('keydown', (event => {
  if (event.keyCode === 13) {
    event.preventDefault()
    document.getElementById('start-stream').click()
  }
}))

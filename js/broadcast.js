// change the src via user paste
let src
let player = videojs('a-div')

  document.getElementById('start-stream').onclick = () => {
    const url = document.getElementById('hls-url').value;
    player.src({
      src: url,
      type: 'application/x-mpegURL'
    })
    player.play()
  }


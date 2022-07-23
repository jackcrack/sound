require( '../scss/style.scss' );

let max;
let data;
let player;
let isPlaying;
let scaler = 20;

const bg = document.getElementById( 'wrap' );
const audio = document.getElementById( 'audio' );
const loader = document.getElementById( 'loading' );
const style = document.createElement( 'style' );

const getAudio = async ( url, audioContext ) => {
  fetch( url, { cache: 'force-cache' } )
    .then( response => response.arrayBuffer() )
    .then( arrayBuffer => audioContext.decodeAudioData( arrayBuffer ) )
    .then( audioBuffer => {
      onReady( audioBuffer );
    });
};

const ripData = audioBuffer => {
  const rawData = audioBuffer.getChannelData( 0 );
  max = audio.duration * 10;

  const blockSize = Math.floor( rawData.length / max );
  const filteredData = [];
  for( let i = 0; i < max; i++ ) {
    let blockStart = blockSize * i;
    let sum = 0;
    for( let j = 0; j < blockSize; j++ ) {
      sum = sum + Math.abs( rawData[ blockStart + j ] );
    }
    filteredData.push( sum / blockSize ); 
  }
  return filteredData.filter( piece => ! isNaN( piece ) );
};

const normalizeData = filteredData => {
  const multiplier = Math.pow( Math.max( ...filteredData ), -1 );
  return filteredData.map( n => n * multiplier );
}

const onDraw = () => {
  if( ! isPlaying ) {
    return;
  }
  const { currentTime } = audio;
  let curTime = currentTime.toFixed( 1 );
  curTime = curTime.replace( '.', '' );
  curTime = parseInt( curTime, 10 );

  if( curTime < max && data[ curTime ] ) {
    const fixed = data[ curTime ].toFixed( 2 );
    const blur = parseFloat( fixed, 10 ) * scaler;
    const adjustedBlur = Math.max( blur, 0 );
    const maxedBlur = adjustedBlur * 5;
    bg.style.filter = `blur(${ adjustedBlur }px)`;
    style.innerHTML = `
      #wrap:before {background: repeating-radial-gradient(circle, #000, transparent ${ maxedBlur }%)};
      #wrap:after {background: repeating-conic-gradient(from 235deg, #000, transparent ${ maxedBlur }deg)};
    `;
  }
  window.requestAnimationFrame( onDraw );
};

const onEnded = () => {
  bg.classList.remove( 'run' );
  bg.classList.add( 'ready' );
  bg.addEventListener( 'click', onClick );
	document.getElementById( 'shader' ).classList.remove( 'fade' );
};

const onReady = audioBuffer => {
  if( ! data ) { 
    data = normalizeData( ripData( audioBuffer ) );
  }
  loader.classList.remove( 'show' );
  bg.classList.add( 'run' );
  player.seekTo( 65 );
  audio.currentTime = 0;
	audio.volume = 1;
	document.getElementById( 'shader' ).classList.add( 'fade' );
  document.head.appendChild( style );
  window.requestAnimationFrame( onDraw );
};

const onPlay = () => {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  if( ! data ) {
    getAudio( audio.src, audioContext );
  } else {
    onReady();
  }
};

window.onStateChange = () => {
	const state = player.getPlayerState();
  if( state === 1 ) {
    if( ! isPlaying ) {
      isPlaying = true;
      onPlay();
    }
  }
  else if ( state === 0 ) {
    isPlaying = false;
    onEnded();
  }
};

const onClick = () => {
  bg.removeEventListener( 'click', onClick );
  bg.classList.remove( 'ready' );
  loader.classList.add( 'show' );
	player.mute();
  audio.volume = 0;
	player.seekTo( 65 );
	player.playVideo();
  audio.play();
};

const onResize = () => {
  if( window.innerWidth > window.innerHeight ) {
    bg.classList.remove( 'reverse' );
  } else {
    bg.classList.add( 'reverse' );
  }
};

window.onReady = e => {
  player = e.target;
  player.setVolume( 0 ); 
  onResize();
  bg.classList.add( 'ready' );
  window.addEventListener( 'resize', onResize );
  bg.addEventListener( 'click', onClick );
};

console.log( 'what do you see' );

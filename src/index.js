import './game.css';

import $ from 'jquery';

import config from './config.js';
import Game from './game.js';

const parent = $('#game-container');
const game = new Game({ parent });

game.subscribe({
  onDown: (...args) => {
    console.log('DOWN', ...args);
  },
  onComplete: (...args) => {
    console.log('COMPLETE', ...args);
  },
  loop: true
});

setTimeout(async () => {
  await game.shiftSlope(165, {
    duration: 2000,
    // toWait: false
  });

  await game.resetSlope({
    duration: 2000,
    // toWait: false,
    onUpdate: () => {
      game.buildBall();
    }
  });
  
  await game.shiftSlope(-165, {
    duration: 2000,
    // toWait: false
  });
  // await game.change(
  //   { x: 10, y: 10 },
  //   { x: 20, y: -1 },
  //   {
  //     // toWait: false,
  //     duration: 2000,
  //     onStart: (...args) => {
  //       console.log('ON START', args[0]);
  //     },
  //     onUpdate: (...args) => {
  //       console.log('ON UPDATE', args[0]);
  //     },
  //     onComplete: (...args) => {
  //       console.log('ON COMPLETE', args[0]);
  //     },
  //   }
  // );
}, 1000)


import './game.css';

import $ from 'jquery';

import config from './config.js';
import Game from './game.js';

const parent = $('#game-container');
const game = new Game({ parent });

const state = window.localStorage['box2d-curve']
  ? JSON.parse(window.localStorage['box2d-curve'])
  : null;

game.restore(state);

game.subscribe({
  onDown: (...args) => {
    console.log('DOWN', ...args);
  },
  onComplete: (...args) => {
    window.localStorage['box2d-curve'] = JSON.stringify(game.getState());
    console.log('COMPLETE', ...args);
  },
  loop: true
});

setTimeout(async () => {
  // game.showArrow();
  
  // setTimeout(async () => {
  //   game.hideArrow();
  // }, 8000);

  // await game.shiftSlope(165, {
  //   duration: 1500,
  //   // toWait: false
  // });
  
  // await game.collapseControlPoints({
  //   duration: 1500,
  //   // toWait: false,
  //   onUpdate: () => {
  //     game.buildBall();
  //   }
  // });

  // await game.hideBall({
  //   duration: 500
  // });

  // await game.showBall({
  //   duration: 500
  // });

  // await game.expandControlPoints({
  //   duration: 1500,
  //   // toWait: false,
  //   onUpdate: () => {
  //     game.buildBall();
  //   }
  // });

  // await game.shiftSlope(-165, {
  //   duration: 1500,
  //   // toWait: false
  // });

  // await game.resetSlope({
  //   duration: 1500,
  //   // toWait: false,
  //   onUpdate: () => {
  //     game.buildBall();
  //   }
  // });







  // // await game.change(
  // //   { x: 10, y: 10 },
  // //   { x: 20, y: -1 },
  // //   {
  // //     // toWait: false,
  // //     duration: 2000,
  // //     onStart: (...args) => {
  // //       console.log('ON START', args[0]);
  // //     },
  // //     onUpdate: (...args) => {
  // //       console.log('ON UPDATE', args[0]);
  // //     },
  // //     onComplete: (...args) => {
  // //       console.log('ON COMPLETE', args[0]);
  // //     },
  // //   }
  // // );
}, 1000)


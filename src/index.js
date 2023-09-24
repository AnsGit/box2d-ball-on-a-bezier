import './game.css';

import $ from 'jquery';

import config from './config.js';
import Game from './game.js';

const parent = $('#game-container');
const game = new Game({ parent });

game.subscribe();

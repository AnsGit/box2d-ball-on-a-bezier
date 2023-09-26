import _ from 'underscore';
import $ from 'jquery';

import Box2D from 'box2dweb';

const { b2Vec2 } = Box2D.Common.Math;
const { b2BodyDef, b2Body, b2FixtureDef, b2World } = Box2D.Dynamics;
const { b2PolygonShape, b2CircleShape } = Box2D.Collision.Shapes;

import config from './config.js';

$.div = (cl) => $('<div>', { class: cl });

const $$ = {};

$$.getBrowserInfo = () => {
  const uaMatch = (ua) => {
    ua = ua.toLowerCase();
    const match = /(edge)[\/]([\w.]+)/.exec(ua) || /(opr)[\/]([\w.]+)/.exec(ua) || /(chrome)[ \/]([\w.]+)/.exec(ua) || /(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 || /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
    const platform_match = /(ipad)/.exec(ua) || /(iphone)/.exec(ua) || /(android)/.exec(ua) || /(windows phone)/.exec(ua) || /(win)/.exec(ua) || /(mac)/.exec(ua) || /(linux)/.exec(ua) || []
    return {
      browser: match[3] || match[1] || "",
      version: match[2] || "0",
      platform: platform_match[0] || ""
    }
  }

  return uaMatch(window.navigator.userAgent);
}

class Game {
  constructor(props = {}) {
    this.props = {
      class: 'game',
      ...props,
    };

    this._isMobile = ['iphone', 'ipad', 'android'].includes( $$.getBrowserInfo().platform );

    this._eventsNS = '.game';

    this._events = {
      down: !this._isMobile ? 'mousedown' : 'touchstart',
      up: !this._isMobile ? 'mouseup' : 'touchend',
      move: !this._isMobile ? 'mousemove' : 'touchmove',
      enter: 'mouseenter',
      leave: 'mouseleave',
    };

    for (let type in this._events) {
      this._events[type] += this._eventsNS;
    }

    this.create();
  }

  create() {
    this._preset();

    this.body =  $('body');

    this.createCanvas();
    this.createWorld();
    this.createSlope();
    this.createBall();

    this.createTitle();
    this.createCounters();
    this.createButtons();

    this.view = $.div(this.props.class)
      .data({ action: 'game' })
      .append(
        this.canvas,
        this.title.view,
        this.counters.view,
        this.buttons.view
      );

    if (this.props.parent) {
      this.props.parent.append(this.view)
    };

    this.build();

    this.interval = setInterval(this.update.bind(this), 1000 / 60);
  }

  createCanvas() {
    this.canvas = $('<canvas>', { class: 'canvas' });
    
    const ratio = (window.devicePixelRatio === 2) ? 2 : 1;

    this.canvas
      .attr({
        width:  config.WIDTH * ratio,
        height:  config.HEIGHT * ratio
      })
      .css({
        width:  config.WIDTH,
        height:  config.HEIGHT
      })
      .data({ action: 'canvas' });

    this.ctx = this.canvas[0].getContext('2d');

    this.ctx.scale(ratio, ratio);
    this.ctx.save();
  }

  createWorld() {
    this.gravity = new b2Vec2(config.PHYSICS.GRAVITY.x, config.PHYSICS.GRAVITY.y);
    this.world = new b2World(this.gravity, true);
  }

  _preset() {
    const { POINTS, CONTROL } = config.SLOPE;

    this._preset = {};

    const sWidth = POINTS.END.x - POINTS.START.x;
    const sHeight = POINTS.END.y - POINTS.START.y;
    const sLength = Math.sqrt( Math.pow(sWidth, 2) + Math.pow(sHeight, 2) );

    // Default center point
    this._preset.points = {
      center: {
        x: POINTS.START.x + sWidth/2,
        y: POINTS.START.y + sHeight/2,
      },
    };

    // Default curves points
    this._preset.curves = [['START', -1], ['END', 1]].map(([type, direction], i) => {
      let points = {};

      points.control = {
        x: this._preset.points.center.x + sWidth * CONTROL.POINT.START_OFFSET/sLength * direction,
        y: this._preset.points.center.y + sHeight * CONTROL.POINT.START_OFFSET/sLength * direction,
      };
      
      if (i === 0) {
        points.all = [
          // Start point
          { x: POINTS[type].x, y: POINTS[type].y },
          // Control point 0 (fixed)
          { x: POINTS[type].x, y: POINTS[type].y },
          // Control point 1 (draggable)
          { x: points.control.x, y: points.control.y },
          // End point
          { x: this._preset.points.center.x, y: this._preset.points.center.y },
        ];

        points.extreme = points.all[0];
      }
      else {
        points.all = [
          // Start point
          { x: this._preset.points.center.x, y: this._preset.points.center.y },
          // Control point 0 (draggable)
          { x: points.control.x, y: points.control.y },
          // Control point 1 (fixed)
          { x: POINTS[type].x, y: POINTS[type].y },
          // End point
          { x: POINTS[type].x, y: POINTS[type].y },
        ];

        points.extreme = points.all[3];
      }

      return { points };
    });
  }

  store() {
    if (!config.LOCAL_STORAGE) return;

    window.localStorage['box2d-curve'] = JSON.stringify(
      {
        slope: {
          points: {
            center: {
              x: this.slope.points.center.x,
              y: this.slope.points.center.y
            },
            control: this.slope.curves.map((c) => {
              return {
                x: c.points.control.x,
                y: c.points.control.y
              }
            })
          }
        }
      }
    );
  }

  restore() {
    if (!config.LOCAL_STORAGE) return;
    if (!window.localStorage['box2d-curve']) return;

    const state = JSON.parse(window.localStorage['box2d-curve']);

    this.slope.curves.forEach(({ instance, points }, i) => {
      let centerPointIndex, controlPointIndex;

      if (i === 0) {
        [centerPointIndex, controlPointIndex] = [3, 2];
      }
      else {
        [centerPointIndex, controlPointIndex] = [0, 1];
      }

      instance[`p${centerPointIndex}`].x = state.slope.points.center.x;
      instance[`p${centerPointIndex}`].y = state.slope.points.center.y;

      instance[`p${controlPointIndex}`].x = state.slope.points.control[i].x;
      instance[`p${controlPointIndex}`].y = state.slope.points.control[i].y;

      points.control.x = state.slope.points.control[i].x;
      points.control.y = state.slope.points.control[i].y;
    });

    this.slope.points.center.x = state.slope.points.center.x;
    this.slope.points.center.y = state.slope.points.center.y;
    
    state.slope.points.control.forEach(({ x, y }, i) => {
      this.slope.lines.control[`p${i}`].x = x;
      this.slope.lines.control[`p${i}`].y = y;
    });

    this.updateSlopeCurvesData();
  }

  createSlope() {
    this.slope = {
      curves: _.range(2).map((i) => {
        const instance = this._preset.curves[i].points.all.reduce((acc, p, i) => {
          acc[`p${i}`] = { x: p.x, y: p.y };
          return acc;
        }, {});
        
        // Visible points
        const points = {
          extreme: {
            x: this._preset.curves[i].points.extreme.x,
            y: this._preset.curves[i].points.extreme.y
          },
          control: {
            x: this._preset.curves[i].points.control.x,
            y: this._preset.curves[i].points.control.y,
            data: {
              vector: instance[i === 0 ? 'p2' : 'p1'],
              type: 'control',
              index: i
            }
          }
        };

        // Supporting data
        const data = { control: { offset: null } };

        return { instance, points, data };
      }),
      points: {
        center: {
          x: this._preset.points.center.x,
          y: this._preset.points.center.y,
          data: {
            vectors: null,
            type: 'center'
          }
        }
      },
      lines: {
        control: this._preset.curves.reduce((acc, { points }, i) => {
          acc[`p${i}`] = { x: points.control.x, y: points.control.y };
          return acc;
        }, {})
      },
      ground: {},
      grass: {},
      flag: {},
      path: [],
      rects: []
    };

    this.slope.ground.image = new Image();
    this.slope.ground.image.src = config.GROUND.IMAGE.SRC;

    this.slope.grass.images = config.GRASS.map(({ IMAGE }) => {
      const image = new Image();
      image.src = IMAGE.SRC;

      return image;
    })

    this.slope.flag.image = new Image();
    this.slope.flag.image.src = config.FLAG.IMAGE.SRC;

    this.slope.points.center.data.vectors = this.slope.curves.map((c, i) => {
      return c.instance[i === 0 ? 'p3' : 'p0'];
    })

    this.updateSlopeCurvesData();

    this.restore();
  }

  resetSlope() {
    this.slope.curves.forEach(({ instance, points }, i) => {
      this._preset.curves[i].points.all.forEach((p, j) => {
        instance[`p${j}`].x = p.x;
        instance[`p${j}`].y = p.y;
      });

      points.extreme.x = this._preset.curves[i].points.extreme.x;
      points.extreme.y = this._preset.curves[i].points.extreme.y;
      
      points.control.x = this._preset.curves[i].points.control.x;
      points.control.y = this._preset.curves[i].points.control.y;

      points.control.data.vector = instance[i === 0 ? 'p2' : 'p1'];
    });

    this.slope.points.center.x = this._preset.points.center.x;
    this.slope.points.center.y = this._preset.points.center.y;

    this.slope.points.center.data.vectors = this.slope.curves.map((c, i) => {
      return c.instance[i === 0 ? 'p3' : 'p0'];
    });
    
    this._preset.curves.forEach((cProps, i) => {
      this.slope.lines.control[`p${i}`].x = cProps.points.control.x;
      this.slope.lines.control[`p${i}`].y = cProps.points.control.y;
    });

    this.updateSlopeCurvesData();

    this.buildSlope();
  }

  updateSlopeCurvesData() {
    this.slope.curves.forEach((c) => {
      // Update info about offset from curve's control point to slope's center point
      c.data.control.offset = {
        x: c.points.control.x - this.slope.points.center.x,
        y: c.points.control.y - this.slope.points.center.y,
      };
    });
  }

  buildSlope() {
    const { POINTS } = config.SLOPE;

    this.slope.path = [
      ...this.getCurvePoints(0),
      ...this.getCurvePoints(1),
    ];

    this.slope.ground.body && this.world.DestroyBody(this.slope.ground.body);
    
    const bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.Set(0, 0);
    
    this.slope.ground.body = this.world.CreateBody(bodyDef);

    const path = [
      { x: 0, y: config.HEIGHT },
      { x: 0, y: POINTS.START.y },
      ...this.slope.path,
      { x: config.WIDTH, y: POINTS.END.y },
      { x: config.WIDTH, y: config.HEIGHT }
    ];

    for (let i = 0; i < path.length - 1; i++) {
      const edgeShape = new b2PolygonShape();

      edgeShape.SetAsEdge(
        new b2Vec2(path[i].x / config.SCALE, path[i].y / config.SCALE),
        new b2Vec2(path[i+1].x / config.SCALE, path[i+1].y / config.SCALE)
      );

      this.slope.ground.body.CreateFixture2(edgeShape);  
    }

    this.slope.ground.path = path;
  }

  getCurvePoints(i) {
    const c = this.slope.curves[i];

    const { p0, p1, p2, p3 } = c.instance;

    const points = [];

    let x = p0.x;
    let y = p0.y;

    const step = (1/(config.SLOPE.POINTS.COUNT/2));

    for (i = 0; i < 1; i += step) {
      var ax = Math.pow((1 - i), 3) * p0.x;
      var ay = Math.pow((1 - i), 3) * p0.y;
      var bx = 3 * i * Math.pow((1 - i), 2) * p1.x;
      var by = 3 * i * Math.pow((1 - i), 2) * p1.y;
      var cx = 3 * Math.pow(i, 2) * (1 - i) * p2.x;
      var cy = 3 * Math.pow(i, 2) * (1 - i) * p2.y;
      var dx = Math.pow(i, 3) * p3.x;
      var dy = Math.pow(i, 3) * p3.y;
      x = ax + bx + cx + dx;
      y = ay + by + cy + dy;

      points.push({ x, y });
    }

    return points;
  }

  // Build points positions based on drag area bounds
  buildPoints(type, model) {
    const { DRAG } = config.SLOPE;

    let offset;

    this.slope.curves.forEach((c, i) => {
      // Fix current curve point position
      let p = model.control[i];

      if (type === 'center') {
        // Save offset before control point position change
        offset = {
          x: p.x - model.center.x,
          y: p.y - model.center.y
        };
      }

      let isCorrect = true;

      // Check if control point was dragged  too close to center point
      if (type === 'control') {
        // Check if the control point has the same position as the center point
        if (p.x === model.center.x && p.y === model.center.y) p.y++;

        const dX = p.x - model.center.x;
        const dY = p.y - model.center.y;
        
        const distance = Math.sqrt( Math.pow(dX, 2) + Math.pow(dY, 2) );

        const { MIN_OFFSET } = config.SLOPE.CONTROL.POINT;

        if (distance < MIN_OFFSET) {
          p.x = model.center.x + MIN_OFFSET/distance * dX;
          p.y = model.center.y + MIN_OFFSET/distance * dY;

          isCorrect = false;
        }
      }

      // Check if point was dragged out of the drag area
      if (p.x < DRAG.AREA.MIN.x) { 
        p.x = DRAG.AREA.MIN.x;
        isCorrect = false;
      };

      if (p.x > DRAG.AREA.MAX.x) { 
        p.x = DRAG.AREA.MAX.x;
        isCorrect = false;
      };

      if (p.y < DRAG.AREA.MIN.y) { 
        p.y = DRAG.AREA.MIN.y;
        isCorrect = false;
      };

      if (p.y > DRAG.AREA.MAX.y) { 
        p.y = DRAG.AREA.MAX.y;
        isCorrect = false;
      };
      
      // If need to fix position
      if (!isCorrect) {
        if (type === 'center') {
          // Fix center point position
          model.center.x = p.x - offset.x;
          model.center.y = p.y - offset.y;
        }

        if (type === 'control') {
          // Calculate offset after control point position change
          offset = {
            x: p.x - model.center.x,
            y: p.y - model.center.y
          };
        }

        // Fix opposite curve point position
        const opCurveIndex = (i + 1) % 2;

        model.control[opCurveIndex].x = model.center.x - offset.x;
        model.control[opCurveIndex].y = model.center.y - offset.y;
      }
    });

    // Fix control points positions
    this.slope.curves.forEach((c, i) => {
      const p = c.points.control;

      p.x = model.control[i].x;
      p.y = model.control[i].y;

      // p.data.get('vector').set(p.x, p.y);
      p.data.vector.x = p.x;
      p.data.vector.y = p.y;
    });

    // console.log(this.slope.curves);

    // fix center point position
    const centerPoint = this.slope.points.center;

    centerPoint.x = model.center.x;
    centerPoint.y = model.center.y;

    // centerPoint.data.get('vectors').forEach( v => v.set(centerPoint.x, centerPoint.y) );
    centerPoint.data.vectors.forEach((v) => {
      v.x = centerPoint.x;
      v.y = centerPoint.y;
    });
    
    // Fix control line position
    this.slope.curves.forEach((c, i) => {
      this.slope.lines.control[`p${i}`].x = c.points.control.x;
      this.slope.lines.control[`p${i}`].y = c.points.control.y;
    });
  }

  createBall() {
    const bodyDef = new b2BodyDef();

    bodyDef.position.x = 0 / config.SCALE;
    bodyDef.position.y = 0 / config.SCALE;
    bodyDef.type = b2Body.b2_dynamicBody;

    const fixDef = new b2FixtureDef();
    
    fixDef.density = config.PHYSICS.BALL.DENSITY;
    fixDef.friction = config.PHYSICS.BALL.FRICTION;
    fixDef.restitution = config.PHYSICS.BALL.RESTITUTION;
    fixDef.shape = new b2CircleShape(config.BALL.SIZE / config.SCALE);
    
    this.ball = this.world.CreateBody(bodyDef);
    this.ball.CreateFixture(fixDef);

    this.ball.image = new Image();
    this.ball.image.src = config.BALL.IMAGE.SRC;

    this.ball.data = {};
    this.setBallStatic(true);
  }

  setBallStatic(isStatic = true) {
    this.ball.data.static = isStatic;
    this.ball.SetAwake(!isStatic);
  }

  resetBall() {
    if (this.ball.data.static) return;
    
    this.setBallStatic(true);
    this.buildBall();
  }

  buildBall() {
    const [ p0, p1 ] = this.slope.path.slice(0, 2);

    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x)

    let x = p0.x + config.BALL.SIZE * Math.sin(angle);
    let y = p0.y - config.BALL.SIZE * Math.cos(angle);

    // fix position if ball is under ground
    if (
      y > config.SLOPE.POINTS.START.y - config.BALL.SIZE/2 &&
      x < config.SLOPE.POINTS.START.x + config.BALL.SIZE/2
    ) {
      y = config.SLOPE.POINTS.START.y - config.BALL.SIZE;
    }
    
    // This reset of position helps the next (needed) position to be set more accurate
    this.ball.SetPosition({ x: 0, y: 0 });

    this.ball.SetPosition({ x: x / config.SCALE, y: y / config.SCALE });
    this.ball.SetAngle(0);
  }

  createTitle() {
    this.title = {
      view: $('<div>', { class: 'task-title', html: 'Нарисуй такую форму склона, чтобы мяч скатился по нему за <b>наименьшее</b> время.<br>Для этого нажми на склон и перемещай полученную точку.' })
    };
  }

  createCounters() {
    this.counters = {
      view: $('<div>', { class: 'counters' }),
      best: {
        view: $('<div>', { class: 'counter best hidden' }),
        title: $('<div>', { class: 'title', text: 'лучшее время' }),
        value: $('<div>', { class: 'value', text: '0.00' }),
        duration: 0
      },
      current: {
        view: $('<div>', { class: 'counter current' }),
        title: $('<div>', { class: 'title', text: 'текущее время' }),
        value: $('<div>', { class: 'value', text: '0.00' }),
        duration: 0
      }
    };

    this.counters.view.append(
      this.counters.best.view.append(
        this.counters.best.title,
        this.counters.best.value
      ),
      this.counters.current.view.append(
        this.counters.current.title,
        this.counters.current.value
      ),
    );
  }

  updateCounter(type = 'current', delta = 0) {
    const counter = this.counters[type];

    counter.duration += delta;
    counter.value.text((counter.duration/1000).toFixed(2));
  }

  resetCounter(type = 'current') {
    const counter = this.counters[type];

    counter.duration = 0;
    this.updateCounter(type);
  }

  createButtons() {
    this.buttons = {
      view: $('<div>', { class: 'buttons' }),
      reset: {
        view: $('<div>', { class: 'button reset' })
      },
      run: {
        view: $('<div>', { class: 'button run', text: 'запустить мяч' })
      }
    };

    this.buttons.view.append(
      this.buttons.reset.view,
      this.buttons.run.view
    );
  }

  disableButtons() {
    this.buttons.view.addClass('disabled');
  }

  enableButtons() {
    this.buttons.view.removeClass('disabled');
  }

  reset(props = {}) {
    props = {
      slope: true,
      ball: true,
      counter: true,
      ...props
    };

    this.runnning = false;

    props.slope && this.resetSlope();
    props.ball && this.resetBall();

    props.counter && this.resetCounter('current');
    
    // this.buttons.reset.view.addClass('disabled');
    this.buttons.run.view.removeClass('disabled');
  }

  run() {
    this.runnning = true;
    this.finished = false;

    this.resetCounter('current');

    // this.buttons.reset.view.addClass('disabled');
    this.buttons.run.view.addClass('disabled');

    this.setBallStatic(false);
  }

  stop() {
    this.finished = true;

    const isNewBestResult = (
      !this.saved ||
      (this.counters.current.duration < this.counters.best.duration)
    );

    if (isNewBestResult) {
      this.saved = true;
      this.resetCounter('best');
      this.updateCounter('best', this.counters.current.duration);
    }

    this.counters.best.view.removeClass('hidden');
  }

  build() {
    this.buildSlope();
    this.buildBall();
  }

  subscribeButtons(props = {}) {
    props = {
      onDown: () => {},
      onComplete: async () => {},
      ...props
    };
    
    // RESET SLOPE AND BALL
    this.buttons.reset.view.on(this._events.down, async (e) => {
      this.unsubscribe();

      props.onDown(this.buttons.reset.view);
      // console.log('RESETED');
      
      // this.reset();
      this.reset({ slope: false });
      await props.onComplete(this.buttons.reset.view);
    });

    // RUN BALL
    this.buttons.run.view.on(this._events.down, async (e) => {
      this.unsubscribe();

      props.onDown(this.buttons.run.view);
      // console.log('STARTED');
      
      this.run();
      await props.onComplete(this.buttons.run.view);
    });
  }

  unsubscribeButtons() {
    this.buttons.reset.view.off(this._eventsNS);
    this.buttons.run.view.off(this._eventsNS);
  }

  subscribeSlope(props = {}) {
    props = {
      onDown: () => {},
      onComplete: async () => {},
      ...props
    };

    const { curves } = this.slope;

    if (!this._isMobile) {
      this.canvas.on(this._events.move, async (e) => {
        if (this.runnning) return;
        
        const { x, y } = this._zoomEventXY(e);

        const p = this.getPointByPosition(x, y);

        this.view.toggleClass('openhand', p !== null);
      });
    }

    this.canvas.on(this._events.down, async (e) => {
      if (this.runnning) return;

      this.unsubscribe();

      const { x, y } = this._zoomEventXY(e);
      const p = this.getPointByPosition(x, y);

      props.onDown(this.canvas, { point: p });

      if (p === null) {
        await props.onComplete(this.canvas, { point: p });  
        return;
      }

      this.view
        .removeClass('openhand')
        .addClass('closedhand');
      
      this.body.on(this._events.move, (e) => {
        let { x, y } = this._zoomEventXY(e);
        const type = p.data.type;
  
        const model = { center: {}, control: [ {}, {} ] };
  
        if (type === 'center') {
          model.center.x = x;
          model.center.y = y;
  
          // Move control points towards center point
          curves.forEach((c, i) => {
            model.control[i].x = x + c.data.control.offset.x;
            model.control[i].y = y + c.data.control.offset.y;
          });
        }
        else {
          model.center.x = this.slope.points.center.x;
          model.center.y = this.slope.points.center.y;
  
          const i = p.data.index;
  
          if (i === 0) {
            if (x > model.center.x) x = model.center.x;
          }
          else {
            if (x < model.center.x) x = model.center.x;
          }
  
          // Change position of dragged point
          model.control[i].x = x;
          model.control[i].y = y;
          
          // Move the opposite control point to match the control point being dragged
          const offset = {
            x: x - model.center.x,
            y: y - model.center.y
          };
  
          const opCurveIndex = (i + 1) % 2;
  
          model.control[opCurveIndex].x = model.center.x - offset.x;
          model.control[opCurveIndex].y = model.center.y - offset.y;
        }
  
        this.buildPoints(type, model);
  
        this.build();
      });
  
      this.body.on(this._events.up, async (e) => {
        this.unsubscribe();

        this.enableButtons();
        this.updateSlopeCurvesData();

        this.store();
  
        // this.build();
        await props.onComplete(this.canvas, { point: p });  
      });
    });
  }

  unsubscribeSlope() {
    this.canvas.off(this._eventsNS);
    this.view.off(this._eventsNS);
    this.body.off(this._eventsNS);

    this.view.removeClass('openhand closedhand');
  }

  getPointByPosition(x, y) {
    const points = [
      this.slope.points.center,
      ...this.slope.curves.map( c => c.points.control)
    ];
    
    for(let i = 0; i < points.length; i++) {
      const p = points[i];

      const radius = p.data.type === 'center'
        ? config.SLOPE.POINT.HOVER.RADIUS
        : config.SLOPE.CONTROL.POINT.HOVER.RADIUS;

      const d = Math.sqrt( Math.pow(y - p.y, 2) + Math.pow(x - p.x, 2) );

      if (d < radius) return p;
    }

    return null;
  }

  async subscribe(props = {}) {
    props = {
      onDown: () => {},
      onComplete: async () => {},
      loop: false,
      ...props
    };

    await new Promise((resolve) => {
      const onComplete = async (...args) => {
        await props.onComplete(...args);
        resolve();
      };

      this.subscribeSlope({ ...props, onComplete });
      this.subscribeButtons({ ...props, onComplete });
    });

    if (props.loop) {
      await this.subscribe(props);
    }
  }
  
  unsubscribe() {
    this.unsubscribeSlope();
    this.unsubscribeButtons();
  }

  drawGround() {
    this.ctx.strokeStyle = 'transparent';
    this.ctx.lineWidth = config.SLOPE.LINE.WIDTH;
    this.ctx.fillStyle = config.GROUND.COLOR;

    this.ctx.beginPath();

    const { path } = this.slope.ground;

    this.ctx.moveTo(path[0].x, path[0].y);

    for (var i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }

    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.save();
    this.ctx.clip();
    this.ctx.drawImage(this.slope.ground.image, 0, 0, config.WIDTH, config.HEIGHT);
    this.ctx.restore();
  }
  
  drawGrass() {
    this.slope.grass.images.forEach((image, i) => {
      const { WIDTH, HEIGHT, OFFSET } = config.GRASS[i];

      let x, y;

      if (i === 0) {
        x = config.SLOPE.POINTS.START.x - WIDTH - OFFSET.RIGHT;
        y = config.SLOPE.POINTS.START.y - HEIGHT + OFFSET.TOP;
      }
      else {
        x = config.SLOPE.POINTS.END.x + OFFSET.LEFT;
        y = config.SLOPE.POINTS.END.y - HEIGHT + OFFSET.TOP;
      }

      this.ctx.drawImage(image, x, y, WIDTH, HEIGHT);
    })
  }

  drawFlags() {
    ['START', 'END'].forEach((type, i) => {
      const { WIDTH, HEIGHT, OFFSET } = config.FLAG;

      const x = config.SLOPE.POINTS[type].x - WIDTH - OFFSET.RIGHT;
      const y = config.SLOPE.POINTS[type].y - HEIGHT - OFFSET.BOTTOM;

      this.ctx.drawImage(this.slope.flag.image, x, y, WIDTH, HEIGHT);
    })
  }

  drawSlope() {
    // Draw line
    this.ctx.beginPath();

    this.ctx.strokeStyle = config.SLOPE.COLOR;
    this.ctx.lineWidth = config.SLOPE.LINE.WIDTH;

    const { path } = this.slope;

    this.ctx.moveTo(path[0].x, path[0].y);

    for (var i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }

    // this.ctx.closePath();
    this.ctx.stroke();

    // Draw points
    this.ctx.beginPath();
    this.ctx.fillStyle = config.SLOPE.COLOR;

    this.slope.curves.forEach((c) => {
      const { x, y } = c.points.extreme;

      this.ctx.arc(x, y, config.SLOPE.POINT.RADIUS, 0, Math.PI * 2, false);
      this.ctx.fill();
    })
  }

  drawControlLine() {
    // Draw line
    this.ctx.beginPath();

    this.ctx.strokeStyle = config.SLOPE.CONTROL.COLOR;
    this.ctx.lineWidth = config.SLOPE.CONTROL.LINE.WIDTH;

    const { p0, p1 } = this.slope.lines.control;

    this.ctx.moveTo(p0.x, p0.y);
    this.ctx.lineTo(p1.x, p1.y);

    // this.ctx.closePath();
    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = config.SLOPE.CONTROL.COLOR;
    
    // Draw center point
    this.ctx.beginPath();

    const { x, y } = this.slope.points.center;

    this.ctx.arc(x, y, config.SLOPE.POINT.RADIUS, 0, Math.PI * 2, false);
    this.ctx.fill();

    // Draw control point
    this.ctx.beginPath();
    this.slope.curves.forEach((c) => {
      const { x, y } = c.points.control;

      this.ctx.arc(x, y, config.SLOPE.CONTROL.POINT.RADIUS, 0, Math.PI * 2, false);
      this.ctx.fill();
    });
  }

  drawBall() {
    const rotation = this.ball.GetAngle();
    const position = this.ball.GetWorldCenter();

    const x = position.x * config.SCALE;
    const y = position.y * config.SCALE;

    if (this.ball.data.static) {
      this.ball.SetAwake(false);
    }

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    this.ctx.drawImage(
      this.ball.image,
      -config.BALL.SIZE,
      -config.BALL.SIZE,
      config.BALL.SIZE * 2,
      config.BALL.SIZE * 2
    );

    this.ctx.restore();
  }

  draw() {
    this.ctx.clearRect(0, 0, config.WIDTH, config.HEIGHT);

    this.drawGround();
    this.drawGrass();
    this.drawFlags();
    this.drawSlope();
    this.drawControlLine();
    this.drawBall();
  }

  update() {
    this.world.Step(1 / 60, 10, 10);
    
    this.draw();

    if (this.runnning) {
      const bPos = this.ball.GetWorldCenter();

      const bX = bPos.x * config.SCALE;

      if (!this.finished) {
          this.updateCounter('current', 1000/60);

        if (bX > config.SLOPE.POINTS.END.x) {
          this.stop(1000/60);
        };
      }

      // Reset if ball have ran beyond the screen bounds
      if (
        (bX > config.WIDTH + config.BALL.SIZE) ||
        (bX < -config.BALL.SIZE)
      ) {
        this.reset({ slope: false, counter: false });
      }
    }

    this.world.ClearForces();
  }

  destroy() {
    clearInterval(this.interval);
  }

  disable() {
    this.parent.addClass('disabled');
  }

  enable() {
    this.parent.removeClass('disabled');
  }

  _zoomEventXY(e) {
    if (e.touches) {
      e = e.touches[0];
    }

    let zoom, correction;

    zoom = document.body.style.zoom;

    if (/^\s*\d+(\.\d+)?\s*$/.test(zoom)) {
      // is float
      correction = parseFloat(zoom);
    }
    else if (/^\s*\d+(\.\d+)?%\s*$/.test(zoom)) {
      // is percentage
      correction = parseInt(zoom) / 100;
    }
    else {
      correction = 1;
    }

    const pageX = e.pageX / correction;
    const pageY = e.pageY / correction;

    const offset = this.canvas.offset();

    return {
      x: pageX - offset.left,
      y: pageY - offset.top,
    };
  }
}

export default Game;

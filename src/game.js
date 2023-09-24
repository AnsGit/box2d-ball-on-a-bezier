import _ from 'underscore';
import $ from 'jquery';

import Box2D from 'box2dweb';
// const Box2D = require("box2dweb")

const { b2Vec2 } = Box2D.Common.Math;
const { b2BodyDef, b2Body, b2FixtureDef, b2World, b2DebugDraw } = Box2D.Dynamics;
const { b2MassData, b2PolygonShape, b2CircleShape } = Box2D.Collision.Shapes;

import config from './config.js';

$.div = (cl) => $('<div>', { class: cl });

class Game {
  constructor(props = {}) {
    this.props = {
      class: 'game',
      ...props,
    };

    this.create();
  }

  create() {
    this._preset();

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
    // this.subscribe();
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
      });

    this.ctx = this.canvas[0].getContext('2d');
  }

  createWorld() {
    this.gravity = new b2Vec2(config.PHYSICS.GRAVITY.x, config.PHYSICS.GRAVITY.y);
    this.world = new b2World(this.gravity, true);
  }

  // preload() {
  //   this.load.image('ball', require('../assets/ball.png'), 40, 40);
  // }

  _preset() {
    const { POINTS, CONTROL } = config.SLOPE;

    // // Temp line
    // const line = new Phaser.Geom.Line(
    //   POINTS.START.x, POINTS.START.y,
    //   POINTS.END.x, POINTS.END.y
    // );

    this._preset = {};

    const sWidth = POINTS.END.x - POINTS.START.x;
    const sHeight = POINTS.END.y - POINTS.START.y;

    // Default center point
    this._preset.points = {
      // center: line.getPoint(0.5),
      center: {
        x: POINTS.START.x + sWidth/2,
        y: POINTS.START.y + sHeight/2,
      },
    };

    // Default curves points
    this._preset.curves = [['START', -1], ['END', 1]].map(([type, direction], i) => {
      let points = {};

      // points.control = line.getPoint(0.5 + CONTROL.POINT.OFFSET * direction);
      points.control = {
        x: this._preset.points.center.x + sWidth * CONTROL.POINT.OFFSET * direction,
        y: this._preset.points.center.y + sHeight * CONTROL.POINT.OFFSET * direction,
      };
      
      if (i === 0) {
        points.all = [
          // Start point
          // new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          { x: POINTS[type].x, y: POINTS[type].y },
          // Control point 0 (fixed)
          // new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          { x: POINTS[type].x, y: POINTS[type].y },
          // Control point 1 (draggable)
          // new Phaser.Math.Vector2(points.control.x, points.control.y),
          { x: points.control.x, y: points.control.y },
          // End point
          // new Phaser.Math.Vector2(this._preset.points.center.x, this._preset.points.center.y)
          { x: this._preset.points.center.x, y: this._preset.points.center.y },
        ];

        points.extreme = points.all[0];
      }
      else {
        points.all = [
          // Start point
          // new Phaser.Math.Vector2(this._preset.points.center.x, this._preset.points.center.y),
          { x: this._preset.points.center.x, y: this._preset.points.center.y },
          // Control point 0 (draggable)
          // new Phaser.Math.Vector2(points.control.x, points.control.y),
          { x: points.control.x, y: points.control.y },
          // Control point 1 (fixed)
          // new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          { x: POINTS[type].x, y: POINTS[type].y },
          // End point
          // new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          { x: POINTS[type].x, y: POINTS[type].y },
        ];

        points.extreme = points.all[3];
      }

      return { points };
    });

    // // Remove temp line
    // this.matter.world.remove(line);
  }

  // create() {
  //   this._preset();

  //   this.parent = $(`#${this.registry.parent.config.parent}`);

  //   this.matter.world.setBounds(0, 0, config.WIDTH, config.HEIGHT, 50, false, false, true, true);
  //   this.matter.world.setGravity(config.PHYSICS.GRAVITY.x, config.PHYSICS.GRAVITY.y);

  //   // this.matter.world.runner.isFixed = true;
  //   this.matter.world.autoUpdate = false;

  //   // console.log(Phaser);
  //   // console.log(this.matter);
  //   // console.log(this.matter.systems.cache.game);
  //   // console.log(this.matter.systems.cache.game.config);
  //   // console.log(this.matter.systems.cache.game.config.seed);
  //   // console.log(Phaser.Physics.Matter);
  //   // console.log(Phaser.Physics.Matter.Matter.Common.random);
  //   // console.log(Phaser.Physics.Matter.Matter.Common);

  //   this.graphics = this.add.graphics();

  //   this.frameTime = 0;

  //   this.createSlope();
  //   this.createBall();

  //   this.createTitle();
  //   this.createCounters();
  //   this.createButtons();

  //   this.build();
  //   this.subscribe();
  // }

  store() {
    if (!config.LOCAL_STORAGE) return;

    window.localStorage['matter-curve'] = JSON.stringify(
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
    if (!window.localStorage['matter-curve']) return;

    const state = JSON.parse(window.localStorage['matter-curve']);

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

      // points.control.setPosition(
      //   state.slope.points.control[i].x,
      //   state.slope.points.control[i].y,
      // );
      points.control.x = state.slope.points.control[i].x;
      points.control.y = state.slope.points.control[i].y;
    });

    // this.slope.points.center.setPosition(
    //   state.slope.points.center.x,
    //   state.slope.points.center.y,
    // );
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
        // const instance = new Phaser.Curves.CubicBezier(
        //   ...this._preset.curves[i].points.all.map((p) => {
        //     return new Phaser.Math.Vector2(p.x, p.y);
        //   })
        // );

        const instance = this._preset.curves[i].points.all.reduce((acc, p, i) => {
          acc[`p${i}`] = { x: p.x, y: p.y };
          return acc;
        }, {});
        
        // Visible points
        const points = {
          // extreme: this.add.circle(
          //   this._preset.curves[i].points.extreme.x,
          //   this._preset.curves[i].points.extreme.y,
          //   config.SLOPE.POINT.RADIUS,
          //   config.SLOPE.COLOR
          // ),
          extreme: {
            x: this._preset.curves[i].points.extreme.x,
            y: this._preset.curves[i].points.extreme.y
          },
          // control: this.add.circle(
          //   this._preset.curves[i].points.control.x,
          //   this._preset.curves[i].points.control.y,
          //   config.SLOPE.CONTROL.POINT.RADIUS,
          //   config.SLOPE.CONTROL.COLOR
          // )
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

        // points.control
        //   .setInteractive()
        //   .setData('vector', instance[i === 0 ? 'p2' : 'p1'])
        //   .setData('type', 'control')
        //   .setData('index', i);
        
        // Supporting data
        const data = { control: { offset: null } };

        return { instance, points, data };
      }),
      points: {
        // center: this.add.circle(
        //   this._preset.points.center.x,
        //   this._preset.points.center.y,
        //   config.SLOPE.POINT.RADIUS,
        //   config.SLOPE.CONTROL.COLOR
        // )
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
        // control: new Phaser.Curves.Line(
        //   new Phaser.Math.Vector2(
        //     this._preset.curves[0].points.control.x,
        //     this._preset.curves[0].points.control.y
        //   ),
        //   new Phaser.Math.Vector2(
        //     this._preset.curves[1].points.control.x,
        //     this._preset.curves[1].points.control.y
        //   )
        // )
        control: this._preset.curves.reduce((acc, { points }, i) => {
          acc[`p${i}`] = { x: points.control.x, y: points.control.x };
          return acc;
        }, {})
      },
      // interactive: { points: null },
      ground: null,
      path: [],
      rects: []
    };

    // this.slope.points.center
    //   .setInteractive()
    //   .setData('vectors', this.slope.curves.map((c, i) => {
    //     return c.instance[i === 0 ? 'p3' : 'p0'];
    //   }))
    //   .setData('type', 'center');

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

      // points.extreme.setPosition(
      //   this._preset.curves[i].points.extreme.x,
      //   this._preset.curves[i].points.extreme.y,
      // );
      points.extreme.x = this._preset.curves[i].points.extreme.x;
      points.extreme.y = this._preset.curves[i].points.extreme.y;
      
      // points.control.setPosition(
      //   this._preset.curves[i].points.control.x,
      //   this._preset.curves[i].points.control.y,
      // );
      points.control.x = this._preset.curves[i].points.control.x;
      points.control.y = this._preset.curves[i].points.control.y;

      // points.control.setData('vector', instance[i === 0 ? 'p2' : 'p1']);
      points.control.data.vector = instance[i === 0 ? 'p2' : 'p1'];
    });

    // this.slope.points.center
    //   .setPosition(
    //     this._preset.points.center.x,
    //     this._preset.points.center.y,
    //   )
    //   .setData('vectors', this.slope.curves.map((c, i) => {
    //     return c.instance[i === 0 ? 'p3' : 'p0'];
    //   }));
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
    // 1 WAY
    const { POINTS } = config.SLOPE;

    // const Body = Phaser.Physics.Matter.Matter.Body;
    // const Bodies = Phaser.Physics.Matter.Matter.Bodies;

    this.slope.path = [
      // ...this.slope.curves[0].instance.getPoints(POINTS.COUNT/2),
      ...this.getCurvePoints(0),
      // ...this.slope.curves[1].instance.getPoints(POINTS.COUNT/2).slice(1)
      ...this.getCurvePoints(1).slice(1),
    ];
    
    // this.slope.ground && this.matter.world.remove(this.slope.ground);
    this.slope.ground && this.world.DestroyBody(this.slope.ground);

    // this.slope.ground = Bodies.fromVertices(
    //   config.WIDTH - 0,
    //   config.HEIGHT - POINTS.START.y,
    //   [
    //     new Phaser.Math.Vector2(0, config.HEIGHT),
    //     new Phaser.Math.Vector2(0, POINTS.START.y),
    //     ...this.slope.path,
    //     new Phaser.Math.Vector2(config.WIDTH, POINTS.END.y),
    //     new Phaser.Math.Vector2(config.WIDTH, config.HEIGHT)
    //   ],
    //   { isStatic: true },
    //   true
    // );

    const bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.Set(0, 0);
    
    this.slope.ground = this.world.CreateBody(bodyDef);

    const points = [
      { x: 0, y: config.HEIGHT },
      { x: 0, y: POINTS.START.y },
      ...this.slope.path,
      { x: config.WIDTH, y: POINTS.END.y },
      { x: config.WIDTH, y: config.HEIGHT }
    ];

    for (let i = 0; i < points.length - 1; i++) {
      const edgeShape = new b2PolygonShape();

      edgeShape.SetAsEdge(
        new b2Vec2(points[i].x / config.SCALE, points[i].y / config.SCALE),
        new b2Vec2(points[i+1].x / config.SCALE, points[i+1].y / config.SCALE)
      );

      this.slope.ground.CreateFixture2(edgeShape);  
    }

    // Body.setPosition(this.slope.ground, {
    //   x: config.WIDTH - this.slope.ground.bounds.min.x,
    //   y: POINTS.START.y + (config.HEIGHT - POINTS.START.y) - this.slope.ground.bounds.max.y + (config.HEIGHT - POINTS.START.y),
    //   // y: config.HEIGHT - this.slope.ground.bounds.max.y + (config.HEIGHT - POINTS.START.y),
    // });

    // this.slope.ground.friction = config.PHYSICS.SLOPE.FRICTION;

    // this.matter.world.add(this.slope.ground);

    return;
    

    // 2 WAY
    this.slope.path = [
      ...this.slope.curves[0].instance.getPoints(32),
      ...this.slope.curves[1].instance.getPoints(32).slice(1)
    ];

    this.slope.rects.forEach((rect) => {
      rect && this.matter.world.remove(rect);
    });

    let nextPosition = {};

    // Slope rects
    this.slope.rects = this.slope.path.map(({ x, y }, i) => {
      if (i === this.slope.path.length - 1) return;

      nextPosition.x = this.slope.path[i + 1].x;
      nextPosition.y = this.slope.path[i + 1].y;

      const distance = Phaser.Math.Distance.Between(nextPosition.x, nextPosition.y, x, y);
      const angle = Phaser.Math.Angle.Between(nextPosition.x, nextPosition.y, x, y);

      const rect = this.matter.add.rectangle(x, y, distance, 2, {
        // friction: 0,
        // frictionAir: 0,
        // restitution: 0,
        // ignoreGravity: true,
        // inertia: Infinity,
        angle,
        isStatic: true,
        collisionFilter: { category: this.surface.category }
      });

      // rect.density = 0
      // rect.friction = 0.11
      // rect.frictionStatic = 0
      // rect.inertia = 1000
      // rect.inverseInertia = 100000

      // console.log(rect);

      return rect;
    });
  }

  getCurvePoints(i) {
    const c = this.slope.curves[i];

    const { p0, p1, p2, p3 } = c.instance;

    const points = [];
    // var pointA = new b2Vec2(82/SCALE, 200/SCALE);

    // // point to the second point, 'pointB' about a third from the left and the bottom
	  // var pointB = new b2Vec2(82/SCALE, 200/SCALE);

    // var pointC = new b2Vec2(137/SCALE, 438/SCALE);
    // var pointD = new b2Vec2(259/SCALE, 305/SCALE);

    // // place the first point, 'pointA' in the upper left hand corner.
    // var pointA = new b2Vec2(259/SCALE, 305/SCALE);

    // // point to the second point, 'pointB' about a third from the left and the bottom
  	// var pointB = new b2Vec2(381/SCALE, 172/SCALE);

    // var pointC = new b2Vec2(612/SCALE, 360/SCALE);
    // var pointD = new b2Vec2(612/SCALE, 360/SCALE);

    let x = p0.x;
    let y = p0.y;

    points.push({ x, y });
    // var x2, y2;
    // var i;

    // bodyDef.position.Set(0, 0);

    // var curve = world.CreateBody(bodyDef);

    // var edgeShape = new b2PolygonShape();
    // edgeShape.SetAsEdge(new b2Vec2(0, y1), new b2Vec2(x1, y1));
    // curve.CreateFixture2(edgeShape);

    const step = (1/config.SLOPE.POINTS.COUNT/2);

    for (i = 0; i < (1 - step); i += step) {
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

        // var edgeShape = new b2PolygonShape();
        // edgeShape.SetAsEdge(new b2Vec2(x1, y1), new b2Vec2(x2, y2));
        // // edgeShape.density = 0.0;
        // // edgeShape.friction = 10.0;
        // // edgeShape.restitution = 10.0;
        // curve.CreateFixture2(edgeShape);

        // x1 = x2;
        // y1 = y2;
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

      // Check if object was dragged out of the drag area
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
    // this.ball = this.matter.add.image(0, 0, 'ball', 1);
    
    // // this.ball.setCircle(config.BALL.SIZE);
    // this.ball.setPolygon(config.BALL.SIZE, 70);
    // this.ball.setFriction(config.PHYSICS.BALL.FRICTION);
    // this.ball.setFrictionAir(config.PHYSICS.BALL.FRICTION_AIR);
    // this.ball.setBounce(config.PHYSICS.BALL.BOUNCE);
    // this.ball.setDensity(config.PHYSICS.BALL.DENSITY);

    // // // Init auxiliary props
    // // this.ball.collide = {
    // //   body: { id: null },
    // //   timeout: null
    // // };

    // // this.ball.direction = { changed: false };

    // const body = this.ball.body;
    // this.matter.body.setInertia(body, config.PHYSICS.BALL.INERTIA);

    // this.ball.setStatic(true);

    const bodyDef = new b2BodyDef();

    bodyDef.position.x = 0 / config.SCALE;
    bodyDef.position.y = 0 / config.SCALE;

    const fixDef = new b2FixtureDef();
    
    fixDef.density = config.PHYSICS.BALL.DENSITY;
    fixDef.friction = config.PHYSICS.BALL.FRICTION;
    fixDef.restitution = config.PHYSICS.BALL.RESTITUTION;
    fixDef.shape = new b2CircleShape(config.BALL.SIZE / config.SCALE);
    
    this.ball = this.world.CreateBody(bodyDef);
    this.ball.CreateFixture(fixDef);
  }

  resetBall() {
    this.buildBall();
    // this.ball.setStatic(true);
    this.ball.SetType(b2Body.b2_staticBody);
  }

  buildBall() {
    const [ p0, p1 ] = this.slope.path.slice(0, 2);

    // const p0 = this.slope.curve.getPoint(0.05);
    // const p1 = this.slope.curve.getPoint(0.06);

    // const angle = Phaser.Math.Angle.Between(p0.x, p0.y, p1.x, p1.y);
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x)

    const x = p0.x + config.BALL.SIZE * Math.sin(angle);
    const y = p0.y - config.BALL.SIZE * Math.cos(angle);

    // this.ball.SetPosition(x, y);
    // this.ball.body.angle = 0;
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
    // this.input.enabled = true;
  }

  run() {
    this.runnning = true;
    this.finished = false;

    this.resetCounter('current');

    // Set x/y-gravity before running
    // this.matter.world.setGravity(config.PHYSICS.GRAVITY.x, config.PHYSICS.GRAVITY.y);

    // this.buttons.reset.view.addClass('disabled');
    this.buttons.run.view.addClass('disabled');
    // this.input.enabled = false;

    // this.ball.setStatic(false);
    this.ball.SetType(b2Body.b2_dynamicBody);
    // this.ball.setVelocityX(1);
    // this.ball.setVelocityY(5);
    // this.ball.setAngularVelocity(0.1);

    // this.ball.setOnCollideEnd((data) => {
    //   // console.log(data);
    //   // this.ball.collide.body.id = data.collision.pair.bodyB.id;
    //   // console.log(this.ball.collide.body.id);
    //   // clearTimeout(this.ball.collide.timeout);

    //   // this.ball.collide.timeout = setTimeout(
    //   //   () => {
    //   //     // this.stop();
    //   //     // this.reset({ slope: false, counter: false });
    //   //   },
    //   //   config.BALL.COLLIDE.TIMEOUT
    //   // );
    // })

    // let i = 0;
    // this.ball.setSleepEndEvent((...args) => {
    //   // console.log(args);
    //   console.log(i++);
    // })
    
    // this.buttons.reset.view.removeClass('disabled');
    // console.log('STOPED');
  }

  stop() {
    this.finished = true;

    // Reset x-gravity after slope ending
    // this.matter.world.setGravity(0, config.PHYSICS.GRAVITY.y);

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

  subscribeButtons() {
    // RESET SLOPE AND BALL
    this.buttons.reset.view.on('click', (e) => {
      // console.log('RESETED');

      // this.reset();
      this.reset({ slope: false });
    });

    // RUN BALL
    this.buttons.run.view.on('click', (e) => {
      // console.log('STARTED');

      this.run();
    });
  }

  subscribeSlope() {
    const { DRAG } = config.SLOPE;
    const { curves } = this.slope;

    this.input.setDraggable([
      ...this.slope.curves.map( c => c.points.control ),
      this.slope.points.center
    ]);

    this.input.on('dragstart', (pointer, gameObject) => {
      this.disableButtons();
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      const type = gameObject.data.get('type');

      const model = { center: {}, control: [ {}, {} ] };

      if (type === 'center') {
        model.center.x = dragX;
        model.center.y = dragY;

        // Move control points towards center point
        curves.forEach((c, i) => {
          model.control[i].x = dragX + c.data.control.offset.x;
          model.control[i].y = dragY + c.data.control.offset.y;
        });
      }
      else {
        model.center.x = this.slope.points.center.x;
        model.center.y = this.slope.points.center.y;

        const i = gameObject.data.get('index');

        if (i === 0) {
          if (dragX > model.center.x) dragX = model.center.x;
        }
        else {
          if (dragX < model.center.x) dragX = model.center.x;
        }

        // Change position of dragged point
        model.control[i].x = dragX;
        model.control[i].y = dragY;
        
        // Move the opposite control point to match the control point being dragged
        const offset = {
          x: dragX - model.center.x,
          y: dragY - model.center.y
        };

        const opCurveIndex = (i + 1) % 2;

        model.control[opCurveIndex].x = model.center.x - offset.x;
        model.control[opCurveIndex].y = model.center.y - offset.y;
      }

      this.buildPoints(type, model);

      this.build();
    });

    this.input.on('dragend', (pointer, gameObject) => {
      this.enableButtons();
      this.updateSlopeCurvesData();

      this.store();

      // this.build();
    });
  }

  subscribe() {
    this.subscribeSlope();
    this.subscribeButtons();
  }

  drawSlope() {
    this.graphics.moveTo(this.slope.path[0].x, this.slope.path[0].y);

    for (var i = 1; i < this.slope.path.length; i++) {
      this.graphics.lineTo(this.slope.path[i].x, this.slope.path[i].y);
    }
  }

  drawGround() {
    this.graphics.beginPath();

    this.graphics.fillStyle(config.GROUND.COLOR);
    this.graphics.lineStyle(8, 'transparent');

    // Stroke slope
    this.drawSlope();

    // Stroke ground
    this.graphics.lineTo(config.WIDTH, config.SLOPE.POINTS.END.y);
    this.graphics.lineTo(config.WIDTH, config.HEIGHT);
    this.graphics.lineTo(0, config.HEIGHT);
    this.graphics.lineTo(0, config.SLOPE.POINTS.START.y);

    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw slope over the ground
    this.graphics.lineStyle(config.SLOPE.LINE.WIDTH, config.SLOPE.COLOR);
    this.slope.curves.forEach( c =>  c.instance.draw(this.graphics) );
  }

  drawControlLine() {
    this.graphics.lineStyle(config.SLOPE.CONTROL.LINE.WIDTH, config.SLOPE.CONTROL.COLOR);
    this.slope.lines.control.draw(this.graphics);
  }

  draw() {
    this.graphics.clear();

    this.drawGround();
    this.drawControlLine();
  }

  update(time, delta) {
    this.draw();

    if (this.runnning) {
        if (!this.finished) {
          this.updateCounter('current', delta);

        if (this.ball.x > config.SLOPE.POINTS.END.x) {
          this.stop(delta);
        };
      }

      // Reset if ball have ran beyond the screen bounds
      if (
        (this.ball.x > config.WIDTH + config.BALL.SIZE) ||
        (this.ball.x < -config.BALL.SIZE)
      ) {
        this.reset({ slope: false, counter: false });
      }
    }

    this.matter.world.step(delta);

    return;

    // Check it if needing in fps limitation
    this.frameTime += delta;
    while(this.frameTime >= 16.66) {
      this.frameTime -= 16.66;

      this.draw();

      if (this.runnning) {
        if (!this.finished) {
          this.updateCounter('current', delta);

          if (this.ball.x > config.SLOPE.POINTS.END.x) {
            this.stop(delta);
          };
        }

        // Reset if ball have ran beyond the screen bounds
        if (
          (this.ball.x > config.WIDTH + config.BALL.SIZE) ||
          (this.ball.x < -config.BALL.SIZE)
        ) {
          this.reset({ slope: false, counter: false });
        }
      }

      this.matter.world.step(16.66);
    }
  }

  subscribe(props = {}) {

  }

  disable() {
    this.parent.addClass('disabled');
  }

  enable() {
    this.parent.removeClass('disabled');
  }
}

export default Game;

const config = {
  LOCAL_STORAGE: true,
  WIDTH: 1024,
  HEIGHT: 512,
  SCALE: 140,
  SLOPE: {
    COLOR: '#473289',
    POINT: {
      RADIUS: 12,
      HOVER: {
        RADIUS: 18
      }
    },
    LINE: {
      WIDTH: 8
    },
    POINTS: {
      START: { x: 82, y: 200 },
      END: { x: 612, y: 360 },
      COUNT: 40
    },
    CONTROL: {
      COLOR: '#FFFFFF',
      POINT: {
        RADIUS: 8,
        START_OFFSET: 55,
        MIN_OFFSET: 30,
        HOVER: {
          RADIUS: 18
        }
      },
      LINE: {
        WIDTH: 2
      }
    },
    DRAG: {
      AREA: {
        MIN: { x: 125, y: 84 },
        MAX: { x: 585, y: 490 },
      }
    }
  },
  GROUND: {
    COLOR: '#674FB2'
  },
  BALL: {
    SIZE: 20,
    x: 103,
    y: 200,
    // COLLIDE: { TIMEOUT: 1000 }
  },
  PHYSICS: {
    GRAVITY: { x: 0, y: 10 },
    BALL: {
      // FRICTION: 0.01,
      // FRICTION_AIR: 0,
      // BOUNCE: 0.0,
      // DENSITY: 0.000008,
      // INERTIA: 0.1,
      FRICTION: 2.0,
      DENSITY: 1.0,
      RESTITUTION: 0,
    },
    SLOPE: {
      FRICTION: 0.01
    }
  }
};

export default config;
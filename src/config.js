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
        RADIUS: 18,
        SCALE: 1.33
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
        RADIUS: 4,
        START_OFFSET: 55,
        MIN_OFFSET: 30,
        HOVER: {
          RADIUS: 18,
          SCALE: 1.5
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
    COLOR: '#674FB2',
    IMAGE: {
      SRC: require("../assets/ground.png")
    }
  },
  GRASS: [
    {
      WIDTH: 245,
      HEIGHT: 29,
      OFFSET: {
        TOP: 7,
        RIGHT: 2
      },
      IMAGE: {
        SRC: require("../assets/grass-0.png")
      }
    },
    {
      WIDTH: 406,
      HEIGHT: 56,
      OFFSET: {
        TOP: 5,
        LEFT: 7
      },
      IMAGE: {
        SRC: require("../assets/grass-1.png")
      }
    },
  ],
  FLAG: {
    WIDTH: 28,
    HEIGHT: 48,
    OFFSET: {
      RIGHT: -2,
      BOTTOM: 7
    },
    IMAGE: {
      SRC: require("../assets/flag.png")
    }
  },
  BALL: {
    SIZE: 20,
    x: 103,
    y: 200,
    IMAGE: {
      SRC: require("../assets/ball.png")
    }
  },
  PHYSICS: {
    GRAVITY: { x: 0, y: 10 },
    BALL: {
      FRICTION: 2.0,
      DENSITY: 1.0,
      RESTITUTION: 0,
    }
  }
};

export default config;
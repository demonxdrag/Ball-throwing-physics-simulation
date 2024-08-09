# config.py

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Colors
WHITE = (255, 255, 255)
RED = (255, 0, 0)
BLACK = (0, 0, 0)
BLUE = (0, 0, 255)

# Rod properties
ROD_LENGTH = 200        # Length of the rod in mm
ROD_RADIUS = 7.5        # Radius of the rod in mm
ROD_DENSITY = 7.87

# Ball properties
BALL_RADIUS = 7.5       # Radius of the ball in mm
BALL_DENSITY = 7.87

# Physics
GRAVITY = 0.98          # Gravity affecting the ball
INITIAL_ANGLE = 0       # Initial angle of the rod in degrees
RELEASE_ANGLE = 90      # Angle at which the ball is released
MOTOR_TORQUE = 2        # Angular velocity of the rod in degrees per frame
MOTOR_MAX_SPEED = 2     # Radians per second
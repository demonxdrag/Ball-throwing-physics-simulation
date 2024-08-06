import pygame
import pygame_gui
import sys
import math
from config import *

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Ball Throw Simulation with Rotating Assembly")

font = pygame.font.Font(None, 36)
clock = pygame.time.Clock()
manager = pygame_gui.UIManager((SCREEN_WIDTH, SCREEN_HEIGHT))

# Create input fields and labels
initial_angle_label = pygame_gui.elements.UILabel(relative_rect=pygame.Rect((10, 10), (150, 30)), text='Initial Angle:', manager=manager)
initial_angle_input = pygame_gui.elements.UITextEntryLine(relative_rect=pygame.Rect((160, 10), (100, 30)), manager=manager)
initial_angle_input.set_text(str(INITIAL_ANGLE))

motor_torque_label = pygame_gui.elements.UILabel(relative_rect=pygame.Rect((10, 50), (150, 30)), text='Motor Torque:', manager=manager)
motor_torque_input = pygame_gui.elements.UITextEntryLine(relative_rect=pygame.Rect((160, 50), (100, 30)), manager=manager)
motor_torque_input.set_text(str(MOTOR_TORQUE))

release_angle_label = pygame_gui.elements.UILabel(relative_rect=pygame.Rect((10, 90), (150, 30)), text='Release Angle:', manager=manager)
release_angle_input = pygame_gui.elements.UITextEntryLine(relative_rect=pygame.Rect((160, 90), (100, 30)), manager=manager)
release_angle_input.set_text(str(RELEASE_ANGLE))

rod_radius_in_mm = ROD_RADIUS / 10
rod_length_in_mm = ROD_LENGTH / 10
rod_weight = math.pi * rod_radius_in_mm**2 * rod_length_in_mm * ROD_DENSITY
ball_radius_in_mm = BALL_RADIUS / 10
ball_weight = ((4 * math.pi * ball_radius_in_mm**3) / 3) * BALL_DENSITY

# Rod origin (in pixels, for drawing purposes)
rod_origin = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)  # Center of rotation
initial_velocity = [0, 0]

# Function to calculate the expected path of the ball
def calculate_path(initial_angle, motor_torque, release_angle):
    # Convert weights from grams to kilograms
    rod_weight_kg = rod_weight / 1000  # kg
    ball_weight_kg = ball_weight / 1000  # kg

    # Convert angles to radians for calculation
    initial_angle_rad = math.radians(initial_angle)
    release_angle_rad = math.radians(release_angle)

    # Moments of inertia
    I_rod = (1 / 3) * rod_weight_kg * ROD_LENGTH ** 2  # kg*cm^2
    I_ball = ball_weight_kg * ROD_LENGTH ** 2  # kg*cm^2
    I_total = I_rod + I_ball  # kg*cm^2

    # Initial conditions
    rad_angle = initial_angle_rad  # radians
    rotational_speed = 0  # rad/frame
    accelerating = True

    # Calculate rotational speed until release
    while accelerating:
        if rad_angle >= release_angle_rad or rotational_speed >= MOTOR_MAX_SPEED:
            accelerating = False
        else:
            angular_acceleration = motor_torque / I_total  # rad/frame^2
            rotational_speed += angular_acceleration  # rad/frame
            rad_angle += rotational_speed  # radians

    # Linear velocity at release (perpendicular to the rod)
    release_velocity = rotational_speed * ROD_LENGTH  # cm/frame
    velocity = [
        -release_velocity * math.sin(release_angle_rad),  # cm/frame
        release_velocity * math.cos(release_angle_rad)  # cm/frame
    ]

    # Initial position of the ball
    position = [
        rod_origin[0] + ROD_LENGTH * math.cos(release_angle_rad),  # cm
        rod_origin[1] + ROD_LENGTH * math.sin(release_angle_rad)  # cm
    ]
    path = []

    # Update position until the ball hits the ground
    while position[1] < SCREEN_HEIGHT:
        velocity[1] += GRAVITY  # cm/frame^2
        position[0] += velocity[0]  # cm
        position[1] += velocity[1]  # cm
        path.append((int(position[0]), int(position[1])))
        if position[0] >= SCREEN_WIDTH or position[1] >= SCREEN_HEIGHT:
            break

    distance = position[0] - rod_origin[0] - ROD_LENGTH * math.cos(release_angle_rad)  # cm
    return path, distance


# Main loop
running = True

while running:
    time_delta = clock.tick(60) / 1000.0

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        manager.process_events(event)
        
    manager.update(time_delta)

    # Retrieve the values from input fields
    try:
        initial_angle = float(initial_angle_input.get_text())
    except ValueError:
        initial_angle = INITIAL_ANGLE

    try:
        motor_torque = float(motor_torque_input.get_text())
    except ValueError:
        motor_torque = MOTOR_TORQUE

    try:
        release_angle = float(release_angle_input.get_text())
    except ValueError:
        release_angle = RELEASE_ANGLE

    # Calculate rod angle and ball position for both systems
    rod_angle_1 = initial_angle
    rad_angle_1 = math.radians(rod_angle_1)
    ball_1_pos = [
        rod_origin[0] + ROD_LENGTH * math.cos(rad_angle_1),
        rod_origin[1] + ROD_LENGTH * math.sin(rad_angle_1)
    ]
    
    rod_angle_2 = release_angle
    rad_angle_2 = math.radians(rod_angle_2)
    ball_2_pos = [
        rod_origin[0] + ROD_LENGTH * math.cos(rad_angle_2),
        rod_origin[1] + ROD_LENGTH * math.sin(rad_angle_2)
    ]

    # Calculate the expected path and distance
    path, distance = calculate_path(initial_angle, motor_torque, release_angle)

    # Clear the screen
    screen.fill(WHITE)

    # Draw the rods
    rod_1_end = (int(ball_1_pos[0]), int(ball_1_pos[1]))
    pygame.draw.line(screen, BLACK, rod_origin, rod_1_end, 15)
    rod_2_end = (int(ball_2_pos[0]), int(ball_2_pos[1]))
    pygame.draw.line(screen, BLACK, rod_origin, rod_2_end, 15)

    # Draw the expected path
    for point in path:
        pygame.draw.circle(screen, BLUE, point, 2)

    # Draw the balls
    pygame.draw.circle(screen, RED, (int(ball_1_pos[0]), int(ball_1_pos[1])), BALL_RADIUS)
    pygame.draw.circle(screen, BLUE, (int(ball_2_pos[0]), int(ball_2_pos[1])), BALL_RADIUS)
    
    # Draw the concentric circle
    pygame.draw.circle(screen, BLACK, rod_origin, ROD_LENGTH, 1)

    # Display expected distance
    distance_text = f'Expected Distance: {distance:.2f} cm'
    distance_surface = font.render(distance_text, True, BLACK)
    screen.blit(distance_surface, (SCREEN_WIDTH // 2, 10))
    
    # Display expected weights
    rod_weight_text = f'Rod Weight: {rod_weight:.2f} grams'
    rod_weight_surface = font.render(rod_weight_text, True, BLACK)
    screen.blit(rod_weight_surface, (SCREEN_WIDTH // 2, 30))
    ball_weight_text = f'Ball Weight: {ball_weight:.2f} grams'
    ball_weight_surface = font.render(ball_weight_text, True, BLACK)
    screen.blit(ball_weight_surface, (SCREEN_WIDTH // 2, 50))

    # Draw the GUI elements
    manager.draw_ui(screen)

    # Update the display
    pygame.display.flip()

# Quit Pygame
pygame.quit()
sys.exit()

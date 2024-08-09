import { config } from '../config/config'

export interface PathPoint {
	x: number
	y: number
}

export interface SimulationResult {
	path: PathPoint[]
	distance: number
}

export function calculatePath(initialAngle: number, motorTorque: number, releaseAngle: number): SimulationResult {
	// Convert angles to radians
	const initialAngleRad = (initialAngle * Math.PI) / 180
	const releaseAngleRad = (releaseAngle * Math.PI) / 180
	const angleDeltaRad = (Math.abs(releaseAngle - initialAngle) * Math.PI) / 180

	// Constants
	const rodLength = config.rodLength / 10 //cm
	const rodRadius = config.rodWidth / 20 //cm
	const rodWeight = Math.PI * rodRadius ** 2 * rodLength * config.rodDensity // g
	const ballRadius = config.ballWidth / 20 //cm
	const ballWeight = ((4 * Math.PI * ballRadius ** 3) / 3) * config.ballDensity // g
	const motorMaxSpeed = config.motorMaxSpeed // rad/s
	const gravity = config.gravity // m/s^2

	// Moments of inertia in kg*cm^2 (converted from grams to kg)
	const rodWeightKg = rodWeight / 1000
	const ballWeightKg = ballWeight / 1000
	const I_rod = ((1 / 3) * rodWeightKg * rodLength) ** 2
	const I_ball = (ballWeightKg * rodLength) ** 2
	const I_total = I_rod + I_ball

	// Calculate angular velocity at release
	const angularSpeedAtRelease = Math.sqrt((2 * motorTorque * angleDeltaRad) / I_total)
	const angularSpeed = Math.min(angularSpeedAtRelease, motorMaxSpeed)

	console.log(motorTorque, angleDeltaRad, I_total, angularSpeedAtRelease)

	// Linear velocity at release (perpendicular to the rod)
	const releaseVelocity = angularSpeed * rodLength // cm/s
	const velocity = {
		x: releaseVelocity * Math.sin(releaseAngleRad), // cm/s
		y: releaseVelocity * Math.cos(releaseAngleRad) // cm/s
	}

	// Initial position of the ball
	const position = {
		x: rodLength * Math.cos(releaseAngleRad), // cm
		y: rodLength * Math.sin(releaseAngleRad) // cm
	}

	// Surfaces
	const wall = config.wall / 10 // cm
	const floor = config.floor / 10 // cm

	const path: PathPoint[] = []
	// Update position until the ball hits a surface
	while (position.y >= floor || Math.abs(position.x) < wall) {
		if (velocity.y < 0) {
			velocity.y -= gravity * 10 // cm/s^2
			position.y += velocity.y // cm/s
		} else {
			velocity.y += gravity * 10 // cm/s^2
			position.y -= velocity.y // cm/s
		}
		if (velocity.x < 0) {
            position.x += velocity.x // cm/s
		} else {
            position.x -= velocity.x // cm/s
		}
		path.push({ x: position.x, y: position.y })
	}

	const distance = position.x // Final x-position is the distance

	return { path, distance }
}

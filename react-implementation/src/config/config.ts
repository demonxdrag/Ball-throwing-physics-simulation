export const config = {
	// Rod
	rodLength: 200, // mm
	rodWidth: 15, // diameter in mm
	rodDensity: 2.7, // g/cm^3
	rodDrag: 1.17, // constant
	// Ball
	ballWidth: 15, // diameter in mm
	ballDensity: 7.87, // g/cm^3
	ballDrag: 0.47, // constant
	// Surfaces
	wall: 500, // mm
	floor: 500, // mm
	// Motor
	motorTorque: 2, // Nm
	motorMaxSpeed: 6.28, // radians/s
	// Generic
	initialAngle: 1,
	releaseAngle: 90,
	gravity: 9.81, // m/s^2
	airDensity: 1.225, // kg/m^3
}

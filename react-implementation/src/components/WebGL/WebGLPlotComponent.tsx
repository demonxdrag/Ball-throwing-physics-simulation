import React, { useEffect, useRef, useState } from 'react'

import { config } from '../../config/config'

interface PlotProps {
	initialAngle: number
	releaseAngle: number
	motorTorque: number
	motorMaxSpeed: number
}
interface Vector {
	x: number
	y: number
}

const WebGLPlotComponent: React.FC<PlotProps> = (props: PlotProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const { initialAngle, releaseAngle, motorTorque, motorMaxSpeed } = props
	const [result, setResult] = useState<number>(0)

	// Constants
	const deltaTime = 0.01
	const gravity = config.gravity
	const airDensity = config.airDensity // kg/m^3
	const floorDistance = config.floor / 1000 // m
	const wallDistance = config.wall / 1000 // m

	const rodLength = config.rodLength / 1000 // m
	const rodRadius = config.rodWidth / 2000 // m
	const rodWeight = Math.PI * (rodRadius * 100) ** 2 * (rodLength * 100) * config.rodDensity // g

	const ballRadius = config.ballWidth / 2000 // m
	const ballCrossSectionalArea = Math.PI * ballRadius ** 2 // m^2
	const ballVolume = (4 / 3) * Math.PI * (ballRadius * 100) ** 3 // cm^3
	const ballWeight = ballVolume * config.ballDensity // g
	const dragCoefficient = config.ballDrag // Sphere

	const pivotRatio = 0.15 // 15% of the rod length
	const rodDistanceBeforePivot = rodLength * pivotRatio
	const rodDistanceFromPivotToCenterOfMass = rodLength / 2 - rodDistanceBeforePivot
	const rodDistanceAfterPivot = rodLength - rodDistanceBeforePivot
	const ballDistanceToPivot = rodDistanceAfterPivot - ballRadius

	// Change g to kg
	const rodWeightKg = rodWeight / 1000
	const ballWeightKg = ballWeight / 1000

	// Calculate moments of inertia around the pivot point
	const IRodCenter = (rodWeightKg * rodRadius ** 2) / 4 + (1 / 12) * rodWeightKg * rodLength ** 2
	const IRod = IRodCenter + rodWeightKg * rodDistanceFromPivotToCenterOfMass ** 2
	const IBallCenter = (2 / 5) * ballWeightKg * ballRadius ** 2
	const IBall = IBallCenter + ballWeightKg * ballDistanceToPivot ** 2

	const ITotal = IRod + IBall

	/** START OF CANVAS */

	const vertexShaderSource = `
	attribute vec4 aVertexPosition;
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	void main(void) {
  		gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	}`

	const fragmentShaderSource = `
	void main(void) {
		gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);  // White color
	}`

	const positions: number[] = []

	function compileShader(gl: WebGLRenderingContext, sourceCode: string, type: GLenum): WebGLShader | null {
		const shader = gl.createShader(type)
		if (!shader) return null

		gl.shaderSource(shader, sourceCode)
		gl.compileShader(shader)

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader))
			gl.deleteShader(shader)
			return null
		}
		return shader
	}

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const gl = canvasRef.current.getContext('webgl') as WebGLRenderingContext

		const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
		const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)
		const shaderProgram = gl.createProgram()

		if (!shaderProgram || !vertexShader || !fragmentShader) return

		gl.attachShader(shaderProgram, vertexShader)
		gl.attachShader(shaderProgram, fragmentShader)
		gl.linkProgram(shaderProgram)

		const positionBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

		function drawScene(positions: number[], rodVertexCount: number, ballVertexCount: number) {
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)

			if (!shaderProgram) return
			const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
			gl.enableVertexAttribArray(vertexPosition)
			gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0)

			gl.drawArrays(gl.LINES, 0, rodVertexCount)
			gl.drawArrays(gl.POINTS, rodVertexCount, ballVertexCount)
		}

		function animate(velocity: Vector, position: Vector) {
			const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
			const dragForce = 0.5 * dragCoefficient * airDensity * ballCrossSectionalArea * speed ** 2
			const dragAccel = dragForce / ballWeightKg

			velocity.x -= dragAccel * (velocity.x / speed) * deltaTime
			velocity.y -= (gravity + dragAccel * (velocity.y / speed)) * deltaTime

			position.x += velocity.x * deltaTime
			position.y += velocity.y * deltaTime

			drawScene([position.x, position.y], 1, 1)

			if (position.y < floorDistance) return
			requestAnimationFrame(() => animate(velocity, position))
		}

		// Convert angles to radians
		const initialAngleRad = (initialAngle * Math.PI) / 180
		const releaseAngleRad = (releaseAngle * Math.PI) / 180

		// Calculate angular speed
		const angleDirection = initialAngle > releaseAngle ? -1 : 1
		const angleDeltaRad = (angleDirection * (releaseAngle - initialAngle) * Math.PI) / 180
		const angularSpeedAtRelease = angleDirection * Math.sqrt((2 * motorTorque * angleDeltaRad) / ITotal)
		const angularSpeed = Math.min(angularSpeedAtRelease, motorMaxSpeed) // rad/s

		// Adjust velocity for release angle perpendicular to the rod
		const releaseVelocity = angularSpeed * ballDistanceToPivot // m/s
		const v = {
			x: releaseVelocity * Math.sin(releaseAngleRad), // Horizontal component of velocity
			y: releaseVelocity * Math.cos(releaseAngleRad) // Vertical component of velocity
		}

		// Release position of the ball
		const releasePosition = {
			x: ballDistanceToPivot * Math.cos(releaseAngleRad),
			y: ballDistanceToPivot * Math.sin(releaseAngleRad)
		}

		animate(v, releasePosition)
	}, [canvasRef, initialAngle, releaseAngle, motorTorque, motorMaxSpeed])

	/** END OF CANVAS */

	// useEffect(() => {
	// 	function animate(velocity: Vector, position: Vector) {
	// 		const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
	// 		const dragForce = 0.5 * dragCoefficient * airDensity * ballCrossSectionalArea * speed ** 2
	// 		const dragAccel = dragForce / ballWeightKg

	// 		velocity.x -= dragAccel * (velocity.x / speed) * deltaTime
	// 		velocity.y -= (gravity + dragAccel * (velocity.y / speed)) * deltaTime

	// 		position.x += velocity.x * deltaTime
	// 		position.y += velocity.y * deltaTime
	// 	}

	// 	// if (!plotRef.current) return;
	// 	// // Constants
	// 	// const gravity = config.gravity;
	// 	// const Cd = 0.47; // Drag coefficient for a sphere
	// 	// const rho = 1.225; // Air density in kg/m^3
	// 	// const rodLength = config.rodLength / 1000; // m
	// 	// const rodRadius = config.rodWidth / 2000; // m
	// 	// const ballRadius = config.ballWidth / 2000; // m
	// 	// const ballWeightKg = ((4 * Math.PI * ballRadius ** 3) / 3) * config.ballDensity / 1000; // kg
	// 	// const A = Math.PI * ballRadius ** 2; // Cross-sectional area
	// 	// // Initial conditions
	// 	// const releaseVelocity = angularSpeed * ballDistanceToPivot;
	// 	// const velocity = { x: releaseVelocity * Math.sin(releaseAngleRad), y: releaseVelocity * Math.cos(releaseAngleRad) };
	// 	// const position = { x: releasePosition.x, y: releasePosition.y };
	// 	// let time = 0;
	// 	// const deltaTime = 0.01; // Time step in seconds
	// 	// let timeOfFlight = 0;
	// 	// while (position.y > floorDistance) {
	// 	//   // Calculate drag force
	// 	//   const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
	// 	//   const dragForce = 0.5 * Cd * rho * A * speed ** 2;
	// 	//   const dragAccel = dragForce / ballWeightKg;
	// 	//   // Update velocity with drag and gravity
	// 	//   velocity.x -= (dragAccel * (velocity.x / speed)) * deltaTime;
	// 	//   velocity.y -= (gravity + dragAccel * (velocity.y / speed)) * deltaTime;
	// 	//   // Update position
	// 	//   position.x += velocity.x * deltaTime;
	// 	//   position.y += velocity.y * deltaTime;
	// 	//   // Update time
	// 	//   time += deltaTime;
	// 	// }
	// 	// setResult(position.x);
	// 	// timeOfFlight = time;
	// 	// FunctionPlot and other code would follow here...
	// }, [initialAngle, motorTorque, releaseAngle, motorMaxSpeed])

	// useEffect(() => {
	// 	if (!plotRef.current) return

	// 	// Convert angles to radians
	// 	const initialAngleRad = (initialAngle * Math.PI) / 180
	// 	const releaseAngleRad = (releaseAngle * Math.PI) / 180

	// 	// Calculate angular speed
	// 	const angleDirection = initialAngle > releaseAngle ? -1 : 1
	// 	const angleDeltaRad = (angleDirection * (releaseAngle - initialAngle) * Math.PI) / 180
	// 	const angularSpeedAtRelease = angleDirection * Math.sqrt((2 * motorTorque * angleDeltaRad) / ITotal)
	// 	const angularSpeed = Math.min(angularSpeedAtRelease, motorMaxSpeed) // rad/s

	// 	// Adjust velocity for release angle perpendicular to the rod
	// 	const releaseVelocity = angularSpeed * ballDistanceToPivot // m/s
	// 	const v = {
	// 		x: releaseVelocity * Math.sin(releaseAngleRad), // Horizontal component of velocity
	// 		y: releaseVelocity * Math.cos(releaseAngleRad) // Vertical component of velocity
	// 	}

	// 	// Release position of the ball
	// 	const releasePosition = {
	// 		x: ballDistanceToPivot * Math.cos(releaseAngleRad),
	// 		y: ballDistanceToPivot * Math.sin(releaseAngleRad)
	// 	}

	// 	// Time of Flight to hit the floor
	// 	const dragForce = 0.5 * dragCoefficient * airDensity * ballCrossSectionalArea * Math.sqrt(v.x ** 2 + v.y ** 2)
	// 	const dragAcceleration = dragForce / ballWeightKg
	// 	const adjustedTimeFactor = 1 + (dragAcceleration / gravity) * 0.5 // Rough estimate
	// 	const d = releasePosition.y - floorDistance
	// 	const timeOfFlight = (v.y + Math.sqrt(v.y ** 2 + 2 * gravity * d)) / gravity
	// 	const timeOfFlightDrag = (v.y + Math.sqrt(v.y ** 2 + 2 * gravity * d)) / (gravity * adjustedTimeFactor)

	// 	// Calculate traveled distance in X axis
	// 	const traveledDistanceX = releasePosition.x - v.x * timeOfFlight
	// 	setResult(traveledDistanceX)

	// 	// Simplify calculations that don't depend on t
	// 	const vDrag = { x: v.x / drag, y: (v.y + gravity / drag) / drag }

	// 	// Set up the function plot
	// 	functionPlot({
	// 		target: plotRef.current,
	// 		width: 600,
	// 		height: 600,
	// 		xAxis: { label: 'X (m)', domain: [xMin, xMax] },
	// 		yAxis: { label: 'Y (m)', domain: [yMin, yMax] },
	// 		grid: true,
	// 		data: [
	// 			// Ball's projectile path as a parametric equation starting from release position with air drag
	// 			{
	// 				x: `${releasePosition.x} - ${vDrag.x} * (1 - exp(-${drag} * t))`,
	// 				y: `${releasePosition.y} + (${vDrag.y} * (1 - exp(-${drag} * t)) - (${gravity} * t) / ${drag})`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, timeOfFlightDrag],
	// 				color: 'blue'
	// 			},
	// 			// Ball's projectile path as a parametric equation starting from release position without drag
	// 			{
	// 				x: `${releasePosition.x} - t * ${v.x}`,
	// 				y: `${releasePosition.y} + ${v.y} * t - 0.5 * ${gravity} * t^2`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, timeOfFlight],
	// 				color: 'gray'
	// 			},
	// 			// Rod at the initial angle
	// 			{
	// 				x: `t * ${(rodDistanceAfterPivot * Math.cos(initialAngleRad)) / rodDistanceAfterPivot}`,
	// 				y: `t * ${(rodDistanceAfterPivot * Math.sin(initialAngleRad)) / rodDistanceAfterPivot}`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, rodDistanceAfterPivot],
	// 				color: 'gray'
	// 			},
	// 			{
	// 				x: `-t * ${(rodDistanceBeforePivot * Math.cos(initialAngleRad)) / rodDistanceBeforePivot}`,
	// 				y: `-t * ${(rodDistanceBeforePivot * Math.sin(initialAngleRad)) / rodDistanceBeforePivot}`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, rodDistanceBeforePivot],
	// 				color: 'gray'
	// 			},
	// 			// Rod at the release angle
	// 			{
	// 				x: `t * ${(rodDistanceAfterPivot * Math.cos(releaseAngleRad)) / rodDistanceAfterPivot}`,
	// 				y: `t * ${(rodDistanceAfterPivot * Math.sin(releaseAngleRad)) / rodDistanceAfterPivot}`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, rodDistanceAfterPivot],
	// 				color: 'black'
	// 			},
	// 			{
	// 				x: `-t * ${(rodDistanceBeforePivot * Math.cos(releaseAngleRad)) / rodDistanceBeforePivot}`,
	// 				y: `-t * ${(rodDistanceBeforePivot * Math.sin(releaseAngleRad)) / rodDistanceBeforePivot}`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, rodDistanceBeforePivot],
	// 				color: 'black'
	// 			},
	// 			// Circular Path
	// 			{
	// 				x: `${ballDistanceToPivot} * cos(t)`,
	// 				y: `${ballDistanceToPivot} * sin(t)`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				range: [0, 2 * Math.PI],
	// 				color: 'gray'
	// 			},
	// 			// Ball
	// 			{
	// 				x: `${releasePosition.x} + ${ballRadius} * cos(t)`,
	// 				y: `${releasePosition.y} + ${ballRadius} * sin(t)`,
	// 				fnType: 'parametric',
	// 				graphType: 'polyline',
	// 				color: 'blue'
	// 			},
	// 			// Floor
	// 			{
	// 				fn: `y=${floorDistance}`,
	// 				color: 'gray'
	// 			}
	// 		]
	// 	})
	// }, [initialAngle, motorTorque, releaseAngle, motorMaxSpeed])

	return (
		<div>
			<canvas ref={canvasRef}></canvas>
			<canvas id='simulation' width='600' height='600'></canvas>
			<div className='result'>Traveled distance to floor: {result} m</div>
		</div>
	)
}

export default WebGLPlotComponent

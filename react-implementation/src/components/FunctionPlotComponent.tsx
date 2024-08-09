import React, { useEffect, useRef, useState } from 'react'

import { config } from '../config/config'
import functionPlot from 'function-plot'

interface PlotProps {
	initialAngle: number
	motorTorque: number
	releaseAngle: number
}

const FunctionPlotComponent: React.FC<PlotProps> = ({ initialAngle, motorTorque, releaseAngle }) => {
	const plotRef = useRef<HTMLDivElement>(null)
	const [result, setResult] = useState<number>(0)

	useEffect(() => {
		if (!plotRef.current) return

		// Convert angles to radians
		const initialAngleRad = (initialAngle * Math.PI) / 180
		const releaseAngleRad = (releaseAngle * Math.PI) / 180

		// Constants
		const rodLength = config.rodLength / 10 // cm
		const gravity = config.gravity * 100 // Convert from m/s^2 to cm/s^2

		// Calculate initial velocity
		const motorMaxSpeed = config.motorMaxSpeed
		const rodRadius = config.rodWidth / 20 // cm
		const rodWeight = Math.PI * rodRadius ** 2 * rodLength * config.rodDensity // g
		const ballRadius = config.ballWidth / 20 // cm
		const ballWeight = ((4 * Math.PI * ballRadius ** 3) / 3) * config.ballDensity // g

		const rodWeightKg = rodWeight / 1000
		const ballWeightKg = ballWeight / 1000
		const I_rod = ((1 / 3) * rodWeightKg * rodLength) ** 2
		const I_ball = (ballWeightKg * rodLength) ** 2
		const I_total = I_rod + I_ball

		const angleDirection = initialAngle > releaseAngle ? -1 : 1
		const angleDeltaRad = (angleDirection * (releaseAngle - initialAngle) * Math.PI) / 180
		const angularSpeedAtRelease = angleDirection * Math.sqrt((2 * motorTorque * angleDeltaRad) / I_total)
		const angularSpeed = Math.min(angularSpeedAtRelease, motorMaxSpeed)

		const floorDistance = config.floor / 10 // cm

		// Adjust velocity for release angle perpendicular to the rod
		const releaseVelocity = angularSpeed * rodLength // cm/s
		const v = {
			x: releaseVelocity * Math.sin(releaseAngleRad), // Horizontal component of velocity
			y: releaseVelocity * Math.cos(releaseAngleRad) // Vertical component of velocity
		}

		// Release position of the ball
		const releasePosition = {
			x: rodLength * Math.cos(releaseAngleRad),
			y: rodLength * Math.sin(releaseAngleRad)
		}

		// Time of flight to hit the floor
		const a = -0.5 * gravity
		const b = v.y
		const c = releasePosition.y - floorDistance

		const discriminant = b * b - 4 * a * c
		if (discriminant < 0) {
			console.log('No real roots for the time of flight equation.')
			setResult(0)
			return
		}

		const sqrtDiscriminant = Math.sqrt(discriminant)
		const t1 = (-b + sqrtDiscriminant) / (2 * a)
		const t2 = (-b - sqrtDiscriminant) / (2 * a)
		const timeOfFlight = Math.max(t1, t2) // Choose the positive root

		// Calculate traveled distance in X axis
		const traveledDistanceX = releasePosition.x - v.x * timeOfFlight
		setResult(traveledDistanceX)

		// Calculate dynamic axis ranges
		const xMin = Math.min(-rodLength * 2, -config.wall / 10) - 10
		const xMax = Math.max(rodLength * 2, config.wall / 10) + 10
		const yMin = Math.min(-rodLength * 2, floorDistance) - 10
		const yMax = Math.max(rodLength * 2, -floorDistance) + 10

		// Set up the function plot
		functionPlot({
			target: plotRef.current,
			width: 600,
			height: 600,
			xAxis: { label: 'X (cm)', domain: [xMin, xMax] },
			yAxis: { label: 'Y (cm)', domain: [yMin, yMax] },
			grid: true,
			data: [
				// Ball's projectile path as a parametric equation starting from release position
				{
					x: `${releasePosition.x} - t * ${v.x}`,
					y: `${releasePosition.y} + ${v.y} * t - 0.5 * ${gravity} * t^2`,
					fnType: 'parametric',
					graphType: 'polyline',
					color: 'blue'
				},
				// Initial Rod at the initial angle
				{
					x: `t * ${(rodLength * Math.cos(initialAngleRad)) / rodLength}`,
					y: `t * ${(rodLength * Math.sin(initialAngleRad)) / rodLength}`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, rodLength],
					color: 'gray'
				},
				// Release Rod at the release angle
				{
					x: `t * ${(rodLength * Math.cos(releaseAngleRad)) / rodLength}`,
					y: `t * ${(rodLength * Math.sin(releaseAngleRad)) / rodLength}`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, rodLength],
					color: 'black'
				},
				// Circular Path
				{
					x: `${rodLength} * cos(t)`,
					y: `${rodLength} * sin(t)`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, 2 * Math.PI],
					color: 'gray'
				},
				// Floor
				{
					fn: `y=${floorDistance}`,
					color: 'gray'
				}
			]
		})
	}, [initialAngle, motorTorque, releaseAngle])

	return (
		<div>
			<div ref={plotRef}></div>
			<div className='result'>Traveled distance to floor: {result.toFixed(2)} cm</div>
		</div>
	)
}

export default FunctionPlotComponent

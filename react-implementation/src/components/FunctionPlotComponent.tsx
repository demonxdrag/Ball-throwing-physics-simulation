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
		const motorMaxSpeed = config.motorMaxSpeed
		const gravity = config.gravity * 100 // Convert from m/s^2 to cm/s^2

		const rodLength = config.rodLength / 10 // cm
		const rodRadius = config.rodWidth / 20 // cm
		const rodWeight = Math.PI * rodRadius ** 2 * rodLength * config.rodDensity // g

		const ballRadius = config.ballWidth / 20 // cm
		const ballWeight = ((4 * Math.PI * ballRadius ** 3) / 3) * config.ballDensity // g

		const pivotRatio = 0.15 // 15% of the rod length
		const rodDistanceBeforePivot = rodLength * pivotRatio
		const rodDistanceFromPivotToCenterOfMass = rodLength / 2 - rodDistanceBeforePivot
		const rodDistanceAfterPivot = rodLength - rodDistanceBeforePivot
		const ballDistanceToPivot = rodDistanceAfterPivot - ballRadius

		// Change g to kg
		const rodWeightKg = rodWeight / 1000
		const ballWeightKg = ballWeight / 1000

		// Calculate moments of inertia around the pivot point
		// const IRod = (1 / 3) * rodWeightKg * rodDistanceAfterPivot ** 2 + rodWeightKg * rodDistanceBeforePivot ** 2
		const IRodCenter = (1 / 12) * rodWeightKg * rodLength ** 2
		const IRod = IRodCenter + rodWeightKg * rodDistanceFromPivotToCenterOfMass ** 2
		const IBallCenter = (2 / 5) * ballWeightKg * ballRadius ** 2
		const IBall = IBallCenter + ballWeightKg * ballDistanceToPivot ** 2

		const ITotal = IRod + IBall

		const angleDirection = initialAngle > releaseAngle ? -1 : 1
		const angleDeltaRad = (angleDirection * (releaseAngle - initialAngle) * Math.PI) / 180
		const angularSpeedAtRelease = angleDirection * Math.sqrt((2 * motorTorque * angleDeltaRad) / ITotal)
		const angularSpeed = Math.min(angularSpeedAtRelease, motorMaxSpeed)

		const floorDistance = config.floor / 10 // cm

		// Adjust velocity for release angle perpendicular to the rod
		const releaseVelocity = angularSpeed * ballDistanceToPivot // cm/s
		const v = {
			x: releaseVelocity * Math.sin(releaseAngleRad), // Horizontal component of velocity
			y: releaseVelocity * Math.cos(releaseAngleRad) // Vertical component of velocity
		}

		// Release position of the ball
		const releasePosition = {
			x: ballDistanceToPivot * Math.cos(releaseAngleRad),
			y: ballDistanceToPivot * Math.sin(releaseAngleRad)
		}

		// Time of flight to hit the floor
		const g = -0.5 * gravity
		const Vy = v.y
		const d = releasePosition.y - floorDistance

		const discriminant = Vy * Vy - 4 * g * d
		if (discriminant < 0) {
			console.log('No real roots for the time of flight equation.')
			setResult(0)
			return
		}

		const sqrtDiscriminant = Math.sqrt(discriminant)
		const t1 = (-Vy + sqrtDiscriminant) / (2 * g)
		const t2 = (-Vy - sqrtDiscriminant) / (2 * g)
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
				// Rod at the initial angle
				{
					x: `t * ${(rodDistanceAfterPivot * Math.cos(initialAngleRad)) / rodDistanceAfterPivot}`,
					y: `t * ${(rodDistanceAfterPivot * Math.sin(initialAngleRad)) / rodDistanceAfterPivot}`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, rodDistanceAfterPivot],
					color: 'gray'
				},
				{
					x: `-t * ${(rodDistanceBeforePivot * Math.cos(initialAngleRad)) / rodDistanceBeforePivot}`,
					y: `-t * ${(rodDistanceBeforePivot * Math.sin(initialAngleRad)) / rodDistanceBeforePivot}`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, rodDistanceBeforePivot],
					color: 'gray'
				},
				// Rod at the release angle
				{
					x: `t * ${(rodDistanceAfterPivot * Math.cos(releaseAngleRad)) / rodDistanceAfterPivot}`,
					y: `t * ${(rodDistanceAfterPivot * Math.sin(releaseAngleRad)) / rodDistanceAfterPivot}`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, rodDistanceAfterPivot],
					color: 'black'
				},
				{
					x: `-t * ${(rodDistanceBeforePivot * Math.cos(releaseAngleRad)) / rodDistanceBeforePivot}`,
					y: `-t * ${(rodDistanceBeforePivot * Math.sin(releaseAngleRad)) / rodDistanceBeforePivot}`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, rodDistanceBeforePivot],
					color: 'black'
				},
				// Circular Path
				{
					x: `${ballDistanceToPivot} * cos(t)`,
					y: `${ballDistanceToPivot} * sin(t)`,
					fnType: 'parametric',
					graphType: 'polyline',
					range: [0, 2 * Math.PI],
					color: 'gray'
				},
				// Ball
				{
					x: `${releasePosition.x} + ${ballRadius} * cos(t)`,
					y: `${releasePosition.y} + ${ballRadius} * sin(t)`,
					fnType: 'parametric',
					graphType: 'polyline',
					color: 'blue',
					closed: true
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

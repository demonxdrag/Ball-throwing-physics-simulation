import { Canvas, useFrame } from '@react-three/fiber'
import { Mesh, Vector3 } from 'three'
import React, { useRef } from 'react'

import { config } from '../../config/config'

interface ThreePlotComponentProps {
	initialAngle: number
	releaseAngle: number
	motorTorque: number
	motorMaxSpeed: number
	controls?: {
		play: boolean
		reset: boolean
	}
}

const ThreePlotComponent: React.FC<ThreePlotComponentProps> = ({ initialAngle, releaseAngle, motorTorque, motorMaxSpeed, controls }) => {
	const floorDistance = config.floor / 1000 // m
	return (
		<Canvas camera={{ position: [0, floorDistance, 0.6], rotation: [0, 0, 0], fov: 50 }} style={{ width: '800px', height: '600px' }}>
			{/* <CameraControls /> */}
			<gridHelper />
			<ambientLight intensity={Math.PI / 2} />
			<spotLight position={[1, 1, 1]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
			<pointLight position={[-1, -1, -1]} decay={0} intensity={Math.PI} />
			<RodAndBall initialAngle={initialAngle} releaseAngle={releaseAngle} motorTorque={motorTorque} motorMaxSpeed={motorMaxSpeed} controls={controls} />
		</Canvas>
	)
}

const RodAndBall: React.FC<ThreePlotComponentProps> = ({ initialAngle, releaseAngle, motorTorque, motorMaxSpeed, controls = { play: false, reset: true } }) => {
	const rodRef = useRef<Mesh>(null)
	const ballRef = useRef<Mesh>(null)

	// Constants
	const initialAngleRad = (initialAngle * Math.PI) / 180
	const releaseAngleRad = (releaseAngle * Math.PI) / 180

	const gravity = config.gravity
	const airDensity = config.airDensity // kg/m^3
	const floorDistance = config.floor / 1000 // m
	const wallDistance = config.wall / 1000 // m

	const rodLength = config.rodLength / 1000 // m
	const rodRadius = config.rodWidth / 2000 // m
	const rodCrossSectionalArea = rodRadius * rodLength
	const rodWeight = Math.PI * (rodRadius * 100) ** 2 * (rodLength * 100) * config.rodDensity // g
	const rodDrag = config.rodDrag // Rod

	const ballRadius = config.ballWidth / 2000 // m
	const ballCrossSectionalArea = Math.PI * ballRadius ** 2 // m^2
	const ballVolume = (4 / 3) * Math.PI * (ballRadius * 100) ** 3 // cm^3
	const ballWeight = ballVolume * config.ballDensity // g
	const ballDrag = config.ballDrag // Sphere

	const pivotRatio = 0.15 // 15% of the rod length
	const rodDistanceBeforePivot = rodLength * pivotRatio
	const rodDistanceFromPivotToCenterOfMass = rodLength / 2 - rodDistanceBeforePivot
	const rodDistanceAfterPivot = rodLength - rodDistanceBeforePivot
	const ballDistanceToPivot = rodDistanceAfterPivot - ballRadius

	// Change g to kg
	const rodWeightKg = rodWeight / 1000
	const ballWeightKg = ballWeight / 1000

	// Drag coefficient
	const FBallDrag = (0.5 * ballDrag * airDensity * ballCrossSectionalArea) / ballWeightKg // N

	// Calculate moments of inertia around the pivot point
	const IRodCenter = (rodWeightKg * rodRadius ** 2) / 4 + (1 / 12) * rodWeightKg * rodLength ** 2
	const IRod = IRodCenter + rodWeightKg * rodDistanceFromPivotToCenterOfMass ** 2
	const IBallCenter = (2 / 5) * ballWeightKg * ballRadius ** 2
	const IBall = IBallCenter + ballWeightKg * ballDistanceToPivot ** 2

	const ITotal = IRod + IBall

	const target = -floorDistance + ballRadius

	const phaseRef = useRef<number>(1)
	const angularSpeedRef = useRef<number>(0)
	const angleRef = useRef<number>(initialAngleRad)
	const torqueRef = useRef<number>(motorTorque)
	const velocityRef = useRef<Vector3>(new Vector3(0, 0, 0))

	useFrame((state, t) => {
		// Having a consistent frame duration is important for the simulation since we need enough precision to avoid missing critical events
		const ti = 0.0165 // this value comes from averaging t

		if (controls.play === true) {
			/**
			 * Phase 1
			 * The system is in an initial state holding the rod in place
			 * The rod will accelerate until it reaches the maximum speed release angle
			 * The rod will continue rotating until the release angle if it hasn't reached already
			 */

			// Calculate moments of inertia around the pivot point
			const TRodGravity = rodWeightKg * gravity * rodDistanceFromPivotToCenterOfMass * Math.sin(angleRef.current)
			const TBallGravity = ballWeightKg * gravity * ballDistanceToPivot * Math.sin(angleRef.current)
			const TTotalGravity = -(TRodGravity + TBallGravity)

			// Calculate drag force as damping torque (air resistance)
			const TBallDrag =
				-0.5 * ballDrag * airDensity * ballCrossSectionalArea * Math.sign(angularSpeedRef.current) * angularSpeedRef.current ** 2 * ballDistanceToPivot
			const TRodDrag =
				(-0.5 * rodDrag * airDensity * rodCrossSectionalArea * Math.sign(angularSpeedRef.current) * angularSpeedRef.current ** 2 * rodLength) / 2

			// Combine torques
			let effectiveTorque = torqueRef.current - TTotalGravity + TBallDrag + TRodDrag

			// Breaking
			if (torqueRef.current < 0) {
				effectiveTorque = (angularSpeedRef.current / motorMaxSpeed) * torqueRef.current * ti - TTotalGravity + TBallDrag + TRodDrag
			}

			// Calculate angular acceleration
			const angularAcceleration = effectiveTorque / ITotal

			// Update angular speed
			angularSpeedRef.current += angularAcceleration * ti
			if (angularSpeedRef.current > motorMaxSpeed) {
				angularSpeedRef.current = motorMaxSpeed
			}

			// Update angle
			angleRef.current += angularSpeedRef.current * ti

			// Rotate the rod over the pivot point
			if (rodRef.current) {
				const offsetRodPosition = rodLength / 2 - rodDistanceBeforePivot
				const rodX = -offsetRodPosition * Math.sin(angleRef.current)
				const rodY = offsetRodPosition * Math.cos(angleRef.current)
				rodRef.current.rotation.z = angleRef.current
				rodRef.current.position.set(rodX, rodY + floorDistance, 0)
			}

			if (phaseRef.current === 1) {
				// Update ball position
				if (ballRef.current) {
					const ballX = -ballDistanceToPivot * Math.sin(angleRef.current) - ballRadius * 2 * Math.cos(angleRef.current)
					const ballY = ballDistanceToPivot * Math.cos(angleRef.current) - ballRadius * 2 * Math.sin(angleRef.current)
					ballRef.current.position.set(ballX, ballY + floorDistance, 0)
				}

				// Preparing for Phase 2
				if (angleRef.current >= releaseAngleRad) {
					angleRef.current = releaseAngleRad
					torqueRef.current = -motorTorque
					phaseRef.current = 2

					// Calculate angular speed
					const angularSpeed = angularSpeedRef.current * Math.cos(angleRef.current)

					// Adjust velocity for release angle perpendicular to the rod
					const releaseVelocity = angularSpeed * ballDistanceToPivot // m/s
					velocityRef.current = new Vector3(-releaseVelocity * Math.cos(angleRef.current), -releaseVelocity * Math.sin(angleRef.current), 0)

					// Update the system to be at the release angle
					// This is a consistency measure since t could make the ball miss the target position
					// Rotate the rod over the pivot point
					if (rodRef.current) {
						const offsetRodPosition = rodLength / 2 - rodDistanceBeforePivot
						const rodX = -offsetRodPosition * Math.sin(angleRef.current)
						const rodY = offsetRodPosition * Math.cos(angleRef.current)
						rodRef.current.rotation.z = angleRef.current
						rodRef.current.position.set(rodX, rodY + floorDistance, 0)
					}
					if (ballRef.current) {
						const ballX = -ballDistanceToPivot * Math.sin(angleRef.current) - ballRadius * 2 * Math.cos(angleRef.current)
						const ballY = ballDistanceToPivot * Math.cos(angleRef.current) - ballRadius * 2 * Math.sin(angleRef.current)
						ballRef.current.position.set(ballX, ballY + floorDistance, 0)
					}
				}
			}

			if (phaseRef.current === 2) {
				/**
				 * Phase 2
				 * The system has released the ball at the release angle
				 * The rod will stop accelerating as it is no longer in use
				 * The ball is now an independent system being affected by gravity and air resistance as it travels
				 * The ball will continue to move until it hits the floor
				 */

				// Calculate the effects of gravity
				const gravityForce = new Vector3(0, -gravity, 0) // Only affects the y-axis

				// Update ball velocity with gravity and air resistance
				const airResistance = new Vector3(
					-FBallDrag * velocityRef.current.x * Math.abs(velocityRef.current.x),
					-FBallDrag * velocityRef.current.y * Math.abs(velocityRef.current.y),
					0
				)

				// Update ball position
				if (ballRef.current) {
					const ballPosition = ballRef.current.position.clone()

					// Apply forces to the velocity vector temporarily
					const g = gravityForce.clone().multiplyScalar(ti)
					const air = airResistance.clone().multiplyScalar(ti)
					const V = velocityRef.current.clone().add(g).add(air)

					// Increase precision only if the ball is close to the target
					if (ballPosition.y + V.clone().multiplyScalar(ti).y <= target) {
						let pti = 0.00001 // Precise time
						let safety = 0 // Prevents memory leak

						while (ballPosition.y > target && safety < 10_000) {
							safety += 1
							velocityRef.current.add(gravityForce.multiplyScalar(pti)).add(airResistance.multiplyScalar(pti))
							ballPosition.add(velocityRef.current.clone().multiplyScalar(pti))
							ballRef.current.position.set(ballPosition.x, ballPosition.y, ballPosition.z)
						}

						console.log('End of simulation: ', ballPosition.x)
						phaseRef.current = 0
					} else {
						// Update ball position
						velocityRef.current.add(gravityForce.multiplyScalar(ti)).add(airResistance.multiplyScalar(ti))
						ballPosition.add(velocityRef.current.clone().multiplyScalar(ti))
						ballRef.current.position.set(ballPosition.x, ballPosition.y, ballPosition.z)
					}
				}
			}
		} else if (controls.reset === true) {
			angularSpeedRef.current = 0
			angleRef.current = initialAngleRad
			phaseRef.current = 1
			velocityRef.current = new Vector3(0, 0, 0)
			torqueRef.current = motorTorque

			if (rodRef.current) {
				const offsetRodPosition = rodLength / 2 - rodDistanceBeforePivot
				const rodX = -offsetRodPosition * Math.sin(angleRef.current)
				const rodY = offsetRodPosition * Math.cos(angleRef.current)
				rodRef.current.rotation.z = angleRef.current
				rodRef.current.position.set(rodX, rodY + floorDistance, 0)
			}

			if (ballRef.current) {
				const ballX = -ballDistanceToPivot * Math.sin(angleRef.current) - ballRadius * 2 * Math.cos(angleRef.current)
				const ballY = ballDistanceToPivot * Math.cos(angleRef.current) - ballRadius * 2 * Math.sin(angleRef.current)
				ballRef.current.position.set(ballX, ballY + floorDistance, 0)
			}
		}
	})

	return (
		<>
			<mesh ref={rodRef} position={[0, 0, 0]}>
				<cylinderGeometry args={[rodRadius, rodRadius, rodLength, 32]} />
				<meshStandardMaterial color='lightgray' />
			</mesh>
			<mesh ref={ballRef} position={[0, 0, 0]}>
				<sphereGeometry args={[ballRadius, 32, 32]} />
				<meshStandardMaterial color='darkgray' />
			</mesh>
			{/* Base */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorDistance, -0.004]}>
				<cylinderGeometry args={[rodRadius / 2, rodRadius / 2, rodRadius * 4, 32]} />
				<meshStandardMaterial color='red' />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorDistance, -0.07]}>
				<cylinderGeometry args={[0.02, 0.02, 0.1, 32]} />
				<meshStandardMaterial color='red' />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorDistance, -0.0701]}>
				<cylinderGeometry args={[0.04, 0.04, 0.1, 32]} />
				<meshStandardMaterial color='lightgray' />
			</mesh>
			<mesh position={[0, floorDistance / 2, -0.071]}>
				<boxGeometry args={[0.08, floorDistance, 0.1, 1, 1, 1]} />
				<meshStandardMaterial color='lightgray' />
			</mesh>
		</>
	)
}

export default ThreePlotComponent

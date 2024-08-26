import { Canvas, RootState, useFrame } from '@react-three/fiber'
import { Mesh, Vector3 } from 'three'
import React, { useEffect, useRef, useState } from 'react'

import { Line } from '@react-three/drei'
import { config } from '../../config/config'

interface ThreePlotComponentProps {
	initialAngle: number
	releaseAngle: number
	motorTorque: number
	motorMaxSpeed: number
	controls?: {
		play: boolean
		reset: boolean
		speed: number
	}
}

const ThreePlotComponent: React.FC<ThreePlotComponentProps> = ({ initialAngle, releaseAngle, motorTorque, motorMaxSpeed, controls }) => {
	const floorDistance = config.floor / 1000 // m
	const [result, setResult] = useState<number>(0)

	return (
		<div id='three-canvas'>
			<Canvas camera={{ position: [0, floorDistance - 0.1, 1], rotation: [0, 0, 0], fov: 50 }} style={{ width: '600px', height: '600px' }}>
				<gridHelper />
				<ambientLight intensity={Math.PI / 2} />
				<spotLight position={[1, 1, 1]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
				<pointLight position={[-1, -1, -1]} decay={0} intensity={Math.PI} />
				<RodAndBall
					initialAngle={initialAngle}
					releaseAngle={releaseAngle}
					motorTorque={motorTorque}
					motorMaxSpeed={motorMaxSpeed}
					controls={controls}
					setResult={setResult}
				/>
			</Canvas>
			<div className='result'>Traveled distance to floor: {result} m</div>{' '}
		</div>
	)
}

interface RodAndBallProps extends ThreePlotComponentProps {
	setResult: React.Dispatch<React.SetStateAction<number>>
}
const RodAndBall: React.FC<RodAndBallProps> = ({
	initialAngle,
	releaseAngle,
	motorTorque,
	motorMaxSpeed,
	controls = { play: false, reset: true, speed: 1 },
	setResult
}) => {
	const ballRef = useRef<Mesh>(null)
	const rodRef = useRef<Mesh>(null)
	const rodReleaseRef = useRef<Mesh>(null)
	const targetRef = useRef<Mesh>(null)

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

	const target = ballRadius

	const phaseRef = useRef<number>(1)
	const angularSpeedRef = useRef<number>(0)
	const angleRef = useRef<number>(initialAngleRad)
	const torqueRef = useRef<number>(motorTorque)
	const velocityRef = useRef<Vector3>(new Vector3(0, 0, 0))
	const pathRef = useRef<Vector3[]>([])
	const [path, setPath] = useState<Vector3[]>([])

	useEffect(() => {
		if (rodReleaseRef.current) {
			const offsetRodPosition = rodLength / 2 - rodDistanceBeforePivot
			const rodX = -offsetRodPosition * Math.sin(releaseAngleRad)
			const rodY = offsetRodPosition * Math.cos(releaseAngleRad)
			rodReleaseRef.current.rotation.z = releaseAngleRad
			rodReleaseRef.current.position.set(rodX, rodY + floorDistance, 0)
		}
	}, [releaseAngleRad])

	useEffect(() => {
		torqueRef.current = Math.sign(torqueRef.current) * motorTorque
	}, [motorTorque])

	const play = (ti: number, state?: RootState) => {
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

				// Update the system to be at the release angle
				// This is a consistency measure since t could make the ball miss the target position

				// Adjust velocity for release angle perpendicular to the rod
				const releaseVelocity = angularSpeedRef.current * ballDistanceToPivot // m/s
				velocityRef.current = new Vector3(-releaseVelocity * Math.cos(angleRef.current), -releaseVelocity * Math.sin(angleRef.current), 0)

				// Rotate the rod over the pivot point
				if (rodRef.current && state) {
					const offsetRodPosition = rodLength / 2 - rodDistanceBeforePivot
					const rodX = -offsetRodPosition * Math.sin(angleRef.current)
					const rodY = offsetRodPosition * Math.cos(angleRef.current)
					rodRef.current.rotation.z = angleRef.current
					rodRef.current.position.set(rodX, rodY + floorDistance, 0)
				}
				if (ballRef.current && state) {
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

				// Move the camera
				if (state?.camera) {
					state.camera.position.setX(state.camera.position.x + velocityRef.current.x * ti)
					state.camera.position.setZ(Math.max(state.camera.position.z + velocityRef.current.y * ti * 2, 1))
				}

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

					if (!state) {
						setResult(ballPosition.x)
						setPath(pathRef.current)
						if (targetRef.current) {
							targetRef.current.position.setX(ballPosition.x)
						}
					}
					phaseRef.current = 0
				} else {
					// Update ball position
					velocityRef.current.add(gravityForce.multiplyScalar(ti)).add(airResistance.multiplyScalar(ti))
					ballPosition.add(velocityRef.current.clone().multiplyScalar(ti))
					ballRef.current.position.set(ballPosition.x, ballPosition.y, ballPosition.z)
					pathRef.current.push(new Vector3(ballPosition.x, ballPosition.y, ballPosition.z))
				}
			}
		}
	}

	const reset = (state?: RootState) => {
		angularSpeedRef.current = 0
		angleRef.current = initialAngleRad
		phaseRef.current = 1
		velocityRef.current = new Vector3(0, 0, 0)
		torqueRef.current = motorTorque
		pathRef.current = []

		if (state?.camera) {
			state.camera.position.setX(0)
			state.camera.position.setZ(1)
		}

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

	// Simulation
	useEffect(() => {
		const ti = 0.00001 // Higher definition for simulation
		const safetyMax = 1_000_000
		let safety = 0
		while (phaseRef.current > 0 && safety < safetyMax) {
			play(ti)
			safety += 1
		}
		reset()
		if (safety === safetyMax) {
			setResult(0)
		}
	}, [initialAngle, releaseAngle, motorTorque, motorMaxSpeed])

	// Animation
	useFrame((state, t) => {
		// Having a consistent frame duration is important for the simulation since we need enough precision to avoid missing critical events
		const ti = 0.0165 * controls.speed // this value comes from averaging t

		if (controls.play === true) {
			play(ti, state)
		} else if (controls.reset === true) {
			reset(state)
		}
	})

	return (
		<>
			<mesh ref={rodRef} position={[0, 0, 0]}>
				<cylinderGeometry args={[rodRadius, rodRadius, rodLength, 12]} />
				<meshStandardMaterial color='lightgray' metalness={0.5} />
			</mesh>
			<mesh ref={rodReleaseRef} position={[0, 0, 0]}>
				<cylinderGeometry args={[rodRadius, rodRadius, rodLength, 12]} />
				<meshStandardMaterial color='lightgray' wireframe={true} />
			</mesh>
			<mesh ref={ballRef} position={[0, 0, 0]}>
				<sphereGeometry args={[ballRadius, 12, 12]} />
				<meshStandardMaterial color='darkgray' metalness={1} />
			</mesh>
			<mesh ref={targetRef} position={[0, 0, 0]}>
				<cylinderGeometry args={[rodRadius, 0, 0.04, 6]} />
				<meshStandardMaterial color='blue' />
			</mesh>
			{path.length > 1 && (
				<Line
					points={path.map((pos: Vector3) => [pos.x, pos.y, pos.z])} // Convert Vector3 to array
					color='yellow' // Path color
					lineWidth={2} // Thickness of the line
				/>
			)}
			{/* Base */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorDistance, -0.004]}>
				<cylinderGeometry args={[rodRadius / 2, rodRadius / 2, rodRadius * 4, 12]} />
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

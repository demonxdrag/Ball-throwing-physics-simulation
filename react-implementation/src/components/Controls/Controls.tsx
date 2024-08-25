import './Controls.css'

type ControlsProps = {
	initialAngle: number
	setInitialAngle: React.Dispatch<React.SetStateAction<number>>
	releaseAngle: number
	setReleaseAngle: React.Dispatch<React.SetStateAction<number>>
	motorTorque: number
	setMotorTorque: React.Dispatch<React.SetStateAction<number>>
	motorMaxSpeed: number
	setMotorMaxSpeed: React.Dispatch<React.SetStateAction<number>>
	controls: {
		play: boolean
		reset: boolean
		speed: number
	}
	setControls: React.Dispatch<
		React.SetStateAction<{
			play: boolean
			reset: boolean
			speed: number
		}>
	>
}
const Controls = (props: ControlsProps) => {
	const {
		initialAngle,
		setInitialAngle,
		motorTorque,
		setMotorTorque,
		releaseAngle,
		setReleaseAngle,
		motorMaxSpeed,
		setMotorMaxSpeed,
		controls,
		setControls
	} = props

	const handlePlayPause = () => {
		setControls(previousControls => {
			if (previousControls.reset) {
				return { play: true, reset: false, speed: previousControls.speed }
			} else {
				return { play: !previousControls.play, reset: false, speed: previousControls.speed }
			}
		})
	}

	const handleReset = () => {
		setControls(previousControls => ({ play: false, reset: true, speed: previousControls.speed }))
	}

	const handleSpeed = (speed: number) => {
		setControls(previousControls => ({ ...previousControls, speed }))
	}

	const handleMotorTorque = (motorTorque: number) => {
		if (motorTorque > 0) {
			setMotorTorque(motorTorque)
		} else {
			setMotorTorque(0)
		}
	}

	const handleMotorMaxSpeed = (motorMaxSpeed: number) => {
		if (motorMaxSpeed > 0) {
			setMotorMaxSpeed(motorMaxSpeed)
		} else {
			setMotorMaxSpeed(0)
		}
	}

	return (
		<div className='Controls'>
			<div className='inputs'>
				<label>
					Initial Angle:
					<div>
						<input type='number' value={initialAngle} onChange={e => setInitialAngle(Number(e.target.value))} />
						<div className='unit'>Deg</div>
					</div>
				</label>
				<label>
					Release Angle:
					<div>
						<input type='number' value={releaseAngle} onChange={e => setReleaseAngle(Number(e.target.value))} />
						<div className='unit'>Deg</div>
					</div>
				</label>
				<label>
					Motor Torque:
					<div>
						<input type='number' value={motorTorque} onChange={e => handleMotorTorque(Number(e.target.value))} />
						<div className='unit'>Nm</div>
					</div>
				</label>
				<label>
					Motor Maximum Speed:
					<div>
						<input type='number' value={motorMaxSpeed} onChange={e => handleMotorMaxSpeed(Number(e.target.value))} />
						<div className='unit'>rad/s</div>
					</div>
				</label>
				<button onClick={handlePlayPause}>{controls.play ? 'Pause' : 'Play'}</button>
				<button onClick={handleReset}>Reset</button>
				<div>
					<button onClick={() => handleSpeed(0.25)}>0.25x</button>
					<button onClick={() => handleSpeed(0.5)}>0.5x</button>
					<button onClick={() => handleSpeed(0.75)}>0.75x</button>
					<button onClick={() => handleSpeed(1)}>1x</button>
					<div>{controls.speed}x</div>
				</div>
			</div>
		</div>
	)
}

export default Controls

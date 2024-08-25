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
	}
	setControls: React.Dispatch<
		React.SetStateAction<{
			play: boolean
			reset: boolean
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
				return { play: true, reset: false }
			} else {
				return { play: !previousControls.play, reset: false }
			}
		})
	}

	const handleReset = () => {
		setControls({ play: false, reset: true })
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
						<input type='number' value={motorTorque} onChange={e => setMotorTorque(Number(e.target.value))} />
						<div className='unit'>Nm</div>
					</div>
				</label>
				<label>
					Motor Maximum Speed:
					<div>
						<input type='number' value={motorMaxSpeed} onChange={e => setMotorMaxSpeed(Number(e.target.value))} />
						<div className='unit'>rad/s</div>
					</div>
				</label>
				<button onClick={handlePlayPause}>{controls.play ? 'Pause' : 'Play'}</button>
				<button onClick={handleReset}>Reset</button>
			</div>
		</div>
	)
}

export default Controls

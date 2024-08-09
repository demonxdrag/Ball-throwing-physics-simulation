import './Controls.css'

type ControlsProps = {
	initialAngle: number
	setInitialAngle: (angle: number) => void
	releaseAngle: number
	setReleaseAngle: (angle: number) => void
	motorTorque: number
	setMotorTorque: (torque: number) => void
	motorMaxSpeed: number
	setMotorMaxSpeed: (speed: number) => void
}
const Controls = (props: ControlsProps) => {
	const { initialAngle, setInitialAngle, motorTorque, setMotorTorque, releaseAngle, setReleaseAngle } = props
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
						<input type='number' value={motorTorque} onChange={e => setMotorTorque(Number(e.target.value))} />
						<div className='unit'>rad/s</div>
					</div>
				</label>
			</div>
		</div>
	)
}

export default Controls

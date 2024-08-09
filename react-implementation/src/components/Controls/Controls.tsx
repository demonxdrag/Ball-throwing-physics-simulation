import './Controls.css'

type ControlsProps = {
	initialAngle: number
	setInitialAngle: (angle: number) => void
	motorTorque: number
	setMotorTorque: (torque: number) => void
	releaseAngle: number
	setReleaseAngle: (angle: number) => void
}
const Controls = (props: ControlsProps) => {
	const { initialAngle, setInitialAngle, motorTorque, setMotorTorque, releaseAngle, setReleaseAngle } = props
	return (
		<div className='Controls'>
			<div className='inputs'>
				<label>
					Initial Angle:
					<input type='number' value={initialAngle} onChange={e => setInitialAngle(Number(e.target.value))} />
				</label>
				<label>
					Motor Torque:
					<input type='number' value={motorTorque} onChange={e => setMotorTorque(Number(e.target.value))} />
				</label>
				<label>
					Release Angle:
					<input type='number' value={releaseAngle} onChange={e => setReleaseAngle(Number(e.target.value))} />
				</label>
			</div>
		</div>
	)
}

export default Controls

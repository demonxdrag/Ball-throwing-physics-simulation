// import './Controls.css'

import { Button, InputNumber, Panel, Slider, Stack, Toggle } from 'rsuite'
import { CloseOutline, PauseOutline, PlayOutline } from '@rsuite/icons'

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
	_3d: boolean
	set3d: React.Dispatch<React.SetStateAction<boolean>>
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
		setControls,
		_3d,
		set3d
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

	const handleInitialAngle = (input: string) => {
		let value = Number(input)
		if (!isNaN(value)) {
			setInitialAngle(value)
		}
	}

	const handleReleaseAngle = (input: string) => {
		let value = Number(input)
		if (!isNaN(value)) {
			setReleaseAngle(value)
		}
	}

	const handleMotorTorque = (input: string) => {
		let value = Number(input)
		if (value > 0 && !isNaN(value)) {
			setMotorTorque(value)
		} else {
			setMotorTorque(0)
		}
	}

	const handleMotorMaxSpeed = (motorMaxSpeed: string) => {
		let value = Number(motorMaxSpeed)
		if (value > 0 && !isNaN(value)) {
			setMotorMaxSpeed(value)
		} else {
			setMotorMaxSpeed(0)
		}
	}

	return (
		<div className='Controls'>
			<Panel header='Controls'>
				<Toggle onChange={checked => set3d(checked)} checked={_3d}>
					3D
				</Toggle>
				<Stack direction='column' alignItems='stretch' spacing={10}>
					<Stack.Item>
						<label>Initial Angle:</label>
						<InputNumber postfix='Deg' defaultValue={initialAngle} onChange={value => handleInitialAngle(String(value))} scrollable />
					</Stack.Item>
					<Stack.Item>
						<label>Release Angle:</label>
						<InputNumber postfix='Deg' defaultValue={releaseAngle} onChange={value => handleReleaseAngle(String(value))} scrollable />
					</Stack.Item>
					<Stack.Item>
						<label>Motor Torque:</label>
						<InputNumber
							postfix='Nm'
							min={0}
							defaultValue={motorTorque}
							onChange={value => handleMotorTorque(String(value))}
							scrollable
							decimalSeparator='.'
						/>
					</Stack.Item>
					<Stack.Item>
						<label>Maximum Speed:</label>
						<InputNumber
							postfix='rad/s'
							min={0}
							defaultValue={motorMaxSpeed}
							onChange={value => handleMotorMaxSpeed(String(value))}
							scrollable
							decimalSeparator='.'
						/>
					</Stack.Item>
				</Stack>
				{_3d && (
					<Stack direction='column' alignItems='stretch' spacing={10} style={{ marginTop: '20px' }}>
						<Stack.Item>
							<Button startIcon={controls.play ? <PauseOutline /> : <PlayOutline />} onClick={handlePlayPause}>
								{controls.play ? 'Pause' : 'Play'}
							</Button>
							<Button startIcon={<CloseOutline />} onClick={handleReset}>
								Reset
							</Button>
						</Stack.Item>
						<Stack.Item>
							<Slider
								progress
								defaultValue={100}
								min={10}
								max={100}
								step={10}
								graduated
								onChange={value => {
									handleSpeed(value / 100)
								}}
							/>
							<div>Speed: {controls.speed * 100}%</div>
						</Stack.Item>
					</Stack>
				)}
			</Panel>
		</div>
	)
}

export default Controls

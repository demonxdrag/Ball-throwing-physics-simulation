import './App.css'

import React, { useState } from 'react'

import Controls from './components/Controls/Controls'
import ThreePlotComponent from './components/ThreePlotComponent/ThreePlotComponent'
import { config } from './config/config'

const App: React.FC = () => {
	const [initialAngle, setInitialAngle] = useState<number>(config.initialAngle)
	const [releaseAngle, setReleaseAngle] = useState<number>(config.releaseAngle)
	const [motorTorque, setMotorTorque] = useState<number>(config.motorTorque)
	const [motorMaxSpeed, setMotorMaxSpeed] = useState<number>(config.motorMaxSpeed)
	const [controls, setControls] = useState<{ play: boolean; reset: boolean }>({ play: false, reset: true })

	return (
		<div className='App'>
			<h1>Ball Throw Simulation</h1>
			<div className='main-container'>
				<Controls
					initialAngle={initialAngle}
					releaseAngle={releaseAngle}
					motorTorque={motorTorque}
					motorMaxSpeed={motorMaxSpeed}
					controls={controls}
					setInitialAngle={setInitialAngle}
					setReleaseAngle={setReleaseAngle}
					setMotorTorque={setMotorTorque}
					setMotorMaxSpeed={setMotorMaxSpeed}
					setControls={setControls}
				/>
				<ThreePlotComponent initialAngle={initialAngle} releaseAngle={releaseAngle} motorTorque={motorTorque} motorMaxSpeed={motorMaxSpeed} controls={controls}/>
			</div>
		</div>
	)
}

export default App

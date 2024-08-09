import './App.css'

import React, { useState } from 'react'

import Controls from './components/Controls/Controls'
import FunctionPlotComponent from './components/FunctionPlotComponent'
import { config } from './config/config'

const App: React.FC = () => {
	const [initialAngle, setInitialAngle] = useState<number>(config.initialAngle)
	const [releaseAngle, setReleaseAngle] = useState<number>(config.releaseAngle)
	const [motorTorque, setMotorTorque] = useState<number>(config.motorTorque)
	const [motorMaxSpeed, setMotorMaxSpeed] = useState<number>(config.motorMaxSpeed)

	return (
		<div className='App'>
			<h1>Ball Throw Simulation</h1>
			<div className='main-container'>
				<Controls
					initialAngle={initialAngle}
					releaseAngle={releaseAngle}
					motorTorque={motorTorque}
					motorMaxSpeed={motorMaxSpeed}
					setInitialAngle={setInitialAngle}
					setReleaseAngle={setReleaseAngle}
					setMotorTorque={setMotorTorque}
					setMotorMaxSpeed={setMotorMaxSpeed}
				/>
				<FunctionPlotComponent
					initialAngle={initialAngle}
					releaseAngle={releaseAngle}
					motorTorque={motorTorque}
					motorMaxSpeed={motorMaxSpeed}
				/>
			</div>
		</div>
	)
}

export default App

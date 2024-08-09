import './App.css'

import React, { useState } from 'react'

import Controls from './components/Controls/Controls'
import FunctionPlotComponent from './components/FunctionPlotComponent'

const App: React.FC = () => {
	const [initialAngle, setInitialAngle] = useState<number>(45)
	const [motorTorque, setMotorTorque] = useState<number>(10)
	const [releaseAngle, setReleaseAngle] = useState<number>(90)

	return (
		<div className='App'>
			<h1>Ball Throw Simulation</h1>
			<div className='main-container'>
				<Controls
					initialAngle={initialAngle}
					motorTorque={motorTorque}
					releaseAngle={releaseAngle}
					setInitialAngle={setInitialAngle}
					setMotorTorque={setMotorTorque}
					setReleaseAngle={setReleaseAngle}
				/>
				<FunctionPlotComponent initialAngle={initialAngle} motorTorque={motorTorque} releaseAngle={releaseAngle} />
			</div>
		</div>
	)
}

export default App

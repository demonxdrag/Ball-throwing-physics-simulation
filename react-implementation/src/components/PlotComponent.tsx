import { Data, Layout } from 'plotly.js'
import { PathPoint, calculatePath } from '../utils/calculations'

import Plot from 'react-plotly.js'
import React from 'react'
import { config } from '../config/config'

interface PlotProps {
	initialAngle: number
	motorTorque: number
	releaseAngle: number
}

const PlotComponent: React.FC<PlotProps> = (props: PlotProps) => {
	const { initialAngle, motorTorque, releaseAngle } = props

  const rodLength = config.rodLength
  const rodWidth = config.rodWidth
  const ballWidth = config.ballWidth

  const rodWeight = 0.5
  const ballWeight = 0.5

  const motorMaxSpeed = config.motorMaxSpeed

	// Calculate the path
	const { path, distance } = calculatePath(initialAngle, motorTorque, releaseAngle)

	// Trace for the ball's path
	const pathTrace: Data = {
		x: path.map((point: PathPoint) => point.x),
		y: path.map((point: PathPoint) => point.y),
		mode: 'lines+markers',
		type: 'scatter',
		name: 'Ball Path',
		text: path.map((point: PathPoint) => `x: ${point.x.toFixed(2)} cm, y: ${point.y.toFixed(2)} cm`),
		hoverinfo: 'text',
		line: { color: 'blue' }
	}

	// Trace for the rod
	const rodEndX = rodLength * Math.cos((initialAngle * Math.PI) / 180)
	const rodEndY = rodLength * Math.sin((initialAngle * Math.PI) / 180)
	const rodTrace: Data = {
		x: [0, rodEndX],
		y: [0, rodEndY],
		mode: 'lines',
		type: 'scatter',
		name: 'Rod',
		line: { color: 'black', width: 4 }
	}

	// Trace for the circular path
	const circlePoints = 100
	const circleX: number[] = []
	const circleY: number[] = []
	for (let i = 0; i < circlePoints; i++) {
		const angle = (2 * Math.PI * i) / circlePoints
		circleX.push(rodLength * Math.cos(angle))
		circleY.push(rodLength * Math.sin(angle))
	}
	const circleTrace: Data = {
		x: circleX,
		y: circleY,
		mode: 'lines',
		type: 'scatter',
		name: 'Circular Path',
		line: { color: 'gray', dash: 'dash' }
	}

	const data = [pathTrace, rodTrace, circleTrace]

	const layout: Partial<Layout> = {
		title: `Ball Path Simulation (Distance: ${distance.toFixed(2)} cm)`,
		xaxis: { title: 'X (cm)' },
		yaxis: { title: 'Y (cm)' },
		height: 500,
		showlegend: true,
		shapes: [
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: -config.wall,
        y0: -config.floor,
        x1: -config.wall,
        y1: config.floor,
        line: { color: 'gray' }
			},
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: config.wall,
        y0: -config.floor,
        x1: config.wall,
        y1: config.floor,
        line: { color: 'gray' }
			},
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: -config.wall,
        y0: config.floor,
        x1: config.wall,
        y1: config.floor,
        line: { color: 'gray' }
      }
		]
	}

	return <Plot data={data} layout={layout} />
}

export default PlotComponent


/** @jsx h */
import { h } from 'react-flyd'
import { stream, scan, map } from 'flyd'
import mergeAll from 'flyd/module/mergeall'
import filter from 'flyd/module/filter'
import DOM from 'react-dom'
import R from 'ramda'
import css from 'index.css'
import d3 from 'd3'

const initialState = {
  x: 0,
  y: 0,
  z: 1,
  width: window.innerWidth,
  height: window.innerHeight
}

const Arc = ({innerRadius, outerRadius, startAngle, endAngle}) => {
  const arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle)
    .endAngle(endAngle)

  return (
    <path
      d={arc()}
      fill={'yellow'}
      stroke={'black'} />
  )
}

const graph = ({x, y, z, width, height}) => {
  return (
    <svg width={width} height={height}>
      <g transform={`matrix(${z}, 0, 0, ${z}, ${x}, ${y})`}>
        <circle r={100} cy={100} cx={100} fill='red' />
        <text color='black' fill='black' fontSize={33} x={200} y={200}>!!!!!!</text>
        <Arc innerRadius={50} outerRadius={100} startAngle={0} endAngle={90} />
      </g>

    </svg>
  )
}

const preventDefault = (e) => {
  e.preventDefault()
  e.stopPropagation()
  return e
}

const on = (event, fn = R.identity, target = window) => {
  const $ = fn(stream())
  target.addEventListener(event, $)
  return $
}

const wheel = on('wheel', map(preventDefault))
const resize = on('resize')

const action = (type) => (payload) => ({type, payload})

const move$ = R.pipe(
  filter(R.complement(R.prop('ctrlKey'))),
  map(R.props(['deltaX', 'deltaY'])),
  map(action('move'))
)(wheel)

const zoom$ = R.pipe(
  filter(R.prop('ctrlKey')),
  map(R.props(['deltaY'])),
  map(action('zoom'))
)(wheel)

//
// if (e.ctrlKey) {
//   var s = Math.exp(-e.deltaY/100);
//   scale *= s;
//   console.log("delta = " + e.deltaY);
//   console.log("scale = " + scale);
//   console.log("s = " + s);
//
// }

const log = (msg) => map((e) => { console.log(msg, e); return e })
const resize$ = R.pipe(
  map(R.prop('target')),
  map(R.props(['innerWidth', 'innerHeight'])),
  map(action('resize'))
)(resize)


const reducer = (state, {type, payload}) => {
  switch (type) {
    case 'move':
      return {...state, x: state.x - payload[0], y: state.y - payload[1]}
    case 'zoom':
      return {...state, z: state.z - payload[0]}
    case 'resize':
      return {...state, width: payload[0], height: payload[1]}
  }

  return state
}

const state$ = scan(reducer, initialState, mergeAll([move$, zoom$, resize$]))

const render = (...state) =>
  DOM.render(graph(...state), document.getElementById('root'))

map(render, state$)
// map(console.log, state$)

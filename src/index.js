/** @jsx h */
import { h } from 'react-flyd'
import { stream, scan, map } from 'flyd'
import mergeAll from 'flyd/module/mergeall'
import filter from 'flyd/module/filter'
import flatMap from 'flyd/module/flatmap'
import takeUntil from 'flyd/module/takeuntil'
import DOM from 'react-dom'
import R from 'ramda'
import css from 'index.css'
import * as d3 from 'd3'
import * as components from 'components'

const initialState = {
  x: 0,
  y: 0,
  z: 1,
  width: window.innerWidth,
  height: window.innerHeight,
  graph: [
    {component: components.Header, x: 200, y: 200},
    {component: components.AddOne(), x: 200, y: 500},
    {component: components.DecOne(), x: 200, y: 800},
    {component: components.Merge(), x: 200, y: 1100}
  ]
}

const Arc = ({r, a}) => {
  const outerRadius = r
  const innerRadius = r - 10
  const [startAngle, endAngle] = a
  const padAngle = 0.1
  const props = {
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    padAngle
  }

  return <path className={css.arc} d={d3.arc().cornerRadius(5)(props)} />
}

const segments = (s) => (index, len) => {
  const segmentSize = Math.PI / len
  const start = segmentSize * index + s
  const end = start + segmentSize
  return [start, end]
}
const outSegments = segments(0)
const inSegments = segments(Math.PI)

const mouseDown = stream()
const Node = ({index, ins, outs, x, y}) => {
  console.log('????', index)
  return (
    <g transform={`translate(${x},${y})`} className={css.node}>
      <circle r={110} className={css.nodeContainer} onMouseDown={(e) => mouseDown(e, index)} />
      <g transform='translate(-2)'>
        {R.times((i) => <Arc key={`in-${i}`} r={100} a={inSegments(i, ins)} />, ins)}
      </g>
      <g transform='translate(2)'>
        {R.times((i) => <Arc key={`out-${i}`} r={100} a={outSegments(i, outs)} />, outs)}
      </g>
    </g>
  )
}

const Graph = ({x, y, z, width, height, graph}) => {
  return (
    <svg width={width} height={height}>
      <g transform={`matrix(${z}, 0, 0, ${z}, ${x}, ${y})`}>
        {graph.map((item, i) => {
          const c = item.component
          return <Node key={i} index={i} ins={c.ins.length} outs={Object.keys(c.outs).length} x={item.x} y={item.y} />
        })}
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
  map(R.head),
  map(action('zoom'))
)(wheel)

const mouseMove = stream()
const mouseUp = stream()

window.addEventListener('mousemove', mouseMove)
window.addEventListener('mouseup', mouseUp)

// stopped here, problem is index doesn't reach it :/
const drag = flatMap((md, index) => {
  console.log('DDD', md, index)
  const startX = md.offsetX
  const startY = md.offsetY

  return takeUntil(map((mm) => {
    mm.preventDefault()

    return {
      left: mm.clientX - startX,
      top: mm.clientY - startY,
      index
    }
  }, mouseMove), mouseUp)
}, mouseDown)

// const log = (msg) => map((e) => { console.log(msg, e); return e })
const resize$ = R.pipe(
  map(R.prop('target')),
  map(R.props(['innerWidth', 'innerHeight'])),
  map(action('resize'))
)(resize)

const reducer = (state, {type, payload}) => {
  if (type === 'drag') console.log(payload)
  switch (type) {
    case 'move':
      return {...state, x: state.x - payload[0], y: state.y - payload[1]}
    case 'drag':
      return state
    case 'zoom':
      return {...state, z: Math.max(state.z - payload / 100, 0.1)}
    case 'resize':
      return {...state, width: payload[0], height: payload[1]}
  }

  return state
}

const drag$ = map(action('drag'), drag)

const state$ = scan(reducer, initialState, mergeAll([move$, zoom$, resize$, drag$]))

const render = (...state) =>
  DOM.render(Graph(...state), document.getElementById('root'))

map(render, state$)


/** @jsx h */
import { h } from 'react-flyd'
import { stream, scan, map } from 'flyd'
import mergeAll from 'flyd/module/mergeall'
import filter from 'flyd/module/filter'
import DOM from 'react-dom'
import R from 'ramda'
import css from 'index.css'
import * as d3 from 'd3'

const Header = {
  title: 'Header',
  ins: ['count'],
  outs: {
    dom: (count) => <h1>Count: {count}</h1>
  }
}

const AddOne = () => {
  const add = stream()

  return {
    title: 'AddOne',
    ins: [],
    outs: {
      dom: () => <button onClick={() => add}>+</button>,
      add
    }
  }
}

const DecOne = () => {
  const dec = stream()

  return {
    title: 'AddOne',
    ins: [],
    outs: {
      dom: () => <button onClick={() => dec}>-</button>,
      dec
    }
  }
}

const initialState = {
  x: 0,
  y: 0,
  z: 1,
  width: window.innerWidth,
  height: window.innerHeight,
  graph: [Header, AddOne(), DecOne()]
}

// const arc =
const Arc = ({r, a}) => {
  const outerRadius = r
  const innerRadius = r - 10
  const [startAngle, endAngle] = a
  const cornerRadius = 100000
  const padAngle = 0.1
  const props = {
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    // cornerRadius,
    padAngle
  }

  return <path className={css.arc} d={d3.arc()(props)} />
}

const segments = (s) => (index, len) => {
  const segmentSize = Math.PI / len
  const start = segmentSize * index + s
  const end = start + segmentSize
  return [start, end]
}
const outSegments = segments(0)
const inSegments = segments(Math.PI)

const Node = ({ins, outs, x, y}) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <g transform="translate(-2)">
        {R.times((i) => <Arc key={`in-${i}`} r={100} a={inSegments(i, ins)} />, ins)}
      </g>
      <g transform="translate(2)">
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
            return <Node ins={item.ins.length} outs={Object.keys(item.outs).length} x={150 + i * 210} y={200} />
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
      return {...state, z: Math.max(state.z - payload/100, 0.1)}
    case 'resize':
      return {...state, width: payload[0], height: payload[1]}
  }

  return state
}

const state$ = scan(reducer, initialState, mergeAll([move$, zoom$, resize$]))

const render = (...state) =>
  DOM.render(Graph(...state), document.getElementById('root'))

map(render, state$)
map(console.log, state$)

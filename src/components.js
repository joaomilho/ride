import { merge, stream } from 'flyd'

export const Header = {
  title: 'Header',
  ins: ['count'],
  outs: {
    dom: (count) => <h1>Count: {count}</h1>
  }
}

export const AddOne = () => {
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

export const DecOne = () => {
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

export const Merge = () => {
  return {
    title: 'AddOne',
    ins: ['stream1', 'stream2'],
    outs: {
      merge
    }
  }
}

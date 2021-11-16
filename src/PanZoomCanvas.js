import {
  useCallback,
  createContext,
  useRef,
  useLayoutEffect,
  useEffect,
  useContext,
  useState
} from 'react'
import useEventListener from './useEventListener'
import * as pointUtils from './pointUtils'

const MIN_SCALE = 0.5
const MAX_SCALE = 3

export function usePan() {
  const [panState, setPanState] = useState(pointUtils.ORIGIN)
  const lastPointRef = useRef(pointUtils.ORIGIN)

  const pan = useCallback((e) => {
    const lastPoint = lastPointRef.current
    const point = {x: e.pageX, y: e.pageY}
    lastPointRef.current = point

    setPanState(panState => {
      const delta = pointUtils.diff(lastPoint, point)
      const offset = pointUtils.sum(panState, delta)
      return offset
    })
  }, [])

  const endPan = useCallback(() => {
    document.removeEventListener('mousemove', pan)
    document.removeEventListener('mouseup', endPan)
  }, [pan])

  const startPan = useCallback(
    (e) => {
      document.addEventListener('mousemove', pan)
      document.addEventListener('mouseup', endPan)
      lastPointRef.current = {x: e.pageX, y: e.pageY}
    },
    [pan, endPan]
  )

  return [panState, startPan]
}

export function useScale(ref) {
  const [scale, setScale] = useState(1)

  const updateScale = ({direction, interval}) => {
    setScale(currentScale => {
      let scale

      // Adjust up to or down to the maximum or minimum scale levels by `interval`.
      if (direction === 'up' && currentScale + interval < MAX_SCALE) {
        scale = currentScale + interval
      } else if (direction === 'up') {
        scale = MAX_SCALE
      } else if (direction === 'down' && currentScale - interval > MIN_SCALE) {
        scale = currentScale - interval
      } else if (direction === 'down') {
        scale = MIN_SCALE
      } else {
        scale = currentScale
      }

      return scale
    })
  }

  // Set up an event listener such that on `wheel`, we call `updateScale`.
  useEventListener(ref, 'wheel', e => {
    e.preventDefault()

    updateScale({
      direction: e.deltaY > 0 ? 'up' : 'down',
      interval: 0.1
    })
  })

  return scale
}

export function useLast(value) {
  const ref = useRef(value)
  
  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function useMousePos(ref) {
  const mousePos = useRef(pointUtils.ORIGIN)

  useEventListener(ref, 'mousemove', e => {
    e.preventDefault()
    mousePos.current = e
  })

  return mousePos
}

export const TrackingExample = () => {
  const [buffer, setBuffer] = useState(pointUtils.ORIGIN)
  const ref = useRef(null)
  const [offset, startPan] = usePan()
  const scale = useScale(ref)
  const mousePosRef = useMousePos(ref)
  const lastOffset = useLast(offset)
  const lastScale = useLast(scale)
  const delta = pointUtils.diff(offset, lastOffset)
  const adjustedOffset = useRef(pointUtils.sum(offset, delta))

  if (lastScale === scale) {
    adjustedOffset.current = pointUtils.sum(
      adjustedOffset.current,
      pointUtils.scale(delta, scale)
    )
  } else {
    const lastMouse = pointUtils.scale(mousePosRef.current, lastScale)
    const newMouse = pointUtils.scale(mousePosRef.current, scale)
    const mouseOffset = pointUtils.diff(lastMouse, newMouse)
    adjustedOffset.current = pointUtils.sum(adjustedOffset.current, mouseOffset)
  }

  useLayoutEffect(() => {
    const height = ref.current?.clientHeight ?? 0
    const width = ref.current?.clientWidth ?? 0

    setBuffer({
      x: (width - width / scale) / 2,
      y: (height - height / scale) / 2
    })
  }, [scale, setBuffer])

  return (
    <div ref={ref} onMouseDown={startPan} style={{position: 'relative', display: '100%', height: '100%'}}>
      <div
        style={{
          backgroundImage: 'url(https://jclem.nyc3.cdn.digitaloceanspaces.com/pan-zoom-canvas-react/grid.svg)',
          transform: `scale(${scale})`,
          display: 'block',
          backgroundPosition: `${-adjustedOffset.current.x}px ${-adjustedOffset
            .current.y}px`,
          position: 'absolute',
          bottom: buffer.y,
          left: buffer.x,
          right: buffer.x,
          top: buffer.y
        }}
      ></div>
    </div>
  )
}

export const CanvasContext = createContext({})
export function CanvasProvider(props) {
  const [buffer, setBuffer] = useState(pointUtils.ORIGIN)
  const ref = useRef(null)
  const [offset, startPan] = usePan()
  const scale = useScale(ref)
  const mousePosRef = useMousePos(ref)
  const lastOffset = useLast(offset)
  const lastScale = useLast(scale)
  const delta = pointUtils.diff(offset, lastOffset)
  const adjustedOffset = useRef(pointUtils.sum(offset, delta))

  if (lastScale === scale) {
    adjustedOffset.current = pointUtils.sum(
      adjustedOffset.current,
      pointUtils.scale(delta, scale)
    )
  } else {
    const lastMouse = pointUtils.scale(mousePosRef.current, lastScale)
    const newMouse = pointUtils.scale(mousePosRef.current, scale)
    const mouseOffset = pointUtils.diff(lastMouse, newMouse)
    adjustedOffset.current = pointUtils.sum(adjustedOffset.current, mouseOffset)
  }

  useLayoutEffect(() => {
    const height = ref.current?.clientHeight ?? 0
    const width = ref.current?.clientWidth ?? 0

    setBuffer({
      x: (width - width / scale) / 2,
      y: (height - height / scale) / 2
    })
  }, [scale, setBuffer])

  return (
    <CanvasContext.Provider
      value={{
        offset: adjustedOffset.current,
        scale,
        buffer
      }}
    >
      <div ref={ref} onMouseDown={startPan} style={{position: 'relative', width: '100%', height: '100%'}}>
        {props.children}
      </div>
    </CanvasContext.Provider>
  )
}

export function GridBackground() {
  const {offset, buffer, scale} = useContext(CanvasContext)

  return (
    <div
      style={{
        backgroundImage: 'url(https://jclem.nyc3.cdn.digitaloceanspaces.com/pan-zoom-canvas-react/grid.svg)',
        display: 'block',
        transform: `scale(${scale})`,
        backgroundPosition: `${-offset.x}px ${-offset.y}px`,
        position: 'absolute',
        bottom: buffer.y,
        left: buffer.x,
        right: buffer.x,
        top: buffer.y
      }}/>
  )
}

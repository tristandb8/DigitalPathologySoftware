
import React, { useRef, useEffect } from 'react'

const Canvas = props => {
  const { draw, ...rest } = props
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let frameCount = 0
    let animationFrameId
    
    const render = () => {
      frameCount++
      draw(context, frameCount)
      animationFrameId = window.requestAnimationFrame(render)
    }

    function handleResize() {
      context.canvas.width = window.innerWidth;
      context.canvas.height = window.innerWidth;      
    }

    window.addEventListener('resize', handleResize)
    
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
    
  }, [draw])
  
  return <canvas ref={canvasRef} {...rest}/>
}

export default Canvas

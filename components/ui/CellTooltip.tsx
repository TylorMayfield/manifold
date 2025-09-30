"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
  className?: string
}

const CellTooltip: React.FC<CellTooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 300,
  disabled = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let top = 0
    let left = 0

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - 8
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + scrollTop + 8
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left + scrollLeft - tooltipRect.width - 8
        break
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + scrollLeft + 8
        break
    }

    setPosition({ top, left })
  }

  useEffect(() => {
    if (isVisible) {
      updatePosition()
      const handleResize = () => updatePosition()
      const handleScroll = () => updatePosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isVisible, placement])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getArrowClass = () => {
    const baseArrow = "absolute w-2 h-2 bg-white border-black transform rotate-45"
    
    switch (placement) {
      case 'top':
        return `${baseArrow} border-r border-b -bottom-1 left-1/2 -translate-x-1/2`
      case 'bottom':
        return `${baseArrow} border-l border-t -top-1 left-1/2 -translate-x-1/2`
      case 'left':
        return `${baseArrow} border-t border-r -right-1 top-1/2 -translate-y-1/2`
      case 'right':
        return `${baseArrow} border-b border-l -left-1 top-1/2 -translate-y-1/2`
      default:
        return ''
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 px-2 py-1 text-sm text-black bg-white border-2 border-black shadow-cell rounded-sm max-w-xs",
            className
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
          <div className={getArrowClass()} />
        </div>
      )}
    </>
  )
}

export default CellTooltip

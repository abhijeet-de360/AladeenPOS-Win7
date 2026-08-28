import { useEffect } from 'react'

/**
 * Universal Touch & Pointer Drag Scroll Helper for Windows POS Touchscreens.
 * Enables smooth fingertip swiping/dragging on scrollable containers.
 * Prevents accidental button clicks during scroll drags.
 */
export function setupGlobalTouchScroll(): () => void {
  let isPointerDown = false
  let isDragging = false
  let startX = 0
  let startY = 0
  let initialScrollLeft = 0
  let initialScrollTop = 0
  let activeContainer: HTMLElement | null = null

  // Finds the nearest scrollable parent container
  function getScrollContainer(element: HTMLElement | null): HTMLElement | null {
    let curr = element
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const style = window.getComputedStyle(curr)
      const overflowY = style.overflowY
      const overflowX = style.overflowX
      const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll') && curr.scrollHeight > curr.clientHeight
      const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && curr.scrollWidth > curr.clientWidth
      
      if (isScrollableY || isScrollableX || curr.getAttribute('data-touch-scroll') === 'true') {
        return curr
      }
      curr = curr.parentElement
    }
    return null
  }

  function handlePointerDown(e: PointerEvent | MouseEvent) {
    // Only handle primary pointer (finger or left mouse button)
    if ('button' in e && e.button !== 0) return

    const target = e.target as HTMLElement | null
    if (!target) return

    // Ignore input fields, textareas, selects, or elements explicitly opting out
    const tagName = target.tagName.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
      return
    }

    const container = getScrollContainer(target)
    if (!container) return

    activeContainer = container
    isPointerDown = true
    isDragging = false
    startX = e.clientX
    startY = e.clientY
    initialScrollLeft = container.scrollLeft
    initialScrollTop = container.scrollTop
  }

  function handlePointerMove(e: PointerEvent | MouseEvent) {
    if (!isPointerDown || !activeContainer) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // 5px threshold to distinguish intentional fingertip swipe drag from quick tap
    if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      isDragging = true
    }

    if (isDragging) {
      activeContainer.scrollTop = initialScrollTop - deltaY
      activeContainer.scrollLeft = initialScrollLeft - deltaX

      if (e.cancelable) {
        e.preventDefault()
      }
    }
  }

  function handlePointerUp() {
    isPointerDown = false
    if (isDragging) {
      // Keep isDragging true briefly to swallow any immediate click event
      setTimeout(() => {
        isDragging = false
        activeContainer = null
      }, 50)
    } else {
      activeContainer = null
    }
  }

  function handleClickCapture(e: MouseEvent) {
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function handleInputTap(e: Event) {
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      if (target.getAttribute('data-no-virtual-keyboard') === 'true') {
        return
      }
      if (window.api && typeof (window.api as any).openVirtualKeyboard === 'function') {
        try {
          ;(window.api as any).openVirtualKeyboard()
        } catch (err) {
          console.warn('[TouchScroll] Error opening virtual keyboard:', err)
        }
      }
    }
  }

  // Bind global capture listeners
  window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true })
  window.addEventListener('pointermove', handlePointerMove, { capture: false })
  window.addEventListener('pointerup', handlePointerUp, { capture: true })
  window.addEventListener('pointercancel', handlePointerUp, { capture: true })
  window.addEventListener('click', handleClickCapture, { capture: true })
  window.addEventListener('focusin', handleInputTap, { capture: true })
  window.addEventListener('click', handleInputTap, { capture: true })

  return () => {
    window.removeEventListener('pointerdown', handlePointerDown, { capture: true })
    window.removeEventListener('pointermove', handlePointerMove, { capture: false })
    window.removeEventListener('pointerup', handlePointerUp, { capture: true })
    window.removeEventListener('pointercancel', handlePointerUp, { capture: true })
    window.removeEventListener('click', handleClickCapture, { capture: true })
    window.removeEventListener('focusin', handleInputTap, { capture: true })
    window.removeEventListener('click', handleInputTap, { capture: true })
  }
}

/**
 * React hook to setup global touch drag scrolling on component mount.
 */
export function useTouchScroll() {
  useEffect(() => {
    const cleanup = setupGlobalTouchScroll()
    return cleanup
  }, [])
}

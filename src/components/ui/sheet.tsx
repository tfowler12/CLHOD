import React from 'react'

function useFocusTrap(ref: React.RefObject<HTMLDivElement>) {
  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusableSelector =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'

    const getFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        el => !el.hasAttribute('disabled')
      )

    const focusables = getFocusable()
    focusables[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const current = getFocusable()
      if (current.length === 0) {
        e.preventDefault()
        return
      }
      const first = current[0]
      const last = current[current.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    node.addEventListener('keydown', handleKeyDown)
    return () => {
      node.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [ref])
}

export function Sheet({open, onOpenChange, children}: any){ return open ? children : null }
export function SheetContent({className='', children}: any){
  const contentRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(contentRef)
  return (
    <div
      className='fixed inset-0 z-[100] bg-black/30 flex'
      aria-modal="true"
    >
      <div
        ref={contentRef}
        role='dialog'
        className={`ml-auto h-full w-full sm:w-[28rem] bg-white border-l shadow-xl p-4 overflow-auto ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
export function SheetHeader({children}: any){ return <div className='mb-2'>{children}</div> }
export function SheetTitle({children, className=''}: any){ return <div className={`text-xl font-semibold ${className}`}>{children}</div> }

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

export function Dialog({children}: any){ return <div>{children}</div> }
export function DialogTrigger({asChild, children}: any){ return children }
export function DialogContent({className='', children}: any){
  const contentRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(contentRef)
  return (
    <div
      className='fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4'
      aria-modal="true"
    >
      <div
        ref={contentRef}
        role='dialog'
        className={`bg-white w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90vh] overflow-auto ${className}`}
      >
        {children}
      </div>

export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  )
}

export function DialogTrigger({ asChild, children }: any) {
  return children
}

export function DialogContent({ className = '', children }: any) {
  return (
    <div className={`relative bg-white w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90vh] overflow-auto ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = '' }: any) {
  return <div className={className}>{children}</div>
}

export function DialogTitle({ children, className = '' }: any) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>
}

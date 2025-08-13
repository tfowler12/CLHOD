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

interface SheetProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Sheet({ open, children }: SheetProps) {
  return open ? <>{children}</> : null
}

interface SheetContentProps {
  side?: 'bottom' | 'right'
  className?: string
  children: React.ReactNode
}

export function SheetContent({ side = 'right', className = '', children }: SheetContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(contentRef)
  const positionClass =
    side === 'bottom'
      ? 'absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl'
      : 'ml-auto h-full w-full sm:w-[28rem]'
  return (
    <div className="fixed inset-0 z-[100] bg-black/30 flex" aria-modal="true">
      <div
        ref={contentRef}
        role="dialog"
        className={`${positionClass} bg-white border shadow-xl p-4 overflow-auto ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

interface SheetHeaderProps {
  children: React.ReactNode
  className?: string
}

export function SheetHeader({ children, className = '' }: SheetHeaderProps) {
  return <div className={className}>{children}</div>
}

interface SheetTitleProps {
  children: React.ReactNode
  className?: string
}

export function SheetTitle({ children, className = '' }: SheetTitleProps) {
  return <div className={`text-xl font-semibold ${className}`}>{children}</div>
}


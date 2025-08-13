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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = getFocusable()
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
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

    const focusables = getFocusable()
    focusables[0]?.focus()

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

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200]">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  )
}

interface SheetContentProps {
  className?: string
  children: React.ReactNode
}

export function SheetContent({ className = '', children }: SheetContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(contentRef)
  return (
    <div
      ref={contentRef}
      role="dialog"
      className={`absolute inset-x-0 bottom-0 max-h-[90vh] bg-white border-t shadow-xl p-4 overflow-auto rounded-t-2xl ${className}`}
    >
      {children}
    </div>
  )
}

interface SheetHeaderProps {
  className?: string
  children: React.ReactNode
}

export function SheetHeader({ className = '', children }: SheetHeaderProps) {
  return <div className={className}>{children}</div>
}

interface SheetTitleProps {
  className?: string
  children: React.ReactNode
}

export function SheetTitle({ className = '', children }: SheetTitleProps) {
  return <div className={`text-xl font-semibold ${className}`}>{children}</div>
}


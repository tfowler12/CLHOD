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

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dialog({ children }: DialogProps) {
  return <>{children}</>
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  return children
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void

}

export function DialogContent({ className = '', children, onOpenChange }: DialogContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(contentRef)
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4"
      aria-modal="true"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        ref={contentRef}
        role="dialog"
        className={`bg-white w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90vh] overflow-auto ${className}`}
        onClick={e => e.stopPropagation()}
        >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return <div className={className}>{children}</div>
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>
}


import React from 'react'

interface SheetProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return open ? children : null
}

interface SheetContentProps {
  className?: string
  children: React.ReactNode
}

export function SheetContent({ className = '', children }: SheetContentProps) {
  return <div className={`fixed right-0 top-0 h-full w-full sm:w-[28rem] bg-white border-l shadow-xl p-4 overflow-auto ${className}`}>{children}</div>
}

interface SheetHeaderProps {
  children: React.ReactNode
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return <div className='mb-2'>{children}</div>
}

interface SheetTitleProps {
  children: React.ReactNode
  className?: string
}

export function SheetTitle({ children, className = '' }: SheetTitleProps) {
  return <div className={`text-xl font-semibold ${className}`}>{children}</div>
}

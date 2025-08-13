import React from 'react'

interface DialogProps {
  children: React.ReactNode
}

export function Dialog({ children }: DialogProps) {
  return <div>{children}</div>
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  return children
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className = '', children }: DialogContentProps) {
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

interface DialogHeaderProps {
  children: React.ReactNode
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className='mb-2'>{children}</div>
}

interface DialogTitleProps {
  children: React.ReactNode
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <div className='text-lg font-semibold'>{children}</div>
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

import React from 'react'

export function Sheet({ open, onOpenChange, children }: any) {
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

export function SheetContent({ className = '', children }: any) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 max-h-[90vh] bg-white border-t shadow-xl p-4 overflow-auto rounded-t-2xl ${className}`}
    >
      {children}
    </div>
  )
}

export function SheetHeader({ children, className = '' }: any) {
  return <div className={className}>{children}</div>
}

export function SheetTitle({ children, className = '' }: any) {
  return <div className={`text-xl font-semibold ${className}`}>{children}</div>
}

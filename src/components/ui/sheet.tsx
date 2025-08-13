import React from 'react'
export function Sheet({open, onOpenChange, children}: any){ return open ? children : null }
export function SheetContent({className='', children}: any){ return <div className={`fixed right-0 top-0 h-full w-full sm:w-[28rem] bg-white border-l shadow-xl p-4 overflow-auto ${className}`}>{children}</div> }
export function SheetHeader({children}: any){ return <div className='mb-2'>{children}</div> }
export function SheetTitle({children, className=''}: any){ return <div className={`text-xl font-semibold ${className}`}>{children}</div> }

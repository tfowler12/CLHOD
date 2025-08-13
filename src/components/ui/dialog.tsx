import React from 'react'
export function Dialog({children}: any){ return <div>{children}</div> }
export function DialogTrigger({asChild, children}: any){ return children }
export function DialogContent({className='', children}: any){
  return (
    <div className='fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4'>
      <div className={`bg-white w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90vh] overflow-auto ${className}`}>{children}</div>
    </div>
  )
}
export function DialogHeader({children}: any){ return <div className='mb-2'>{children}</div> }
export function DialogTitle({children}: any){ return <div className='text-lg font-semibold'>{children}</div> }

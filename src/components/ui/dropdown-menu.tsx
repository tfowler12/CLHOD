import React from 'react'
export function DropdownMenu({children}: any){ return <div className='relative inline-block'>{children}</div> }
export function DropdownMenuTrigger({asChild, children}: any){ return children }
export function DropdownMenuContent({children, align='end'}: any){
  const alignClass = align==='end' ? 'right-0' : 'left-0'
  return <div className={`absolute ${alignClass} z-[90] mt-2 bg-white border rounded-xl p-2 shadow`}>{children}</div>
}
export function DropdownMenuItem({children, onClick}: any){ return <div className='px-3 py-2 rounded hover:bg-slate-100 cursor-pointer' onClick={onClick}>{children}</div> }
export function DropdownMenuLabel({children}: any){ return <div className='text-xs uppercase text-slate-500 px-3 pt-2 pb-1'>{children}</div> }
export function DropdownMenuSeparator(){ return <div className='h-px bg-slate-200 my-1'/> }

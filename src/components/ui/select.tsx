import React from 'react'
export function Select({children, onValueChange, value}: any){ return <div data-value={value}>{children}</div> }
export function SelectTrigger({children, className='', ...props}: any){ return <div className={`border rounded-xl px-3 py-2 text-sm bg-white ${className}`} {...props}>{children}</div> }
export function SelectValue({placeholder}: any){ return <span className='text-slate-500'>{placeholder}</span> }
export function SelectContent({children}: any){ return <div className='mt-2 grid gap-1'>{children}</div> }
export function SelectItem({children, value, onClick}: any){ return <button className='text-left px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200' onClick={()=>onClick?.(value)}>{children}</button> }

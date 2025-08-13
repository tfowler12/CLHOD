import React from 'react'
export function Badge({children, className='', variant='secondary'}: any){
  const styles = variant==='secondary' ? 'bg-slate-100 text-slate-700' : 'bg-primary text-white'
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${styles} ${className}`}>{children}</span>
}

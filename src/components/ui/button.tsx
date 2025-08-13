import React from 'react'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'ghost'|'outline'|'secondary', size?: 'sm'|'icon' }
export function Button({ className='', variant='default', size, ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition border'
  const variants = {
    default: 'bg-primary text-white border-primary hover:bg-primary/90',
    ghost: 'bg-transparent border-transparent hover:bg-slate-100',
    outline: 'bg-white border-slate-200 hover:bg-slate-50',
    secondary: 'bg-slate-100 border-slate-200 hover:bg-slate-200',
  } as const
  const sizes = { sm: 'px-2 py-1 text-sm rounded-xl', icon: 'h-9 w-9 p-0 rounded-full' } as const
  const sz = size ? sizes[size] : ''
  return <button className={`${base} ${variants[variant]} ${sz} ${className}`} {...props} />
}

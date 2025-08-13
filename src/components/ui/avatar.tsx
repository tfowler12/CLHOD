import React from 'react'
export function Avatar({className='', children}: any){ return <div className={`rounded-full overflow-hidden bg-slate-200 ${className}`}>{children}</div> }
export function AvatarImage({src, alt}: any){ return <img src={src} alt={alt||''} className='w-full h-full object-cover'/> }
export function AvatarFallback({children, className=''}: any){ return <div className={`w-full h-full flex items-center justify-center text-sm ${className}`}>{children}</div> }

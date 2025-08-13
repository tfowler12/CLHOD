import React from 'react'
export function TooltipProvider({children}: any){ return children }
export function Tooltip({children}: any){ return children }
export function TooltipTrigger({asChild, children}: any){ return children }
export function TooltipContent({children}: any){ return <div className='text-xs bg-black text-white px-2 py-1 rounded'>{children}</div> }

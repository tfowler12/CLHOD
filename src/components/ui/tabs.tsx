import React from 'react'
export function Tabs({defaultValue, children}: any){ return <div>{children}</div> }
export function TabsList({children, className=''}: any){ return <div className={`flex gap-2 ${className}`}>{children}</div> }
export function TabsTrigger({children, value}: any){ return <button className='px-3 py-2 rounded-xl border bg-slate-100'>{children}</button> }
export function TabsContent({children, value, className=''}: any){ return <div className={className}>{children}</div> }

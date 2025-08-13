import React from 'react'
export function Card({className='', ...props}: any){ return <div className={`bg-white border rounded-2xl ${className}`} {...props}/> }
export function CardHeader({className='', ...props}: any){ return <div className={`p-4 border-b ${className}`} {...props}/> }
export function CardTitle({className='', ...props}: any){ return <div className={`text-lg font-semibold ${className}`} {...props}/> }
export function CardContent({className='', ...props}: any){ return <div className={`p-4 ${className}`} {...props}/> }

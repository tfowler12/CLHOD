import React from 'react'
export function Table({children}: any){ return <table className='w-full text-sm'>{children}</table> }
export function TableHeader({children}: any){ return <thead className='bg-slate-50'>{children}</thead> }
export function TableHead({children}: any){ return <th className='text-left px-3 py-2 border-b'>{children}</th> }
export function TableBody({children}: any){ return <tbody>{children}</tbody> }
export function TableRow({children, className='', ...props}: any){ return <tr className={`border-b ${className}`} {...props}>{children}</tr> }
export function TableCell({children, className='', ...props}: any){ return <td className={`px-3 py-2 align-top ${className}`} {...props}>{children}</td> }

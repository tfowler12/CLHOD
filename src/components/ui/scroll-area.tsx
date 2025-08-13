import React from 'react'
export function ScrollArea({className='', children}: any){ return <div className={`${className} overflow-auto`}>{children}</div> }

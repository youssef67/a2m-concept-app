import React from 'react'
export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 md:p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

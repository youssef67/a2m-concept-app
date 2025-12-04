import React from 'react'
export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  }

  return (
    <div className={`flex items-center justify-center ${sizes[size]} ${className}`}>
      <div className="bg-black rounded-lg w-full h-full flex items-center justify-center p-1">
        <img
          src="/logo-512.png"
          alt="A2M Concepts"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}

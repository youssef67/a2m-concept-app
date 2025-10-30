export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-32 h-32 text-6xl'
  }

  return (
    <div className={`flex items-center justify-center ${sizes[size]} ${className}`}>
      <div className="bg-primary-600 text-white font-bold rounded-lg w-full h-full flex items-center justify-center">
        A2M
      </div>
    </div>
  )
}

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  )
}

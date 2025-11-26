import React from 'react'

const Input = React.forwardRef(({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  label,
  ...rest
}, ref) => {
  const baseClasses = 'w-full min-h-[48px] px-4 py-3 text-base border rounded-lg transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed'
  const errorClasses = error
    ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
    : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

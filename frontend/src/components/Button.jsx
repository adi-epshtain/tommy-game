/**
 * Unified Button Component
 * Provides consistent button styling across the entire app
 */

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props 
}) {
  // Base classes shared by all buttons
  const baseClasses = 'font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95'
  
  // Size variants
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl'
  }
  
  // Variant styles with enhanced hover effects
  const variantClasses = {
    primary: 'bg-gradient-to-b from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:shadow-green-400/50 active:from-green-700 active:to-green-800 focus:ring-green-300',
    secondary: 'bg-white text-gray-800 border-2 border-gray-300 shadow-md hover:bg-gray-50 hover:shadow-xl hover:shadow-gray-300/50 hover:border-gray-400 active:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-2xl hover:shadow-red-400/50 active:from-red-700 active:to-red-800 focus:ring-red-300',
    info: 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700 hover:shadow-2xl hover:shadow-blue-400/50 active:from-blue-700 active:to-blue-800 focus:ring-blue-300'
  }
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button


function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#1E3A5F] text-white hover:bg-[#16304d]',
    secondary: 'bg-white text-[#1E3A5F] border border-[#1E3A5F] hover:bg-gray-50',
    danger: 'bg-[#EF4444] text-white hover:bg-red-600',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;

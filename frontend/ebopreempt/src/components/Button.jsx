function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#1E3A5F] dark:bg-[#06B6D4] text-white hover:bg-[#16304d] dark:hover:bg-[#0891B2]',
    secondary: 'bg-white dark:bg-gray-800 text-[#1E3A5F] dark:text-[#06B6D4] border border-[#1E3A5F] dark:border-[#06B6D4] hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: 'bg-[#EF4444] text-white hover:bg-red-600',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;

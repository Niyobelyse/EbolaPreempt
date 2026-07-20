function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 ${className}`}>
      {children}
    </div>
  );
}

export default Card;

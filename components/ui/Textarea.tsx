import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = "",
  ...props
}) => {
  const baseClasses =
    "block w-full px-4 py-3 bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-5 rounded-xl shadow-xl placeholder-white placeholder-opacity-30 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-30 focus:border-white focus:border-opacity-10 sm:text-sm text-white resize-none transition-all duration-300";

  const errorClasses = error
    ? "border-red-400 border-opacity-50 text-red-100 placeholder-red-300 placeholder-opacity-70 focus:ring-red-400 focus:ring-opacity-50 focus:border-red-400 focus:border-opacity-70"
    : "";

  const inputClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-white/90 mb-2">
          {label}
        </label>
      )}

      <textarea className={inputClasses} {...props} />

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      {helperText && !error && (
        <p className="mt-2 text-sm text-white/60">{helperText}</p>
      )}
    </div>
  );
};

export default Textarea;

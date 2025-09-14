import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) => {
  const baseClasses = "input";
  const errorClasses = error ? "input-error" : "";
  const iconClasses = leftIcon ? "pl-12" : "";
  const rightIconClasses = rightIcon ? "pr-12" : "";

  const inputClasses = `${baseClasses} ${errorClasses} ${iconClasses} ${rightIconClasses} ${className}`;

  return (
    <div className="space-y-2">
      {label && <label className="text-label">{label}</label>}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className="text-white/60">{leftIcon}</div>
          </div>
        )}

        <input className={inputClasses} {...props} />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <div className="text-white/60">{rightIcon}</div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {helperText && !error && <p className="text-caption">{helperText}</p>}
    </div>
  );
};

export default Input;

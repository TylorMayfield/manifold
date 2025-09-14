import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "default";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    destructive:
      "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700",
    default: "btn-primary",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const classes = `${variantClasses[variant as keyof typeof variantClasses]} ${
    sizeClasses[size]
  } ${className}`;

  const iconElement = icon && (
    <span className={iconPosition === "left" ? "mr-2" : "ml-2"}>{icon}</span>
  );

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {iconPosition === "left" && iconElement}
      {children}
      {iconPosition === "right" && iconElement}
    </button>
  );
};

export default Button;

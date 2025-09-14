import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          className={`inline-block align-bottom modal rounded-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:w-full animate-scale-in ${sizeClasses[size]}`}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 sm:p-6 sm:pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-heading text-white">{title}</h3>
              {showCloseButton && (
                <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

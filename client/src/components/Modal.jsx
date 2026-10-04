import React from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, className = "" }) {
  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${className}`.trim()}
      onClick={onClose}
    >
      <div
        className={`modal-panel animate-fade-in ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Închide fereastra"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

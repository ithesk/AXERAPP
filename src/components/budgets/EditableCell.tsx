"use client";

import React, { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (shiftKey: boolean) => void;
}

export default function EditableCell({
  value,
  onChange,
  type = "text",
  placeholder = "",
  className = "",
  disabled = false,
  min,
  max,
  step,
  onEnter,
  onEscape,
  onTab,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sincronizar tempValue cuando value cambia externamente
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Auto-focus cuando entra en modo edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === "text" || type === "textarea") {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        if (type !== "textarea" || e.ctrlKey) {
          e.preventDefault();
          setIsEditing(false);
          onChange(tempValue);
          if (onEnter) onEnter();
        }
        break;

      case "Escape":
        e.preventDefault();
        setTempValue(value); // Revertir cambios
        setIsEditing(false);
        if (onEscape) onEscape();
        break;

      case "Tab":
        e.preventDefault();
        setIsEditing(false);
        onChange(tempValue);
        if (onTab) onTab(e.shiftKey);
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (type === "number") {
      const numValue = parseFloat(e.target.value);
      setTempValue(isNaN(numValue) ? 0 : numValue);
    } else {
      setTempValue(e.target.value);
    }
  };

  const displayValue = () => {
    if (type === "number") {
      return typeof value === "number" ? value.toFixed(2) : "0.00";
    }
    return value || placeholder;
  };

  const baseClassName = `w-full px-2 py-1.5 text-sm ${className}`;

  if (isEditing) {
    const Component = type === "textarea" ? "textarea" : "input";
    return (
      <Component
        ref={inputRef as any}
        type={type === "number" ? "number" : "text"}
        value={tempValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        className={`${baseClassName} border border-brand-500 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white dark:bg-gray-900 dark:text-white`}
        {...(type === "textarea" ? { rows: 2 } : {})}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`${baseClassName} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${!value && placeholder ? "text-gray-400 italic" : "text-gray-800 dark:text-white/90"}`}
      title="Doble clic para editar"
    >
      {displayValue()}
    </div>
  );
}

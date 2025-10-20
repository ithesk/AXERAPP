"use client";

import React from "react";
import PhoneInputWithCountry from "react-phone-number-input";
import type { CountryCode } from "libphonenumber-js/core";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  defaultCountry?: CountryCode;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Ingresa tu número",
  defaultCountry = "DO",
  disabled = false,
  className,
}: PhoneInputProps) {
  const inputClassName = [
    "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm",
    "placeholder:text-gray-400",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
  ].join(" ");

  return (
    <div className={`phone-input-wrapper ${className || ""}`}>
      <PhoneInputWithCountry
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={(val) => onChange(val || "")}
        placeholder={placeholder}
        disabled={disabled}
        countrySelectProps={{
          className: "phone-country-select",
        }}
        numberInputProps={{
          className: inputClassName,
        }}
      />
      <style jsx global>{`
        .phone-input-wrapper {
          width: 100%;
        }

        .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.375rem;
          background: hsl(var(--background));
          cursor: pointer;
          transition: all 0.2s;
        }

        .PhoneInputCountry:hover {
          background: hsl(var(--accent));
        }

        .PhoneInputCountry:focus-within {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }

        .PhoneInputCountryIcon {
          width: 1.25rem;
          height: 1rem;
        }

        .PhoneInputCountrySelect {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        .PhoneInputCountrySelectArrow {
          width: 0.375rem;
          height: 0.375rem;
          border-right: 1px solid currentColor;
          border-bottom: 1px solid currentColor;
          transform: rotate(45deg);
          margin-left: 0.25rem;
          opacity: 0.5;
        }

        .PhoneInputInput {
          flex: 1;
        }

        /* Dark mode */
        .dark .PhoneInputCountry {
          border-color: hsl(var(--border));
          background: hsl(var(--background));
        }

        .dark .PhoneInputCountry:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, type InputHTMLAttributes } from "react";

// A password <input> with an eye button to show / hide what was typed.
// Drop-in replacement for <input type="password" …/> inside a .field.
export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="pw-eye"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18" /><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.7M6.2 6.3C4.2 7.7 2.7 9.8 2 12c1 2.5 5 7 10 7 1.9 0 3.6-.6 5-1.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </div>
  );
}

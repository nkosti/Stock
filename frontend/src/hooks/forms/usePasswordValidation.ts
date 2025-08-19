import { useState } from "react";

export default function usePasswordValidation () {
  const [validation, setValidation] = useState({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
    });
  
    const validate = (password: string) => {
      const newValidation = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };
      setValidation(newValidation);
      return Object.values(newValidation).every(Boolean);
    };

    return { validation, validate }
}
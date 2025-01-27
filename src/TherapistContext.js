import React, { createContext, useState } from "react";

// Create the context
export const TherapistContext = createContext();

// Provide the context
export const TherapistProvider = ({ children }) => {
  const [therapistName, setTherapistName] = useState("");

  return (
    <TherapistContext.Provider value={{ therapistName, setTherapistName }}>
      {children}
    </TherapistContext.Provider>
  );
};

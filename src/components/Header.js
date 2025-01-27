import React, { useContext } from "react";
import { TherapistContext } from "../TherapistContext";

const Header = () => {
  const { therapistName } = useContext(TherapistContext);

  return (
    <div className="header">
      {therapistName && <span>Logged in as: {therapistName}</span>}
    </div>
  );
};

export default Header;

'use client';

import React from "react";
import "../styles/sideInfo.css";

interface Props {
  label: string;
  description: string;
  extraInfo?: string[];
  visible: boolean;
}

const SideInfoPanel = React.forwardRef<HTMLDivElement, Props>(
  ({ label, description, extraInfo = [], visible }, ref) => {
    return (
      <div
        ref={ref}
        className={`side-info-panel ${visible ? "visible" : ""}`}
      >
        <p className="sidetitle">{label}</p>
        <p className="biglabel">{description}</p>

        {extraInfo.map((line, i) => (
          <p key={i} className="side-extra">
            {line}
          </p>
        ))}
      </div>
    );
  }
);

SideInfoPanel.displayName = "SideInfoPanel";
export default SideInfoPanel;

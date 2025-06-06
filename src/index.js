import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "./i18n"

// Stagewise toolbar configuration
const stagewiseConfig = {
  plugins: []
};

// Create main app root
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize stagewise toolbar in development mode
if (process.env.NODE_ENV === 'development') {
  const { StagewiseToolbar } = require('@stagewise/toolbar-react');
  const toolbarRoot = ReactDOM.createRoot(document.createElement('div'));
  toolbarRoot.render(<StagewiseToolbar config={stagewiseConfig} />);
  document.body.appendChild(toolbarRoot._internalRoot.containerInfo);
}

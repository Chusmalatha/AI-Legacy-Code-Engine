import React from "react";
import { ProjectProvider } from "./components/ProjectContext.jsx";
import Workspace from "./components/Workspace.jsx";

function App() {
  return (
    <ProjectProvider>
      <Workspace />
    </ProjectProvider>
  );
}

export default App;

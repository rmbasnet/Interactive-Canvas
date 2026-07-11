import { useState } from "react";
import CollaborativeCanvas from "./components/CollaborativeCanvas";
import ColorPallet from "./components/ColorPallet";

function App() {
  const [color, setColor] = useState("#ff4500");
  const [isEraser, setIsEraser] = useState(false);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
        <ColorPallet
          color={color}
          onColorChange={setColor}
          isEraser={isEraser}
          onEraserToggle={setIsEraser}
        />
        <CollaborativeCanvas
          color={color}
          isEraser={isEraser}
        />
      </div>
    </>
  );
}

export default App;

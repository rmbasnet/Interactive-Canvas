import React from "react";

function ColorPallet({ color, onColorChange, isEraser, onEraserToggle }) {
  const colors = [
    "#ff4500",
    "#1e90ff",
    "#32cd32",
    "#ffd700",
    "#8a2be2",
    "#000000",
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <label htmlFor="eraser">Eraser:</label>
      <input
        type="checkbox"
        id="eraser"
        checked={isEraser}
        onChange={(e) => onEraserToggle(e.target.checked)}
      />
      <label htmlFor="colorPicker">Color:</label>
      <input
        type="color"
        id="colorPicker"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        disabled={isEraser}
        style={{ width: "40px", height: "30px" }}
      />
      <div style={{ display: "flex", gap: "5px" }}>
        {colors.map((c) => (
          <button
            key={c}
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: c,
              border:
                color === c && !isEraser ? "2px solid #fff" : "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => {
              if (!isEraser) onColorChange(c);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default ColorPallet;

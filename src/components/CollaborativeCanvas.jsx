import React, { useRef, useEffect, useState } from "react";

function CollaborativeCanvas({ color = "#ff4500", isEraser = false }) {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const lastPoint = useRef({ x: 0, y: 0 });

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8080");

    socketRef.current.onmessage = (event) => {
      const { x1, y1, x2, y2, color: receivedColor } = JSON.parse(event.data);
      drawLine(x1, y1, x2, y2, receivedColor, false);
    };

    return () => socketRef.current.close();
  }, []);

  // ---- drawing core -------------------------------------------------
  const drawLine = (x1, y1, x2, y2, color = "#000000", emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();

    if (emit && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ x1, y1, x2, y2, color }));
    }
  };

  // ---- snapshot handling -------------------------------------------
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, imageData]);
  };

  // ---- event handlers -----------------------------------------------
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    lastPoint.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
    saveState(); // save before we start drawing
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const drawColor = isEraser ? "#ffffff" : color;

    drawLine(
      lastPoint.current.x,
      lastPoint.current.y,
      offsetX,
      offsetY,
      drawColor,
      true,
    );

    lastPoint.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  };

  const undoLine = () => {
    if (history.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // pop the latest state (the current canvas)
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    // restore to the new top of stack, or clear if empty
    if (newHistory.length > 0) {
      ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // ---- render -------------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        marginTop: "20px",
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: "2px solid #333",
          background: "#fff",
          cursor: "crosshair",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={clearCanvas}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#ff4500",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Clear Canvas
        </button>

        <button
          onClick={undoLine}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#1e90ff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );
}

export default CollaborativeCanvas;

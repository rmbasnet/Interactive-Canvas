import React, { useRef, useEffect, useState } from "react";

function CollaborativeCanvas({ color = "#ff4500", isEraser = false }) {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8080");

    socketRef.current.onmessage = (event) => {
      const { x1, y1, x2, y2, color: receivedColor } = JSON.parse(event.data);
      drawLine(x1, y1, x2, y2, receivedColor, false);
    };

    return () => socketRef.current.close();
  }, []);

  //core drawing functions
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

    // Broadcast your movements to the server
    if (emit && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ x1, y1, x2, y2, color }));
    }
  };

  //local pointer event handler
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    lastPoint.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
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

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

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
    </div>
  );
}

export default CollaborativeCanvas;

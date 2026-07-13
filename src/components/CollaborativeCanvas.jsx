import React, { useRef, useEffect, useState } from "react";

function CollaborativeCanvas({ color = "#ff4500", isEraser = false }) {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const lastPoint = useRef({ x: 0, y: 0 });
  const WS_uri = (import.meta.env.VITE_WS_URI || "ws://localhost:8080").trim();

  useEffect(() => {
    const socket = new WebSocket(WS_uri);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
    });

    socket.addEventListener("error", () => {
      console.error(
        "WebSocket connection failed. Start the backend server first with: npm run dev in the backend folder.",
      );
    });

    socket.addEventListener("message", (event) => {
      const { x1, y1, x2, y2, color: receivedColor } = JSON.parse(event.data);
      drawLine(x1, y1, x2, y2, receivedColor, false);
    });

    return () => {
      if (
        socketRef.current?.readyState === WebSocket.OPEN ||
        socketRef.current?.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [WS_uri]);

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
  const getCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const restoreSnapshot = (snapshot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (snapshot) {
      ctx.putImageData(snapshot, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveState = () => {
    const snapshot = getCanvasSnapshot();
    if (!snapshot) return;

    undoStackRef.current = [...undoStackRef.current, snapshot];
    redoStackRef.current = [];
  };

  // ---- event handlers -----------------------------------------------
  const startDrawing = (e) => {
    if (isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    lastPoint.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
    saveState(); // save the state before the current stroke begins
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
    undoStackRef.current = [];
    redoStackRef.current = [];
  };

  const undoLine = () => {
    if (undoStackRef.current.length === 0) return;

    const currentSnapshot = getCanvasSnapshot();
    const previousSnapshot =
      undoStackRef.current[undoStackRef.current.length - 1];

    if (currentSnapshot) {
      redoStackRef.current = [...redoStackRef.current, currentSnapshot];
    }

    undoStackRef.current = undoStackRef.current.slice(0, -1);
    restoreSnapshot(previousSnapshot);
  };

  const redoLine = () => {
    if (redoStackRef.current.length === 0) return;

    const currentSnapshot = getCanvasSnapshot();
    const nextSnapshot = redoStackRef.current[redoStackRef.current.length - 1];

    if (currentSnapshot) {
      undoStackRef.current = [...undoStackRef.current, currentSnapshot];
    }

    redoStackRef.current = redoStackRef.current.slice(0, -1);
    restoreSnapshot(nextSnapshot);
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

        <button
          onClick={redoLine}
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
          Redo
        </button>
      </div>
    </div>
  );
}

export default CollaborativeCanvas;

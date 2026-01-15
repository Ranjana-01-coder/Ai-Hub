import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";

export default function SignCollector() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInstance = useRef(null);

  const [label, setLabel] = useState(""); // current letter
  const [dataset, setDataset] = useState([]); // collected samples
  const [filename, setFilename] = useState("sign_dataset"); // default file name

  useEffect(() => {
    if (!webcamRef.current) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      if (results.multiHandLandmarks && label) {
        const landmarks = results.multiHandLandmarks[0];
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
        drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1 });

        // Flatten landmarks and save with label
        const flat = landmarks.flatMap((lm) => [lm.x, lm.y, lm.z]);
        setDataset((prev) => [...prev, { label, landmarks: flat }]);
      }
    });

    cameraInstance.current = new Camera(webcamRef.current.video, {
      onFrame: async () => await hands.send({ image: webcamRef.current.video }),
      width: 320,
      height: 240,
    });

    cameraInstance.current.start();

    return () => {
      if (cameraInstance.current) {
        cameraInstance.current.stop();
        cameraInstance.current = null;
      }
    };
  }, [label]);

  // Save dataset as JSON with custom filename
  const saveDataset = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".json") ? filename : filename + ".json";
    a.click();
  };

  return (
    <div className="p-4 text-center min-h-screen flex flex-col items-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Sign Data Collector</h1>

      {/* Webcam + Canvas */}
      <div className="relative">
        <Webcam ref={webcamRef} style={{ width: 320, height: 240 }} />
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>

      {/* Label Input */}
      <div className="mt-4">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value.toUpperCase())}
          placeholder="Enter Letter (A-Z)"
          className="border p-2 rounded w-32 text-center"
        />
        <p className="text-gray-500 mt-2">
          Current Label: <b>{label || "None"}</b>
        </p>
      </div>

      {/* Filename Input */}
      <div className="mt-4">
        <input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Filename"
          className="border p-2 rounded w-48 text-center"
        />
      </div>

      {/* Save Button */}
      <div className="mt-4 flex gap-2 justify-center">
        <button
          onClick={saveDataset}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
        >
          Save Dataset
        </button>
      </div>

      <p className="mt-4">Collected samples: {dataset.length}</p>
    </div>
  );
}

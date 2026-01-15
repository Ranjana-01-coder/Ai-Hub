import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";

export default function SignLanguage() {
  const [input, setInput] = useState("");
  const [signImages, setSignImages] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [accuracy, setAccuracy] = useState(0);        // ✅ NEW
  const [cameraOn, setCameraOn] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInstance = useRef(null);

  // Accuracy tracking
  const totalFrames = useRef(0);                     // ✅ NEW
  const correctFrames = useRef(0);                   // ✅ NEW

  // Convert typed text → ASL images
  const handleConvert = useCallback(() => {
    const letters = input
      .trim()
      .toLowerCase()
      .split("")
      .filter((char) => /[a-z]/.test(char));

    const images = letters.map((ch) => `/signs/${ch}.png`);
    setSignImages(images);
  }, [input]);

  // Text-to-Speech
  const speakText = () => {                          // ✅ NEW
    if (!input) return;
    const utter = new SpeechSynthesisUtterance(input);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  // Mediapipe setup
  useEffect(() => {
    if (!cameraOn || !webcamRef.current) return;

    totalFrames.current = 0;                         // reset on start
    correctFrames.current = 0;
    setAccuracy(0);

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
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
      canvasRef.current.width = 320;
      canvasRef.current.height = 240;
      ctx.clearRect(0, 0, 320, 240);

      // Draw camera image
      ctx.drawImage(results.image, 0, 0, 320, 240);

      if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((lm) => {
          drawConnectors(ctx, lm, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2,
          });

          drawLandmarks(ctx, lm, { color: "#FF0000", lineWidth: 1 });

          const thumb = lm[4];
          const index = lm[8];
          const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y);

          totalFrames.current += 1;

          if (dist < 0.05) {
            correctFrames.current += 1;
            setFeedback("✅ Correct Sign!");
          } else {
            setFeedback("❌ Try Again");
          }

          // Update accuracy percentage
          const percent =
            (correctFrames.current / totalFrames.current) * 100;
          setAccuracy(percent.toFixed(1));
        });
      }
    });

    // Start camera
    cameraInstance.current = new Camera(webcamRef.current.video, {
      onFrame: async () =>
        await hands.send({ image: webcamRef.current.video }),
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
  }, [cameraOn]);

  return (
    <div className="p-6 min-h-screen flex flex-col items-center bg-gray-100">
      
      <h1 className="text-3xl font-bold text-gray-600 mb-6 text-center">
        AI Sign Language Generator
      </h1>

      {/* Instructions */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded w-full max-w-2xl mb-6">
        <h2 className="font-semibold mb-2">📌 Instructions</h2>
        <ul className="list-disc list-inside text-left">
          <li>Type any word to convert it into sign-language letters.</li>
          <li>Click <strong>Start Camera</strong> to enable hand tracking.</li>
          <li>Thumb + Index close = “Correct Sign”.</li>
        </ul>
      </div>

      {/* Input + Convert */}
      <div className="flex gap-2 mb-4">
        <input
          className="w-64 p-3 rounded-lg bg-gray-200 text-gray-900 placeholder-gray-600 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a word..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={handleConvert}
          className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded"
        >
          Convert
        </button>

        {/* Speak Button */}
        <button
          onClick={speakText}
          className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded"
        >
          🔊 Speak
        </button>
      </div>

      {/* Generated Sign Images */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {signImages.length > 0 ? (
          signImages.map((src, index) => (
            <img
              key={index}
              src={src}
              onError={(e) => (e.target.style.display = "none")}
              alt={`sign-${index}`}
              className="w-20 h-20 object-contain bg-gray-200 p-2 rounded-md"
            />
          ))
        ) : (
          <p className="text-gray-500">No signs to show yet</p>
        )}
      </div>

      {/* Webcam */}
      <div className="flex flex-col items-center">
        {cameraOn && (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              mirrored
              style={{ width: 320, height: 240 }}
            />

            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0"
              width={320}
              height={240}
            />
          </div>
        )}

        <button
          onClick={() => setCameraOn((prev) => !prev)}
          className="mt-4 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
        >
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      {/* Feedback */}
      <p className="mt-4 text-xl font-bold">{feedback}</p>

      {/* Accuracy */}
      <p className="text-lg mt-2 text-gray-700">
        Accuracy: <strong>{accuracy}%</strong>
      </p>
    </div>
  );
}

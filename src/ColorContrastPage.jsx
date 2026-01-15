import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Prism from "./components/Prism"; // your Prism component

export default function ColorContrastChecker() {
  const [foreground, setForeground] = useState("#963131");
  const [background, setBackground] = useState("#cfb9b9");
  const [contrastRatio, setContrastRatio] = useState(21);

  const [wcag, setWcag] = useState({
    normalText: false,
    largeText: false,
    enhanced: false,
  });

  useEffect(() => {
    const fg = parseInt(foreground.slice(1), 16);
    const bg = parseInt(background.slice(1), 16);

    const getLuminance = (c) => {
      const r = (c >> 16) & 0xff;
      const g = (c >> 8) & 0xff;
      const b = c & 0xff;
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };

    const L1 = getLuminance(fg);
    const L2 = getLuminance(bg);
    const ratio =
      L1 > L2 ? (L1 + 0.05) / (L2 + 0.05) : (L2 + 0.05) / (L1 + 0.05);

    setContrastRatio(ratio.toFixed(2));

    // WCAG rules
    setWcag({
      normalText: ratio >= 4.5, // AA for normal text
      largeText: ratio >= 3.0, // AA for large text
      enhanced: ratio >= 7.0, // AAA
    });
  }, [foreground, background]);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Foreground: ${foreground}, Background: ${background}`
    );
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Prism Background */}
      <div className="absolute inset-0 z-0">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.5}
          glow={1}
        />
      </div>

      {/* Page Content */}
      <div className="relative z-10 flex flex-col items-center p-6">
        <Toaster position="top-right" reverseOrder={false} />
        <h1 className="text-4xl font-bold text-gray-400 mb-6">
          Color Contrast Checker
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Upload any document and let our AI make it accessible with text
          extraction and audio narration.
        </p>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Color Pickers */}
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-gray-400">
              Foreground Color
            </h2>
            <input
              type="color"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="w-full h-12 rounded"
            />

            <h2 className="text-xl font-semibold text-gray-400 mt-4">
              Background Color
            </h2>
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full h-12 rounded"
            />

            <button
              onClick={handleCopy}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg transition"
            >
              Copy Colors
            </button>
          </div>

          {/* Live Preview */}
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md shadow-lg flex flex-col space-y-4">
            <p className="text-xl text-gray-400">Live Preview:</p>
            <div
              className="w-full p-6 rounded transition"
              style={{ backgroundColor: background, color: foreground }}
            >
              <h2 className="text-2xl font-bold">Sample Heading</h2>
              <p>
                This is a sample paragraph demonstrating how your chosen colors
                look together. The text should be easily readable against the
                background.
              </p>
              <p className="text-lg font-semibold mt-2">Large Text Example</p>
              <p className="text-sm">
                Small text should also maintain sufficient contrast for
                accessibility compliance.
              </p>
              <button
                style={{
                  backgroundColor: background,
                  color: foreground,
                  border: `1px solid ${foreground}`,
                }}
                className="mt-4 px-4 py-2 rounded-lg"
              >
                Button Example
              </button>
              <a href="#" style={{ color: foreground }} className="ml-4">
                Link Example
              </a>
            </div>

            {/* Contrast Info */}
            <div className="text-center">
              <p
                className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
                  contrastRatio >= 4.5 ? "bg-green-600" : "bg-red-600"
                }`}
              >
                Contrast Ratio: {contrastRatio}:1
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4 text-gray-400 text-sm">
                <p>
                  Normal Text:{" "}
                  {wcag.normalText ? (
                    <span className="text-green-400">✔ Pass</span>
                  ) : (
                    <span className="text-red-400">✘ Fail</span>
                  )}
                </p>
                <p>
                  Large Text:{" "}
                  {wcag.largeText ? (
                    <span className="text-green-400">✔ Pass</span>
                  ) : (
                    <span className="text-red-400">✘ Fail</span>
                  )}
                </p>
                <p>
                  Enhanced (AAA):{" "}
                  {wcag.enhanced ? (
                    <span className="text-green-400">✔ Pass</span>
                  ) : (
                    <span className="text-red-400">✘ Fail</span>
                  )}
                </p>
              </div>

              {/* Suggestions */}
              {!wcag.normalText && (
                <div className="mt-4 text-xs text-gray-400">
                  <p>Suggestions:</p>
                  <ul className="list-disc list-inside">
                    <li>
                      Try darkening the foreground or lightening the background
                    </li>
                    <li>Consider using high-contrast color combinations</li>
                    <li>
                      Test with users who have visual impairments for best
                      results
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Aurora from './components/Aurora.jsx';
import BlurText from './components/BlurText.jsx';
import Carousel from './components/Carousel.jsx';
import Prism from './components/Prism.jsx';
import { supabase } from "./supabaseClient.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login.jsx";
import Analyze from "./Analyze.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ColorContrastPage from "./ColorContrastPage.jsx";
import SignLanguage from "./SignLanguage.jsx";
import toast, { Toaster } from "react-hot-toast";
import SignCollector from "./SignCollector.jsx";
import './App.css';

function App() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState(null); 


  useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setUser(data.user));

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
  });

  return () => listener.subscription.unsubscribe();
}, []);



  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };

  // ✅ Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadedFile(file);
  };

  // ✅ Upload function
  const uploadFile = async (file) => {
    if (!file) {
      setUploadMessage("⚠️ Please select a file first.");
      return;
    }

    try {
      // Log file details for debugging
      console.log("Uploading file:", file.name, file.size, file.type);

      // 1️⃣ Get session & user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const userId = session?.user?.id;
      if (!userId) throw new Error("⚠️ You must be logged in to upload files");

      const safeFileName = encodeURIComponent(file.name);

      // 2️⃣ Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("uploads")
        .upload(`myfiles/${safeFileName}`, file, { upsert: true });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw storageError;
      }

      console.log("✅ File uploaded:", storageData);
      setUploadMessage("✅ File uploaded successfully!");

      // 3️⃣ Insert row into your table (RLS-compatible)
        const insertData = {
              name: file.name,               // <-- column 'name'
              path: `myfiles/${safeFileName}`,  // <-- column 'path'
              user_id: userId,               // <-- required for RLS
              status: "Not Started",         // <-- optional
            };

        console.log("DEBUG INSERT:", insertData);

        const {data: dbData, error: dbError} = await supabase
        .from("uploads_metadata") // your table name
        .insert([insertData])
        .select()
        .single();
            

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }
      console.log("✅ Row inserted in uploads_metadata table:", dbData);

      // 4️⃣ Generate a public URL for the uploaded file
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("uploads")
        .getPublicUrl(`myfiles/${safeFileName}`);

      if (urlError) throw urlError;
      console.log("📂 Public URL:", publicUrlData.publicUrl);

      // 5️⃣ Redirect to analyze page with file URL
      navigate("/analyze", { state: { fileUrl: publicUrlData.publicUrl } });

    } catch (error) {
      console.error("Upload failed:", error); // log the full error object
      const message = error?.message || error?.statusText || JSON.stringify(error);
      setUploadMessage("❌ Upload failed: " + message);
    }
  };

  // ✅ Handle upload button click
  const handleUpload = () => {
    if (uploadedFile) {
      uploadFile(uploadedFile);
    } else {
      setUploadMessage("⚠️ No file selected.");
    }
  };
  return (
    <div className="relative min-h-screen w-screen bg-black text-white">
      {/* Aurora Background */}
      <Aurora
        colorStops={["#a3e635", "#c084fc", "#6366f1"]}
        blend={0.5}
        amplitude={4.5}
        speed={1.0}
      />
      {/* Top Navigation */}
      <header className="absolute top-0 left-0 w-full px-10 py-6 flex items-center justify-between z-20">
        <div className="flex-1 text-center hidden md:flex justify-center gap-10 font-medium text-white text-lg">
          <a href="#features" className="hover:text-green-400 transition">Features</a>
          <a href="#tools" className="hover:text-purple-400 transition">Tools</a>
          <a href="#about" className="hover:text-blue-400 transition">About</a>
        </div>
        <div className="flex gap-4">
          {!user ? (
            <button
              className="bg-transparent border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-black transition"
              onClick={() => navigate("/login")}
            >
               Sign In
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span>{user.email}</span>
              <button
                className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition"
                onClick={async () => await supabase.auth.signOut()}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      {/* Page Content */}
      <div className="relative z-10 flex flex-col items-start justify-start min-h-screen px-6 pt-12 gap-16 transition-all duration-700 ease-in-out">
        {/* Hero Section */}
        <section className="w-full bg-black">
          <BlurText
            text="Empowering Inclusion Through Intelligent Accessibility!"
            delay={150}
            animateBy="words"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-3xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg text-left"
          />
          <div className="flex flex-col md:flex-row items-start justify-start gap-10 flex-wrap">
            <p className="text-white text-lg md:text-xl max-w-md">
              Transform digital content into accessible experiences. Upload documents, check color contrast, and convert text to sign language - all in one unified platform.
            </p>
            <div className="w-full md:w-1/3 flex flex-row gap-4 justify-start">
              <button
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg"
                onClick={() => {
                  const element = document.getElementById("features");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Start Using Tools
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 font-semibold text-base text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                WCAG Compliant
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                AI-Powered
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
                Multilingual
              </span>
            </div>
          </div>
        </section>

        {/* Comprehensive Accessibility Tools */}
        <section id="features" className="w-full bg-gray-950 py-20 px-6 transition-colors duration-700">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Comprehensive Accessibility Tools</h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to make digital content accessible to everyone, powered by cutting-edge AI technology.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tool 1 */}
            <div className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-blue-600 mb-2">
                <path d="M192 64C156.7 64 128 92.7 128 128V512c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V234.5c0-17-6.7-33.3-18.7-45.3L386.7 82.7c-12-12-28.2-18.7-45.2-18.7H192zM453.5 240H360c-13.3 0-24-10.7-24-24V122.5L453.5 240z" />
              </svg>
              <h3 className="font-semibold text-xl mb-2">AI Document Reader</h3>
              <p className="mb-4">Upload PDFs, images, or text and get instant audio narration with accessible large text output.</p>
              <ul className="mb-4 space-y-2 text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                  OCR text extraction
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                  Natural voice synthesis
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                  Multiple language support
                </span>
              </ul>
            <button
              onClick={() => window.location.href="./analyze.jsx"}
              className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg"
            >
              Ai Document Reader
            </button>
            </div>
            {/* Tool 2 */}
            <div className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-purple-600 mb-2">
                <path d="M320 312C386.3 312 440 258.3 440 192S386.3 72 320 72 200 125.7 200 192s53.7 120 120 120zM290.3 368C191.8 368 112 447.8 112 546.3c0 16.4 13.3 29.7 29.7 29.7h356.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3H290.3z" />
              </svg>
              <h3 className="font-semibold text-xl mb-2">Sign Language Generator</h3>
              <p className="mb-4">Convert text into sign language video animations with AI-powered avatars for inclusive communication.</p>
              <ul className="mb-4 space-y-2 text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-600 rounded-full"></span>
                  Animated avatars
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-600 rounded-full"></span>
                  Multiple sign languages
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-600 rounded-full"></span>
                  Real-time generation
                </span>
              </ul>
              <button
                onClick={() => navigate("/sign-language")}
                className="mt-auto bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg"
              >
                Sign Language Generator
              </button>
            </div>
            {/* Tool 3 */}
            <div className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-green-600 mb-2">
                <path d="M320 576C214 576 128 490 128 384c0-91.2 130.2-274.1 166.6-323.5C300.5 52.5 309.8 48 319.8 48h.4c10 0 19.3 4.5 25.2 12.5C381.8 109.9 512 292.8 512 384c0 106-86 192-192 192zM240 376c0-13.3-10.7-24-24-24s-24 10.7-24 24c0 75.1 60.9 136 136 136 13.3 0 24-10.7 24-24s-10.7-24-24-24c-48.6 0-88-39.4-88-88z" />
              </svg>
              <h3 className="font-semibold text-xl mb-2">Color Contrast Checker</h3>
              <p className="mb-4">Scan websites or images and get live WCAG compliance suggestions for perfect accessibility.</p>
              <ul className="mb-4 space-y-2 text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-600 rounded-full"></span>
                  WCAG analysis
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-600 rounded-full"></span>
                  Contrast ratio evaluation
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-600 rounded-full"></span>
                  Visual recommendations
                </span>
              </ul>
              <button 
                onClick={() => navigate("/contrast")}
                className="mt-auto bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg"
              >
              Ai-Check Contrast
              </button>
            </div>
          </div>
        </section>

        <div className="w-full bg-black py-20 px-6">
  
  {/* Section Title */}
  <h2 className="text-4xl font-bold text-white text-center mb-24">
    How It Works
  </h2>
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

    {/* Step 1 */}
    <div className="bg-gray-900 rounded-2xl p-8 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-blue-600 mb-2">
        <path d="M192 64C156.7 64 128 92.7 128 128V512c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V234.5c0-17-6.7-33.3-18.7-45.3L386.7 82.7c-12-12-28.2-18.7-45.2-18.7H192zM453.5 240H360c-13.3 0-24-10.7-24-24V122.5L453.5 240z" />
      </svg>
      <h3 className="text-2xl font-bold text-white mt-3 mb-4">
        AI Document Reader
      </h3>
      <p className="text-gray-300 mb-6">
        Upload PDFs, images, or text files. Our AI extracts content using OCR
        and converts it into clear, accessible audio narration.
      </p>
      <ul className="text-gray-400 space-y-2">
        <li>• Upload document</li>
        <li>• OCR text extraction</li>
        <li>• Voice & large-text output</li>
      </ul>
    </div>
    <div className="bg-gray-900 rounded-2xl p-8 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-purple-600 mb-2">
                <path d="M320 312C386.3 312 440 258.3 440 192S386.3 72 320 72 200 125.7 200 192s53.7 120 120 120zM290.3 368C191.8 368 112 447.8 112 546.3c0 16.4 13.3 29.7 29.7 29.7h356.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3H290.3z" />
      </svg>
      <h3 className="text-2xl font-bold text-white mt-3 mb-4">
        Sign Language Generator
      </h3>
      <p className="text-gray-300 mb-6">
        Enter text or speech and our AI instantly converts it into sign
        language animations using realistic avatars.
      </p>
      <ul className="text-gray-400 space-y-2">
        <li>• Input text or speech</li>
        <li>• AI sign conversion</li>
        <li>• Real-time avatar animation</li>
      </ul>
    </div>
    <div className="bg-gray-900 rounded-2xl p-8 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-green-600 mb-2">
        <path d="M320 576C214 576 128 490 128 384c0-91.2 130.2-274.1 166.6-323.5C300.5 52.5 309.8 48 319.8 48h.4c10 0 19.3 4.5 25.2 12.5C381.8 109.9 512 292.8 512 384c0 106-86 192-192 192zM240 376c0-13.3-10.7-24-24-24s-24 10.7-24 24c0 75.1 60.9 136 136 136 13.3 0 24-10.7 24-24s-10.7-24-24-24c-48.6 0-88-39.4-88-88z" />
      </svg>
      <h3 className="text-2xl font-bold text-white mt-3 mb-4">
        Color Contrast Checker
      </h3>
      <p className="text-gray-300 mb-6">
        Scan websites or images to analyze color contrast and receive WCAG
        accessibility recommendations instantly.
      </p>
      <ul className="text-gray-400 space-y-2">
        <li>• Upload image / URL</li>
        <li>• WCAG contrast analysis</li>
        <li>• Accessibility suggestions</li>
      </ul>
    </div>

  </div>
</div>

        {/* Try Our AI Document Reader */}
      <section id="tools" className="w-full bg-gray-900 text-white py-20 px-6 transition-all duration-700">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Try Our AI Document Reader</h2>
          <p className="text-lg text-gray-300">
            Upload any document and let our AI make it accessible with text extraction and audio narration.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg p-8 shadow-lg text-gray-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 fill-current text-blue-500">
              <path d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z" />
            </svg>
            Document Upload
          </h3>

          <label
            htmlFor="file-upload"
            className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center text-gray-600 mb-6 cursor-pointer hover:border-blue-500 transition relative flex flex-col items-center"
          >
            <div className="text-6xl text-blue-500 mb-2">+</div>
            <p className="text-lg">Drop your document here or <span className="text-blue-500 underline">browse files</span></p>
            <p className="text-sm mt-2 text-gray-500">Supports PDF, images (JPG, PNG, WebP), and text files</p>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {/* Upload Button goes here */}
          <button
            onClick={handleUpload}
            className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg mb-4"
          >
            Upload
          </button>

          <div className="upload-feedback w-full">
            {uploadMessage && <p className="text-green-600 text-sm mb-2">{uploadMessage}</p>}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {uploadedFile && (
              <div className="mt-4 p-4 bg-gray-200 rounded text-black text-sm">
                <p><strong>Uploaded:</strong> {uploadedFile.name}</p>
                <a
                  href={uploadedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Download / View
                </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mt-6">
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-1 text-purple-600">OCR</h4>
              <p className="text-sm text-gray-700">Text Extraction</p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-1 text-green-600">TTS</h4>
              <p className="text-sm text-gray-700">Audio Narration</p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-1 text-blue-600">AI</h4>
              <p className="text-sm text-gray-700">Smart Processing</p>
            </div>
          </div>
        </div>
      </section>


        {/* Footer with Map & Address */}
        <footer id="about" className="w-full bg-gray-950 text-white py-16 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Google Map */}
            <div className="w-full h-64 md:h-72 rounded-lg overflow-hidden shadow-lg">
              <iframe
                title="Company Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3931.115073086818!2d77.54371277480496!3d9.175039288071366!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06d6cd14e7b019%3A0x96f083ab64a3b0b0!2sTirupathi%20Srinivasa%20Garden%2C%20Sankarankovil%2C%20Tamil%20Nadu%20627756!5e0!3m2!1sen!2sin!4v1694019245635!5m2!1sen!2sin"
                width="100%"
                height="100%"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            {/* Address and Links */}
            <div className="flex flex-col justify-start gap-6">
              <div>
                <h4 className="text-xl font-bold mb-2">Our Location</h4>
                <p className="text-gray-300 leading-relaxed">
                  235/12, Tirupathi Srinivasa Garden,<br />
                  Sankarankovil - 627756,<br />
                  Tenkasi District, Tamil Nadu, India.
                </p>
              </div>

              <div className="flex flex-col gap-2 text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition">About Us</a>
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                <a href="#" className="hover:text-white transition">Terms & Conditions</a>
                <a href="#" className="hover:text-white transition">Support</a>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} All Rights Reserved | Built with ❤️ by NeuraNova
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

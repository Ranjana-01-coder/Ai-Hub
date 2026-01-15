import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import PrismaticBurst from "./components/PrismaticBurst.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("✅ Account created successfully!");
      setTimeout(() => navigate("/login"), 1000);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Shader background */}
      <PrismaticBurst
        intensity={2}
        speed={0.5}
        animationType="rotate3d"
        mixBlendMode="lighten"
        colors={["#ff0040", "#00ffff", "#ffcc00"]}
        distort={0}
        rayCount={0}
      />

      {/* Glassmorphic signup form */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <form className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/30 p-10 rounded-3xl shadow-2xl w-full max-w-md text-white">
          <h2 className="text-4xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-400 to-blue-400 animate-gradient-x">
            Sign Up
          </h2>

          <label className="block mb-4">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-2 p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all backdrop-blur-sm"
              required
            />
          </label>

          <label className="block mb-4">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-2 p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all backdrop-blur-sm"
              required
            />
          </label>

          <label className="block mb-6">
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-2 p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all backdrop-blur-sm"
              required
            />
          </label>

          <button
            type="submit"
            onClick={handleSignup}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 shadow-lg transition-all transform hover:scale-105"
          >
            Sign Up
          </button>

          {message && (
            <p
              className={`mt-6 text-center ${
                message.startsWith("❌") ? "text-red-400" : "text-green-400"
              } font-medium`}
            >
              {message}
            </p>
          )}

          <p className="mt-4 text-center text-gray-300 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-pink-400 hover:underline cursor-pointer"
            >
              Sign In
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({ message: "Server error" }));

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        const isFirstTime = data.login_count === 1;
        const greetingBase = isFirstTime ? "Welcome to" : "Welcome back to";
        const userDisplay =
          data.role === "Head" ? `Head ${data.username}` : data.username;
        const finalMessage = `${greetingBase} ${data.dept}, ${userDisplay}!`;

        // Updated Swal block with Redirection Logic
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Login Successful!",
          text: finalMessage,
          timer: 2000, // 2 seconds para mabilis ang transition
          showConfirmButton: false,
        }).then(() => {
          router.push("/dashboard");
        });
      } else {
        throw new Error(data.message || "Invalid username or password");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.message || "Failed to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-bold text-green-900 mb-2 ml-1"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
          placeholder="Enter your username"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-bold text-green-900 mb-2 ml-1"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors flex items-center justify-center h-full"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Login Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`relative w-full py-4 rounded-xl text-green-950 font-black text-lg transition-all shadow-md active:scale-95 overflow-hidden group border-b-4 border-yellow-700 uppercase tracking-wider ${
            loading
              ? "bg-gray-400 border-gray-500 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-400"
          }`}
        >
          {!loading && (
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
          )}
          <span className="relative z-10">
            {loading ? "Logging in..." : "Login"}
          </span>
        </button>
      </div>

      {/* Register Link */}
      <Link
        href="/register"
        className="block w-full py-3 text-center text-green-700 hover:text-yellow-600 font-bold transition-colors text-sm mt-4"
      >
        Create a new account
      </Link>
    </form>
  );
}
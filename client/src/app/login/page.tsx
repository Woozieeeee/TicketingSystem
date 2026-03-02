"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { API_URL } from "../../config/api";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
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

        const isFirstTime = data.login_count === 1;
        const greetingBase = isFirstTime ? "Welcome to" : "Welcome back to";
        const userDisplay =
          data.role === "Head" ? `Head ${data.username}` : data.username;
        const finalMessage = `${greetingBase} ${data.dept}, ${userDisplay}!`;

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Login Successful!",
          text: finalMessage,
          timer: 3000,
          showConfirmButton: false,
        });

        router.push("/dashboard");
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
    <div className="min-h-screen bg-gray-50 py-[80px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                required={true}
                suppressHydrationWarning
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  suppressHydrationWarning
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none transition-colors flex items-center justify-center h-full"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm mt-4"
            >
              Create a new account
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

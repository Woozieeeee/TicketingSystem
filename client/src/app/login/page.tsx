"use client"; // Marks as Client Component

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Swal from "sweetalert2";

export default function Login() {
  // State: Login credentials
  const [form, setForm] = useState({ username: "", password: "" });
  // State: Loading status
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Function para sa pag-login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Huwag muna nating i-refresh 'yung page
    setLoading(true); // Pakita muna nating naglo-load na

    try {
      // Send natin 'yung login details sa server
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        // Pag pumasok, kunin natin 'yung user data
        const user = await res.json();

        // I-save muna natin sa browser para hindi na kailangan mag-login ulit
        localStorage.setItem("user", JSON.stringify(user));

        // Magpakita ng success message gamit ang SweetAlert2
        await Swal.fire({
          icon: "success",
          title: "Login Successful!",
          text: `Welcome back, ${user.username}!`,
          timer: 2000,
          showConfirmButton: false,
        });

        // Lipat na tayo sa Dashboard!
        router.push("/dashboard");
      } else {
        // Pag mali 'yung info, sabihan natin si user
        const data = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: data.message || "Invalid credentials",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Failed to connect to server",
      });
    } finally {
      setLoading(false); // Tapos na 'yung loading, pwede na ulit mag-click
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={null} />
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Field */}
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
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              required
            />
          </div>

          {/* Submit Button */}
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

          {/* Register Link */}
          <Link
            href="/register"
            className="block w-full py-3 text-center text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Create a new account
          </Link>
        </form>
      </div>
    </div>
  );
}

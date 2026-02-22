"use client"; // Indicates Client Component for interactivity

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function Register() {
  // State: Form input values
  const [form, setForm] = useState({
    username: "",
    password: "",
    department: "",
  });

  // State: Submission status to prevent double-clicks
  const [submitting, setSubmitting] = useState(false);

  // Router for navigation
  const router = useRouter();

  // Dito tayo magrerehistro ng bagong account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Huwag muna nating i-refresh 'yung page
    setSubmitting(true); // I-disable muna 'yung button para iwas double-click

    try {
      // Send natin 'yung registration details sa server
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // Check natin kung may error ba sa pag-register
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: data.message || res.statusText,
        });
        return;
      }

      // Pag okay na ang lahat, sabihan si user
      const data = await res.json();
      await Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: `Successfully registered as ${data.role}!`,
        timer: 2000,
        showConfirmButton: false,
      });
      router.push("/login"); // Lipat na tayo sa login page para makapasok
    } catch (error) {
      console.error("Registration error:", error);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Failed to connect to server",
      });
    } finally {
      setSubmitting(false); // I-enable na ulit natin 'yung button
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Centered Registration Form Container */}
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Register
        </h1>
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Username Input */}
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
              suppressHydrationWarning // Add this to prevent the error in image_e9eddd
            />
          </div>

          {/* Password Input */}
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
              suppressHydrationWarning
              required
            />
          </div>

          {/* Department Input */}
          <div>
            <label
              htmlFor="department"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Department
            </label>
            <input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. IT"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              suppressHydrationWarning
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "Registering..." : "Register"}
          </button>

          {/* Login Link */}
          <Link
            href="/login"
            className="block w-full py-3 text-center text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Already have an account? Login here
          </Link>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function Register() {
  // Updated state: using 'dept' to match your MySQL column name
  const [form, setForm] = useState({
    username: "",
    password: "",
    dept: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.role === "Head") {
          // 🌟 Special Message for the Department Head
          await Swal.fire({
            icon: "success",
            title: "Department Created!",
            text: `You are the first member of ${data.dept}. You have been successfully registered as the Department Head.`,
            confirmButtonColor: "#15803d",
          });
        } else {
          // Standard message for normal users
          await Swal.fire({
            icon: "success",
            title: "Registration Successful",
            text: `Welcome to the ${data.dept} department!`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
        router.push("/login");
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Oops...", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Create Account
        </h1>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Department
            </label>
            <input
              id="department"
              type="text"
              placeholder="e.g. IT, HR, Billing"
              value={form.dept}
              onChange={(e) => setForm({ ...form, dept: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              required
              suppressHydrationWarning
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "Processing..." : "Register Now"}
          </button>

          <Link
            href="/login"
            className="block w-full py-3 text-center text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Already have an account? Login
          </Link>
        </form>
      </div>
    </div>
  );
}

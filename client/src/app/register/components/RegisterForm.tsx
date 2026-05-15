"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/api";
import FormInput from "./FormInput";
import CategorySelector from "./CategorySelector";

export default function RegisterForm() {
  const [form, setForm] = useState({ username: "", password: "", dept: "" });
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const departmentData = {
    "Administrative & Support": ["Information and Technology Office", "Human Resource Office", "Marketing and Scholarship Office", "Finance and Accounting Office", "Registrar's Office", "Learning Resource Center", "External and Alumni Relations Office", "Quality Management and Planning Office", "Student Affairs and Services Office", "Other Admin Support"],
    "Basic Education": ["Grade School", "Junior High School", "Senior High School"],
    "Higher Education & Professional Schools": ["College of Law", "Graduate School", "College of Accountancy", "College of Arts & Sciences", "College of Business Management", "College of Computer Studies", "College of Education", "College of Nursing", "College of Physical Therapy", "College of Radiologic Technology"],
    "General & Auxiliary Services": ["Security Office", "Maintenance & Janitorial", "General Facilities", "Canteen Services"],
  };

  const getStrength = (password: string) => {
    if (password.length === 0) return { width: "0%", color: "bg-transparent", textColor: "text-transparent", label: "" };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLongEnough = password.length >= 8;
    const score = [hasUpper, hasLower, hasNumber, isLongEnough].filter(Boolean).length;
    if (score <= 1) return { width: "25%", color: "bg-red-500", textColor: "text-red-500", label: "Weak — need 8+ chars, uppercase, lowercase, number" };
    if (score <= 2) return { width: "50%", color: "bg-orange-500", textColor: "text-orange-500", label: "Fair — still missing requirements" };
    if (score === 3) return { width: "75%", color: "bg-yellow-500", textColor: "text-yellow-500", label: "Almost — one more requirement" };
    return { width: "100%", color: "bg-green-500", textColor: "text-green-600", label: "Strong" };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.role === "Head") {
          await Swal.fire({ icon: "success", title: "Department Created!", text: `You are the first member of ${data.dept}. You have been registered as the Department Head.`, confirmButtonColor: "#15803d" });
        } else {
          await Swal.fire({ icon: "success", title: "Registration Successful", text: `Welcome to the ${data.dept} department!`, timer: 2000, showConfirmButton: false });
        }
        router.push("/login");
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      const details = error.details ? `\n${error.details.join("\n")}` : "";
      Swal.fire({ icon: "error", title: "Oops...", text: error.message + details });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <FormInput 
        form={form} 
        setForm={setForm} 
        showPassword={showPassword} 
        setShowPassword={setShowPassword} 
        strength={getStrength(form.password)} 
      />
      
      <CategorySelector 
        category={category} 
        setCategory={setCategory} 
        form={form} 
        setForm={setForm} 
        departmentData={departmentData} 
      />

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={`relative w-full py-4 rounded-xl text-green-950 font-black text-lg transition-all shadow-md active:scale-95 overflow-hidden group border-b-4 border-yellow-700 uppercase tracking-wider ${
            submitting ? "bg-gray-400 border-gray-500 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-400"
          }`}
        >
          {!submitting && (
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
          )}
          <span className="relative z-10">{submitting ? "Processing..." : "Register Now"}</span>
        </button>
      </div>

      <Link
        href="/login"
        className="block w-full py-3 text-center text-green-700 hover:text-yellow-600 font-bold transition-colors text-sm mt-4"
      >
        Already have an account? Login
      </Link>
    </form>
  );
}
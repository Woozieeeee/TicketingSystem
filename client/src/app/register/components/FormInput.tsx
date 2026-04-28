"use client";

import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function FormInput({ form, setForm, showPassword, setShowPassword, strength }: any) {
  return (
    <>
      {/* Username */}
      <div>
        <label className="block text-sm font-bold text-green-900 mb-2 ml-1">Username</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
          placeholder="Choose a username"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-bold text-green-900 mb-2 ml-1">Password</label>
        <div className="relative">
          <input
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

        {/* Strength Meter */}
        <div className="mt-3 px-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Security Level</span>
            <span className={`text-[10px] font-bold uppercase transition-colors duration-300 ${strength.textColor}`}>
              {strength.label}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: strength.width }}
              className={`h-full ${strength.color} transition-all duration-500`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
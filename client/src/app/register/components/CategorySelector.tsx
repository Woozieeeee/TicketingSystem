"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function CategorySelector({ category, setCategory, form, setForm, departmentData }: any) {
  return (
    <>
      {/* Main Category Selection */}
      <div>
        <label className="block text-sm font-bold text-green-900 mb-2 ml-1">Main Category</label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setForm({ ...form, dept: "" });
            }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all outline-none text-gray-900 appearance-none cursor-pointer"
            required
          >
            <option value="" disabled>Select Category</option>
            {Object.keys(departmentData).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Specific Department Selection */}
      <motion.div
        initial={false}
        animate={{ opacity: category ? 1 : 0.5 }}
      >
        <label className="block text-sm font-bold text-green-900 mb-2 ml-1">Specific Department</label>
        <div className="relative">
          <select
            value={form.dept}
            onChange={(e) => setForm({ ...form, dept: e.target.value })}
            disabled={!category}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all outline-none text-gray-900 appearance-none cursor-pointer disabled:cursor-not-allowed"
            required
          >
            <option value="" disabled>Select a department</option>
            {category && (departmentData as any)[category].map((d: string) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={20} />
          </div>
        </div>
      </motion.div>
    </>
  );
}
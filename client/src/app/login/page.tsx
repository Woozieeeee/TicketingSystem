"use client";

import { motion } from "framer-motion";
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        {/* Solid White Card with subtle shadow */}
        <div className="bg-white py-10 px-6 shadow-xl border border-gray-100 sm:rounded-3xl sm:px-10">
          <LoginHeader />
          <LoginForm />
        </div>
      </motion.div>
    </div>
  );
}

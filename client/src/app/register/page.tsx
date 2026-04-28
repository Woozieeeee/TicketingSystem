"use client";
import { motion } from "framer-motion";
import RegisterHeader from "./components/RegisterHeader";
import RegisterForm from "./components/RegisterForm";
export default function Register() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-10 px-6 shadow-xl border border-gray-100 sm:rounded-3xl sm:px-10">
          <RegisterHeader />
          <RegisterForm />
        </div>
      </motion.div>
    </div>
  );
}
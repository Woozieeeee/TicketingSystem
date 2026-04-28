"use client";

export default function RegisterHeader() {
  return (
    <>
      <div className="flex justify-center mb-6">
        <img
          src="/spc-logo.jpg"
          alt="SPC Logo"
          className="h-24 w-24 rounded-full border-2 border-green-700 object-cover"
        />
      </div>

      <h1 className="text-2xl font-bold text-center text-green-800 mb-8 uppercase tracking-widest">
        Create Account
      </h1>
    </>
  );
}
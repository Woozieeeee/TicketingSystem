"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  user: {
    username: string;
    role: string;
    dept: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <nav
      className="z-999 text-white shadow-md border-b border-gray-200 px-6 py-4 flex justify-between items-center relative"
      style={{ backgroundColor: "#15803d" }}
    >
      {/* Logo / Title */}
      <div className="flex text-white items-center">
        <h1
          className="text-xl font-bold tracking-tight cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          Ticketing System
        </h1>
      </div>
    </nav>
  );
}

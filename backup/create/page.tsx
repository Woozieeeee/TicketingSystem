"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function CreateTicketPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentCategories = {
    IT: ["Network", "Hardware", "Software", "Account Reset"],
    GASO: ["Cleaning", "Electrical", "Plumbing", "Carpentry"],
    Nursing: ["Patient Care", "Medication", "Equipment", "Facility"],
    General: ["Concern", "Message", "Question", "Other"],
  };

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    // Priority is no longer in the form state as it's automatic
  });

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const defaultCat =
        departmentCategories[
          parsedUser.dept as keyof typeof departmentCategories
        ]?.[0] || "Other";
      setFormData((prev) => ({ ...prev, category: defaultCat }));
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!mounted || !user) return <div className="min-h-screen bg-gray-50" />;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "PENDING",
          userId: user.id,
          dept: user.dept,
          date: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Ticket created successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/tickets");
      } else {
        throw new Error("Failed to create ticket");
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while creating the ticket",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-3xl mx-auto py-12 px-4 ">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center space-x-4 ">
          <div
            className={`h-2 w-24 rounded-full ${step >= 1 ? "bg-green-600" : "bg-gray-200"}`}
          />
          <div
            className={`h-2 w-24 rounded-full ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`}
          />
        </div>

        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-green-600 px-8 py-6">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {step === 1 ? "New Support Request" : "Confirm Your Details"}
            </h1>
            <p className="text-blue-100 text-sm mt-1">Step {step} of 2</p>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="space-y-10"
              >
                {/* Category Selection - Dropdown */}
                <section>
                  <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 block">
                    1. Select Category
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all p-4 outline-none border appearance-none cursor-pointer"
                    >
                      {(
                        departmentCategories[
                          user.dept as keyof typeof departmentCategories
                        ] || departmentCategories.General
                      ).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Subject & Description */}
                <section className="space-y-5">
                  <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider block border-b pb-2">
                    2. Ticket Information
                  </label>

                  <div>
                    <label
                      htmlFor="title"
                      className="block text-xs font-bold text-gray-500 mb-1 ml-1"
                    >
                      SUBJECT TITLE
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all p-4 outline-none border"
                      placeholder="Enter a brief summary..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-xs font-bold text-gray-500 mb-1 ml-1"
                    >
                      DETAILED DESCRIPTION
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      required
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full rounded-xl border-solid border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all p-4 "
                      placeholder="Explain the issue in detail..."
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      width: "100%",
                      gap: "1rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => router.back()}
                      style={{ width: "auto" }}
                      className="!w-fit min-w-[120px] px-8 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition "
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{ width: "auto" }}
                      className="!w-fit min-w-[140px] px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Create Ticket"}
                    </button>
                  </div>
                </section>
              </form>
            ) : (
              /* Review Section - Enhanced Spacing */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                  <p className="text-sm font-semibold text-blue-800 flex items-center">
                    Reviewing {user.dept} Request
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Subject - Takes up 2 columns on medium screens */}
                  <div className="md:col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Subject
                    </h3>
                    <p className="text-xl font-extrabold text-gray-900 leading-tight">
                      {formData.title}
                    </p>
                  </div>

                  {/* Status - Takes up 1 column and centers the content */}
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Initial Status
                    </h3>
                    <span className="px-4 py-2 rounded-full text-xs font-black uppercase bg-yellow-500 text-white">
                      Pending
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
                  <div className="flex justify-between items-center mb-4 border-b pb-4 border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      Description Details
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                      Category: {formData.category}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-loose text-lg whitespace-pre-wrap">
                    {formData.description || "No details provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-gray-900 font-bold text-sm flex items-center gap-2 transition"
                    disabled={isSubmitting}
                  >
                    ← Back to Edit
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-12 py-4 rounded-xl text-white font-bold transition-all shadow-xl active:scale-95 ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Confirm & Send Ticket"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

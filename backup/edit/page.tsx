"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Swal from "sweetalert2";

// 1. Separate the logic into a child component
function EditTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // Get ID from ?id=...
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    priority: "High",
  });

  const departmentCategories = {
    IT: ["Network", "Hardware", "Software", "Account Reset"],
    GASO: ["Cleaning", "Electrical", "Plumbing", "Carpentry"],
    Nursing: ["Patient Care", "Medication", "Equipment", "Facility"],
    General: ["Concern", "Message", "Question", "Other"],
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      if (id) {
        fetchTicketData();
      }
    } else {
      router.push("/login");
    }
  }, [id]);

  useEffect(() => {
    // Ensure textarea height matches content after formData changes (including initial load)
    const ta = textareaRef.current;
    if (ta) {
      // use a timeout to allow the DOM to update with the new value first
      setTimeout(() => {
        ta.style.height = "auto";
        // set to scrollHeight (plus a small extra to avoid clipping)
        ta.style.height = `${ta.scrollHeight + 2}px`;
      }, 0);
    }
  }, [formData.description]);

  const fetchTicketData = async () => {
    try {
      if (!id) {
        // No id in query params — nothing to fetch
        setLoading(false);
        return;
      }

      // Try backend first
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`);

      if (res.ok) {
        const data = await res.json();

        // Match the keys exactly as they are saved in your Create page
        setFormData({
          category: data.category || "",
          title: data.title || "",
          description: data.description || "",
          priority: data.priority || "High",
        });
        return;
      }

      // If backend doesn't have the ticket (for example it lives only in localStorage),
      // try to find it in localStorage as a fallback so the edit page can still work.
      if (res.status === 404) {
        const local = localStorage.getItem("myTickets");
        if (local) {
          const localTickets = JSON.parse(local);
          const match = localTickets.find(
            (t: any) => String(t.globalId) === String(id),
          );
          if (match) {
            setFormData({
              category: match.category || "",
              title: match.title || "",
              description: match.description || "",
              priority: match.priority || "High",
            });
            return;
          }
        }
        // Not found anywhere
        await Swal.fire(
          "Not found",
          "Ticket not found on server or in local data.",
          "error",
        );
        router.push("/tickets");
        return;
      }

      // Other non-ok responses
      console.warn("Failed to fetch ticket data (status:", res.status, ")");
    } catch (error) {
      console.error("Error fetching ticket:", error);
      await Swal.fire(
        "Error",
        "Could not fetch ticket data. Check your server.",
        "error",
      );
      router.push("/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height to recalculate
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scrollHeight
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedData = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      };

      const res = await fetch(`http://localhost:3001/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        // Get the updated ticket from the server (it includes lastUpdated)
        const updatedTicket = await res.json();

        // Update localStorage.myTickets so the client-side merged view reflects the edit immediately.
        try {
          const localRaw = localStorage.getItem("myTickets");
          const localTickets = localRaw ? JSON.parse(localRaw) : [];

          const idx = localTickets.findIndex(
            (t: any) => String(t.globalId) === String(updatedTicket.globalId),
          );

          // Preserve any local-only flags (userMarkedDone/headMarkedDone) when updating
          const localFlags =
            idx !== -1
              ? {
                  userMarkedDone: localTickets[idx].userMarkedDone,
                  headMarkedDone: localTickets[idx].headMarkedDone,
                }
              : {};

          const newLocalEntry = { ...updatedTicket, ...localFlags };

          if (idx !== -1) {
            localTickets[idx] = newLocalEntry;
          } else {
            localTickets.push(newLocalEntry);
          }

          localStorage.setItem("myTickets", JSON.stringify(localTickets));
        } catch (e) {
          console.warn("Could not update local myTickets:", e);
        }

        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Ticket changes saved successfully.",
          timer: 1200,
          showConfirmButton: false,
        });

        // Refresh and navigate back to the tickets list
        router.refresh();
        router.push("/tickets");
      }
    } catch (error) {
      Swal.fire("Error", "Could not update the ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Loading Ticket Data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="bg-green-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Edit Ticket #{id}</h1>
            <p className="text-blue-100 text-sm">
              Update your request details below
            </p>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 border outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(
                  departmentCategories[
                    user?.dept as keyof typeof departmentCategories
                  ] || departmentCategories.General
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Subject Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 border outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                Description
              </label>
              <textarea
                ref={textareaRef}
                name="description"
                required
                rows={1}
                value={formData.description}
                onChange={(e) => {
                  handleChange(e);
                  requestAnimationFrame(() => {
                    const ta = textareaRef.current;
                    if (ta) {
                      ta.style.height = "auto";
                      ta.style.height = `${ta.scrollHeight + 2}px`;
                    }
                  });
                }}
                className="rounded-xl border-gray-200 bg-gray-50 p-4 border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  minHeight: "120px",
                  width: "100%", // Forces full width of form
                  display: "block",
                  resize: "none", // Disables manual resize handle
                  overflow: "hidden", // Hides scrollbar as it grows
                  wordBreak: "break-all", // Forces character wrapping
                  whiteSpace: "pre-wrap",
                  boxSizing: "border-box", // Prevents padding from adding to width
                }}
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// 2. Wrap the whole thing in Suspense
export default function EditTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <EditTicketForm />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/api";
import { getAuthHeaders, getUser } from "../../../lib/apiClient";
import type { FormData, User } from "../types";

export function useEditTicket(
  isOpen: boolean,
  ticket: Record<string, any> | null,
  onClose: () => void,
  onSuccess: () => void,
) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormData>({
    category: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (isOpen && ticket) {
        const userData = await getUser();
        if (userData) setUser(userData);
        setFormData({
          title: ticket.title || "",
          description: ticket.description || "",
          category: ticket.category || "",
        });
      }
    };

    loadUser();
  }, [isOpen, ticket]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!ticket) return;
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.globalId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to update");

      onSuccess();
      onClose();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ticket Updated",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === "AbortError";
      Swal.fire({
        icon: "error",
        title: isTimeout ? "Server Timeout" : "Update Failed",
        text: isTimeout
          ? "Server took too long. Restart backend."
          : "Check server connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToChat = () => {
    router.push(user?.role === "Head" ? "/chat/adminChat" : "/chat/userChat");
  };

  return {
    mounted,
    isSubmitting,
    user,
    formData,
    handleChange,
    handleSubmit,
    goToChat,
  };
}

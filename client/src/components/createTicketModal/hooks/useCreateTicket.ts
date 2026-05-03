"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/api";
import type { FormData, User } from "../types";

export function useCreateTicket(
  isOpen: boolean,
  onClose: () => void,
  onSuccess: () => void,
) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
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

  // Restore draft on open
  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user:", error);
        }
      }

      const savedDraft = localStorage.getItem("ticket_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Draft restored",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (e) {
          console.error("Draft restore failed");
        }
      }
      setStep(1);
    }
  }, [isOpen]);

  // Auto-save draft as user types
  useEffect(() => {
    if (formData.title || formData.description || formData.category) {
      localStorage.setItem("ticket_draft", JSON.stringify(formData));
    }
  }, [formData]);

  const handleClearForm = () => {
    localStorage.removeItem("ticket_draft");
    setFormData({ category: "", title: "", description: "" });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Format date for MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
      const now = new Date();
      const mysqlDate = now.toISOString().slice(0, 19).replace("T", " ");

      const payload = {
        ...formData,
        status: "PENDING",
        userId: user?.id,
        createdBy: user?.username,
        dept: user?.dept,
        date: mysqlDate,
      };

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to create ticket");

      // Clear draft on success
      localStorage.removeItem("ticket_draft");
      setFormData({ category: "", title: "", description: "" });

      onSuccess();
      onClose();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ticket created successfully",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === "AbortError";

      Swal.fire({
        icon: "error",
        title: isTimeout ? "Server Timeout" : "Submission Failed",
        text: isTimeout
          ? "The server took too long to respond. Please restart your backend."
          : "Please check your server connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mounted,
    step,
    setStep,
    isSubmitting,
    user,
    formData,
    setFormData,
    handleClearForm,
    handleChange,
    handleSubmit,
  };
}

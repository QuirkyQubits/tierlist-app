import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // start fade in

    const hideTimer = setTimeout(() => setVisible(false), 2000); // start fade out after 2s
    const removeTimer = setTimeout(onClose, 3000); // remove after 3s total

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg flex items-center gap-2 text-sm font-medium
      transition-opacity duration-1000 ease-in-out
      ${visible ? "opacity-100" : "opacity-0"}
      ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
    >
      {type === "success" ? "✅" : "⚠️"} {message}
    </div>
  );
}

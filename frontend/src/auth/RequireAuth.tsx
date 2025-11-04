import type { JSX } from "react";
import { Navigate } from "react-router-dom";

export function RequireAuth({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: JSX.Element;
}) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

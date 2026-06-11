import React from "react";
import { Outlet } from "react-router-dom";
import { useRolePermissions } from "../hooks/useRolePermissions";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { Viewed } = useRolePermissions();

  if (Viewed === "0") {
    return (
      <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="content p-5 text-center shadow-sm rounded bg-white">
          <i className="ti ti-lock-off text-danger" style={{ fontSize: "3rem" }}></i>
          <h4 className="text-danger mt-3">Access Denied</h4>
          <p className="text-muted">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children ? children : <Outlet />}</>;
};

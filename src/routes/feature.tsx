import { Outlet, Navigate, useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/header/header";
import Sidebar from "../components/sidebar/sidebar";
import ThemeSettings from "../components/theme-settings/themeSettings";
import { useEffect, useState } from "react";
import { resetMobileSidebar } from "../core/redux/sidebarSlice";
import axios from "axios";
import { getFirstAccessibleRoute, hasPermission } from "../utils/permission";
import { getSidebarData } from "../components/sidebar/sidebarData";

const Feature = () => {
  const SidebarData = getSidebarData();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user =
    useSelector((state: any) => state.user.userData) ||
    JSON.parse(sessionStorage.getItem("userData") || "null");
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);
  const { miniSidebar, mobileSidebar, expandMenu } = useSelector(
    (state: any) => state.sidebarSlice
  );

  const dataLayout = themeSettings["data-layout"];
  const dataWidth = themeSettings["data-width"];
  const dataSize = themeSettings["data-size"];
  const dir = themeSettings["dir"];

  // ✅ Always run hooks first
  useEffect(() => {
    dispatch(resetMobileSidebar());
  }, [location.pathname, dispatch]);

  useEffect(() => {
    const syncPermissions = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";
        if (!user || !id) return;

        // 1. Sync Role
        const userData = JSON.parse(sessionStorage.getItem("userData") || "[]");
        const loggedInUsername = userData[0]?.UserID;
        if (!loggedInUsername) return;

        const loginRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetLogins`
        );
        const users = loginRes.data || [];
        const currentUser = users.find((u: any) => u.Mobile === loggedInUsername);

        let currentRole = localStorage.getItem("RoleName");
        if (currentUser) {
          currentRole = currentUser.Typed;
          localStorage.setItem("RoleName", currentUser.Typed);
          localStorage.setItem("UserName", currentUser.UserName);
          localStorage.setItem("ID", currentUser.ID);
        }

        // 2. Sync Permissions
        if (currentRole) {
          const permRes = await axios.post(
            `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=RolesDisplay`,
            { RoleName: currentRole }
          );
          localStorage.setItem("permissions", JSON.stringify(permRes.data || []));
        }
      } catch (error) {
        console.error("Auto-sync permissions failed:", error);
      }
    };

    syncPermissions();
  }, [location.pathname, user]);

  useEffect(() => {
    // 💡 Auto-redirect specifically for Dashboard access denial
    const checkDashboardAccess = () => {
      const isDashboardPath = location.pathname === "/financial-dashborad" ||
        location.pathname === "/material" ||
        location.pathname === "/";

      if (isDashboardPath && user) {
        const permissionsExist = localStorage.getItem("permissions");
        if (permissionsExist) {
          const hasFinancial = hasPermission("DashBoard", "Financial", "Viewed");
          const hasMaterial = hasPermission("DashBoard", "Material", "Viewed");

          if (!hasFinancial && !hasMaterial) {
            const firstRoute = getFirstAccessibleRoute(SidebarData);
            if (firstRoute && firstRoute !== location.pathname) {
              navigate(firstRoute, { replace: true });
            }
          }
        }
      }
    };

    // Delay slightly to allow permissions to load/sync if they haven't yet
    const timer = setTimeout(checkDashboardAccess, 300);
    return () => clearTimeout(timer);
  }, [location.pathname, user, navigate]);

  useEffect(() => {
    const handleCloseFilterClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains("close-filter-btn")) {
        const dropdownMenu = target.closest(".dropdown-menu");
        if (dropdownMenu) {
          dropdownMenu.classList.remove("show");
          const dropdownWrapper = dropdownMenu.closest(".dropdown");
          if (dropdownWrapper) {
            const toggleButton = dropdownWrapper.querySelector("[data-toggle]");
            if (toggleButton) {
              toggleButton.classList.remove("show");
            }
          }
        }
      }
    };
    document.addEventListener("click", handleCloseFilterClick);
    return () => {
      document.removeEventListener("click", handleCloseFilterClick);
    };
  }, []);

  // ✅ Now conditionally render AFTER hooks
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === "/Company-list") {
    return (
      <div className="main-wrapper">
        <Header width="100%" marginLeft="0" />
        <Outlet />
      </div>
    );
  }

  return (
    <div
      className={`
        ${miniSidebar || dataLayout === "mini" || dataSize === "compact" ? "mini-sidebar" : ""}
        ${(expandMenu && miniSidebar) || (expandMenu && dataLayout === "mini") ? "expand-menu" : ""}
        ${mobileSidebar ? "menu-opened slide-nav" : ""}
        ${dataWidth === "box" ? "layout-box-mode mini-sidebar" : ""}
        ${dir === "rtl" ? "layout-mode-rtl" : ""}
      `}
    >
      <div className="main-wrapper">
        <Header />
        <Sidebar />
        <Outlet />
        <ThemeSettings />
      </div>
      <div
        className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}
        onClick={() => dispatch(resetMobileSidebar())}
      ></div>
    </div>
  );
};

export default Feature;

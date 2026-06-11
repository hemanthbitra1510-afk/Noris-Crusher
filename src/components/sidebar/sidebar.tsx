import { useDispatch, useSelector } from "react-redux";
import { updateTheme } from "../../core/redux/themeSlice";
import { useEffect, useState } from "react";
import { setExpandMenu, setMobileSidebar } from "../../core/redux/sidebarSlice";
import { Link, useLocation, useNavigate } from "react-router";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { getSidebarData } from "./sidebarData";
import React from "react";
import { all_routes } from "../../routes/all_routes";
import NorisLogo from "../../assets/img/NorisLogo-removebg-preview.png";
import axios from "axios";

const Sidebar = () => {
  const SidebarData = getSidebarData();
  const route = all_routes;
  const Location = useLocation();
  const pathname = Location.pathname;
  const [permissions, setPermissions] = useState<any[]>([]);


  // 🔧 normalize helper (Standardized with permission.tsx)
  const normalize = (val: string) =>
    val?.toLowerCase().replace(/\s+/g, "").trim();

  const [roleName, setRoleName] = useState<string | null>(localStorage.getItem("RoleName"));
  const id = sessionStorage.getItem("selectedItems") ?? "";

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("userData") || "[]");
        const loggedInUsername = userData[0]?.UserID;

        if (!loggedInUsername || !id) return;

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetLogins`
        );

        const users = res.data || [];
        const user = users.find((u: any) => u.Mobile === loggedInUsername);

        if (user) {
          setRoleName(user.Typed);
          localStorage.setItem("RoleName", user.Typed);
          localStorage.setItem("UserName", user.UserName);
          localStorage.setItem("ID", user.ID);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [id]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.post(
          `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=RolesDisplay`,
          { RoleName: roleName }
        );

        // keep only viewable modules
        setPermissions(res.data || []);

        // ✅ store full permissions (important)
        localStorage.setItem("permissions", JSON.stringify(res.data || []));
      } catch (error) {
        console.error("Permission fetch error:", error);
      }
    };

    if (roleName && id) {
      fetchPermissions();
    }
  }, [roleName, id]);
  const [subsidebar, setSubsidebar] = useState("");


  // Track open state for each menu by label
  const [openMenus, setOpenMenus] = useState<{ [label: string]: boolean }>({});
  const dispatch = useDispatch();

  // On mount or pathname change, auto-open submenus with an active link
  useEffect(() => {
    const newOpenMenus: { [label: string]: boolean } = {};
    SidebarData.forEach((mainLabel) => {
      mainLabel.submenuItems?.forEach((title: any) => {
        // If any submenu link is active, open this menu
        const isActive =
          title.link === pathname ||
          (title.relatedRoutes && title.relatedRoutes.includes(pathname)) ||
          (title.submenuItems && title.submenuItems.some((item: any) =>
            item.link === pathname ||
            (item.relatedRoutes && item.relatedRoutes.includes(pathname)) ||
            (item.submenuItems && item.submenuItems.some((subitem: any) =>
              subitem.link === pathname ||
              (subitem.relatedRoutes && subitem.relatedRoutes.includes(pathname))
            ))
          ));
        if (isActive) {
          newOpenMenus[title.label] = true;
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
  }, [pathname]);

  // Toggle logic for main menus
  const handleMenuToggle = (label: string) => {
    setOpenMenus((prev) => {
      if (prev[label]) {
        return {};
      }

      return { [label]: true };
    });

    setSubsidebar("");
  };


  const toggleSubsidebar = (subitem: any) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };

  const handleClick = (label: any) => {
    handleMenuToggle(label);
  };

  const navigate = useNavigate();
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);

  const handleMiniSidebar = () => {
    const rootElement = document.documentElement;
    const isMini = rootElement.getAttribute("data-layout") === "mini";
    const updatedLayout = isMini ? "default" : "mini";
    dispatch(
      updateTheme({
        "data-layout": updatedLayout,
      })
    );
    if (isMini) {
      rootElement.classList.remove("mini-sidebar");
    } else {
      rootElement.classList.add("mini-sidebar");
    }
  };
  const onMouseEnter = () => {
    dispatch(setExpandMenu(true));
  };
  const onMouseLeave = () => {
    dispatch(setExpandMenu(false));
  };

  const handleLayoutClick = (layout: string) => {
    const layoutSettings: any = {
      "data-layout": "default",
      dir: "ltr",
    };

    switch (layout) {
      case "Default":
        layoutSettings["data-layout"] = "default";
        break;
      case "Hidden":
        layoutSettings["data-layout"] = "hidden";
        break;
      case "Mini":
        layoutSettings["data-layout"] = "mini";
        break;
      case "Hover View":
        layoutSettings["data-layout"] = "hoverview";
        break;
      case "Full Width":
        layoutSettings["data-layout"] = "full-width";
        break;
      case "Dark":
        layoutSettings["data-bs-theme"] = "dark";
        break;
      case "RTL":
        layoutSettings.dir = "rtl";
        break;
      default:
        break;
    }
    dispatch(updateTheme(layoutSettings));
    navigate("/dashboard");
  };
  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );
  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };
  useEffect(() => {
    const rootElement: any = document.documentElement;
    Object.entries(themeSettings).forEach(([key, value]) => {
      rootElement.setAttribute(key, value);
    });
    if (themeSettings["data-layout"] === "mini") {
      rootElement.classList.add("mini-sidebar");
    } else {
      rootElement.classList.remove("mini-sidebar");
    }
  }, [themeSettings]);

  const hasPermission = (main: string, sub: string) => {
    // 👑 OWNER OVERRIDE: Full access to everything
    if (normalize(roleName || "") === "owner") return true;

    const match = permissions.find(
      (p) =>
        normalize(p.MainModule) === normalize(main) &&
        normalize(p.SubModule) === normalize(sub)
    );

    if (!match) return true; // ✅ show if not in API

    return match.Viewed === "1";
  };

  const isModuleVisible = (parentLabel: string, item: any): boolean => {
    // Use moduleName if provided, otherwise fallback to label
    const targetSub = item?.moduleName || item?.label;
    const targetMain = item?.parentModuleName || parentLabel;

    if (!targetMain || !targetSub) return true;

    const allowed = hasPermission(targetMain, targetSub);
    if (!allowed) return false;

    // If it has submodules, at least one must be viewable
    if (item?.submenuItems && item.submenuItems.length > 0) {
      return item.submenuItems.some((sub: any) => isModuleVisible(targetSub, sub));
    }

    return true;
  };

  return (
    <>
      {/* Sidenav Menu Start */}
      <div
        className="sidebar"
        id="sidebar"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Start Logo */}
        <div className="sidebar-logo">
          <div className="d-flex justify-content-center">
            {/* Normal Sidebar */}
            <Link to={route.FinancialDashborad} className="logo logo-normal" >
              <img
                src={NorisLogo}
                alt="Logo"
                style={{ height: 36 }}
              />
            </Link>

            {/* Mini Sidebar */}
            <Link to={route.FinancialDashborad} className="logo-small">
              <img
                src={NorisLogo}
                alt="Logo"
                style={{ height: 32 }}
              />
            </Link>

            {/* Dark Mode */}
            <Link to={route.FinancialDashborad} className="dark-logo">
              <img
                src={NorisLogo}
                alt="Logo"
                style={{ height: 36 }}
              />
            </Link>
          </div>

          <button
            className="sidenav-toggle-btn btn border-0 p-0 active"
            id="toggle_btn"
            onClick={handleMiniSidebar}
          >
            <i className="ti ti-arrow-bar-to-left" />
          </button>
          {/* Sidebar Menu Close */}
          <button className="sidebar-close" onClick={toggleMobileSidebar}>
            <i className="ti ti-x align-middle" />
          </button>
        </div>
        {/* End Logo */}
        {/* Sidenav Menu */}

        <div className="sidebar-inner" data-simplebar="">
          <OverlayScrollbarsComponent style={{ height: "100%", width: "100%" }}>
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                {SidebarData
                  ?.filter((category) =>
                    category.submenuItems?.some((module: any) =>
                      isModuleVisible(category.tittle, module)
                    )
                  )
                  ?.map((mainLabel, index) => (
                    <React.Fragment key={`main-${index}`}>
                      <li className="menu-title">
                        <span>{mainLabel?.tittle}</span>
                      </li>
                      <li>
                        <ul>
                          {mainLabel?.submenuItems
                            ?.filter((title: any) => isModuleVisible(mainLabel?.tittle, title))

                            .map((title: any, i) => {

                              // Check if any submenu or subsubmenu is active
                              const isSubmenuActive =
                                (title?.submenuItems &&
                                  title.submenuItems.some(
                                    (item: any) =>
                                      item?.link === Location.pathname ||
                                      (item?.submenuItems &&
                                        item.submenuItems.some(
                                          (subitem: any) => subitem?.link === Location.pathname
                                        ))
                                  )) ||
                                false;

                              const isActive =
                                (title.relatedRoutes && title.relatedRoutes.includes(Location.pathname)) ||
                                title.link === Location.pathname ||
                                isSubmenuActive;

                              const isMenuOpen = openMenus[title?.label] || false;

                              return (
                                <li className="submenu" key={`title-${i}`}>
                                  <Link
                                    to={title?.submenu ? "#" : title?.link}
                                    onClick={() => {
                                      handleClick(title?.label);
                                      if (mainLabel?.tittle === "Layout") {
                                        handleLayoutClick(title?.label);
                                      }
                                    }}
                                    className={`${isActive ? "active" : ""} ${isMenuOpen ? "subdrop" : ""}`}
                                  >
                                    <i className={`ti ti-${title.icon}`}></i>
                                    <span>{title?.label}</span>
                                    {(title?.submenu || title?.customSubmenuTwo) && (
                                      <span className="menu-arrow"></span>
                                    )}
                                    {title?.submenu === false &&
                                      title?.version === "v2.0" && (
                                        <span className="badge bg-danger ms-2 rounded-2 badge-md fs-12 fw-medium">
                                          v2.0
                                        </span>
                                      )}
                                  </Link>

                                  {title?.submenu !== false && (
                                    <ul
                                      style={{
                                        display: isMenuOpen ? "block" : "none",
                                      }}
                                    >
                                      {title?.submenuItems
                                        ?.filter((item: any) => isModuleVisible(title?.label, item))

                                        .map((item: any, j: any) => {

                                          const isSubActive =
                                            item?.submenuItems
                                              ?.map((link: any) => link?.link)
                                              .includes(Location.pathname) ||
                                            item?.link === Location.pathname;

                                          return (
                                            <li
                                              className={`${item?.submenuItems
                                                ? "submenu submenu-two"
                                                : ""
                                                } `}
                                              key={`item-${j}`}
                                            >
                                              <Link
                                                to={
                                                  item?.submenu ? "#" : item?.link
                                                }
                                                className={`${isSubActive
                                                  ? "active subdrop"
                                                  : ""
                                                  } ${subsidebar === item?.label
                                                    ? "subdrop"
                                                    : ""
                                                  }`}
                                                onClick={() => {
                                                  toggleSubsidebar(item?.label);
                                                  if (title?.label === "Layouts") {
                                                    handleLayoutClick(item?.label);
                                                  }
                                                }}
                                              >
                                                {item?.label}
                                                {(item?.submenu ||
                                                  item?.customSubmenuTwo) && (
                                                    <span className="menu-arrow"></span>
                                                  )}
                                              </Link>
                                              {item?.submenuItems ? (
                                                <ul
                                                  style={{
                                                    display:
                                                      subsidebar === item?.label
                                                        ? "block"
                                                        : "none",
                                                  }}
                                                >
                                                  {item?.submenuItems
                                                    ?.filter((subItem: any) => isModuleVisible(item?.label, subItem))

                                                    .map((items: any, k: any) => {

                                                      const isSubSubActive =
                                                        items?.submenuItems
                                                          ?.map(
                                                            (link: any) => link.link
                                                          )
                                                          .includes(
                                                            Location.pathname
                                                          ) ||
                                                        items?.link ===
                                                        Location.pathname;

                                                      return (
                                                        <li
                                                          key={`submenu-item-${k}`}
                                                        >
                                                          <Link
                                                            to={
                                                              items?.submenu
                                                                ? "#"
                                                                : items?.link
                                                            }
                                                            className={`${isSubSubActive
                                                              ? "active"
                                                              : ""
                                                              }`}
                                                          >
                                                            {items?.label}
                                                          </Link>
                                                        </li>
                                                      );
                                                    }
                                                    )}
                                                </ul>
                                              ) : null}
                                            </li>
                                          );
                                        }
                                        )}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                        </ul>
                      </li>
                    </React.Fragment>
                  ))}
              </ul>
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>
      {/* Sidenav Menu End */}
    </>
  );
};

export default Sidebar; 
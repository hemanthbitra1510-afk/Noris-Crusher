import { Link } from "react-router";
import HeaderSearchmodal from "../header-searchModal/headerSearchmodal";
import ImageWithBasePath from "../imageWithBasePath";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { all_routes } from "../../routes/all_routes";
import { useNavigate } from 'react-router-dom'; 
import { logout } from '../../core/redux/userSlice';
import { setMobileSidebar } from "../../core/redux/sidebarSlice";
import ChangePasswordModal from "./ChangePasswordModal";


type HeaderProps = {
  width?: string | number;
  marginLeft?: string | number;
};
const Header:React.FC<HeaderProps >= ({width,marginLeft}) => {
  const [company, setCompany] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // ✅ Added modal state

useEffect(() => {
  const storedCompany = JSON.parse(
    sessionStorage.getItem("selectedItems1") || "null"
  );
  setCompany(storedCompany);
}, []);

  const route = all_routes
  const dispatch = useDispatch();
   const navigate = useNavigate();
    const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);

  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );

  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };

  // --- Dynamic Notifications Logic ---
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("header_notifications");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "notification-1",
        user: "John Doe",
        avatar: "assets/img/users/user-01.jpg",
        message: "left 6 comments on ",
        boldContext: "Isla Nublar SOC2 compliance report",
        time: "4 min ago",
        isRead: false
      },
      {
        id: "notification-2",
        user: "Thomas William",
        avatar: "assets/img/users/user-12.jpg",
        message: "“Oh, I finished de-bugging the phones, but the system's compiling for eighteen minutes, or twenty...”",
        boldContext: "",
        time: "8 min ago",
        isRead: false
      },
      {
        id: "notification-3",
        user: "Sarah Anderson",
        avatar: "assets/img/profiles/avatar-12.jpg",
        message: "attached a file to ",
        boldContext: "Isla Nublar SOC2 compliance report",
        time: "15 min ago",
        isRead: false
      },
      {
        id: "notification-4",
        user: "Ann McClure",
        avatar: "assets/img/profiles/avatar-08.jpg",
        message: "mentioned you in ",
        boldContext: "Bug Fix Review - Task #432",
        time: "20 min ago",
        isRead: false
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("header_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  // ------------------------------------

  useEffect(() => {
    const htmlElement: any = document.documentElement;
    Object.entries(themeSettings).forEach(([key, value]) => {
      htmlElement.setAttribute(key, value);
    });
  }, [themeSettings]);

  return (
    <>
      {/* Topbar Start */}
      <header className="navbar-header"   style={{ width: typeof width === "number" ? `${width}px` : width ,    marginLeft: typeof marginLeft === "number" ? `${marginLeft}px` : marginLeft, }}>
        <div className="page-container topbar-menu">
          <div className="d-flex align-items-center gap-2">
  {/* Menu Button — ALWAYS FIRST */}
  <button
    id="mobile_btn"
    className="mobile-btn btn border-0 p-0 d-lg-none"
    type="button"
    onClick={toggleMobileSidebar}
  >
    <i className="ti ti-menu-deep fs-24" />
  </button>

  {/* Company Name */}
  <Link
    to={route.FinancialDashborad}
    className="logo d-flex align-items-center"
  >
    <span
      className="fw-semibold text-dark"
      style={{
        fontSize: "16px",
        whiteSpace: "nowrap",
      }}
    >
      {company?.Name || "Company Name"}
    </span>
  </Link>

  {/* Sidebar collapse/expand button (keep as-is) */}
  <button
    className="sidenav-toggle-btn btn border-0 p-0"
    id="toggle_btn2"
  >
    <i className="ti ti-arrow-bar-to-right" />
  </button>

  {/* Search (desktop only) */}
  <div className="me-auto d-flex align-items-center header-search d-lg-flex d-none">
    {/* search content */}
  </div>
</div>

          <div className="d-flex align-items-center">
            {/* Search for Mobile */}
            {/* <div className="header-item d-flex d-lg-none me-2">
              <button
                className="topbar-link btn"
                data-bs-toggle="modal"
                data-bs-target="#searchModal"
                type="button"
              >
                <i className="ti ti-search fs-16" />
              </button>
            </div> */}
            {/* Minimize */}
            {/* <div className="header-item">
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="btn topbar-link btnFullscreen"
                  onClick={toggleFullscreen}
                >
                  <i className="ti ti-maximize" />
                </Link>
              </div>
            </div> */}
            {/* Minimize */}
            {/* Light/Dark Mode Button */}
            {/* <div className="header-item d-none d-sm-flex me-2">
              <Link
                to="#"
                id="dark-mode-toggle"
                className={`topbar-link btn btn-icon topbar-link header-togglebtn ${themeSettings["data-bs-theme"] === "dark" ? "activate" : ""
                  }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "light")}
              >
                <i className="ti ti-sun fs-16" />
              </Link> */}
              {/* Light Mode Toggle */}
              {/* <Link
                to="#"
                id="light-mode-toggle"
                className={`topbar-link btn btn-icon topbar-link header-togglebtn ${themeSettings["data-bs-theme"] === "light" ? "activate" : ""
                  }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "dark")}
              >
                <i className="ti ti-moon fs-16" />
              </Link>
            </div> */}
            {/* pages */}
            {/* <div className="header-item d-none d-sm-flex">
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="btn topbar-link topbar-teal-link"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-layout-grid-add" />
                </Link> */}
                {/* <div className="dropdown-menu dropdown-menu-end dropdown-menu-md p-2"> */}
                  {/* Item*/}
                  {/* <Link to={route.contactGrid} className="dropdown-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="d-flex mb-1 fw-semibold text-dark">
                          Contacts
                        </span>
                        <span className="fs-13">View All the Contacts</span>
                      </div>
                      <i className="ti ti-chevron-right-pipe text-dark" />
                    </div>
                  </Link> */}
                  {/* Item*/}
                  {/* <Link to={route.pipeline} className="dropdown-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="d-flex mb-1 fw-semibold text-dark">
                          Pipeline
                        </span>
                        <span className="fs-13">View All the Pipeline</span>
                      </div>
                      <i className="ti ti-chevron-right-pipe text-dark" />
                    </div>
                  </Link> */}
                  {/* Item*/}
                  {/* <Link to={route.activities} className="dropdown-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="d-flex mb-1 fw-semibold text-dark">
                          Activities
                        </span>
                        <span className="fs-13">Activities</span>
                      </div>
                      <i className="ti ti-chevron-right-pipe text-dark" />
                    </div>
                  </Link> */}
                  {/* Item*/}
                  {/* <Link to={route.analytics} className="dropdown-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="d-flex mb-1 fw-semibold text-dark">
                          Analytics
                        </span>
                        <span className="fs-13">Analytics</span>
                      </div>
                      <i className="ti ti-chevron-right-pipe text-dark" />
                    </div>
                  </Link> */}
                {/* </div> */}
              {/* </div> */}
            {/* </div> */}
            {/* faq */}
            {/* <div className="header-item d-none d-sm-flex">
              <div className="dropdown me-2">
                <Link
                  to={route.faq}
                  className="btn topbar-link topbar-indigo-link"
                >
                  <i className="ti ti-help-hexagon" />
                </Link>
              </div>
            </div> */}
            {/* report */}
            {/* <div className="header-item d-none d-sm-flex">
              <div className="dropdown me-2">
                <Link
                  to={route.leadReports}
                  className="btn topbar-link topbar-warning-link"
                >
                  <i className="ti ti-chart-pie" />
                </Link>
              </div>
            </div> */}
            {/* <div className="header-line" /> */}
            {/* message */}
            {/* <div className="header-item">
              <div className="dropdown me-2">
                <Link to={route.chat} className="btn topbar-link">
                  <i className="ti ti-message-circle-exclamation" />
                  <span className="badge rounded-pill">14</span>
                </Link>
              </div>
            </div> */}
            {/* Notification Dropdown */}
            <div className="header-item">
              <div className="dropdown me-2">
                <button
                  className="topbar-link btn topbar-link dropdown-toggle drop-arrow-none"
                  data-bs-toggle="dropdown"
                  data-bs-offset="0,24"
                  type="button"
                  aria-haspopup="false"
                  aria-expanded="false"
                >
                  <i className="ti ti-bell-check fs-16 animate-ring" />
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill bg-danger">{unreadCount}</span>
                  )}
                </button>
                <div
                  className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
                  style={{ minWidth: 320 }}
                >
                  <div className="p-2 border-bottom">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="m-0 fs-16 fw-semibold">
                          Notifications
                        </h6>
                      </div>
                      {unreadCount > 0 && (
                        <div className="col-auto">
                          <button
                            onClick={markAllAsRead}
                            className="btn btn-link btn-sm p-0 text-danger text-decoration-none fs-12 fw-medium"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Notification Body */}
                  <div
                    className="notification-body position-relative z-2 rounded-0"
                    data-simplebar=""
                    style={{ maxHeight: 350, overflowY: 'auto' }}
                  >
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center">
                        <i className="ti ti-bell-off fs-24 text-muted mb-2 d-block" />
                        <p className="mb-0 text-muted fs-13">All caught up! No notifications.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          className="dropdown-item notification-item py-3 text-wrap border-bottom"
                          id={n.id}
                          key={n.id}
                          style={{ backgroundColor: n.isRead ? 'transparent' : 'rgba(228, 31, 7, 0.03)' }}
                        >
                          <div className="d-flex">
                            <div className="me-2 position-relative flex-shrink-0">
                              <ImageWithBasePath
                                src={n.avatar}
                                className="avatar-md rounded-circle"
                                alt=""
                              />
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-medium text-dark">{n.user}</p>
                              <p className="mb-1 text-wrap text-muted fs-13">
                                {n.message}
                                {n.boldContext && (
                                  <span className="fw-medium text-dark">
                                    {n.boldContext}
                                  </span>
                                )}
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-12 text-muted">
                                  <i className="ti ti-clock me-1" />
                                  {n.time}
                                </span>
                                <div className="notification-action d-flex align-items-center float-end gap-2">
                                  {!n.isRead && (
                                    <Link
                                      to="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        markAsRead(n.id);
                                      }}
                                      className="notification-read rounded-circle bg-danger"
                                      data-bs-toggle="tooltip"
                                      title="Mark as Read"
                                      aria-label="Mark as Read"
                                      style={{ width: '8px', height: '8px', display: 'inline-block' }}
                                    />
                                  )}
                                  <button
                                    className="btn rounded-circle p-0"
                                    onClick={() => dismissNotification(n.id)}
                                    style={{ border: 'none', background: 'transparent' }}
                                  >
                                    <i className="ti ti-x fs-14 text-muted" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* View All*/}
                  <div className="p-2 rounded-bottom border-top text-center">
                    <Link
                      to="#"
                      className="text-center text-decoration-underline fs-14 mb-0 text-muted"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* User Dropdown */}
            <div className="dropdown profile-dropdown d-flex align-items-center justify-content-center">
              <Link
                to="#"
                className="topbar-link dropdown-toggle drop-arrow-none position-relative"
                data-bs-toggle="dropdown"
                data-bs-offset="0,22"
                aria-haspopup="false"
                aria-expanded="false"
              >
                <ImageWithBasePath
                  src="assets/img/users/user-40.jpg"
                  width={38}
                  className="rounded-1 d-flex"
                  alt="user-image"
                />
                <span className="online text-success">
                  <i className="ti ti-circle-filled d-flex bg-white rounded-circle border border-1 border-white" />
                </span>
              </Link>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-md p-2">
                <div className="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                  
                  <div className="ms-2">
                    <p className="fw-medium text-dark mb-0">
  {company?.UserName || "User"}
</p>
<span className="d-block fs-13">
  {company?.Name || "Company"}
</span>

                  </div>
                </div>
                {/* Item - Change Password Popup */}
                <Link 
                    to="#" 
                    className="dropdown-item" 
                    onClick={(e) => {
                        e.preventDefault();
                        setShowPasswordModal(true);
                    }}
                >
                  <i className="ti ti-user-circle me-1 align-middle" />
                  <span className="align-middle">Password Change</span>
                </Link>
                {/* item */}
                <div className="form-check form-switch form-check-reverse d-flex align-items-center justify-content-between dropdown-item mb-0">
                  <label className="form-check-label" htmlFor="notify">
                    <i className="ti ti-bell" />
                    Notifications
                  </label>
                  <input
                    className="form-check-input me-0"
                    type="checkbox"
                    role="switch"
                    id="notify"
                  />
                </div>
                {/* Item*/}
                <Link to="#" className="dropdown-item">
                  <i className="ti ti-help-circle me-1 align-middle" />
                  <span className="align-middle">Help &amp; Support</span>
                </Link>
                {/* Item - Change Password Secondary */}
                <Link 
                    to="#" 
                    className="dropdown-item"
                    onClick={(e) => {
                        e.preventDefault();
                        setShowPasswordModal(true);
                    }}
                >
                  <i className="ti ti-settings me-1 align-middle" />
                  <span className="align-middle">Settings</span>
                </Link>
                {/* Item*/}
                <div className="pt-2 mt-2 border-top">
                  <i className="ti ti-logout me-1 fs-17 align-middle" />
                  <span className="align-middle btn text-danger" onClick={handleLogout}>Sign Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Topbar End */}
      <HeaderSearchmodal />
      
      {/* 🔐 Change Password Modal */}
      <ChangePasswordModal 
        show={showPasswordModal} 
        onHide={() => setShowPasswordModal(false)} 
      />
    </>
  );
};

export default Header;

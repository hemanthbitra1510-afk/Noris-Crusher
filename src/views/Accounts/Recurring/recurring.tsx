import React, { useEffect, useState, useRef } from "react";
import { checkPageAccess } from "../../../utils/permission";
import axios from "axios";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Row, Col, Card, Nav, Tab, Table } from "react-bootstrap";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

// Interface definitions based on API response
interface CategoryBreakdown {
  Category: string;
  Count: number;
  Monthly: string;
  Annual: string;
}

interface UpcomingRenewal {
  ID: number;
  Name: string;
  Category: string;
  Payee: string;
  Amount: string;
  Frequency: string;
  NextDue: string;
  DaysAway: number;
}

interface ProjectionMonth {
  Month: string;
  YM: string;
  Projected: string | number;
}

interface SubscriptionRow {
  ID: number;
  Name: string;
  Category: string;
  Payee: string;
  Amount: string;
  Frequency: string;
  DueDay: number;
  StartDate: string;
  EndDate: string;
  PaymentMode: string;
  LastPaid: string;
  MonthlyEquivalent: string;
  AnnualEquivalent: string;
}

interface RecurringData {
  FY: string;
  FromDate: string;
  ToDate: string;
  ActiveCount: number;
  MonthlyCommitted: string;
  AnnualProjected: string;
  AnnualPotential: string;
  ByCategory: CategoryBreakdown[];
  Upcoming: UpcomingRenewal[];
  Monthly: ProjectionMonth[];
  All: SubscriptionRow[];
  Note?: string;
}

const RecurringSubmodule: React.FC = () => {
  // Page access control for role-based security
  const accessDenied = checkPageAccess("Accounts", "Recurring");
  if (accessDenied) return accessDenied;

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<RecurringData | null>(null);

  // Search & Pagination states for subscriptions table
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Sorting state
  const [sortKey, setSortKey] = useState<keyof SubscriptionRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    // Inject keyframes for spinning loader
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .metric-card-hover {
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .metric-card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 20px rgba(0,0,0,0.08) !important;
      }
      .timeline-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 12px;
      }
      .custom-nav-tabs .nav-link {
        border: none;
        border-bottom: 3px solid transparent;
        color: #6c757d;
        font-weight: 600;
        padding: 12px 20px;
        transition: all 0.2s ease;
      }
      .custom-nav-tabs .nav-link.active {
        color: #0d6efd !important;
        border-bottom-color: #0d6efd !important;
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(style);

    fetchData();

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<RecurringData>(
        `https://norisapi.noris.in/Crusher/Recurring.php?ID=${id}`
      );
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch recurring expenditures data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Safe numerical parser
  const parseCurrency = (val: string | number): number => {
    if (typeof val === "number") return val;
    const cleaned = String(val).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div
          style={{
            height: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 130,
              height: 130,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 130,
                height: 130,
                border: "5px solid #f1f3f5",
                borderTop: "5px solid #0d6efd",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <img
              src={logo}
              alt="Loading"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 50,
                height: 50,
              }}
            />
          </div>
          <p className="mt-3 text-muted fw-semibold">Analyzing Expenditures...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrapper">
        <div className="content p-4 text-center">
          <Card className="shadow-sm border-0 py-5">
            <Card.Body>
              <i className="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
              <h4>No Data Found</h4>
              <p className="text-muted">Unable to retrieve recurring expenditures analytical information.</p>
              <button className="btn btn-primary" onClick={fetchData}>
                Retry Fetch
              </button>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }

  // Visual chart setup for Monthly Projection
  const chartCategories = data.Monthly.map((m) => m.Month);
  const chartSeriesData = data.Monthly.map((m) => parseCurrency(m.Projected));

  const barChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 380,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#3b82f6"],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "50%",
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return val > 0 ? `₹${(val / 1000).toFixed(0)}k` : "";
      },
      offsetY: -20,
      style: {
        fontSize: "11px",
        colors: ["#4b5563"],
        fontWeight: "600",
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 4,
    },
    xaxis: {
      categories: chartCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9ca3af", fontWeight: 500 },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `₹${val.toLocaleString("en-IN")}`,
        style: { colors: "#9ca3af", fontWeight: 500 },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `₹${val.toLocaleString("en-IN")}`,
      },
    },
  };

  // Pie chart setup for Category distribution
  const pieLabels = data.ByCategory.map((c) => c.Category);
  const pieSeries = data.ByCategory.map((c) => parseCurrency(c.Monthly));

  const pieChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 320,
      fontFamily: "inherit",
    },
    colors: [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
      "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
    ],
    labels: pieLabels,
    legend: {
      position: "bottom",
      fontSize: "13px",
      fontWeight: 500,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Committed / Mo",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6b7280",
              formatter: () => {
                return data.MonthlyCommitted;
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val: number) => `₹${val.toLocaleString("en-IN")}`,
      },
    },
  };

  // Local filtering & sorting logic for Subscriptions list
  const filteredSubscriptions = data.All.filter((sub) => {
    return (
      sub.Name.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.Category.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.Payee.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.Frequency.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.PaymentMode.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const handleSort = (key: keyof SubscriptionRow) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === null || aVal === undefined) return sortDirection === "asc" ? 1 : -1;
    if (bVal === null || bVal === undefined) return sortDirection === "asc" ? -1 : 1;

    if (sortKey === "Amount" || sortKey === "MonthlyEquivalent" || sortKey === "AnnualEquivalent") {
      return sortDirection === "asc"
        ? parseCurrency(aVal) - parseCurrency(bVal)
        : parseCurrency(bVal) - parseCurrency(aVal);
    }

    return sortDirection === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Pagination bounds
  const totalPages = Math.ceil(sortedSubscriptions.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = sortedSubscriptions.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="page-wrapper" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="content p-3">
        {/* Dynamic Premium Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="mb-0 fw-bold text-dark">Recurring Analytics</h4>
            <p className="text-muted mb-0 small">
              Expenditure insight and projections for Indian FY <strong>{data.FY}</strong> ({data.FromDate} to {data.ToDate})
            </p>
          </div>
          <button className="btn btn-white border shadow-sm btn-sm d-flex align-items-center gap-2" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise text-primary"></i> Refresh data
          </button>
        </div>

        {/* METRICS CARD GRID */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} md={3}>
            <Card className="border-0 shadow-sm metric-card-hover rounded-3 h-100 position-relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
            }}>
              <Card.Body className="py-4">
                <div className="position-absolute top-50 end-0 translate-middle-y me-3 opacity-25">
                  <i className="bi bi-wallet2 display-3 text-primary"></i>
                </div>
                <small className="text-primary fw-bold text-uppercase tracking-wider">Monthly Committed Burn</small>
                <h3 className="fw-extrabold text-primary-dark mt-2 mb-1">{data.MonthlyCommitted}</h3>
                <span className="small text-secondary fw-semibold">Fixed monthly baseline cost</span>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card className="border-0 shadow-sm metric-card-hover rounded-3 h-100 position-relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
            }}>
              <Card.Body className="py-4">
                <div className="position-absolute top-50 end-0 translate-middle-y me-3 opacity-25">
                  <i className="bi bi-calendar-check display-3 text-success"></i>
                </div>
                <small className="text-success fw-bold text-uppercase tracking-wider">Annual Projected Spend</small>
                <h3 className="fw-extrabold text-success-dark mt-2 mb-1">{data.AnnualProjected}</h3>
                <span className="small text-secondary fw-semibold">Clipped dynamically inside FY window</span>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card className="border-0 shadow-sm metric-card-hover rounded-3 h-100 position-relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
            }}>
              <Card.Body className="py-4">
                <div className="position-absolute top-50 end-0 translate-middle-y me-3 opacity-25">
                  <i className="bi bi-lightning-charge display-3 text-warning"></i>
                </div>
                <small className="text-warning-dark fw-bold text-uppercase tracking-wider">Annual Potential Spend</small>
                <h3 className="fw-extrabold text-warning-dark mt-2 mb-1">{data.AnnualPotential}</h3>
                <span className="small text-secondary fw-semibold">12x Committed burn projection</span>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card className="border-0 shadow-sm metric-card-hover rounded-3 h-100 position-relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)"
            }}>
              <Card.Body className="py-4">
                <div className="position-absolute top-50 end-0 translate-middle-y me-3 opacity-25">
                  <i className="bi bi-bookmark-star display-3 text-purple" style={{ color: "#7c3aed" }}></i>
                </div>
                <small className="fw-bold text-uppercase tracking-wider" style={{ color: "#7c3aed" }}>Active Subscriptions</small>
                <h3 className="fw-extrabold mt-2 mb-1" style={{ color: "#5b21b6" }}>{data.ActiveCount}</h3>
                <span className="small text-secondary fw-semibold">Active committed contracts</span>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* PRIMARY PROJECTION VIEW */}
        <Row className="g-3 mb-4">
          <Col xs={12} lg={8}>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">12-Month Financial Year Projection</h5>
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill small">Apr to Mar projection</span>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                <Chart options={barChartOptions} series={[{ name: "Projected Spend", data: chartSeriesData }]} type="bar" height={360} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={4}>
            <Card className="border-0 shadow-sm rounded-3 h-100">
              <Card.Header className="bg-transparent border-0 pt-4 px-4">
                <h5 className="mb-0 fw-bold text-dark">Upcoming Renewals (30 Days)</h5>
              </Card.Header>
              <Card.Body className="px-4 pb-4" style={{ maxHeight: "390px", overflowY: "auto" }}>
                {data.Upcoming.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-clock-history display-6 text-secondary opacity-50 mb-2 d-block"></i>
                    No subscription renewals found in the next 30 days.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {data.Upcoming.map((item) => {
                      const isHighAlert = item.DaysAway <= 3;
                      const isMidAlert = item.DaysAway > 3 && item.DaysAway <= 7;
                      return (
                        <div key={item.ID} className="p-3 border rounded-3 bg-white shadow-xs d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span
                              className="timeline-dot"
                              style={{
                                backgroundColor: isHighAlert ? "#ef4444" : isMidAlert ? "#f59e0b" : "#3b82f6",
                              }}
                            />
                            <div>
                              <strong className="text-dark d-block fw-semibold" style={{ fontSize: "14px" }}>{item.Name}</strong>
                              <span className="small text-muted">{item.Payee} • {item.Frequency}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <strong className="text-primary-dark d-block" style={{ fontSize: "14px" }}>{item.Amount}</strong>
                            <span className={`badge rounded-pill px-2 py-1 small mt-1 ${isHighAlert ? "bg-danger bg-opacity-10 text-danger" : isMidAlert ? "bg-warning bg-opacity-10 text-warning" : "bg-primary bg-opacity-10 text-primary"
                              }`}>
                              {item.DaysAway === 0 ? "Today" : item.DaysAway === 1 ? "Tomorrow" : `In ${item.DaysAway} days`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* INTERACTIVE BREAKDOWN SECTIONS (TABS) */}
        <Card className="border-0 shadow-sm rounded-3">
          <Tab.Container defaultActiveKey="all">
            <Card.Header className="bg-transparent border-0 p-0 border-bottom">
              <Nav className="custom-nav-tabs px-3">
                <Nav.Item>
                  <Nav.Link eventKey="all" className="d-flex align-items-center gap-2">
                    <i className="bi bi-list-ul"></i> Subscriptions Inventory
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="category" className="d-flex align-items-center gap-2">
                    <i className="bi bi-pie-chart"></i> Category Distribution
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body className="p-4">
              <Tab.Content>
                {/* SUBSCRIPTIONS INVENTORY VIEW */}
                <Tab.Pane eventKey="all">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="position-relative" style={{ width: "280px" }}>
                      <input
                        type="text"
                        className="form-control ps-5 rounded-pill shadow-xs"
                        placeholder="Search subscriptions..."
                        value={searchText}
                        onChange={(e) => {
                          setSearchText(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                    <div className="small text-muted fw-semibold">
                      Showing {startIdx + 1}–{Math.min(startIdx + itemsPerPage, sortedSubscriptions.length)} of {sortedSubscriptions.length} items
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table hover align="middle" className="text-nowrap border border-light">
                      <thead className="table-light">
                        <tr>
                          <th className="cursor-pointer" onClick={() => handleSort("Name")}>
                            Name {sortKey === "Name" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="cursor-pointer" onClick={() => handleSort("Category")}>
                            Category {sortKey === "Category" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="cursor-pointer" onClick={() => handleSort("Payee")}>
                            Payee {sortKey === "Payee" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="text-end cursor-pointer" onClick={() => handleSort("Amount")}>
                            Amount {sortKey === "Amount" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="cursor-pointer" onClick={() => handleSort("Frequency")}>
                            Frequency {sortKey === "Frequency" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="text-center cursor-pointer" onClick={() => handleSort("DueDay")}>
                            Due Day {sortKey === "DueDay" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="text-end cursor-pointer" onClick={() => handleSort("MonthlyEquivalent")}>
                            Monthly Eq {sortKey === "MonthlyEquivalent" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th className="text-end cursor-pointer" onClick={() => handleSort("AnnualEquivalent")}>
                            Annual Eq {sortKey === "AnnualEquivalent" && (sortDirection === "asc" ? " ▲" : " ▼")}
                          </th>
                          <th>Payment Mode</th>
                          <th>Last Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSubscriptions.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-5 text-muted">
                              No matching subscriptions found.
                            </td>
                          </tr>
                        ) : (
                          paginatedSubscriptions.map((sub) => (
                            <tr key={sub.ID}>
                              <td className="fw-semibold text-dark">{sub.Name}</td>
                              <td><span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2.5 py-1">{sub.Category}</span></td>
                              <td>{sub.Payee}</td>
                              <td className="text-end fw-bold text-dark">{sub.Amount}</td>
                              <td>{sub.Frequency}</td>
                              <td className="text-center">{sub.DueDay || "-"}</td>
                              <td className="text-end text-primary fw-semibold">{sub.MonthlyEquivalent}</td>
                              <td className="text-end text-success fw-semibold">{sub.AnnualEquivalent}</td>
                              <td>{sub.PaymentMode || "-"}</td>
                              <td>{sub.LastPaid || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                      <div>
                        Rows per page:{" "}
                        <select
                          className="form-select form-select-sm d-inline-block w-auto border shadow-xs"
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          {[5, 10, 20, 30, 50, 100].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <nav>
                        <ul className="pagination mb-0 flex-wrap">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link shadow-xs" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
                              <i className="bi bi-chevron-left"></i>
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                            <li key={pg} className={`page-item ${pg === currentPage ? "active" : ""}`}>
                              <button className="page-link shadow-xs" onClick={() => setCurrentPage(pg)}>
                                {pg}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link shadow-xs" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </Tab.Pane>

                {/* CATEGORY DISTRIBUTION & TABLE BREAKDOWN VIEW */}
                <Tab.Pane eventKey="category">
                  <Row className="g-4 align-items-center">
                    <Col xs={12} md={7}>
                      <div className="table-responsive">
                        <Table striped hover bordered className="mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Category</th>
                              <th className="text-center">Count</th>
                              <th className="text-end">Monthly Commitment</th>
                              <th className="text-end">Annual Projection</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.ByCategory.map((c, i) => (
                              <tr key={i}>
                                <td className="fw-semibold text-dark">{c.Category}</td>
                                <td className="text-center">{c.Count}</td>
                                <td className="text-end text-primary">{c.Monthly}</td>
                                <td className="text-end text-success">{c.Annual}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Col>
                    <Col xs={12} md={5} className="text-center">
                      <div className="d-inline-block w-100">
                        <Chart options={pieChartOptions} series={pieSeries} type="donut" height={320} />
                      </div>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Tab.Container>
        </Card>
      </div>
    </div>
  );
};

export default RecurringSubmodule;

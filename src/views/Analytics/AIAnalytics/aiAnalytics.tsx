import { useEffect, useState } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card, CardBody, Col, Row } from "react-bootstrap";
import ProductionList from "../../../components/reuse-components/productionList";
import { checkPageAccess } from "../../../utils/permission";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

/* ============================ TYPES ============================ */

interface OutstandingRow {
  Party: string;
  Payable: number;
  Paid: number;
  Balance: number;
  OldestDays: number;
  DaysSincePay: number | null;
  RiskScore: number;
  RiskBand: "High" | "Medium" | "Low";
}

interface AuditRow {
  ID: string | number;
  Date: string;
  Party: string;
  Vehicle: string;
  Material: string;
  Nett: number;
  Rate: number;
  Amount: number;
  Issues: number;
  Reason: string;
  Severity: number;
  SeverityBand: "High" | "Medium" | "Low";
}

interface LogRow {
  Module: string;
  Date: string;
  Party: string;
  Action: string;
  Amount: number | null;
  Ref: string;
}

interface InsightData {
  TotalOutstanding: number;
  PartiesTracked: number;
  HighRiskParties: number;
  AuditFlags: number;
  HighSeverityFlags: number;
  TopParty: string | null;
  TopBalance: number;
  Summary: string;
}

type TabKey = "outstanding" | "audit" | "logs";

// Base folder containing the separate AI Analytics endpoints
// (TopOutstanding.php, DataAudit.php, DataLogs.php, Insights.php + _AIcommon.php)
const API_BASE = "https://norisapi.noris.in/Crusher";

/* ============================ COMPONENT ============================ */

const AIAnalytics = () => {
  const accessDenied = checkPageAccess("Analytics", "AIAnalytics");
  if (accessDenied) return accessDenied;

  const id = sessionStorage.getItem("selectedItems") ?? "";

  const [activeTab, setActiveTab] = useState<TabKey>("outstanding");
  const [loading, setLoading] = useState(false);

  const [insights, setInsights] = useState<InsightData | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);

  /* ---- spinner keyframes (same approach used by other views) ---- */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `@keyframes spin {0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /* ---- generic POST helper (one file per feature) ---- */
  const post = async <T,>(endpoint: string): Promise<T> => {
    const res = await axios.post(
      `${API_BASE}/${endpoint}.php?ID=${id}`,
      { FromDate: "", ToDate: "", Party: "", Limit: 100 }
    );
    return (res.data ?? []) as T;
  };

  /* ---- initial load ---- */
  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ins, top, aud, lg] = await Promise.all([
        post<InsightData>("Insights"),
        post<OutstandingRow[]>("TopOutstanding"),
        post<AuditRow[]>("DataAudit"),
        post<LogRow[]>("DataLogs"),
      ]);
      setInsights(ins as unknown as InsightData);
      setOutstanding(Array.isArray(top) ? top : []);
      setAudit(Array.isArray(aud) ? aud : []);
      setLogs(Array.isArray(lg) ? lg : []);
    } catch (e) {
      console.error("AI Analytics load failed:", e);
      setOutstanding([]);
      setAudit([]);
      setLogs([]);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ============================ TABLE HEADERS ============================ */

  const outstandingHeaders = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Payable", key: "Payable", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
    { label: "Oldest (days)", key: "OldestDays", dataType: "number" },
    { label: "Risk", key: "RiskScore", dataType: "number" },
    { label: "Band", key: "RiskBand", dataType: "string" },
  ];

  const auditHeaders = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Material", key: "Material", dataType: "string" },
    { label: "Nett", key: "Nett", dataType: "number" },
    { label: "Rate", key: "Rate", dataType: "number" },
    { label: "Amount", key: "Amount", dataType: "number" },
    { label: "Severity", key: "SeverityBand", dataType: "string" },
    { label: "Reason", key: "Reason", dataType: "string" },
  ];

  const logHeaders = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "Module", key: "Module", dataType: "string" },
    { label: "Party / Vehicle", key: "Party", dataType: "string" },
    { label: "Action", key: "Action", dataType: "string" },
    { label: "Amount", key: "Amount", dataType: "number" },
    { label: "Ref", key: "Ref", dataType: "string" },
  ];

  /* ============================ CHART CONFIGS ============================ */

  const topChartData = outstanding.slice(0, 10);
  const barOptions: ApexOptions = {
    chart: { type: "bar", height: 300, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
    colors: ["#2F80ED"],
    dataLabels: { enabled: false },
    xaxis: { categories: topChartData.map((r) => r.Party) },
    grid: { borderColor: "#eef0f3" },
    tooltip: {
      y: { formatter: (v: number) => "₹ " + Number(v).toLocaleString("en-IN") },
    },
  };
  const barSeries = [
    { name: "Balance", data: topChartData.map((r) => r.Balance) },
  ];

  const auditBands = ["High", "Medium", "Low"] as const;
  const donutSeries = auditBands.map(
    (b) => audit.filter((r) => r.SeverityBand === b).length
  );
  const donutOptions: ApexOptions = {
    chart: { type: "donut", height: 300 },
    labels: [...auditBands],
    colors: ["#E41F07", "#FFA201", "#27AE60"],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
  };

  /* ============================ SMALL UI HELPERS ============================ */

  const Loader = () => (
    <div style={{ height: 350, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative", width: 150, height: 150 }}>
        <div
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            border: "6px solid #e9ecef",
            borderTop: "6px solid #0d6efd",
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
            width: 55,
            height: 55,
          }}
        />
      </div>
    </div>
  );

  const KpiCard = ({
    title,
    value,
    sub,
    tone,
  }: {
    title: string;
    value: string | number;
    sub?: string;
    tone: string;
  }) => (
    <Col xs={12} sm={6} xl={3} className="mb-2">
      <Card className="h-100 border-0 shadow-sm">
        <CardBody>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted small">{title}</span>
            <span className={`badge bg-${tone} bg-opacity-10 text-${tone}`}>
              <i className="ti ti-brain" />
            </span>
          </div>
          <h3 className="mb-0 mt-2">{value}</h3>
          {sub && <span className="text-muted small">{sub}</span>}
        </CardBody>
      </Card>
    </Col>
  );

  const fmtRs = (n: number) => "₹ " + Number(n || 0).toLocaleString("en-IN");

  /* ============================ RENDER ============================ */

  return (
    <div className="page-wrapper">
      <div className="content p-2">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <span className="bg-primary bg-opacity-10 text-primary rounded p-2">
              <i className="ti ti-brain fs-20" />
            </span>
            <div>
              <h5 className="mb-0">AI Analytics</h5>
              <span className="text-muted small">
                Outstanding parties, data audit &amp; activity logs
              </span>
            </div>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={loadAll}>
            <i className="ti ti-refresh me-1" /> Refresh
          </button>
        </div>

        {/* AI headline */}
        {insights?.Summary && (
          <div className="alert alert-primary d-flex align-items-start gap-2 py-2">
            <i className="ti ti-sparkles mt-1" />
            <div>{insights.Summary}</div>
          </div>
        )}

        {/* KPI row */}
        <Row>
          <KpiCard
            title="Total Outstanding"
            value={insights ? fmtRs(insights.TotalOutstanding) : "—"}
            sub={`${insights?.PartiesTracked ?? 0} parties tracked`}
            tone="primary"
          />
          <KpiCard
            title="High-Risk Parties"
            value={insights?.HighRiskParties ?? 0}
            sub="balance + ageing weighted"
            tone="danger"
          />
          <KpiCard
            title="Audit Flags"
            value={insights?.AuditFlags ?? 0}
            sub={`${insights?.HighSeverityFlags ?? 0} high severity`}
            tone="warning"
          />
          <KpiCard
            title="Top Party"
            value={insights?.TopParty ?? "—"}
            sub={insights ? fmtRs(insights.TopBalance) : ""}
            tone="info"
          />
        </Row>

        {/* Charts */}
        <Row className="mt-1">
          <Col xs={12} md={7} className="mb-2">
            <Card className="h-100 border-0 shadow-sm">
              <CardBody>
                <h6 className="mb-2">Top Outstanding Parties</h6>
                {topChartData.length > 0 ? (
                  <Chart options={barOptions} series={barSeries} type="bar" height={300} />
                ) : (
                  <div className="text-muted text-center py-5">No outstanding balances</div>
                )}
              </CardBody>
            </Card>
          </Col>
          <Col xs={12} md={5} className="mb-2">
            <Card className="h-100 border-0 shadow-sm">
              <CardBody>
                <h6 className="mb-2">Data Audit by Severity</h6>
                {audit.length > 0 ? (
                  <Chart options={donutOptions} series={donutSeries} type="donut" height={300} />
                ) : (
                  <div className="text-muted text-center py-5">No suspicious entries</div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <ul className="nav nav-pills mb-2 mt-1 gap-2">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "outstanding" ? "active" : ""}`}
              onClick={() => setActiveTab("outstanding")}
            >
              <i className="ti ti-cash me-1" /> Top Outstanding
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              <i className="ti ti-shield-search me-1" /> Data Audit
              {audit.length > 0 && (
                <span className="badge bg-danger ms-1">{audit.length}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "logs" ? "active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              <i className="ti ti-history me-1" /> Data Logs
            </button>
          </li>
        </ul>

        {/* Tab content */}
        {loading ? (
          <Loader />
        ) : (
          <>
            {activeTab === "outstanding" && (
              <ProductionList
                title="Top Outstanding Parties"
                periodOptions={["All"]}
                tableHeaders={outstandingHeaders}
                dealsData={outstanding as unknown as Record<string, string | number | null | undefined>[]}
                appliedFilters={{}}
              />
            )}
            {activeTab === "audit" && (
              <ProductionList
                title="Data Audit"
                periodOptions={["All"]}
                tableHeaders={auditHeaders}
                dealsData={audit as unknown as Record<string, string | number | null | undefined>[]}
                appliedFilters={{}}
              />
            )}
            {activeTab === "logs" && (
              <ProductionList
                title="Data Logs"
                periodOptions={["All"]}
                tableHeaders={logHeaders}
                dealsData={logs as unknown as Record<string, string | number | null | undefined>[]}
                appliedFilters={{}}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIAnalytics;

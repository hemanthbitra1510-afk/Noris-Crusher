import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Card, CardBody, CardHeader, Col, Row, Form, Spinner, Badge } from "react-bootstrap";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import CountUp from "react-countup";
import dayjs from "dayjs";
import { checkPageAccess } from "../../../utils/permission";

type Period = "All" | "This Month" | "Last Month" | "This Year" | "Last 6 Months";

interface KPI {
    TotalEmployees: number;
    ActiveEmployees: number;
    InactiveEmployees: number;
    TotalPaid: number;
    AvgPerPayment: number;
    PaidEmployeesCount: number;
    PaymentsCount: number;
}

interface MonthlyRow {
    YM: string;
    Month: string;
    Total: number;
    Count: number;
}

interface DesignationRow {
    Designation: string;
    Count: number;
}

interface PaymentModeRow {
    Mode: string;
    Amount: number;
    Count: number;
}

interface TopEmployeeRow {
    Employee: string;
    Total: number;
    Count: number;
    LastPaid: string;
}

interface RecentPaymentRow {
    Date1: string;
    Employee: string;
    Mode: string;
    Amount: number;
}

interface EmployeeSummaryRow {
    Employee: string;
    Designation: string;
    Contact: string;
    DOJ: string;
    DOL: string;
    Status: string;
    TotalPaid: number;
    PaymentsCount: number;
    LastPaid: string;
}

interface AnalysisResponse {
    status?: string;
    message?: string;
    FY?: string;
    FromDate?: string;
    ToDate?: string;
    KPI?: KPI;
    Monthly?: MonthlyRow[];
    Designations?: DesignationRow[];
    PaymentModes?: PaymentModeRow[];
    TopEmployees?: TopEmployeeRow[];
    RecentPayments?: RecentPaymentRow[];
    EmployeeSummary?: EmployeeSummaryRow[];
}

const EMPTY_KPI: KPI = {
    TotalEmployees: 0,
    ActiveEmployees: 0,
    InactiveEmployees: 0,
    TotalPaid: 0,
    AvgPerPayment: 0,
    PaidEmployeesCount: 0,
    PaymentsCount: 0,
};

const formatINR = (n: number | undefined | null): string => {
    if (n === undefined || n === null || isNaN(n as number)) return "0";
    return Math.round(Number(n)).toLocaleString("en-IN");
};

const getDateRange = (period: Period): { from: string; to: string } => {
    const today = dayjs();
    switch (period) {
        case "This Month":
            return {
                from: today.startOf("month").format("YYYY-MM-DD"),
                to: today.endOf("month").format("YYYY-MM-DD"),
            };
        case "Last Month":
            return {
                from: today.subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
                to: today.subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
            };
        case "Last 6 Months":
            return {
                from: today.subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
                to: today.endOf("month").format("YYYY-MM-DD"),
            };
        case "This Year": {
            // Indian FY: Apr–Mar
            const y = today.year();
            const m = today.month() + 1;
            const startY = m < 4 ? y - 1 : y;
            return {
                from: dayjs(`${startY}-04-01`).format("YYYY-MM-DD"),
                to: dayjs(`${startY + 1}-03-31`).format("YYYY-MM-DD"),
            };
        }
        case "All":
        default:
            return { from: "2000-01-01", to: "2099-12-31" };
    }
};

const EmployeeAnalysis = () => {
    const accessDenied = checkPageAccess("Employee", "Analysis");
    if (accessDenied) return accessDenied;

    const [data, setData] = useState<AnalysisResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [period, setPeriod] = useState<Period>("This Year");
    const [search, setSearch] = useState("");

    const fetchAll = useCallback(
        async (p: Period) => {
            setLoading(true);
            setErrorMsg("");
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                const { from, to } = getDateRange(p);
                const res = await axios.get<AnalysisResponse>(
                    `https://norisapi.noris.in/CrushersNew/EmployeeAnalysis.php`,
                    {
                        params: { ID: id, FromDate: from, ToDate: to },
                        timeout: 15000,
                    }
                );
                const body = res.data;
                if (body && body.status === "failed") {
                    setErrorMsg(body.message || "Server returned an error");
                    setData(null);
                } else {
                    setData(body || null);
                }
            } catch (err: any) {
                console.error("Failed to fetch employee analysis:", err);
                setErrorMsg(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load analysis data"
                );
                setData(null);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchAll(period);
    }, [fetchAll, period]);

    const kpi = data?.KPI ?? EMPTY_KPI;
    const monthly = data?.Monthly ?? [];
    const designations = data?.Designations ?? [];
    const paymentModes = data?.PaymentModes ?? [];
    const topEmployees = data?.TopEmployees ?? [];
    const recentPayments = data?.RecentPayments ?? [];
    const employeeSummary = data?.EmployeeSummary ?? [];

    const filteredEmployeeSummary = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return employeeSummary;
        return employeeSummary.filter(
            (e) =>
                (e.Employee || "").toLowerCase().includes(term) ||
                (e.Designation || "").toLowerCase().includes(term) ||
                (e.Contact || "").toLowerCase().includes(term)
        );
    }, [employeeSummary, search]);

    // ===== Chart options =====
    const monthlyBarOptions: ApexOptions = {
        chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
        colors: ["#4361ee"],
        plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
            categories: monthly.map((m) => m.Month),
            labels: { rotate: -45, style: { fontSize: "11px" } },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => {
                    if (Math.abs(val) >= 10000000) return (val / 10000000).toFixed(1) + "Cr";
                    if (Math.abs(val) >= 100000) return (val / 100000).toFixed(1) + "L";
                    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(0) + "K";
                    return String(Math.round(val));
                },
            },
        },
        legend: { position: "top", horizontalAlign: "center" },
        tooltip: { y: { formatter: (val: number) => "₹ " + formatINR(val) } },
        grid: { borderColor: "#eee", strokeDashArray: 4 },
    };

    const monthlySeries = [
        { name: "Payments (₹)", data: monthly.map((m) => m.Total) },
    ];

    const monthlyCountOptions: ApexOptions = {
        chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit" },
        colors: ["#10b981"],
        stroke: { curve: "smooth", width: 3 },
        dataLabels: { enabled: false },
        fill: {
            type: "gradient",
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 },
        },
        xaxis: {
            categories: monthly.map((m) => m.Month),
            labels: { rotate: -45, style: { fontSize: "11px" } },
        },
        yaxis: { labels: { formatter: (val: number) => String(Math.round(val)) } },
        tooltip: { y: { formatter: (val: number) => `${val} payments` } },
        grid: { borderColor: "#eee", strokeDashArray: 4 },
    };

    const monthlyCountSeries = [
        { name: "Payment Count", data: monthly.map((m) => m.Count) },
    ];

    const designationOptions: ApexOptions = {
        chart: { type: "donut", fontFamily: "inherit" },
        labels: designations.map((d) => d.Designation),
        colors: [
            "#4361ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
            "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#0ea5e9",
        ],
        legend: { position: "bottom" },
        dataLabels: { enabled: true },
        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total",
                            formatter: () => String(kpi.TotalEmployees),
                        },
                    },
                },
            },
        },
    };

    const designationSeries = designations.map((d) => d.Count);

    const modeOptions: ApexOptions = {
        chart: { type: "pie", fontFamily: "inherit" },
        labels: paymentModes.map((m) => m.Mode),
        colors: ["#4361ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
        legend: { position: "bottom" },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(1)}%`,
        },
        tooltip: { y: { formatter: (val: number) => "₹ " + formatINR(val) } },
    };

    const modeSeries = paymentModes.map((m) => m.Amount);

    return (
        <div className="page-wrapper">
            <div className="content p-2">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap p-2">
                    <div>
                        <h5 className="mb-0 fw-bold">
                            <i className="ti ti-chart-pie-filled me-2 text-primary"></i>
                            Employee Analysis
                        </h5>
                        <small className="text-muted">
                            {data?.FY
                                ? `FY ${data.FY} • ${data.FromDate} to ${data.ToDate}`
                                : "Insights on employee payments, advances & workforce"}
                        </small>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        <Form.Select
                            size="sm"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as Period)}
                            style={{ minWidth: 160 }}
                            disabled={loading}
                        >
                            <option value="All">All Time</option>
                            <option value="This Month">This Month</option>
                            <option value="Last Month">Last Month</option>
                            <option value="Last 6 Months">Last 6 Months</option>
                            <option value="This Year">This Year</option>
                        </Form.Select>
                        <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                            onClick={() => fetchAll(period)}
                            disabled={loading}
                        >
                            <i className="ti ti-refresh"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-3">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-muted mt-2 mb-0 small">Loading analysis...</p>
                    </div>
                )}

                {errorMsg && !loading && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 m-2" role="alert">
                        <i className="ti ti-alert-triangle"></i>
                        <div>
                            <strong>Couldn't load analysis.</strong> {errorMsg}
                        </div>
                    </div>
                )}

                {/* KPI Widgets */}
                <Row className="row-gap-3 mb-3">
                    <KpiCard
                        label="Total Employees"
                        value={kpi.TotalEmployees}
                        icon="ti ti-users"
                        color="primary"
                        loading={loading}
                        isCurrency={false}
                    />
                    <KpiCard
                        label="Active"
                        value={kpi.ActiveEmployees}
                        icon="ti ti-user-check"
                        color="success"
                        loading={loading}
                        isCurrency={false}
                    />
                    <KpiCard
                        label="Left / Inactive"
                        value={kpi.InactiveEmployees}
                        icon="ti ti-user-off"
                        color="danger"
                        loading={loading}
                        isCurrency={false}
                    />
                    <KpiCard
                        label="Total Paid"
                        value={kpi.TotalPaid}
                        icon="ti ti-cash"
                        color="warning"
                        loading={loading}
                    />
                    <KpiCard
                        label="Avg / Payment"
                        value={kpi.AvgPerPayment}
                        icon="ti ti-receipt-2"
                        color="info"
                        loading={loading}
                    />
                    <KpiCard
                        label="Paid Employees"
                        value={kpi.PaidEmployeesCount}
                        icon="ti ti-user-dollar"
                        color="secondary"
                        loading={loading}
                        isCurrency={false}
                    />
                </Row>

                {/* Monthly trends */}
                <Row className="row-gap-3 mb-3">
                    <Col xs={12} lg={8}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-between">
                                <h6 className="mb-0 fw-bold text-primary">
                                    <i className="ti ti-chart-bar me-1"></i> Monthly Payments
                                </h6>
                                <Badge bg="primary" className="bg-opacity-25 text-primary">
                                    {monthly.length} months
                                </Badge>
                            </CardHeader>
                            <CardBody>
                                {monthly.length === 0 ? (
                                    <EmptyState text="No payment data for this period" />
                                ) : (
                                    <Chart
                                        options={monthlyBarOptions}
                                        series={monthlySeries}
                                        type="bar"
                                        height={320}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xs={12} lg={4}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-success bg-opacity-10">
                                <h6 className="mb-0 fw-bold text-success">
                                    <i className="ti ti-activity me-1"></i> Payment Frequency
                                </h6>
                            </CardHeader>
                            <CardBody>
                                {monthly.length === 0 ? (
                                    <EmptyState text="No data" />
                                ) : (
                                    <Chart
                                        options={monthlyCountOptions}
                                        series={monthlyCountSeries}
                                        type="area"
                                        height={320}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Distribution pies */}
                <Row className="row-gap-3 mb-3">
                    <Col xs={12} lg={6}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-info bg-opacity-10">
                                <h6 className="mb-0 fw-bold text-info">
                                    <i className="ti ti-briefcase me-1"></i> Designation Breakdown
                                </h6>
                            </CardHeader>
                            <CardBody>
                                {designations.length === 0 ? (
                                    <EmptyState text="No employees" />
                                ) : (
                                    <Chart
                                        options={designationOptions}
                                        series={designationSeries}
                                        type="donut"
                                        height={320}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-warning bg-opacity-10">
                                <h6 className="mb-0 fw-bold text-warning">
                                    <i className="ti ti-credit-card me-1"></i> Payment Mode Distribution
                                </h6>
                            </CardHeader>
                            <CardBody>
                                {paymentModes.length === 0 ? (
                                    <EmptyState text="No payments" />
                                ) : (
                                    <Chart
                                        options={modeOptions}
                                        series={modeSeries}
                                        type="pie"
                                        height={320}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Top employees + Recent payments */}
                <Row className="row-gap-3 mb-3">
                    <Col xs={12} lg={6}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-between">
                                <h6 className="mb-0 fw-bold text-primary">
                                    <i className="ti ti-trophy me-1"></i> Top 10 Employees by Payment
                                </h6>
                                <Badge bg="light" className="text-dark">
                                    {topEmployees.length}
                                </Badge>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="table-responsive" style={{ maxHeight: 360 }}>
                                    <table className="table table-sm table-hover align-middle mb-0">
                                        <thead className="bg-light sticky-top">
                                            <tr>
                                                <th>#</th>
                                                <th>Employee</th>
                                                <th className="text-end">Total Paid</th>
                                                <th className="text-end">Txns</th>
                                                <th>Last Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topEmployees.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-muted py-3">
                                                        No payments found
                                                    </td>
                                                </tr>
                                            ) : (
                                                topEmployees.map((emp, idx) => (
                                                    <tr key={emp.Employee}>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    idx === 0
                                                                        ? "warning"
                                                                        : idx === 1
                                                                            ? "secondary"
                                                                            : idx === 2
                                                                                ? "info"
                                                                                : "light"
                                                                }
                                                                className={idx > 2 ? "text-dark" : ""}
                                                            >
                                                                {idx + 1}
                                                            </Badge>
                                                        </td>
                                                        <td className="fw-medium">{emp.Employee}</td>
                                                        <td className="text-end fw-bold text-primary">
                                                            ₹ {formatINR(emp.Total)}
                                                        </td>
                                                        <td className="text-end">{emp.Count}</td>
                                                        <td className="small text-muted">{emp.LastPaid || "-"}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-success bg-opacity-10 d-flex align-items-center justify-content-between">
                                <h6 className="mb-0 fw-bold text-success">
                                    <i className="ti ti-history me-1"></i> Recent Payments
                                </h6>
                                <Badge bg="light" className="text-dark">
                                    {recentPayments.length}
                                </Badge>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="table-responsive" style={{ maxHeight: 360 }}>
                                    <table className="table table-sm table-hover align-middle mb-0">
                                        <thead className="bg-light sticky-top">
                                            <tr>
                                                <th>Date</th>
                                                <th>Employee</th>
                                                <th>Mode</th>
                                                <th className="text-end">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentPayments.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center text-muted py-3">
                                                        No recent payments
                                                    </td>
                                                </tr>
                                            ) : (
                                                recentPayments.map((a, idx) => (
                                                    <tr key={`${a.Date1}-${a.Employee}-${idx}`}>
                                                        <td className="small">{a.Date1 || "-"}</td>
                                                        <td className="fw-medium">{a.Employee || "-"}</td>
                                                        <td>
                                                            <Badge
                                                                bg="info"
                                                                className="bg-opacity-25 text-info border border-info border-opacity-25"
                                                            >
                                                                {a.Mode || "Cash"}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end fw-bold text-success">
                                                            ₹ {formatINR(a.Amount)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Employee directory with payment summary */}
                <Card className="shadow-sm mb-3">
                    <CardHeader className="bg-secondary bg-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h6 className="mb-0 fw-bold text-secondary">
                            <i className="ti ti-list-details me-1"></i> Employee Payment Summary
                        </h6>
                        <Form.Control
                            type="search"
                            size="sm"
                            placeholder="Search by name / designation / contact..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ maxWidth: 280 }}
                        />
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>S.No</th>
                                        <th>Employee</th>
                                        <th>Designation</th>
                                        <th>Contact</th>
                                        <th>DOJ</th>
                                        <th>Status</th>
                                        <th className="text-end">Total Paid</th>
                                        <th className="text-end">Txns</th>
                                        <th>Last Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployeeSummary.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center text-muted py-3">
                                                {employeeSummary.length === 0
                                                    ? "No employees found"
                                                    : "No employees match your search"}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployeeSummary.map((e, idx) => {
                                            const isActive = (e.Status || "").toLowerCase() === "active";
                                            return (
                                                <tr key={`${e.Employee}-${idx}`}>
                                                    <td>{idx + 1}</td>
                                                    <td className="fw-medium">{e.Employee || "-"}</td>
                                                    <td>{e.Designation || "-"}</td>
                                                    <td className="small">{e.Contact || "-"}</td>
                                                    <td className="small">{e.DOJ || "-"}</td>
                                                    <td>
                                                        <Badge
                                                            bg={isActive ? "success" : "danger"}
                                                            className="bg-opacity-25 border"
                                                        >
                                                            <span
                                                                className={isActive ? "text-success" : "text-danger"}
                                                            >
                                                                {isActive ? "Active" : "Inactive"}
                                                            </span>
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end fw-bold text-primary">
                                                        ₹ {formatINR(e.TotalPaid)}
                                                    </td>
                                                    <td className="text-end">{e.PaymentsCount}</td>
                                                    <td className="small text-muted">{e.LastPaid || "-"}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {filteredEmployeeSummary.length > 0 && (
                                    <tfoot className="border-top">
                                        <tr className="bg-secondary bg-opacity-10 fw-bold">
                                            <td colSpan={6}>Total ({filteredEmployeeSummary.length})</td>
                                            <td className="text-end text-primary">
                                                ₹ {formatINR(kpi.TotalPaid)}
                                            </td>
                                            <td className="text-end">{kpi.PaymentsCount}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

interface KpiCardProps {
    label: string;
    value: number;
    icon: string;
    color: string;
    loading: boolean;
    isCurrency?: boolean;
}

const KpiCard = ({
    label,
    value,
    icon,
    color,
    loading,
    isCurrency = true,
}: KpiCardProps) => (
    <Col xs={6} md={4} xl={2}>
        <div className={`p-3 border rounded h-100 bg-${color} bg-opacity-10`}>
            <div className="d-flex align-items-start justify-content-between">
                <div className="flex-grow-1">
                    <p className="fs-13 text-muted mb-1">{label}</p>
                    <h5 className={`mb-0 fw-bold text-${color}`}>
                        {loading ? (
                            <span className="placeholder col-8 rounded" />
                        ) : isCurrency ? (
                            <>
                                ₹{" "}
                                <CountUp
                                    start={0}
                                    end={value}
                                    duration={1.2}
                                    separator=","
                                    decimals={0}
                                />
                            </>
                        ) : (
                            <CountUp start={0} end={value} duration={1.2} />
                        )}
                    </h5>
                </div>
                <span
                    className={`avatar rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-25`}
                    style={{ width: 38, height: 38 }}
                >
                    <i className={`${icon} fs-16 text-${color}`} />
                </span>
            </div>
        </div>
    </Col>
);

const EmptyState = ({ text }: { text: string }) => (
    <div
        className="text-center p-4 border rounded bg-light"
        style={{
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <p className="m-0 text-muted">{text}</p>
    </div>
);

export default EmployeeAnalysis;

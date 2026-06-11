import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardBody, CardHeader, Col, Row } from "react-bootstrap";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import CountUp from "react-countup";
import CollapseIcons from "../../../components/collapse-icons/collapseIcons";

interface MonthRow {
  Month: string;
  YM: string;
  Revenue?: number;
  Income?: number;
  Expenditure: number;
  Net: number;
}

interface SummaryResponse {
  FY: string;
  FromDate: string;
  ToDate: string;
  Revenue?: number;
  Income?: number;
  Expenditure: number;
  Net: number;
  Monthly: MonthRow[];
}

interface DieselMonthRow {
  Month: string;
  YM: string;
  PurchasedLitres: number;
  PurchasedAmount: number;
  PurchaseRate: number;
  IssuedLitres: number;
  IssuedAmount: number;
  IssueRate: number;
  LitresVariance: number;
  AmountVariance: number;
}

interface DieselResponse {
  FY: string;
  FromDate: string;
  ToDate: string;
  PurchasedLitres: number;
  PurchasedAmount: number;
  PurchaseRate: number;
  IssuedLitres: number;
  IssuedAmount: number;
  IssueRate: number;
  LitresVariance: number;
  AmountVariance: number;
  Monthly: DieselMonthRow[];
}

interface StockMonthRow {
  Month: string;
  YM: string;
  Purchase: number;
  Stock: number;
  Net: number;
}

interface MaterialRow {
  Material: string;
  Measurement: string;
  OpeningQty: number;
  OpeningValue: number;
  PurchasedQty: number;
  PurchasedAmount: number;
  IssuedQty: number;
  IssuedAmount: number;
  ClosingQty: number;
}

interface StockResponse {
  FY: string;
  FromDate: string;
  ToDate: string;
  MaterialsCount: number;
  OpeningQty: number;
  OpeningValue: number;
  PurchasedQty: number;
  PurchasedAmount: number;
  IssuedQty: number;
  IssuedAmount: number;
  ClosingQty: number;
  Monthly: StockMonthRow[];
  TopConsuming: MaterialRow[];
  LowConsuming: MaterialRow[];
  DeadStock: MaterialRow[];
  Materials: MaterialRow[];
}

const formatINR = (n: number | undefined): string => {
  if (n === undefined || n === null || isNaN(n as number)) return "0";
  return Math.round(n).toLocaleString("en-IN");
};

const FinancialsDashboard = () => {
  const [financials, setFinancials] = useState<SummaryResponse | null>(null);
  const [incomeExp, setIncomeExp] = useState<SummaryResponse | null>(null);
  const [diesel, setDiesel] = useState<DieselResponse | null>(null);
  const [stock, setStock] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const id = sessionStorage.getItem("selectedItems") ?? "IMIE08042023";
        const [fin, ie, ds, sb] = await Promise.all([
          axios.get<SummaryResponse>(
            `https://norisapi.noris.in/Crusher/Financials.php?ID=${id}`
          ),
          axios.get<SummaryResponse>(
            `https://norisapi.noris.in/Crusher/IncomeExpenditure.php?ID=${id}`
          ),
          axios.get<DieselResponse>(
            `https://norisapi.noris.in/Crusher/Diesel.php?ID=${id}`
          ),
          axios.get<StockResponse>(
            `https://norisapi.noris.in/Crusher/StockBalance.php?ID=${id}`
          ),
        ]);
        setFinancials(fin.data);
        setIncomeExp(ie.data);
        setDiesel(ds.data);
        setStock(sb.data);
      } catch (err) {
        console.error("Financials fetch error:", err);
        setError("Failed to load financial data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content p-1">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap p-2">
          <div>
            <h5 className="mb-0">Financials Dashboard</h5>
            <small className="text-muted">
              {financials?.FY
                ? `FY ${financials.FY} • ${financials.FromDate} to ${financials.ToDate}`
                : "Loading…"}
            </small>
          </div>
          <CollapseIcons />
        </div>

        {error && (
          <div className="alert alert-danger m-2" role="alert">
            {error}
          </div>
        )}

        {/* Section 1: Revenue & Expenditure (Financials.php) */}
        <Section
          title="Revenue & Expenditure"
          accent="primary"
          data={financials}
          primaryKey="Revenue"
          loading={loading}
        />

        {/* Section 2: Income & Expenditure (IncomeExpenditure.php) */}
        <Section
          title="Income & Expenditure"
          accent="success"
          data={incomeExp}
          primaryKey="Income"
          loading={loading}
        />

        {/* Section 3: Diesel (Diesel.php) */}
        <DieselSection data={diesel} loading={loading} />

        {/* Section 4: Stock Balance (StockBalance.php) */}
        <StockSection data={stock} loading={loading} />
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  accent: "primary" | "success";
  data: SummaryResponse | null;
  primaryKey: "Revenue" | "Income";
  loading: boolean;
}

const Section = ({ title, accent, data, primaryKey, loading }: SectionProps) => {
  const primaryValue = data?.[primaryKey] ?? 0;
  const expenditure = data?.Expenditure ?? 0;
  const net = data?.Net ?? 0;
  const monthly = useMemo(() => data?.Monthly ?? [], [data]);

  const categories = monthly.map((m) => m.Month);
  const seriesPrimary = monthly.map((m) =>
    Number((m[primaryKey as keyof MonthRow] as number) ?? 0)
  );
  const seriesExpenditure = monthly.map((m) => Number(m.Expenditure ?? 0));
  const seriesNet = monthly.map((m) => Number(m.Net ?? 0));

  const accentColor = accent === "primary" ? "#e41f07" : "#198754";

  const barOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      stacked: false,
      fontFamily: "inherit",
    },
    colors: [accentColor, "#f59e0b", "#3b82f6"],
    plotOptions: {
      bar: { columnWidth: "55%", borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
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
    tooltip: {
      y: { formatter: (val: number) => "₹ " + formatINR(val) },
    },
    grid: { borderColor: "#eee", strokeDashArray: 4 },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: { bar: { columnWidth: "75%" } },
          legend: { position: "bottom" },
          xaxis: { labels: { rotate: -60 } },
        },
      },
    ],
  };

  const series = [
    { name: primaryKey, data: seriesPrimary },
    { name: "Expenditure", data: seriesExpenditure },
    { name: "Net", data: seriesNet },
  ];

  return (
    <Card className="mb-3 shadow-sm">
      <CardHeader
        className={`bg-${accent} bg-opacity-10 d-flex align-items-center justify-content-between`}
      >
        <h6 className={`mb-0 fw-bold text-${accent}`}>{title}</h6>
        {data?.FY && (
          <span className="badge bg-light text-dark">FY {data.FY}</span>
        )}
      </CardHeader>
      <CardBody>
        {/* Widget row */}
        <Row className="row-gap-3 mb-3">
          <SummaryWidget
            label={primaryKey}
            value={primaryValue}
            icon="ti ti-trending-up"
            color={accent}
            loading={loading}
          />
          <SummaryWidget
            label="Expenditure"
            value={expenditure}
            icon="ti ti-trending-down"
            color="warning"
            loading={loading}
          />
          <SummaryWidget
            label="Net"
            value={net}
            icon="ti ti-wallet"
            color={net >= 0 ? "success" : "danger"}
            loading={loading}
          />
          <SummaryWidget
            label="Months Tracked"
            value={monthly.length}
            icon="ti ti-calendar"
            color="info"
            loading={loading}
            isCurrency={false}
          />
        </Row>

        {/* Chart */}
        <Row>
          <Col xs={12} lg={7}>
            {loading ? (
              <ChartSkeleton />
            ) : monthly.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ width: "100%" }}>
                <Chart
                  options={barOptions}
                  series={series}
                  type="bar"
                  height={340}
                />
              </div>
            )}
          </Col>

          {/* Table */}
          <Col xs={12} lg={5}>
            <div className="table-responsive" style={{ maxHeight: 340 }}>
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className={`bg-${accent} bg-opacity-10`}>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">{primaryKey}</th>
                    <th className="text-end">Expenditure</th>
                    <th className="text-end">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4}>
                          <div className="placeholder-glow">
                            <span className="placeholder col-12 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : monthly.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    monthly.map((m) => {
                      const primary = Number(
                        (m[primaryKey as keyof MonthRow] as number) ?? 0
                      );
                      return (
                        <tr key={m.YM}>
                          <td className="fw-medium">{m.Month}</td>
                          <td className="text-end">{formatINR(primary)}</td>
                          <td className="text-end">{formatINR(m.Expenditure)}</td>
                          <td
                            className={`text-end fw-medium ${m.Net < 0 ? "text-danger" : ""
                              }`}
                          >
                            {formatINR(m.Net)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {!loading && monthly.length > 0 && (
                  <tfoot className="border-top">
                    <tr className={`bg-${accent} bg-opacity-10 fw-bold`}>
                      <td>Total</td>
                      <td className="text-end">{formatINR(primaryValue)}</td>
                      <td className="text-end">{formatINR(expenditure)}</td>
                      <td
                        className={`text-end ${net < 0 ? "text-danger" : `text-${accent}`
                          }`}
                      >
                        {formatINR(net)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

interface SummaryWidgetProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  loading: boolean;
  isCurrency?: boolean;
}

const SummaryWidget = ({
  label,
  value,
  icon,
  color,
  loading,
  isCurrency = true,
}: SummaryWidgetProps) => (
  <Col xs={6} md={6} xl={3}>
    <div className={`p-3 border rounded h-100 bg-${color} bg-opacity-10`}>
      <div className="d-flex align-items-start justify-content-between">
        <div>
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
                  duration={1.5}
                  separator=","
                  decimals={0}
                />
              </>
            ) : (
              <CountUp start={0} end={value} duration={1.5} />
            )}
          </h5>
        </div>
        <span
          className={`avatar rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-25`}
          style={{ width: 42, height: 42 }}
        >
          <i className={`${icon} fs-18 text-${color}`} />
        </span>
      </div>
    </div>
  </Col>
);

const ChartSkeleton = () => (
  <div
    style={{
      height: 340,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      className="spinner-border text-primary"
      style={{ width: "2.5rem", height: "2.5rem" }}
    />
  </div>
);

const EmptyState = () => (
  <div
    className="text-center p-4 border rounded bg-light"
    style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <p className="m-0 text-muted">No data available for this period.</p>
  </div>
);

interface DieselSectionProps {
  data: DieselResponse | null;
  loading: boolean;
}

const DieselSection = ({ data, loading }: DieselSectionProps) => {
  const monthly = useMemo(() => data?.Monthly ?? [], [data]);
  const categories = monthly.map((m) => m.Month);
  const purchasedLitres = monthly.map((m) => Number(m.PurchasedLitres ?? 0));
  const issuedLitres = monthly.map((m) => Number(m.IssuedLitres ?? 0));
  const purchasedAmount = monthly.map((m) => Number(m.PurchasedAmount ?? 0));
  const issuedAmount = monthly.map((m) => Number(m.IssuedAmount ?? 0));

  const litresOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#0ea5e9", "#f97316"],
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
      labels: { rotate: -45, style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + "K L";
          return Math.round(val) + " L";
        },
      },
    },
    legend: { position: "top", horizontalAlign: "center" },
    tooltip: {
      y: { formatter: (val: number) => formatINR(val) + " L" },
    },
    grid: { borderColor: "#eee", strokeDashArray: 4 },
  };

  const amountOptions: ApexOptions = {
    chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#0ea5e9", "#f97316"],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 4 },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
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

  const purchasedLitresTotal = data?.PurchasedLitres ?? 0;
  const issuedLitresTotal = data?.IssuedLitres ?? 0;
  const purchasedAmountTotal = data?.PurchasedAmount ?? 0;
  const issuedAmountTotal = data?.IssuedAmount ?? 0;
  const purchaseRate = data?.PurchaseRate ?? 0;
  const issueRate = data?.IssueRate ?? 0;

  return (
    <Card className="mb-3 shadow-sm">
      <CardHeader className="bg-info bg-opacity-10 d-flex align-items-center justify-content-between">
        <h6 className="mb-0 fw-bold text-info">Diesel Purchase & Issue</h6>
        {data?.FY && (
          <span className="badge bg-light text-dark">FY {data.FY}</span>
        )}
      </CardHeader>
      <CardBody>
        <Row className="row-gap-3 mb-3">
          <SummaryWidget
            label="Purchased Litres"
            value={purchasedLitresTotal}
            icon="ti ti-gas-station"
            color="info"
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Issued Litres"
            value={issuedLitresTotal}
            icon="ti ti-flame"
            color="warning"
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Purchase Amount"
            value={purchasedAmountTotal}
            icon="ti ti-shopping-cart"
            color="primary"
            loading={loading}
          />
          <SummaryWidget
            label="Issue Amount"
            value={issuedAmountTotal}
            icon="ti ti-truck-delivery"
            color="success"
            loading={loading}
          />
          <SummaryWidget
            label="Purchase Rate / L"
            value={purchaseRate}
            icon="ti ti-currency-rupee"
            color="info"
            loading={loading}
          />
          <SummaryWidget
            label="Issue Rate / L"
            value={issueRate}
            icon="ti ti-currency-rupee"
            color="warning"
            loading={loading}
          />
          {/* <SummaryWidget
            label="Litres Variance"
            value={litresVariance}
            icon="ti ti-scale"
            color={litresVariance < 0 ? "danger" : "success"}
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Amount Variance"
            value={amountVariance}
            icon="ti ti-arrows-diff"
            color={amountVariance < 0 ? "danger" : "success"}
            loading={loading}
          /> */}
        </Row>

        <Row>
          <Col xs={12} lg={6}>
            <h6 className="fw-semibold mb-2 text-muted">Litres (Purchased vs Issued)</h6>
            {loading ? (
              <ChartSkeleton />
            ) : monthly.length === 0 ? (
              <EmptyState />
            ) : (
              <Chart
                options={litresOptions}
                series={[
                  { name: "Purchased Litres", data: purchasedLitres },
                  { name: "Issued Litres", data: issuedLitres },
                ]}
                type="bar"
                height={320}
              />
            )}
          </Col>
          <Col xs={12} lg={6}>
            <h6 className="fw-semibold mb-2 text-muted">Amount (Purchased vs Issued)</h6>
            {loading ? (
              <ChartSkeleton />
            ) : monthly.length === 0 ? (
              <EmptyState />
            ) : (
              <Chart
                options={amountOptions}
                series={[
                  { name: "Purchased Amount", data: purchasedAmount },
                  { name: "Issued Amount", data: issuedAmount },
                ]}
                type="line"
                height={320}
              />
            )}
          </Col>
        </Row>

        <div className="table-responsive mt-3" style={{ maxHeight: 420 }}>
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="bg-info bg-opacity-10">
              <tr>
                <th>Month</th>
                <th className="text-end">Purch. Litres</th>
                <th className="text-end">Issue Litres</th>
                <th className="text-end">Purch. Rate</th>
                <th className="text-end">Issue Rate</th>
                <th className="text-end">Purch. Amount</th>
                <th className="text-end">Issue Amount</th>
                {/* <th className="text-end">L. Variance</th>
                <th className="text-end">₹ Variance</th> */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9}>
                      <div className="placeholder-glow">
                        <span className="placeholder col-12 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : monthly.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-3">
                    No diesel data available
                  </td>
                </tr>
              ) : (
                monthly.map((m) => (
                  <tr key={m.YM}>
                    <td className="fw-medium">{m.Month}</td>
                    <td className="text-end">{formatINR(m.PurchasedLitres)}</td>
                    <td className="text-end">{formatINR(m.IssuedLitres)}</td>
                    <td className="text-end">{m.PurchaseRate ? m.PurchaseRate.toFixed(2) : "—"}</td>
                    <td className="text-end">{m.IssueRate ? m.IssueRate.toFixed(2) : "—"}</td>
                    <td className="text-end">{formatINR(m.PurchasedAmount)}</td>
                    <td className="text-end">{formatINR(m.IssuedAmount)}</td>
                    {/* <td
                      className={`text-end fw-medium ${
                        m.LitresVariance < 0 ? "text-danger" : m.LitresVariance > 0 ? "text-success" : ""
                      }`}
                    >
                      {formatINR(m.LitresVariance)}
                    </td>
                    <td
                      className={`text-end fw-medium ${
                        m.AmountVariance < 0 ? "text-danger" : m.AmountVariance > 0 ? "text-success" : ""
                      }`}
                    >
                      {formatINR(m.AmountVariance)}
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
            {!loading && monthly.length > 0 && (
              <tfoot className="border-top">
                <tr className="bg-info bg-opacity-10 fw-bold">
                  <td>Total</td>
                  <td className="text-end">{formatINR(purchasedLitresTotal)}</td>
                  <td className="text-end">{formatINR(issuedLitresTotal)}</td>
                  <td className="text-end">{purchaseRate ? purchaseRate.toFixed(2) : "—"}</td>
                  <td className="text-end">{issueRate ? issueRate.toFixed(2) : "—"}</td>
                  <td className="text-end">{formatINR(purchasedAmountTotal)}</td>
                  <td className="text-end">{formatINR(issuedAmountTotal)}</td>
                  {/* <td className={`text-end ${litresVariance < 0 ? "text-danger" : "text-success"}`}>
                    {formatINR(litresVariance)}
                  </td>
                  <td className={`text-end ${amountVariance < 0 ? "text-danger" : "text-success"}`}>
                    {formatINR(amountVariance)}
                  </td> */}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

interface StockSectionProps {
  data: StockResponse | null;
  loading: boolean;
}

const StockSection = ({ data, loading }: StockSectionProps) => {
  const monthly = useMemo(() => data?.Monthly ?? [], [data]);
  const deadStock = useMemo(() => data?.DeadStock ?? [], [data]);
  const allMaterials = useMemo(() => data?.Materials ?? [], [data]);
  const topConsuming = useMemo(() => data?.TopConsuming ?? [], [data]);
  const lowConsuming = useMemo(() => data?.LowConsuming ?? [], [data]);

  const topMaterialsByValue = useMemo(() => {
    return [...allMaterials]
      .sort((a, b) => {
        const aVal = (a.ClosingQty ?? 0) * 1 + (a.OpeningValue ?? 0);
        const bVal = (b.ClosingQty ?? 0) * 1 + (b.OpeningValue ?? 0);
        return bVal - aVal;
      })
      .slice(0, 25);
  }, [allMaterials]);

  const categories = monthly.map((m) => m.Month);
  const purchaseSeries = monthly.map((m) => Number(m.Purchase ?? 0));
  const stockSeries = monthly.map((m) => Number(m.Stock ?? 0));
  const netSeries = monthly.map((m) => Number(m.Net ?? 0));

  const chartOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", stacked: false },
    colors: ["#7c3aed", "#f97316", "#10b981"],
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
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

  const openingQty = data?.OpeningQty ?? 0;
  const openingValue = data?.OpeningValue ?? 0;
  const purchasedQtyTotal = data?.PurchasedQty ?? 0;
  const purchasedAmountTotal = data?.PurchasedAmount ?? 0;
  const issuedQtyTotal = data?.IssuedQty ?? 0;
  const issuedAmountTotal = data?.IssuedAmount ?? 0;
  const closingQty = data?.ClosingQty ?? 0;
  const materialsCount = data?.MaterialsCount ?? 0;

  return (
    <Card className="mb-3 shadow-sm">
      <CardHeader className="d-flex align-items-center justify-content-between" style={{ background: "rgba(124, 58, 237, 0.10)" }}>
        <h6 className="mb-0 fw-bold" style={{ color: "#7c3aed" }}>
          Stock Balance & Inventory
        </h6>
        {data?.FY && (
          <span className="badge bg-light text-dark">FY {data.FY}</span>
        )}
      </CardHeader>
      <CardBody>
        {/* Widgets */}
        <Row className="row-gap-3 mb-3">
          <SummaryWidget
            label="Opening Qty"
            value={openingQty}
            icon="ti ti-box"
            color="info"
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Opening Value"
            value={openingValue}
            icon="ti ti-currency-rupee"
            color="primary"
            loading={loading}
          />
          <SummaryWidget
            label="Purchased Qty"
            value={purchasedQtyTotal}
            icon="ti ti-shopping-cart"
            color="success"
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Purchased Amount"
            value={purchasedAmountTotal}
            icon="ti ti-cash"
            color="success"
            loading={loading}
          />
          <SummaryWidget
            label="Issued Qty"
            value={issuedQtyTotal}
            icon="ti ti-truck-delivery"
            color="warning"
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Issued Amount"
            value={issuedAmountTotal}
            icon="ti ti-receipt"
            color="warning"
            loading={loading}
          />
          <SummaryWidget
            label="Closing Qty"
            value={closingQty}
            icon="ti ti-package"
            color="info"
            loading={loading}
            isCurrency={false}
          />
          <SummaryWidget
            label="Materials Count"
            value={materialsCount}
            icon="ti ti-list"
            color="primary"
            loading={loading}
            isCurrency={false}
          />
        </Row>

        {/* Chart + monthly table */}
        <Row className="mb-3">
          <Col xs={12} lg={7}>
            <h6 className="fw-semibold mb-2 text-muted">
              Monthly Movement (Purchased vs Issued vs Net)
            </h6>
            {loading ? (
              <ChartSkeleton />
            ) : monthly.length === 0 ? (
              <EmptyState />
            ) : (
              <Chart
                options={chartOptions}
                series={[
                  { name: "Purchase", data: purchaseSeries },
                  { name: "Stock", data: stockSeries },
                  { name: "Net", data: netSeries },
                ]}
                type="bar"
                height={340}
              />
            )}
          </Col>
          <Col xs={12} lg={5}>
            <h6 className="fw-semibold mb-2 text-muted">Monthly Summary</h6>
            <div className="table-responsive" style={{ maxHeight: 340 }}>
              <table className="table table-sm table-hover align-middle mb-0">
                <thead style={{ background: "rgba(124, 58, 237, 0.10)" }}>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Purchase</th>
                    <th className="text-end">Stock</th>
                    {/* <th className="text-end">Net</th> */}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5}>
                          <div className="placeholder-glow">
                            <span className="placeholder col-12 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : monthly.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">
                        No monthly data
                      </td>
                    </tr>
                  ) : (
                    monthly.map((m) => (
                      <tr key={m.YM}>
                        <td className="fw-medium">{m.Month}</td>
                        <td className="text-end">{formatINR(m.Purchase)}</td>
                        <td className="text-end">{formatINR(m.Stock)}</td>
                        {/* <td className="text-end">{formatINR(m.PurchasedAmount)}</td>
                        <td
                          className={`text-end fw-medium ${
                            m.NetMovement < 0 ? "text-danger" : m.NetMovement > 0 ? "text-success" : ""
                          }`}
                        >
                          {formatINR(m.NetMovement)}
                        </td> */}
                      </tr>
                    ))
                  )}
                </tbody>
                {!loading && monthly.length > 0 && (
                  <tfoot className="border-top">
                    <tr style={{ background: "rgba(124, 58, 237, 0.10)" }} className="fw-bold">
                      <td>Total</td>
                      <td className="text-end">
                        {formatINR(purchaseSeries.reduce((a, b) => a + b, 0))}
                      </td>
                      <td className="text-end">
                        {formatINR(stockSeries.reduce((a, b) => a + b, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Col>
        </Row>

        {/* Dead Stock + Top/Low Consuming */}
        <Row className="mb-3">
          <Col xs={12} lg={6}>
            <MaterialsTable
              title="Dead Stock"
              titleIcon="ti ti-alert-triangle"
              titleColor="danger"
              rows={deadStock}
              loading={loading}
              emptyText="No dead stock items"
            />
          </Col>
          <Col xs={12} lg={6}>
            {topConsuming.length > 0 ? (
              <MaterialsTable
                title="Top Consuming Materials"
                titleIcon="ti ti-trending-up"
                titleColor="success"
                rows={topConsuming}
                loading={loading}
                emptyText="No data"
              />
            ) : lowConsuming.length > 0 ? (
              <MaterialsTable
                title="Low Consuming Materials"
                titleIcon="ti ti-trending-down"
                titleColor="warning"
                rows={lowConsuming}
                loading={loading}
                emptyText="No data"
              />
            ) : (
              <Card className="h-100">
                <CardHeader className="bg-light fw-bold">
                  <i className="ti ti-info-circle me-1" /> Consumption Insights
                </CardHeader>
                <CardBody className="text-center text-muted d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
                  No consumption data for this period yet.
                </CardBody>
              </Card>
            )}
          </Col>
        </Row>

        {/* All materials (sorted by value) */}
        <h6 className="fw-semibold mb-2 text-muted">
          Top {topMaterialsByValue.length} Materials (of {materialsCount} total)
        </h6>
        <div className="table-responsive" style={{ maxHeight: 420 }}>
          <table className="table table-sm table-hover align-middle mb-0">
            <thead style={{ background: "rgba(124, 58, 237, 0.10)", position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                <th>Material</th>
                <th>Unit</th>
                <th className="text-end">Opening Qty</th>
                <th className="text-end">Opening ₹</th>
                <th className="text-end">Purch Qty</th>
                <th className="text-end">Purch ₹</th>
                <th className="text-end">Issue Qty</th>
                <th className="text-end">Issue ₹</th>
                <th className="text-end">Closing Qty</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9}>
                      <div className="placeholder-glow">
                        <span className="placeholder col-12 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : topMaterialsByValue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-3">
                    No materials available
                  </td>
                </tr>
              ) : (
                topMaterialsByValue.map((m, i) => (
                  <tr key={`${m.Material}-${i}`}>
                    <td className="fw-medium">{m.Material}</td>
                    <td>{m.Measurement}</td>
                    <td className="text-end">{formatINR(m.OpeningQty)}</td>
                    <td className="text-end">{formatINR(m.OpeningValue)}</td>
                    <td className="text-end">{formatINR(m.PurchasedQty)}</td>
                    <td className="text-end">{formatINR(m.PurchasedAmount)}</td>
                    <td className="text-end">{formatINR(m.IssuedQty)}</td>
                    <td className="text-end">{formatINR(m.IssuedAmount)}</td>
                    <td className="text-end fw-medium">{formatINR(m.ClosingQty)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

interface MaterialsTableProps {
  title: string;
  titleIcon: string;
  titleColor: string;
  rows: MaterialRow[];
  loading: boolean;
  emptyText: string;
}

const MaterialsTable = ({
  title,
  titleIcon,
  titleColor,
  rows,
  loading,
  emptyText,
}: MaterialsTableProps) => (
  <Card className="h-100">
    <CardHeader className={`bg-${titleColor} bg-opacity-10 fw-bold text-${titleColor}`}>
      <i className={`${titleIcon} me-1`} /> {title}
    </CardHeader>
    <CardBody className="p-0">
      <div className="table-responsive" style={{ maxHeight: 280 }}>
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th>Material</th>
              <th>Unit</th>
              <th className="text-end">Closing Qty</th>
              <th className="text-end">Opening ₹</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4}>
                    <div className="placeholder-glow">
                      <span className="placeholder col-12 rounded" />
                    </div>
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-3">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((m, i) => (
                <tr key={`${m.Material}-${i}`}>
                  <td className="fw-medium" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.Material}
                  </td>
                  <td>{m.Measurement}</td>
                  <td className="text-end">{formatINR(m.ClosingQty)}</td>
                  <td className="text-end">{formatINR(m.OpeningValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CardBody>
  </Card>
);

export default FinancialsDashboard;

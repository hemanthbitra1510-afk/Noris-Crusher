import axios from "axios";
import ImageWithBasePath from "../../../components/imageWithBasePath";
import { useEffect, useState } from "react";
import CountUp from "react-countup";

interface SummaryResponse {
  Receipt: number;
  Received: number;
  Paid: number;
  Balance: number;
}

interface WidgetConfig {
  key: keyof SummaryResponse;
  label: string;
  icon: string;
  textClass: string;
  percent: string;
  trend: "up" | "down";
}

const FinancialWidgets = () => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet();
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/FinanaceDashBoard.php?ID=${id}&Table=TotalSummary`
      );

      const cleaned: SummaryResponse = {
        Receipt: parseFloat(String(res.data.Receipt).replace(/,/g, "")) || 0,
        Received: parseFloat(String(res.data.Received).replace(/,/g, "")) || 0,
        Paid: parseFloat(String(res.data.Paid).replace(/,/g, "")) || 0,
        Balance: parseFloat(String(res.data.Balance).replace(/,/g, "")) || 0,
      };

      setSummary(cleaned);
    } catch (error) {
      console.error("Summary API error:", error);
    } finally {
      setLoading(false); // ✅ STOP LOADING
    }
  };

  const widgets: WidgetConfig[] = [
    {
      key: "Receipt",
      label: "Receipt",
      icon: "ti ti-building",
      bgClass: "bg-soft-primary border border-primary",
      textClass: "text-primary",
      percent: "5.62%",
      trend: "up",
    },
    {
      key: "Received",
      label: "Received",
      icon: "ti ti-cash",
      bgClass: "bg-soft-success border border-success",
      textClass: "text-success",
      percent: "12%",
      trend: "down",
    },
    {
      key: "Paid",
      label: "Paid",
      icon: "ti ti-credit-card",
      bgClass: "bg-soft-warning border border-warning",
      textClass: "text-warning",
      percent: "6%",
      trend: "up",
    },
    {
      key: "Balance",
      label: "Balance",
      icon: "ti ti-wallet",
      bgClass: "bg-soft-danger border border-danger",
      textClass: "text-primary",
      percent: "16%",
      trend: "down",
    },
  ];

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="row row-gap-3">
          {widgets.map((widget, index) => (
            <div className="col-xl-3 col-sm-6 d-flex" key={index}>
              <div className="flex-fill position-relative overflow-hidden p-3 border-end">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <p className="fs-15 mb-2">{widget.label}</p>
                    <h2 className="mb-2 fs-20">
                      {loading ? (
                        <div className="placeholder-glow" style={{ width: "80px" }}>
                          <span className="placeholder col-12 rounded"></span>
                        </div>
                      ) : (
                        <CountUp
                          start={0}
                          end={summary ? summary[widget.key] : 0}
                          duration={2}
                          separator=","
                        />
                      )}
                    </h2>
                    <p
                      className={`${widget.trend === "up" ? "text-success" : "text-danger"
                        } mb-0 fs-13`}
                    >
                      <i
                        className={`ti ${widget.trend === "up"
                          ? "ti-arrow-bar-up"
                          : "ti-arrow-bar-down"
                          } me-1 fs-15`}
                      />
                      {widget.percent}
                      <span className="text-body ms-1">from last month</span>
                    </p>
                  </div>
                  <span
                    className={`avatar rounded-circle d-flex align-items-center justify-content-center ${widget.bgClass}`}
                    style={{ width: "50px", height: "50px" }}
                  >
                    <i className={`${widget.icon} fs-20 ${widget.textClass}`} />
                  </span>
                </div>
                {/* <ImageWithBasePath
                  src={`assets/img/icons/elemnt-0${index + 1}.svg`}
                  alt={`elemnt-0${index + 1}`}
                  className="img-fluid position-absolute top-0 start-0 opacity-10"
                /> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialWidgets;


import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface TransporterData {
  Transporter: string;
  Trips: string;
  Amount: string;
  Paid: number;
  Balance: number;
}

const TransPorterList = () => {
  const accessDenied = checkPageAccess("Transporter", "Transport");
  if (accessDenied) return accessDenied;


  const [transporterList, setTransporterList] = useState<TransporterData[]>([]);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Transporter", key: "Transporter", dataType: "string" },
    { label: "Trips", key: "Trips", dataType: "string" },
    { label: "Amount", key: "Amount", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];

  useEffect(() => {
    apiGet();
  }, []);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<TransporterData[]>(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=Transporters`
      );
      setTransporterList(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching transporter data:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleLedgerSave = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const data = {
        ...formData,
        IDS: formData.ID,
      };
      delete data.ID;

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=LedgersRegistration`,
        data
      );

      setShowLedgerForm(false);
      apiGet();
    } catch (err) {
      console.error("Ledger save failed:", err);
    }
  };


  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  return (
    <div className="page-wrapper">
      <div className="content p-2">
        {loading ? (
          <div
            style={{
              height: "350px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 150,
                height: 150,
              }}
            >
              {/* Rotating Circle */}
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

              {/* Center Logo */}
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
        ) : (
          <ProductionList
            title="Transporter List"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={transporterList}
            onAddLedgerClick={hasPermission("Transporter", "Transport", "Added") ? () => setShowLedgerForm(true) : undefined} // ✅ ADD THIS
          />
        )}
        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}
        />

      </div>
    </div>
  );
};

export default TransPorterList;


import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Modal, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface PartyOption {
  value: string;
  label: string;
}

interface AgingRow {
  Party: string;
  Payable: number;
  Paid: number;
  Balance: number;
  Total: number;

  "Aging-30": number;
  "Aging-60": number;
  "Aging-90": number;
  "Aging-120": number;

  "Month-30": string;
  "Month-60": string;
  "Month-90": string;
  "Month-120": string;
}

const Aging = () => {
  const accessDenied = checkPageAccess("Accounts", "Aging");
  if (accessDenied) return accessDenied;

  const id = sessionStorage.getItem("selectedItems") ?? "";

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [selectedParty, setSelectedParty] = useState<PartyOption | null>(null);
  const [appliedParty, setAppliedParty] = useState<PartyOption | null>(null);
  const [agingData, setAgingData] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= MONTH FORMATTER ================= */

  const formatMonth = (date?: string) => {
    if (!date) return "";

    const [day, month, year] = date.split("-");

    return new Date(Number(year), Number(month) - 1).toLocaleString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  /* ================= MONTH LABELS ================= */

  const month30 = agingData?.[0]?.["Month-30"]
    ? formatMonth(agingData[0]["Month-30"])
    : "Month-1";

  const month60 = agingData?.[0]?.["Month-60"]
    ? formatMonth(agingData[0]["Month-60"])
    : "Month-2";

  const month90 = agingData?.[0]?.["Month-90"]
    ? formatMonth(agingData[0]["Month-90"])
    : "Month-3";

  const month120 = agingData?.[0]?.["Month-120"]
    ? formatMonth(agingData[0]["Month-120"])
    : "Month-4";

  /* ================= FETCH PARTY LIST ================= */

  const fetchParties = async () => {
    if (!id) return;

    try {
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      const options =
        res.data?.map((item: any) => ({
          value: item.PartyName || item.Party || item.LedgerName,
          label: item.PartyName || item.Party || item.LedgerName,
        })) || [];

      setPartyOptions(options);
    } catch (error) {
      console.error("Failed to fetch parties:", error);
      setPartyOptions([]);
    }
  };

  /* ================= FETCH AGING DATA ================= */

  const fetchAgingData = async (party?: string) => {
    if (!id) return;

    try {
      setLoading(true);

      const payload = {
        Party: party || "",
      };

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Aging.php?ID=${id}&TableName=Aging`,
        payload
      );

      setAgingData(res.data || []);

      // ✅ store cache
      sessionStorage.setItem("agingData", JSON.stringify(res.data || []));

    } catch (error) {
      console.error("Failed to fetch aging data:", error);
      setAgingData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (!id) return;

    fetchParties();

    const cachedAging = sessionStorage.getItem("agingData");

    if (cachedAging) {
      setAgingData(JSON.parse(cachedAging));
    } else {
      fetchAgingData();
    }
  }, [id]);

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

  /* ================= APPLY FILTER ================= */

  const handleApplyFilter = () => {
    setAppliedParty(selectedParty);
    fetchAgingData(selectedParty?.value);
    setShowFilterModal(false);
  };

  /* ================= TABLE HEADERS ================= */

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Payable", key: "Payable", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },

    { label: month30, key: "Aging-30", dataType: "number" },
    { label: month60, key: "Aging-60", dataType: "number" },
    { label: month90, key: "Aging-90", dataType: "number" },
    { label: month120, key: "Aging-120", dataType: "number" },

    { label: "Total", key: "Total", dataType: "number" },
  ];

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
            title="Aging Report"
            periodOptions={["All"]}
            tableHeaders={headers}
            dealsData={agingData}
            handleShow={() => setShowFilterModal(true)}
            appliedFilters={{
              Party: appliedParty?.label || "",
            }}
          />
        )}
        <Modal
          show={showFilterModal}
          onHide={() => setShowFilterModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Aging Filter</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">Party</label>
              <Select
                options={partyOptions}
                isClearable
                placeholder="Select Party..."
                value={selectedParty}
                onChange={(value) => setSelectedParty(value)}
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowFilterModal(false)}
            >
              Close
            </Button>

            <Button variant="primary" onClick={handleApplyFilter}>
              Apply
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </div>
  );
};

export default Aging;


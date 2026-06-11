import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import SourcesForm from "./sorcesForm";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DashboardListRow {
  [key: string]: string | number;
}

interface DebitorDeal extends DashboardListRow {
  ID: number;
  IMIE: string;
  Source: string;
  Date1: string;
  Time1: string;
}

type SummaryResponse = DebitorDeal[];

const SourcesList = () => {
  const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1" },
    { label: "Time", key: "Time1" },
    { label: "Source", key: "Source" },
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
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetSources`
      );
      setMaterialTop(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
    }
    finally {
      setLoading(false);
    }
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  const handleAddClick = () => {
    if (!hasPermission("Masters", "Source", "Added")) {
      showToast("Error", "No permission to add", "danger");
      return;
    }
    setShowModal(true);
  };


  const handleAddSource = async (source: string) => {
    if (!hasPermission("Masters", "Source", "Added")) {
      showToast("Error", "No permission to add", "danger");
      return;
    }
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(`https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=SaveSourceRegistration`, {
        Source: source,
      });
      showToast("Success", "CompanyInfo saved successfully!", "success");
      apiGet();
      setShowModal(false);
    } catch (err: any) {
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  const handleDelete = async (deal: DebitorDeal) => {
    if (!hasPermission("Masters", "Source", "Deleted")) {
      showToast("Error", "No permission to delete", "danger");
      return;
    }
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=DeleteSource`,
        { IDS: deal.ID, _method: "DELETE" }
      );
      showToast("Success", "CompanyInfo saved successfully!", "success");
      apiGet();
    } catch (err) {
      console.error("Error deleting source:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  // Bulk update removed

  const accessDenied = checkPageAccess("Masters", "Source");
  if (accessDenied) return accessDenied;
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
          <ListComponent
            title="Sources"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={materialTop}
            mainModule="Masters"
            subModule="Source"
            onAddClick={
              hasPermission("Masters", "Source", "Added")
                ? handleAddClick
                : undefined
            }
            handleDelete={
              hasPermission("Masters", "Source", "Deleted")
                ? (deal) => handleDelete(deal as any)
                : undefined
            }
            onSuccess={apiGet}
            showTotal={false}
          />
        )}
      </div>
      <SourcesForm
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleAddSource}
      />
    </div>
  );
};

export default SourcesList;


import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import LoginForm from "./loginForm";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DashboardListRow {
  [key: string]: string | number;
}

export interface DebitorDeal extends DashboardListRow {
  ID: string | number; // ✅ required for delete
  Mobile: number | string;
  Typed: string;
  UserName: string;
  DataInsert: string;
  DataUpdate: string;
  DataDelete: string;
  NoOfDays: string;
}

type SummaryResponse = DebitorDeal[];

const LoginList = () => {
  const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<DebitorDeal | null>(null); // ✅ tracks record to edit
  const [loading, setLoading] = useState<boolean>(true);
  const showToast = useToast();

  // Table headers
  const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "User Name", key: "UserName" },
    { label: "Mobile", key: "Mobile" },
    { label: "Typed", key: "Typed" },
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

  // ✅ Fetch data
  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetLogins`
      );

      setMaterialTop(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      setMaterialTop([]);
    } finally {
      setTimeout(() => {
        setLoading(false); // ✅ STOP LOADING (smooth)
      }, 300);
    }
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  const handleAddClick = () => {
    if (!hasPermission("Masters", "Logins", "Added")) {
      showToast("Error", "No permission to add", "danger");
      return;
    }
    setEditData(null); // ✅ clear edit data for new entry
    setShowModal(true);
  };

  const handleEdit = (deal: DebitorDeal) => {
    if (!hasPermission("Masters", "Logins", "Updated")) {
      showToast("Error", "No permission to edit", "danger");
      return;
    }
    setEditData(deal);
    setShowModal(true);
  };

  // ✅ Add Login
  const handleAddSource = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=SaveLoginRegistration`,
        formData
      );
      showToast("Success", "Login saved successfully!", "success");
      apiGet();
      setShowModal(false);
    } catch (err: any) {
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  // ✅ Delete Login
  const handleDelete = async (deal: DebitorDeal) => {
    if (!hasPermission("Masters", "Logins", "Deleted")) {
      showToast("Error", "No permission to delete", "danger");
      return;
    }
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `http://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=DeleteLogin`,
        { IDS: deal.ID, _method: "POST" }
      );
      showToast("Success", "Login deleted!", "success");
      apiGet();
    } catch (err) {
      console.error("Error deleting bank:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  // Bulk update removed


  const accessDenied = checkPageAccess("Masters", "Logins");
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
            title="Logins"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={materialTop}
            onAddClick={
              hasPermission("Masters", "Logins", "Added")
                ? handleAddClick
                : undefined
            }
            handleEdit={
              hasPermission("Masters", "Logins", "Updated")
                ? (deal) => handleEdit(deal as any)
                : undefined
            }
            handleDelete={
              hasPermission("Masters", "Logins", "Deleted")
                ? (deal) => handleDelete(deal as any)
                : undefined
            }
            onSuccess={apiGet}
            showTotal={false}
          />
        )}
      </div>

      {/* Modal Form */}
      <LoginForm
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditData(null); // clear after hide
        }}
        initialData={editData as any}
        onSubmit={handleAddSource}
      />
    </div>
  );
};

export default LoginList;
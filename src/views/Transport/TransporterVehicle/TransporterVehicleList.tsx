import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import TransporterVehicleForm from "./TransporterVehicleForm";
import { hasPermission, checkPageAccess } from "../../../utils/permission";

interface TransporterVehicleData {
  ID: number;
  Transporter: string;
  Vehicle: string;
}

const TransporterVehicleList = () => {
  const accessDenied = checkPageAccess("Transporter", "Transport");
  const [data, setData] = useState<TransporterVehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<TransporterVehicleData | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const showToast = useToast();

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Transporter", key: "Transporter" },
    { label: "Vehicle", key: "Vehicle" },
  ];

  useEffect(() => {
    if (accessDenied) return;
    apiGet();
  }, [accessDenied]);

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
      const res = await axios.get<TransporterVehicleData[]>(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=TransporterVehicles`
      );
      setData(res.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setData([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const payload = {
        ...formData,
        IDS: isEdit ? editData?.ID : undefined,
      };

      await axios.post(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=TransporterVehicleSave`,
        payload
      );

      showToast("Success", isEdit ? "Updated successfully!" : "Saved successfully!", "success");
      setShowForm(false);
      setEditData(null);
      setIsEdit(false);
      apiGet();
    } catch (err) {
      console.error("Save Error:", err);
      showToast("Error", "Failed to save record.", "danger");
    }
  };

  const handleDelete = async (row: TransporterVehicleData) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=TransporterVehicleDelete`,
        { IDS: row.ID }
      );

      showToast("Success", "Deleted successfully!", "success");
      apiGet();
    } catch (err) {
      console.error("Delete Error:", err);
      showToast("Error", "Failed to delete record.", "danger");
    }
  };

  const handleEdit = (row: TransporterVehicleData) => {
    setEditData(row);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditData(null);
    setIsEdit(false);
    setShowForm(true);
  };

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
        ) : (
          <ListComponent
            title="Transporter Vehicle"
            periodOptions={["All", "This Month", "Last Month", "This Year"]}
            tableHeaders={headers as any}
            dealsData={data}
            mainModule="Transporter"
            subModule="Transport"
            onAddClick={hasPermission("Transporter", "Transport", "Added") ? handleAddClick : undefined}
            handleEdit={hasPermission("Transporter", "Transport", "Updated") ? (row) => handleEdit(row as any) : undefined}
            handleDelete={hasPermission("Transporter", "Transport", "Deleted") ? (row) => handleDelete(row as any) : undefined}
            loading={loading}
            onSuccess={apiGet}
          />
        )}
      </div>

      <TransporterVehicleForm
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setEditData(null);
          setIsEdit(false);
        }}
        onSubmit={handleSave}
        initialData={editData}
        isEdit={isEdit}
      />
    </div>
  );
};

export default TransporterVehicleList;

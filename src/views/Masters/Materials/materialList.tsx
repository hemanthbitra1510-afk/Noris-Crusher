import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import MaterialForm from "./MaterialForm";
import { hasPermission, checkPageAccess } from "../../../utils/permission";

interface MaterialRow {
  ID: number;
  Material: string;
  ZohoGSTID: string;
  ZohoNonID: string;
}

const Materials = () => {
  const accessDenied = checkPageAccess("Masters", "Materials");

  const [data, setData] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<MaterialRow | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const showToast = useToast();

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Material", key: "Material" },
    { label: "Zoho GST ID", key: "ZohoGSTID" },
    { label: "Zoho Non GST ID", key: "ZohoNonID" },
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
    return () => document.head.removeChild(style);
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get<any[]>(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
      );

      const mapped = (res.data || []).map((item) => ({
        ID: item.ID,
        Material: item.Material,
        ZohoGSTID: item.ZohoGSTID,
        ZohoNonID: item.ZohoNonID,
      }));

      setData(mapped);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MaterialRegistration`,
        {
          ...formData,
          IDS: isEdit ? editData?.ID : undefined,
        }
      );

      showToast("Success", isEdit ? "Updated!" : "Saved!", "success");
      setShowForm(false);
      setEditData(null);
      setIsEdit(false);
      apiGet();
    } catch {
      showToast("Error", "Save failed", "danger");
    }
  };

  const handleDelete = async (row: MaterialRow) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=DeleteMaterial`,
        { IDS: row.ID }
      );

      showToast("Success", "Deleted!", "success");
      apiGet();
    } catch {
      showToast("Error", "Delete failed", "danger");
    }
  };

  const handleEdit = (row: MaterialRow) => {
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
              <img src={logo} style={{ width: 55, height: 55, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
            </div>
          </div>
        ) : (
          <ListComponent
            title="Materials"
            periodOptions={["All", "This Month", "Last Month", "This Year"]}
            tableHeaders={headers as any}
            dealsData={data}
            mainModule="Masters"
            subModule="Materials"
            onAddClick={hasPermission("Masters", "Materials", "Added") ? handleAddClick : undefined}
            handleEdit={hasPermission("Masters", "Materials", "Updated") ? (row) => handleEdit(row as any) : undefined}
            handleDelete={hasPermission("Masters", "Materials", "Deleted") ? (row) => handleDelete(row as any) : undefined}
            loading={loading}
            onSuccess={apiGet}
          />
        )}
      </div>

      <MaterialForm
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

export default Materials;
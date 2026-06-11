import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import VehicleDocForm from "./VehicleForm";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface VehicleData {
  ID: number;
  Vehicle: string;
  InsuranceDate: string;
  Insurance: string;
  PollutionDate: string;
  Pollution: string;
  FitnessDate: string;
  Fitness: string;
  PermitDate: string;
  Permit: string;
  TaxDate: string;
  Tax: string;
}

type VehicleResponse = VehicleData[];

const VehicleList = () => {
  const accessDenied = checkPageAccess("Vehicle", "Vehicle");
  if (accessDenied) return accessDenied;

  const [vehicleData, setVehicleData] = useState<VehicleData[]>([]);
  const [editingData, setEditingData] = useState<VehicleData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const showToast = useToast();

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Vehicle", key: "Vehicle" },
    { label: "Insurance Date", key: "InsuranceDate" },
    { label: "Insurance Expiry", key: "Insurance" },
    { label: "Pollution Date", key: "PollutionDate" },
    { label: "Pollution Expiry", key: "Pollution" },
    { label: "Fitness Date", key: "FitnessDate" },
    { label: "Fitness Expiry", key: "Fitness" },
    { label: "Permit Date", key: "PermitDate" },
    { label: "Permit Expiry", key: "Permit" },
    { label: "Tax Date", key: "TaxDate" },
    { label: "Tax Expiry", key: "Tax" },
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
      const res = await axios.get<VehicleResponse>(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=VehicleRegistration`
      );
      console.log(res.data)
      setVehicleData(res.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    finally {
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
  const handleAddOrUpdate = async (formData: Partial<VehicleData>) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        ...formData,
        IDS: formData.ID ?? "",
      };
      delete (payload as any).ID;
      console.log(payload)
      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=VehicleRegistrationSave`,
        payload
      );

      console.log("Save response:", res);

      showToast("Success", "Vehicle document saved successfully!", "success");
      setShowForm(false);
      setEditingData(null);
      apiGet();
    } catch (err) {
      console.error(err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  const handleDelete = async (item: VehicleData) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=VehicleRegistrationDelete`,
        {
          IDS: item.ID,
          Vehicle: item.Vehicle,
          _method: "DELETE"
        }
      );

      showToast("Success", "Vehicle document deleted successfully!", "success");
      apiGet();
    } catch (err) {
      console.error("Error deleting item:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
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

              {/* Static Logo */}
              <img
                src={logo}
                alt="Loading"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 50,
                  height: 50,
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <ListComponent
              title="Vehicle Registration List"
              periodOptions={periodOptions}
              tableHeaders={headers}
              dealsData={vehicleData}
              onAddClick={hasPermission("Vehicle", "Vehicle", "Added") ? () => {
                setEditingData(null);
                setShowForm(true);
              } : undefined}
              handleDelete={hasPermission("Vehicle", "Vehicle", "Deleted") ? handleDelete : undefined}
              handleEdit={hasPermission("Vehicle", "Vehicle", "Updated") ? (item) => {
                setEditingData(item);
                setShowForm(true);
              } : undefined}
              onAddLedgerClick={hasPermission("Vehicle", "Vehicle", "Added") ? () => setShowLedgerForm(true) : undefined}
            />
          </div>
        )}
        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}
        />
        <VehicleDocForm
          show={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingData(null);
          }}
          onSubmit={handleAddOrUpdate}
          initialData={editingData}
        />
      </div>
    </div>
  );
};

export default VehicleList;

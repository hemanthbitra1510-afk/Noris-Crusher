import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ReportsFrom from "./reportsForm";
import RepotsList from "../../../components/reuse-components/reportsList";
import { useToast } from "../../../components/reuse-components/Toast";
import SummaryOffcanvas from "./summaryList";
import { Modal, Card } from "react-bootstrap";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DashboardListRow {
  [key: string]: string | number;
}


interface DebitorDeal extends DashboardListRow {
  DCNum: number;
  Date1: string;
  Time1: string;
  Vehicle: string;
  Quarry: string;
  Extractor: string;
  Gross: number;
  Tare: number;
  Nett: number;
  Blocked: string;
  Rate: number;
  Amount: number;
  ActualNett?: number;
  BlockButton?: string;
}

type SummaryResponse = DebitorDeal[];

const ReportList = () => {
  const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [show, setShow] = useState(false);
  const [modelData, setModelData] = useState<DebitorDeal | null>(null);
  const [reportsfilter, setReportsfilter] = useState<Record<string, any> | null>(null);
  const [summarycan, setSummarycan] = useState<boolean>(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const [quarryOptions, setQuarryOptions] = useState<{ label: string; value: string }[]>([]);
  const [extractorOptions, setExtractorOptions] = useState<{ label: string; value: string }[]>([]);
  const [materialOptions, setMaterialOptions] = useState<{ label: string; value: string }[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        // 1. Fetch Quarries & Extractors
        const quarryRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=GetQuarryDropdown`
        );
        if (Array.isArray(quarryRes.data)) {
          setQuarryOptions(quarryRes.data.map((q: { Quarry: string }) => ({ label: q.Quarry, value: q.Quarry })));
          setExtractorOptions(quarryRes.data.map((q: { Extractor: string }) => ({ label: q.Extractor, value: q.Extractor })));
        }

        // 2. Fetch Materials
        const materialRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
        );
        if (Array.isArray(materialRes.data)) {
          setMaterialOptions(materialRes.data.map((m: { Material: string }) => ({ label: m.Material, value: m.Material })));
        }

        // 3. Fetch Transporters
        const transporterRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );
        if (Array.isArray(transporterRes.data)) {
          const filtered = transporterRes.data
            .filter((l: { Type: string; Party: string }) => l.Type === "Transport")
            .map((l: { Party: string }) => ({ label: l.Party, value: l.Party }));
          setTransporterOptions(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch bulk update dropdown data:", err);
      }
    };

    fetchDropdownData();
  }, []);

  const accessDenied = checkPageAccess("Quarry", "Reports");

  const bulkUpdateFields = [
    { label: "Quarry", key: "Quarry", type: "select" as const, options: quarryOptions },
    { label: "Extractor", key: "Extractor", type: "select" as const, options: extractorOptions },
    { label: "Material", key: "Options", type: "select" as const, options: materialOptions },
    { label: "Transporter", key: "Transporter", type: "select" as const, options: transporterOptions },
    { label: "Vehicle", key: "Vehicle", type: "text" as const },
    { label: "Rate", key: "Rate", type: "number" as const },
  ];

  const showToast = useToast();


  const headers = [
    { label: "S.NO", key: "sno", dataType: "index" },
    { label: "DC Number", key: "DCNum", dataType: "number" },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Time", key: "Time1", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Quarry", key: "Quarry", dataType: "string" },
    { label: "Extractor", key: "Extractor", dataType: "string" },
    { label: "Material", key: "Options", dataType: "string" },
    { label: "Transporter", key: "Driver", dataType: "string" },

    // Numeric fields → align right
    { label: "Gross", key: "Gross", dataType: "number" },
    { label: "Tare", key: "Tare", dataType: "number" },
    { label: "Actual Nett", key: "ActualNett", dataType: "number" },
    { label: "Nett", key: "Nett", dataType: "number" },
    { label: "Rate", key: "Rate", dataType: "number" },
    { label: "Amount", key: "Amount", dataType: "number" },
    { label: "Images", key: "Images", dataType: "image" },
  ];
  // Fetch reports
  const apiGet = async (filters?: any) => {
    try {
      setLoading(true);

      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=MyQuarryReport`,
        filters ?? reportsfilter
      );

      const data1 = (res.data || []).map((item: any) => {
        const rawNett = Number(item.Nett);
        const rawActualNett = Number(item.Gross) - Number(item.Tare);
        return {
          ...item,
          DCNum: Number(item.DCNum),
          Gross: Number(item.Gross),
          Tare: Number(item.Tare),
          Rate: Number(item.Rate),
          Amount: Number(item.Amount),
          Nett: rawNett,
          NettRaw: rawNett,
          ActualNett: rawActualNett,
          ActualNettRaw: rawActualNett,
          BlockButton:
            item.Blocked === "Blocked" ? "UnBlocked" : "Blocked",
          Images: [item.Image1, item.Image2].filter(Boolean),
        };
      });

      setMaterialTop(data1);
      setModelData(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast(
        "Error",
        "Failed to fetch reports. Please try again.",
        "danger"
      );
      setMaterialTop([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
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
  // Handle filter submit
  const handleSubmit1 = (formData: Record<string, any>) => {
    setReportsfilter(formData);
    console.log("Filter Submitted:", formData);
    apiGet(formData); // Pass latest filter directly
    handleClose();
  };

  const handleImageClick = (images: string | string[]) => {
    if (!images) return;

    const imgs = Array.isArray(images)
      ? images
      : images.split(",");

    setSelectedImages(imgs);
    setShowImagePopup(true);
  };


  const handleSummary = () => {
    setSummarycan(true);
    console.log('sdnasn')
  };
  // Delete (block/unblock) a deal
  const handleDelete = async (deal: any) => {
    const data = {
      IDS: deal.ID,
      Blocked: deal.Blocked === "Blocked" ? "" : "Blocked",
    };
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=BlockQuarryData`,
        data
      );
      console.log(res);
      showToast(
        "Success",
        `Record ${data.Blocked === "Blocked" ? "UnBlocked" : "Blocked"}!`,
        "success"
      );
      apiGet();
      setModelData(null);
    } catch (err: unknown) {
      console.error("Error deleting data:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      // Parallel API calls
      const updatePromises = ids.map(recordId => {
        // ✅ Fix: Use String() for reliable ID matching
        const deal = materialTop.find(d => String(d.ID) === String(recordId));
        if (!deal) return Promise.resolve();

        return axios.post(
          `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=SaveQuarryData`,
          {
            ...deal,
            Nett: deal.NettRaw, // Restore raw Kg value for API
            ActualNett: deal.ActualNettRaw,
            IDS: recordId,
            [field]: value
          }
        );
      });

      await Promise.all(updatePromises);
      showToast("Success", `Updated ${ids.length} records successfully`, "success");
      setSelectedIds([]);
      apiGet();
    } catch (err) {
      console.error("Bulk update failed:", err);
      showToast("Error", "Failed to update some records", "danger");
    }
  };

  const handleBulkUpload = async (data: any[]) => {
    const id = sessionStorage.getItem("selectedItems") ?? "";

    // Map Excel data to the exact PHP payload format, ensuring missing fields are sent as empty strings
    const mappedData = data.map(item => ({
      DCNumber: item.DCNumber || item.DCNum || item["DC Number"] || "",
      Vehicle: item.Vehicle || "",
      Quarry: item.Quarry || "",
      Extractor: item.Extractor || "",
      Material: item.Material || item.Options || "",
      Gross: item.Gross || "",
      GrossDate: item.GrossDate || item.Date || item.Date1 || "",
      GrossTime: item.GrossTime || item.Time || item.Time1 || "",
      Tare: item.Tare || "",
      TareDate: item.TareDate || "",
      TareTime: item.TareTime || "",
      Nett: item.Nett || "",
      Rate: item.Rate || "",
      Amount: item.Amount || "",
      Driver: item.Driver || item.Transporter || "",
      Destination: item.Destination || "",
      FirstDateTime: item.FirstDateTime || ""
    }));

    try {
      await axios.post(
        `https://norisapi.noris.in/Crusher/Bulkupdate.php?ID=${id}&Table=Quarry`,
        mappedData
      );
    } catch (err) {
      console.error("Bulk upload error:", err);
      throw err;
    }
  };

  // Edit
  const handleEdit = (deal: any) => {
    setShowModal(true);
    setModelData({
      ...deal,
      Nett: deal.NettRaw, // Restore raw Kg value for the form
      ActualNett: deal.ActualNettRaw
    });
  };
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  // Predefined periods
  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

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
          <RepotsList
            defaultValues={reportsfilter}
            changeColor={(row: any, key: any) => {
              if (key === "Nett") {
                const nett = Number(row.Nett) || 0;
                const expectedNett = (Number(row.Gross) || 0) - (Number(row.Tare) || 0);
                const isEdited = Math.abs(nett - expectedNett) > 0.1;
                return isEdited ? "text-info" : "text-danger";
              }
              return "text-dark";
            }}
            title="Reports"
            show={show}
            handleSubmit1={handleSubmit1}
            handleShow={handleShow}
            handleClose={handleClose}
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={materialTop}
            onImageClick={handleImageClick}
            handleEdit={hasPermission("Quarry", "Reports", "Updated") ? handleEdit : undefined}
            handleDelete={hasPermission("Quarry", "Reports", "Deleted") ? handleDelete : undefined}
            handleSummary={handleSummary}
            onSelectionChange={setSelectedIds}
            selectedIds={selectedIds}
            bulkUpdateFields={bulkUpdateFields}
            onBulkUpdateSave={handleBulkUpdateSave}
            onSuccess={apiGet}
            mainModule="Quarry"
            subModule="Reports"
            onBulkUpload={hasPermission("Quarry", "Reports", "Added") ? handleBulkUpload : undefined}
          />
        )}

        {showModal && (
          <ReportsFrom
            onSuccess={apiGet}
            show={showModal}
            onClose={() => setShowModal(false)}
            modeldata={modelData || undefined}
          />
        )}
        {summarycan && (
          <SummaryOffcanvas
            show={summarycan}
            onClose={() => setSummarycan(false)}
            data={materialTop}

          />
        )}
        <Modal
          show={showImagePopup}
          onHide={() => setShowImagePopup(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Report Images</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="row g-3">
              {selectedImages.length === 0 ? (
                <div className="text-center text-muted">No images available</div>
              ) : (
                selectedImages.map((img, index) => (
                  <div className="col-md-4" key={index}>
                    <Card className="shadow-sm">
                      <Card.Img
                        src={img}
                        style={{
                          height: "180px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                      />
                    </Card>
                  </div>
                ))
              )}
            </div>
          </Modal.Body>
        </Modal>


      </div>
    </div>
  );
};
export default ReportList;

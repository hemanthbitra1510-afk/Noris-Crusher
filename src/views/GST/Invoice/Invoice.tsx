import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import GstSearch from "../GstSearchFrom";
import InvoiceForm from "./InvoiceForm";
import InvoiceDetails from "./InvoiceRecipt";
import { Offcanvas, Button, Row, Col, Form } from "react-bootstrap";
import Select from "react-select";
/* ================= TYPES ================= */

interface DailyDeal {
  Date1: string;
  Under: string;
  PaymentMode: string;
  Bank: string;
  Transfer: string;
  DebitAmount: string;
}

interface Filters {
  FromDate: string;
  ToDate: string;
}

interface AddressTable {
  Name: string;
  AddressLine1: string;
  State1: string;
  GST?: string;
  Contact?: string;
  Logo?: string;
}

interface PartyOption {
  value: string;
  label: string;
}

type SummaryResponse = DailyDeal[];

/* ================= COMPONENT ================= */

const AccountCashOut = () => {
  const accessDenied = checkPageAccess("GST", "Invoice");
  if (accessDenied) return accessDenied;


  const company = JSON.parse(
    sessionStorage.getItem("selectedItems1") || "{}"
  );

  const companyIMIE = company?.IMIE;

  /* ---------- STATE ---------- */

  const [cashOutList, setCashOutList] = useState<DailyDeal[]>([]);
  const [filters, setFilters] = useState<Filters>({ FromDate: "", ToDate: "" });

  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);

  const [editData, setEditData] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);

  const [address, setAddress] = useState<AddressTable | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const [partyList, setPartyList] = useState<PartyOption[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

  const [invoiceSeries, setInvoiceSeries] = useState<{ Invoice: string; Series: string }>({
    Invoice: "",
    Series: ""
  });

  const [editingSeries, setEditingSeries] = useState(false);
  const [seriesDraft, setSeriesDraft] = useState<{ Invoice: string; Series: string }>({
    Invoice: "",
    Series: ""
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>(null);

  const [originalRow, setOriginalRow] = useState<any>(null);

  const [consolidateFilters, setConsolidateFilters] = useState({
    Party: "",
    Material: "",
    Destination: "",
    FromDate: "",
    ToDate: ""
  });

  const showToast = useToast();

  /* ---------- TABLE HEADERS ---------- */

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "InvDate", dataType: "string" },
    { label: "Invoice", key: "Invoice", dataType: "string" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "SUM(GrandTotal)", key: "SUM(GrandTotal)", dataType: "number" }
  ];

  /* ================= API ================= */

  const apiGetInvoices = async (params: Filters = filters) => {
    try {

      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoices`,
        params
      );

      setCashOutList(res.data || []);

    } catch (err) {
      console.error("Invoice list fetch failed", err);
    }
  };

  const refreshInvoices = () => {
    apiGetInvoices(filters);
    fetchInvoiceSeries();
  };

  const fetchInvoiceSeries = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceSeries`
      );

      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      setInvoiceSeries({
        Invoice: String(data?.Invoice ?? ""),
        Series: String(data?.Series ?? "")
      });
    } catch (err) {
      console.error("Invoice series fetch failed", err);
    }
  };

  const saveInvoiceSeries = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceSeriesUpdate`,
        {
          Invoice: seriesDraft.Invoice,
          Series: seriesDraft.Series
        }
      );

      setInvoiceSeries({ ...seriesDraft });
      setEditingSeries(false);
      showToast("Success", "Invoice series updated", "success");
    } catch (err) {
      console.error("Invoice series update failed", err);
      showToast("Error", "Unable to update invoice series", "danger");
    }
  };

  const fetchAddressTable = async () => {

    if (!companyIMIE) return;

    setLoadingAddress(true);

    try {

      const res = await axios.get(
        "https://norisapi.noris.in/Crusher/Masters.php",
        {
          params: {
            ID: companyIMIE,
            Table: "AddressTable"
          }
        }
      );

      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      setAddress(data);

    } catch (err) {

      console.error("AddressTable fetch failed", err);

    } finally {

      setLoadingAddress(false);

    }
  };

  /* ===== FETCH PARTY LIST ===== */

  const fetchPartyList = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      const data = Array.isArray(res.data) ? res.data : [];

      const filteredParties = data.filter((item: any) => item.Party);

      const uniqueParties = Array.from(
        new Set(filteredParties.map((item: any) => item.Party))
      ).map((p: string) => ({
        value: p,
        label: p
      }));

      setPartyList(uniqueParties);

    } catch (err) {
      console.error("Party fetch error", err);
    }
  };

  /* ===== CONSOLIDATED API ===== */

  const fetchConsolidated = async () => {

    try {

      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceConsolidate`,
        consolidateFilters
      );

      setConsolidatedData(res.data || []);

    } catch (err) {

      console.error(err);

      showToast("Error", "Unable to load consolidated report", "danger");

    }
  };

  // ===== HELPER FUNCTIONS =====

  const format2 = (val: any) => Number(val || 0).toFixed(2);

  const recalcRow = (row: any) => {

    const tonnes = parseFloat(row?.Tonnes ?? 0) || 0;
    const rate = parseFloat(row?.Rate ?? 0) || 0;
    const tax = parseFloat(row?.Tax ?? 0) || 0;

    const total = Number((tonnes * rate).toFixed(2));
    const taxAmount = Number(((total * tax) / 100).toFixed(2));
    const grandTotal = Number((total + taxAmount).toFixed(2));

    return {
      ...row,
      Tonnes: tonnes,
      Rate: rate,
      Total: total,
      TaxAmount: taxAmount,
      GrandTotal: grandTotal
    };

  };
  const handleEditChange = (field: string, value: any) => {

    const updatedRow = recalcRow({
      ...editRow,
      [field]: value
    });

    setEditRow(updatedRow);

    const updatedTable = [...consolidatedData];
    updatedTable[editingIndex!] = updatedRow;

    setConsolidatedData(updatedTable);

  };

  /* ===== SAVE EDITED ROW ===== */

  const saveConsolidatedRow = async () => {
    try {

      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceConsolidateSave`,
        editRow
      );

      showToast("Success", "Record updated successfully", "success");

      setEditingIndex(null);
      fetchConsolidated();

    } catch (err) {

      console.error(err);

      showToast("Error", "Unable to update record", "danger");

    }
  };

  const deleteConsolidatedRow = async (row: any, index: number) => {

    try {

      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=DeleteInvoiceConsolidate`,
        { IDS: row.ID }
      );

      setConsolidatedData(prev => prev.filter((_, i) => i !== index));

      showToast("Success", "Row deleted", "success");

    } catch (err) {

      console.error(err);
      showToast("Error", "Unable to delete row", "danger");

    }

  };

  const saveAllConsolidated = async () => {

    try {

      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        Invoice: invoiceNo,
        Party: consolidateFilters.Party,
        InvDate: invoiceDate,
        FromDate: consolidateFilters.FromDate,
        ToDate: consolidateFilters.ToDate,
        ItemsData: consolidatedData.map((row) => ({
          ...row,
          Amount: row.Total,   // convert Total -> Amount
        }))
      };

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceConsolidateSave`,
        payload
      );

      showToast("Success", "Invoice saved successfully", "success");

      fetchConsolidated();

      setShowConsolidated(false);



    } catch (err) {

      console.error(err);
      showToast("Error", "Unable to save rows", "danger");

    }

  };

  /* ================= EFFECT ================= */

  useEffect(() => {

    apiGetInvoices(filters);
    fetchAddressTable();
    fetchPartyList();
    fetchInvoiceSeries();

  }, []);

  /* ================= ACTIONS ================= */

  const DataView = async (row: any) => {

    const id = sessionStorage.getItem("selectedItems") ?? "";

    const res = await axios.post(
      `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceDetails`,
      row
    );

    setInvoice(res.data);
    setShowView(true);
  };

  const DataEdit = async (row: any) => {

    const id = sessionStorage.getItem("selectedItems") ?? "";

    const res = await axios.post(
      `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceDetails`,
      row
    );

    setEditData(res.data.InvoiceDetails);
    setShowForm(true);
  };

  const openConsolidated = () => {
    setShowConsolidated(true);
  };

  /* ================= RENDER ================= */

  return (

    <div className="page-wrapper">

      <div className="content p-2">

        <ListComponent
          title="Cash Out - Party Payments"
          periodOptions={["All", "This Month", "Last Month", "This Year"]}
          tableHeaders={headers}
          dealsData={cashOutList}

          handleShow={() => setShowSearch(true)}
          handleEdit={hasPermission("GST", "Invoice", "Updated") ? (row) => DataEdit(row) : undefined}
          handleView={(row) => DataView(row)}

          onAddClick={hasPermission("GST", "Invoice", "Added") ? () => {
            setEditData(null);
            setShowForm(true);
          } : undefined}

          showAdd={true}

          extraButtons={
            <>
              <Button
                variant="success"
                className="ms-2 fw-semibold"
                onClick={openConsolidated}
              >
                Consolidated
              </Button>
              {editingSeries ? (
                <div className="d-flex align-items-center ms-3 gap-2">
                  <Form.Control
                    size="sm"
                    style={{ width: 100 }}
                    placeholder="Invoice"
                    value={seriesDraft.Invoice}
                    onChange={(e) =>
                      setSeriesDraft({ ...seriesDraft, Invoice: e.target.value })
                    }
                  />
                  <Form.Control
                    size="sm"
                    style={{ width: 100 }}
                    placeholder="Series"
                    value={seriesDraft.Series}
                    onChange={(e) =>
                      setSeriesDraft({ ...seriesDraft, Series: e.target.value })
                    }
                  />
                  <Button size="sm" variant="success" onClick={saveInvoiceSeries}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingSeries(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <span className="ms-3 fw-semibold text-primary align-self-center">
                  Invoice: {invoiceSeries.Invoice || "—"}
                  <span className="ms-2">Series: {invoiceSeries.Series || "—"}</span>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="ms-2"
                    onClick={() => {
                      setSeriesDraft({ ...invoiceSeries });
                      setEditingSeries(true);
                    }}
                  >
                    Edit
                  </Button>
                </span>
              )}
            </>
          }
        />

        <GstSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleSubmit={(data) => {
            setFilters(data);
            apiGetInvoices(data);
          }}
        />

        <InvoiceForm
          show={showForm}
          onClose={() => {
            setShowForm(false);
            refreshInvoices();
          }}
          initialData={editData}
          savePurchase={refreshInvoices}
          removeItem={() => { }}
        />

        <Offcanvas
          show={showView}
          onHide={() => setShowView(false)}
          placement="end"
          backdrop="static"
          style={{ width: "80vw" }}
        >

          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              Invoice Details
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body className="p-0">

            <InvoiceDetails
              data={invoice}
              address={address}
              loadingAddress={loadingAddress}
              series={invoiceSeries.Series}
            />

          </Offcanvas.Body>

        </Offcanvas>

        {/* ================= CONSOLIDATED REPORT ================= */}

        <Offcanvas
          show={showConsolidated}
          onHide={() => setShowConsolidated(false)}
          placement="end"
          style={{ width: "75vw" }}
        >

          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              GST Consolidated Report
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>

            <Row className="mb-3">

              <Col md={3}>
                <Form.Label>Party</Form.Label>

                <Select
                  options={partyList}
                  value={
                    consolidateFilters.Party
                      ? { value: consolidateFilters.Party, label: consolidateFilters.Party }
                      : null
                  }
                  onChange={(selected: any) =>
                    setConsolidateFilters({
                      ...consolidateFilters,
                      Party: selected ? selected.value : ""
                    })
                  }
                  placeholder="Select Party"
                  isSearchable
                />

              </Col>

              <Col md={2}>
                <Form.Label>Material</Form.Label>
                <Form.Control
                  onChange={(e) =>
                    setConsolidateFilters({
                      ...consolidateFilters,
                      Material: e.target.value
                    })
                  }
                />
              </Col>

              <Col md={2}>
                <Form.Label>Destination</Form.Label>
                <Form.Control
                  onChange={(e) =>
                    setConsolidateFilters({
                      ...consolidateFilters,
                      Destination: e.target.value
                    })
                  }
                />
              </Col>

              <Col md={2}>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  onChange={(e) =>
                    setConsolidateFilters({
                      ...consolidateFilters,
                      FromDate: e.target.value
                    })
                  }
                />
              </Col>

              <Col md={2}>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  onChange={(e) =>
                    setConsolidateFilters({
                      ...consolidateFilters,
                      ToDate: e.target.value
                    })
                  }
                />
              </Col>

              <Col md={1} className="d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={fetchConsolidated}
                  className="w-100"
                >
                  Go
                </Button>
              </Col>

            </Row>

            <Row className="mb-3">

              <Col md={3}>
                <Form.Label>Invoice Number</Form.Label>
                <Form.Control
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Invoice Number"
                />
              </Col>

              <Col md={3}>
                <Form.Label>Invoice Date</Form.Label>
                <Form.Control
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </Col>

            </Row>

            <div className="table-responsive">

              <table className="table table-bordered table-striped align-middle">

                <thead className="table-light">
                  <tr>
                    <th>Material</th>
                    <th>Destination</th>
                    <th className="text-end">Tonnes</th>
                    <th className="text-end">Rate</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Tax %</th>
                    <th className="text-end">Tax Amount</th>
                    <th className="text-end">Grand Total</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>

                <tbody>

                  {consolidatedData.length > 0 ? (

                    consolidatedData.map((row, index) => {

                      const isEditing = editingIndex === index;

                      return (

                        <tr key={index}>

                          <td>{row.Material}</td>

                          <td>{row.Destination}</td>

                          <td className="text-end">
                            {isEditing ? (
                              <Form.Control
                                type="number"
                                value={editRow?.Tonnes}
                                onChange={(e) =>
                                  handleEditChange("Tonnes", e.target.value)
                                }
                              />
                            ) : row.Tonnes}
                          </td>

                          <td className="text-end">
                            {isEditing ? (
                              <Form.Control
                                type="number"
                                value={editRow?.Rate}
                                onChange={(e) =>
                                  handleEditChange("Rate", e.target.value)
                                }
                              />
                            ) : row.Rate}
                          </td>

                          <td className="text-end">{format2(row.Total)}</td>
                          <td className="text-end">
                            {isEditing ? (
                              <Form.Control
                                type="number"
                                value={editRow?.Tax}
                                onChange={(e) =>
                                  handleEditChange("Tax", e.target.value)
                                }
                              />
                            ) : (
                              format2(row.Tax)
                            )}
                          </td>
                          <td className="text-end">{format2(row.TaxAmount)}</td>
                          <td className="text-end fw-bold">{format2(row.GrandTotal)}</td>

                          <td className="text-center">

                            {isEditing ? (

                              <div className="d-flex gap-2 justify-content-center">



                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingIndex(index);
                                    setEditRow(row);
                                    setOriginalRow({ ...row });
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  className="ms-2"
                                  onClick={() => deleteConsolidatedRow(row, index)}
                                >
                                  Delete
                                </Button>

                              </div>

                            ) : (

                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => {
                                  setEditingIndex(index);
                                  setEditRow(row);
                                  setOriginalRow({ ...row });
                                }}
                              >
                                Edit
                              </Button>


                            )}

                          </td>

                        </tr>

                      );

                    })

                  ) : (

                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        No data available
                      </td>
                    </tr>

                  )}

                </tbody>

              </table>

            </div>
            <div className="d-flex justify-content-end mt-3">

              <Button
                variant="success"
                onClick={saveAllConsolidated}
              >
                Save Invoice
              </Button>

            </div>

          </Offcanvas.Body>

        </Offcanvas>

      </div>


    </div>
  );
};

export default AccountCashOut;


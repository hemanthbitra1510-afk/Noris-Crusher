import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker"; // import your date picker
import Select from "react-select";
import axios from "axios";
import moment from "moment";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleShow: () => void;
  handleSubmit: (formData: any) => void;
}

const IssueSerchModal = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Inventory", "Issue");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Payee: "",
    Material: "",
    Ledger: "",
    FromDate: "",
    ToDate: "",
  });

  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [sparesList, setSparesList] = useState<any[]>([]);
  const [ledgerOptionsList, setLedgerOptionsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";
        if (!id) return;

        const [resIssueTo, resSpares, resLedgers] = await Promise.all([
          axios.get(`https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=Payee`),
          axios.get(`https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MySpares`),
          axios.get(`https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=Ledgers`)
        ]);

        const issueToList = Array.isArray(resIssueTo.data)
          ? resIssueTo.data.map((item: any) => item.Payee || item.IssueTo || item.Party || item.IssuedTo || "")
          : [];
        setLedgerList(issueToList.filter(Boolean));

        const spares = Array.isArray(resSpares.data)
          ? resSpares.data.map((item: any) => item.Spares || item.Material || "")
          : [];
        setSparesList(spares.filter(Boolean));

        const ledgers = Array.isArray(resLedgers.data)
          ? resLedgers.data.map((item: any) => item.Ledger || item.Party || item.name || "")
          : [];
        setLedgerOptionsList(ledgers.filter(Boolean));
      } catch (err) {
        console.error("Error fetching search filters data:", err);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <>
      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Search Filters</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>


            {/* Payee, Ledger & Material */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Issued To</Form.Label>
                  <Select
                    options={ledgerList.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    value={
                      formData.Payee
                        ? { value: formData.Payee, label: formData.Payee }
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setFormData({ ...formData, Payee: selectedOption?.value || "" });
                    }}
                    placeholder="Select Issue To"
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ledger</Form.Label>
                  <Select
                    options={ledgerOptionsList.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    value={
                      formData.Ledger
                        ? { value: formData.Ledger, label: formData.Ledger }
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setFormData({ ...formData, Ledger: selectedOption?.value || "" });
                    }}
                    placeholder="Select Ledger"
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Material</Form.Label>
                  <Select
                    options={sparesList.map((s) => ({
                      value: s,
                      label: s,
                    }))}
                    value={
                      formData.Material
                        ? { value: formData.Material, label: formData.Material }
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setFormData({ ...formData, Material: selectedOption?.value || "" });
                    }}
                    placeholder="Select Material"
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* Date Picker */}
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Select Date Range</Form.Label>
                  <PredefinedDatePicker
                    onChange={(start, end) => {
                      console.log("📅 Date Range Selected:", { start, end });
                      setFormData({
                        ...formData,
                        FromDate: start, // YYYY-MM-DD
                        ToDate: end,     // YYYY-MM-DD
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            const payload = { ...formData };
            if (!payload.FromDate || !payload.ToDate) {
              payload.FromDate = moment().subtract(6, "days").format("YYYY-MM-DD");
              payload.ToDate = moment().format("YYYY-MM-DD");
            }
            handleSubmit(payload);
          }}>
            Apply Filters
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default IssueSerchModal;


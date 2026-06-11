import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker"; // import your date picker
import Select from "react-select";
import axios from "axios";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleShow: () => void;
  handleSubmit: (formData: any) => void;
}

const InventryStockModal = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Inventory", "Stock");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Payee: "",
    Spares: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [sparesList, setSparesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";
        if (!id) return;

        const [resLedger, resSpares] = await Promise.all([
          axios.get(`https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`),
          axios.get(`https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MySpares`)
        ]);

        setLedgerList(resLedger.data || []);

        const spares = Array.isArray(resSpares.data)
          ? resSpares.data.map((item: any) => item.Spares || item.Material || "")
          : [];
        setSparesList(spares.filter(Boolean));
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


            {/* Payee & Material */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payee</Form.Label>
                  <Select
                    options={ledgerList.map((p) => ({
                      value: p.Party,
                      label: p.Party,
                    }))}
                    value={
                      formData.Payee
                        ? { value: formData.Payee, label: formData.Payee }
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setFormData({ ...formData, Payee: selectedOption?.value || "" });
                    }}
                    placeholder="Select Payee"
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Spares</Form.Label>
                  <Select
                    options={sparesList.map((s) => ({
                      value: s,
                      label: s,
                    }))}
                    value={
                      formData.Spares
                        ? { value: formData.Spares, label: formData.Spares }
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setFormData({ ...formData, Spares: selectedOption?.value || "" });
                    }}
                    placeholder="Select Spares"
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

export default InventryStockModal;


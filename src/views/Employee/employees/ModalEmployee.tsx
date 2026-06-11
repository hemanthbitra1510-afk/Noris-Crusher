import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "react-bootstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import CommonPhoneInput from "../../../components/common-phoneInput/commonPhoneInput";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import { useToast } from "../../../components/reuse-components/Toast";
import dayjs from "dayjs";
import axios from "axios";

const validationSchema = Yup.object({
  Employee: Yup.string().required("Employee Name is required"),
  Contact: Yup.string()
    .required("Contact is required")
    .matches(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
  Designation: Yup.string().required("Designation is required"),
  Aadhar: Yup.string().required("Aadhar Number is required"),
  Pan: Yup.string().required("PAN Number is required"),
  Bank: Yup.string().required("Bank Name is required"),
  AccNumber: Yup.string().required("Account Number is required"),
  IFSCCode: Yup.string().required("IFSC Code is required"),
  DOJ: Yup.string().required("Date of Joining is required"),
});

interface ModalEmployeeProps {
  show: boolean;
  onClose: () => void;
  modeldata?: Record<string, any> | null;
  onSuccess?: () => void;
}

const ModalEmployee: React.FC<ModalEmployeeProps> = ({
  show,
  onClose,
  modeldata,
  onSuccess,
}) => {
  const showToast = useToast();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      Employee: modeldata?.Employee || modeldata?.name || "",
      Address1: modeldata?.Address1 || modeldata?.address || "",
      Contact: modeldata?.Contact || modeldata?.contact || "",
      Aadhar: modeldata?.Aadhar || modeldata?.aadhar || "",
      Pan: modeldata?.Pan || modeldata?.pan || "",
      DOJ: modeldata?.DOJ || modeldata?.doj || dayjs().format("DD-MM-YYYY"),
      Designation: modeldata?.Designation || modeldata?.designation || modeldata?.role || "",
      Salary: modeldata?.Salary || modeldata?.salary || "",
      UAN: modeldata?.UAN || modeldata?.uan || "",
      Bank: modeldata?.Bank || modeldata?.bank || "",
      AccNumber: modeldata?.AccNumber || modeldata?.acc_number || modeldata?.account_no || "",
      IFSCCode: modeldata?.IFSCCode || modeldata?.ifsc || "",
      Branch: modeldata?.Branch || modeldata?.branch || "",
      Status: modeldata?.Status || modeldata?.status || "Active",
    },
    validationSchema,
    onSubmit: async (formValues) => {
      try {
        const IMIE = sessionStorage.getItem("selectedItems");

        // Prepare the payload with Aadhar as the primary identifier
        const payload: Record<string, any> = {
          Employee: formValues.Employee,
          Address1: formValues.Address1,
          Contact: formValues.Contact,
          Aadhar: formValues.Aadhar,
          Pan: formValues.Pan,
          DOJ: formValues.DOJ,
          Designation: formValues.Designation,
          Salary: formValues.Salary,
          UAN: formValues.UAN,
          Bank: formValues.Bank,
          AccNumber: formValues.AccNumber,
          IFSCCode: formValues.IFSCCode,
          Branch: formValues.Branch,
          Status: formValues.Status,
        };

        const res = await axios.post(
          `https://norisapi.noris.in/Crusher/Employee.php?ID=${IMIE}&TableName=MyEmployeeSave`,
          payload
        );

        if (res.status === 200) {
          showToast("Success", "Employee information saved successfully!", "success");
          onSuccess?.();
          onClose();
        } else {
          showToast("Error", "Something went wrong. Please try again.", "danger");
        }
      } catch (error: any) {
        showToast(
          "Error",
          error.response?.data?.message || "Failed to save Employee information",
          "danger"
        );
      }
    },
  });

  return (
    <Offcanvas
      show={show}
      onHide={onClose}
      placement="end"
      backdrop={true}
      scroll={true}
      id="offcanvas_employee"
      style={{ width: "80%" }}
    >
      <OffcanvasHeader closeButton>
        <h5 className="mb-0">{modeldata ? "Edit Employee" : "Add Employee"}</h5>
      </OffcanvasHeader>

      <OffcanvasBody>
        <form onSubmit={formik.handleSubmit}>
          <div className="row">
            {/* Employee Name */}
            <div className="col-md-12 mb-3">
              <label className="form-label">
                Employee Name<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="Employee"
                className={`form-control ${formik.touched.Employee && formik.errors.Employee ? "is-invalid" : ""
                  }`}
                value={formik.values.Employee}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Employee Name"
              />
              {formik.touched.Employee && formik.errors.Employee && (
                <div className="invalid-feedback">{formik.errors.Employee}</div>
              )}
            </div>

            {/* Contact */}
            <div className="col-md-6 mb-3">
              <label className="form-label">
                Contact<span className="text-danger">*</span>
              </label>
              <CommonPhoneInput
                name="Contact"
                value={formik.values.Contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Phone Number"
              />
              {formik.touched.Contact && formik.errors.Contact && (
                <div className="text-danger small">{formik.errors.Contact}</div>
              )}
            </div>

            {/* Designation */}
            <div className="col-md-6 mb-3">
              <label className="form-label">
                Designation<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="Designation"
                className={`form-control ${formik.touched.Designation && formik.errors.Designation ? "is-invalid" : ""
                  }`}
                value={formik.values.Designation}
                onChange={formik.handleChange}
                placeholder="Designation"
              />
              {formik.touched.Designation && formik.errors.Designation && (
                <div className="invalid-feedback">{formik.errors.Designation}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">
                Date of Joining<span className="text-danger">*</span>
              </label>
              <CommonDatePicker
                value={
                  formik.values.DOJ
                    ? dayjs(formik.values.DOJ, "DD-MM-YYYY")
                    : null
                }
                format="DD-MM-YYYY"
                onChange={(date) =>
                  formik.setFieldValue(
                    "DOJ",
                    date ? dayjs(date).format("DD-MM-YYYY") : ""
                  )
                }
                placeholder="dd-mm-yyyy"
              />
            </div>

            {/* Status */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="Status"
                value={formik.values.Status}
                onChange={formik.handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <hr />
            <h6>Personal Details</h6>

            {/* Aadhar */}
            <div className="col-md-6 mb-3">
              <label className="form-label">
                Aadhar Number<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="Aadhar"
                className={`form-control ${formik.touched.Aadhar && formik.errors.Aadhar ? "is-invalid" : ""
                  }`}
                value={formik.values.Aadhar}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="12-digit Aadhar"
              />
              {formik.touched.Aadhar && formik.errors.Aadhar && (
                <div className="invalid-feedback">{formik.errors.Aadhar}</div>
              )}
            </div>

            {/* PAN */}
            <div className="col-md-6 mb-3">
              <label className="form-label">
                PAN Number<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="Pan"
                className={`form-control ${formik.touched.Pan && formik.errors.Pan ? "is-invalid" : ""
                  }`}
                value={formik.values.Pan}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="PAN Number"
              />
              {formik.touched.Pan && formik.errors.Pan && (
                <div className="invalid-feedback">{formik.errors.Pan}</div>
              )}
            </div>

            {/* UAN */}
            <div className="col-md-6 mb-3">
              <label className="form-label">UAN Number</label>
              <input
                type="text"
                name="UAN"
                className="form-control"
                value={formik.values.UAN}
                onChange={formik.handleChange}
                placeholder="UAN Number"
              />
            </div>

            {/* Salary */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Salary</label>
              <input
                type="number"
                name="Salary"
                className="form-control"
                value={formik.values.Salary}
                onChange={formik.handleChange}
                placeholder="Monthly Salary"
              />
            </div>

            <hr />
            <h6>Bank Details</h6>

            {/* Bank Name */}
            <div className="col-md-12 mb-3">
              <label className="form-label">
                Bank Name<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="Bank"
                className={`form-control ${formik.touched.Bank && formik.errors.Bank ? "is-invalid" : ""
                  }`}
                value={formik.values.Bank}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Bank Name"
              />
              {formik.touched.Bank && formik.errors.Bank && (
                <div className="invalid-feedback">{formik.errors.Bank}</div>
              )}
            </div>

            {/* Account Number */}
            <div className="col-md-6 mb-3">
              <label className="form-label">
                Account Number<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="AccNumber"
                className={`form-control ${formik.touched.AccNumber && formik.errors.AccNumber ? "is-invalid" : ""
                  }`}
                value={formik.values.AccNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Account Number"
              />
              {formik.touched.AccNumber && formik.errors.AccNumber && (
                <div className="invalid-feedback">{formik.errors.AccNumber}</div>
              )}
            </div>

            {/* IFSC Code */}
            <div className="col-md-6 mb-3">
              <label className="form-label">
                IFSC Code<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="IFSCCode"
                className={`form-control ${formik.touched.IFSCCode && formik.errors.IFSCCode ? "is-invalid" : ""
                  }`}
                value={formik.values.IFSCCode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="IFSC Code"
              />
              {formik.touched.IFSCCode && formik.errors.IFSCCode && (
                <div className="invalid-feedback">{formik.errors.IFSCCode}</div>
              )}
            </div>

            {/* Branch */}
            <div className="col-md-12 mb-3">
              <label className="form-label">Branch</label>
              <input
                type="text"
                name="Branch"
                className="form-control"
                value={formik.values.Branch}
                onChange={formik.handleChange}
                placeholder="Branch Name"
              />
            </div>

            <hr />
            {/* Address */}
            <div className="col-md-12 mb-3">
              <label className="form-label">Address</label>
              <textarea
                name="Address1"
                className="form-control"
                value={formik.values.Address1}
                onChange={formik.handleChange}
                placeholder="Complete Address"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="d-flex align-items-center justify-content-end mt-4">
            <button type="button" className="btn btn-light me-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {modeldata ? "Update Employee" : "Save Employee"}
            </button>
          </div>
        </form>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default ModalEmployee;

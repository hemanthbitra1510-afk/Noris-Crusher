import { Link } from "react-router-dom";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "react-bootstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import CommonPhoneInput from "../../components/common-phoneInput/commonPhoneInput";
import { SOUTH_INDIAN_STATES, E_Invoice } from "../../constants/constants";
import CommonDatePicker from "../../components/common-datePicker/commonDatePicker";
import { useToast } from "../../components/reuse-components/Toast";
import dayjs from "dayjs";
import axios from "axios";

const validationSchema = Yup.object({
  Name: Yup.string().required("Company Name is required"),
  RegNo: Yup.string().required("Registration Number is required"),
  AddressLine1: Yup.string().required("Address Line 1 is required"),
  Contact: Yup.string()
    .required("Contact is required")
    .matches(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
});

interface ModalCompaniesProps {
  show: boolean;
  onClose: () => void;
  modeldata?: any;
}

const ModalCompanies: React.FC<ModalCompaniesProps> = ({
  show,
  onClose,
  modeldata,
}) => {
  const showToast = useToast();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      AddressLine1: modeldata?.AddressLine1 || "",
      Contact: modeldata?.Contact || "",
      EInvoice: modeldata?.EInvoice || "",
      GST: modeldata?.GST || "",
      Logo: modeldata?.Logo || null,
      Name: modeldata?.Name || "",
      RegDate: modeldata?.RegDate || "",
      RegNo: modeldata?.RegNo || "",
      Renew: modeldata?.Renew || "",
      State1: modeldata?.State1 || "",
      LogoName: modeldata?.LogoName || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const IMIE = sessionStorage.getItem("selectedItems");

        const res = await axios.post(
          `https://norisapi.noris.in/Crusher/PostApi.php?ID=${IMIE}&Table=CompanyInfo`,
          values
        );

        if (res.status === 200) {
          showToast("Success", "Company information saved successfully!", "success");
          onClose();
        } else {
          showToast("Error", "Something went wrong. Please try again.", "danger");
        }
      } catch (error: any) {
        showToast(
          "Error",
          error.response?.data?.message || "Failed to save CompanyInfo",
          "danger"
        );
      }
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        formik.setFieldValue("Logo", reader.result);
        formik.setFieldValue("LogoName", file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Offcanvas
      show={show}
      onHide={onClose}
      placement="end"
      backdrop={true}
      scroll={true}
      id="offcanvas_edit"
    >
      <OffcanvasHeader closeButton>
        <h5 className="mb-0">Edit Company</h5>
      </OffcanvasHeader>

      <OffcanvasBody>
        <form onSubmit={formik.handleSubmit}>
          <div className="accordion accordion-bordered" id="main_accordion2">
            <div className="accordion-item rounded mb-3">
              <div className="accordion-header">
                <Link
                  to="#"
                  className="accordion-button accordion-custom-button rounded"
                  data-bs-toggle="collapse"
                  data-bs-target="#basic2"
                >
                  <span className="avatar avatar-md rounded me-1">
                    <i className="ti ti-user-plus" />
                  </span>
                  Basic Info
                </Link>
              </div>

              <div
                className="accordion-collapse collapse show"
                id="basic2"
                data-bs-parent="#main_accordion2"
              >
                <div className="accordion-body border-top">
                  <div className="row mb-3">
                    {/* Logo Upload */}
                    <div className="col-md-12">
                      <div className="d-flex align-items-center mb-3">
                        <div className="avatar avatar-xxl border border-dashed me-3 flex-shrink-0">
                          <div className="position-relative d-flex align-items-center justify-content-center w-100 h-100">
                            {formik.values.Logo ? (
                              <img
                                src={
                                  formik.values.Logo.startsWith("data:")
                                    ? formik.values.Logo
                                    : `data:image/jpeg;base64,${formik.values.Logo}`
                                }
                                alt="Logo Preview"
                                className="w-100 h-100 object-fit-contain"
                              />
                            ) : (
                              <i className="ti ti-photo text-dark fs-16" />
                            )}
                          </div>
                        </div>

                        <div className="d-inline-flex flex-column align-items-start">
                          <div className="drag-upload-btn btn btn-sm btn-primary position-relative mb-2">
                            <i className="ti ti-file-broken me-1" />
                            Upload Logo
                            <input
                              type="file"
                              accept="image/*"
                              className="form-control image-sign"
                              onChange={handleLogoChange}
                            />
                          </div>
                          <span>JPG, GIF, PNG up to 2MB</span>
                        </div>
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Company Name<span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="Name"
                        disabled
                        className={`form-control ${formik.touched.Name && formik.errors.Name ? "is-invalid" : ""
                          }`}
                        value={formik.values.Name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Company Name"
                      />
                      {formik.touched.Name && formik.errors.Name && (
                        <div className="invalid-feedback">{formik.errors.Name}</div>
                      )}
                    </div>

                    {/* Register Date */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Mining Register Date</label>
                      <CommonDatePicker
                        value={
                          formik.values.RegDate
                            ? dayjs(formik.values.RegDate, "DD-MM-YYYY")
                            : null
                        }
                        format="DD-MM-YYYY"
                        onChange={(date) =>
                          formik.setFieldValue(
                            "RegDate",
                            date ? dayjs(date).format("DD-MM-YYYY") : ""
                          )
                        }
                        placeholder="dd-mm-yyyy"
                      />
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
                        <div className="text-danger">{formik.errors.Contact}</div>
                      )}
                    </div>

                    {/* GST */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">GST</label>
                      <input
                        type="text"
                        name="GST"
                        className="form-control"
                        value={formik.values.GST}
                        disabled
                        onChange={formik.handleChange}
                        placeholder="GST Number"
                      />
                    </div>

                    {/* E-Invoice */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">E-Invoice</label>
                      <select
                        className="form-control"
                        name="EInvoice"
                        value={formik.values.EInvoice}
                        disabled
                        onChange={formik.handleChange}
                      >
                        <option value="">Select</option>
                        {E_Invoice.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Registration No */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Mining Registration No</label>
                      <input
                        type="text"
                        name="RegNo"
                        className={`form-control ${formik.touched.RegNo && formik.errors.RegNo ? "is-invalid" : ""
                          }`}
                        value={formik.values.RegNo}
                        onChange={formik.handleChange}
                      />
                      {formik.touched.RegNo && formik.errors.RegNo && (
                        <div className="invalid-feedback">{formik.errors.RegNo}</div>
                      )}
                    </div>

                    {/* State */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">State</label>
                      <select
                        className="form-select"
                        name="State1"
                        value={formik.values.State1}
                        disabled
                        onChange={formik.handleChange}
                      >
                        <option value="">Select State</option>
                        {SOUTH_INDIAN_STATES.map((state) => (
                          <option key={state.code} value={state.name}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Address Line 1 */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Address Line 1</label>
                      <textarea
                        name="AddressLine1"
                        className="form-control"
                        value={formik.values.AddressLine1}
                        disabled
                        onChange={formik.handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="d-flex align-items-center justify-content-end">
            <button type="button" className="btn btn-light me-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default ModalCompanies;

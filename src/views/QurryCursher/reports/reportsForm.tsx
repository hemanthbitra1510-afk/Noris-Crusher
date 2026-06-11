import { Link } from "react-router-dom";
import {
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    Row,
} from "react-bootstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useToast } from "../../../components/reuse-components/Toast";
import axios from "axios";
import { useEffect } from "react";

interface ModalReportsProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    modeldata?: Partial<Record<string, string | number>>;
}

const validationSchema = Yup.object({
    DCNum: Yup.string().required("DC Number is required"),
    Vehicle: Yup.string().required("Vehicle is required"),
    Quarry: Yup.string().required("Quarry is required"),
    Extractor: Yup.string().required("Extractor is required"),
    Gross: Yup.number().required("Gross weight is required"),
    Tare: Yup.number().required("Tare weight is required"),
    Nett: Yup.number().required("Nett weight is required"),
    Rate: Yup.number().required("Rate is required"),
    Amount: Yup.number().required("Amount is required"),
});

const ReportsForm: React.FC<ModalReportsProps> = ({
    show,
    onClose,
    onSuccess,
    modeldata,
}) => {
    const showToast = useToast();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            IDS: modeldata?.ID || "",
            DCNum: modeldata?.DCNum || "",
            Vehicle: modeldata?.Vehicle || "",
            Quarry: modeldata?.Quarry || "",
            Extractor: modeldata?.Extractor || "",
            Gross: Number(modeldata?.Gross) || 0,
            Tare: Number(modeldata?.Tare) || 0,
            Nett: Number(modeldata?.Nett) || 0,
            Rate: Number(modeldata?.Rate) || 0,
            Amount: Number(modeldata?.Amount) || 0,
        },
        validationSchema,
        validateOnBlur: true,
        validateOnChange: true,
        onSubmit: async (values) => {
            console.log("Formik default submit:", values);
        },
    });

    const handleCustomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = await formik.validateForm();

        const otherErrors = Object.keys(errors).filter((key) => key !== "Nett");

        if (otherErrors.length > 0) {
            formik.setErrors(errors);
            return;
        }
        formik.setErrors(errors);
        const storedIMIE = sessionStorage.getItem("selectedItems");
        try {
            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${storedIMIE}&Table=SaveQuarryData`,
                {
                    ...modeldata,
                    ...formik.values,
                    NettRaw: formik.values.Nett,
                    ActualNett: Number(formik.values.Gross) - Number(formik.values.Tare),
                    ActualNettRaw: Number(formik.values.Gross) - Number(formik.values.Tare)
                }
            );
            if (res.status === 200) {
                showToast("Success", "Report saved successfully!", "success");
                onClose();
                onSuccess();
            } else {
                showToast("Error", "Something went wrong. Please try again.", "danger");
            }
        } catch (error: any) {
            console.error("API Error:", error);
            showToast(
                "Error",
                error.response?.data?.message || "Failed to save Report",
                "danger"
            );
        }
    };

    const handleNumericChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target)
        const { name, value } = e.target;
        const val = Number(value) || 0;
        formik.setFieldValue(name, val);

        if (name === "Nett") {
            formik.setFieldValue("Amount", val * formik.values.Rate);
        }
        if (name === "Rate") {
            formik.setFieldValue("Amount", formik.values.Nett * val);
        }
        if (name === "Gross") {
            const newNett = val - formik.values.Tare;
            formik.setFieldValue("Nett", newNett);
            formik.setFieldValue("Amount", newNett * formik.values.Rate);
        }
        if (name === "Tare") {
            const newNett = formik.values.Gross - val;
            formik.setFieldValue("Nett", newNett);
            formik.setFieldValue("Amount", newNett * formik.values.Rate);
        }
        if (name === "Nett") await formik.validateField("Nett");
    };
    useEffect(() => {
        if (formik.values.Nett !== undefined) {
            formik.setFieldTouched("Nett", true, false);
            formik.validateField("Nett");
        }
    }, [formik.values.Nett]);
    return (
        <Offcanvas
            show={show}
            onHide={onClose}
            placement="end"
            backdrop={true}
            scroll={true}
            id="offcanvas_edit_report"
        >
            <OffcanvasHeader closeButton>
                <h5 className="mb-0">Add Report</h5>
            </OffcanvasHeader>
            <OffcanvasBody>
                <form onSubmit={handleCustomSubmit}>
                    <div className="accordion accordion-bordered" id="main_accordion_report">
                        <div className="accordion-item rounded mb-3">
                            <div className="accordion-header">
                                <Link
                                    to="#"
                                    className="accordion-button accordion-custom-button rounded"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#basic_report"
                                >
                                    <span className="avatar avatar-md rounded me-1">
                                        <i className="ti ti-file-plus" />
                                    </span>
                                    Report Info
                                </Link>
                            </div>
                            <div
                                className="accordion-collapse collapse show"
                                id="basic_report"
                                data-bs-parent="#main_accordion_report"
                            >
                                <div className="accordion-body border-top">
                                    <div className="row">
                                        {/* DC Number */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                DC Number<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter DC Number"
                                                className={`form-control ${formik.touched.DCNum && formik.errors.DCNum
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="DCNum"
                                                value={formik.values.DCNum}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.DCNum && formik.errors.DCNum && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.DCNum}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Vehicle<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Vehicle Number"
                                                className={`form-control ${formik.touched.Vehicle && formik.errors.Vehicle
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Vehicle"
                                                value={formik.values.Vehicle}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.Vehicle && formik.errors.Vehicle && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.Vehicle}
                                                </div>
                                            )}
                                        </div>

                                        {/* Quarry */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Quarry<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Quarry Name"
                                                className={`form-control ${formik.touched.Quarry && formik.errors.Quarry
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Quarry"
                                                value={formik.values.Quarry}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.Quarry && formik.errors.Quarry && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.Quarry}
                                                </div>
                                            )}
                                        </div>

                                        {/* Extractor */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Extractor<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Extractor Name"
                                                className={`form-control ${formik.touched.Extractor && formik.errors.Extractor
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Extractor"
                                                value={formik.values.Extractor}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.Extractor && formik.errors.Extractor && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.Extractor}
                                                </div>
                                            )}
                                        </div>

                                        {/* Gross */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Gross<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Enter Gross Weight"
                                                className={`form-control ${formik.touched.Gross && formik.errors.Gross
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Gross"
                                                value={formik.values.Gross}
                                                onChange={handleNumericChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.Gross && formik.errors.Gross && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.Gross}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tare */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Tare<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Enter Tare Weight"
                                                className={`form-control ${formik.touched.Tare && formik.errors.Tare
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Tare"
                                                value={formik.values.Tare}
                                                onChange={handleNumericChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.Tare && formik.errors.Tare && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.Tare}
                                                </div>
                                            )}
                                        </div>

                                        {/* Nett */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Nett<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className={`form-control ${formik.touched.Nett && formik.errors.Nett
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Nett"
                                                value={formik.values.Nett}
                                                onChange={handleNumericChange}
                                                onBlur={formik.handleBlur}
                                            />
                                        </div>

                                        {/* Rate */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Rate<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Enter Rate per Unit"
                                                className={`form-control ${formik.touched.Rate && formik.errors.Rate
                                                    ? "is-invalid"
                                                    : ""
                                                    }`}
                                                name="Rate"
                                                value={formik.values.Rate}
                                                onChange={handleNumericChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.Rate && formik.errors.Rate && (
                                                <div className="invalid-feedback">
                                                    {formik.errors.Rate}
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Amount<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                readOnly
                                                className="form-control"
                                                name="Amount"
                                                value={formik.values.Amount}
                                            />
                                        </div>

                                        {/* Nett info message */}
                                        <Row>
                                            {formik.touched.Nett && formik.errors.Nett && (
                                                <div className="text-info text-end mb-2 d-flex align-items-center justify-content-end">
                                                    <i className="ti ti-info-circle me-1"></i>
                                                    {formik.errors.Nett}
                                                </div>
                                            )}
                                        </Row>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="d-flex align-items-center justify-content-end">
                        <button
                            type="button"
                            className="btn btn-light me-2"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Report
                        </button>
                    </div>
                </form>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default ReportsForm;

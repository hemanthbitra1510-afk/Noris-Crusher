import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import { useEffect, useState } from "react";
import ModalCompanies from "./modalCompanies";
import axios from "axios";

const CompanyList = () => {

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [gstin, setGstin] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  /* ================= FETCH COMPANIES ================= */

  const CompaniesData = async () => {

    const userData = JSON.parse(sessionStorage.getItem("userData") || "[]");

    const data = {
      UserID: userData[0]?.UserID,
      Password: userData[0]?.Password,
    };

    try {

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/PostApi.php?ID=IMIE30042018&Table=CompaniesList`,
        data
      );

      setCompanies(res.data || []);
      console.log(res.data);

    } catch (error) {

      console.error("Error fetching companies:", error);

    }

  };

  useEffect(() => {

    CompaniesData();

  }, []);

  /* ================= AGING API CALL ================= */

  const fetchAgingOnCompanySelect = async (companyID: string) => {

    try {

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Aging.php?ID=${companyID}&TableName=Aging`,
        { Party: "" }
      );

      sessionStorage.setItem("agingData", JSON.stringify(res.data || []));

    } catch (error) {

      console.error("Failed to fetch aging data:", error);

    }

  };

  /* ================= COMPANY SELECT ================= */

  const handleSelect = async (company: any) => {

    try {

      const userData = JSON.parse(sessionStorage.getItem("userData") || "[]");

      const userID = userData[0]?.UserID;
      const password = userData[0]?.Password;

      if (!userID || !password) {
        console.error("Login credentials missing");
        return;
      }

      const loginRes = await axios.get(
        `https://norisapi.noris.in/Crusher/Login.php?UserID=${userID}&Password=${password}`
      );

      const loginInfo = loginRes.data?.[0];

      /* ===== VERIFIED USER ===== */

      if (
        loginInfo?.Verify &&
        loginInfo.Verify.trim().toLowerCase() === "verified"
      ) {

        sessionStorage.setItem("selectedItems", company.IMIE);
        sessionStorage.setItem("selectedItems1", JSON.stringify(company));

        // ✅ CALL AGING API
        fetchAgingOnCompanySelect(company.IMIE); // run in background
        navigate(all_routes.FinancialDashborad);
        return;

      }

      /* ===== OPEN VERIFY MODAL ===== */

      if (!loginInfo?.Verify || loginInfo.Verify.trim() === "") {

        setSelectedCompany(company);
        setGstin("");
        setVerifyError("");
        setShowVerifyModal(true);

        return;

      }

    } catch (error) {

      console.error("Verification process failed:", error);

    }

  };

  /* ================= GST VERIFY ================= */

  const handleGSTVerify = async () => {

    if (!gstin.trim()) {

      setVerifyError("Please enter GSTIN");
      return;

    }

    try {

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/GSTIN.php?ID=${selectedCompany.IMIE}&GSTIN=${gstin.trim()}`
      );

      if (Number(res.data) === 1) {

        sessionStorage.setItem("selectedItems", selectedCompany.IMIE);
        sessionStorage.setItem("selectedItems1", JSON.stringify(selectedCompany));

        // ✅ CALL AGING API
        fetchAgingOnCompanySelect(selectedCompany.IMIE); // background call
        navigate(all_routes.FinancialDashborad);

        navigate(all_routes.FinancialDashborad);

      } else {

        setVerifyError("Invalid GSTIN. Verification failed.");

      }

    } catch (error) {

      setVerifyError("Verification failed. Try again.");

    }

  };

  /* ================= EDIT COMPANY ================= */

  const handleEdit = async (company: any) => {

    console.log("modalopenkjask");

    sessionStorage.setItem("selectedItems", company.IMIE);

    try {

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${company.IMIE}&Table=AddressTable`
      );

      setModelData(res.data);
      setShowModal(true);

    } catch (error) {

      console.error("Error fetching company data:", error);

    }

  };

  return (

    <div
      className="card border-0 bg-danger text-white shadow-sm"
      style={{ minHeight: "700px" }}
    >

      <div className="card-body h-100">

        <div className="content p-4">

          {/* Header */}

          <div className="d-flex align-items-center justify-content-between mb-4">
            <h5 className="fw-bold m-0 text-white">Companies</h5>
          </div>

          {companies.length === 0 ? (

            <div className="text-center text-muted py-5">
              <i className="ti ti-building fs-1 mb-2 text-secondary" />
              <p className="mb-0">No companies found.</p>
            </div>

          ) : (

            <div className="row g-4">

              {companies.map((company, index) => (

                <div className="col-xxl-3 col-xl-4 col-md-6" key={index}>

                  <div
                    className="card shadow-sm h-100 position-relative p-4 transition-transform hover-scale-105"
                    style={{
                      borderRadius: "1rem",
                      border: "1px solid #8d8d8dff",
                      backgroundColor: company.IMIE?.includes("RMC")
                        ? "#cececeff"
                        : company.IMIE?.includes("IMIE")
                          ? "#ffffffff"
                          : "#ffffff"
                    }}
                  >

                    {/* Header */}

                    <div className="d-flex align-items-center mb-4">

                      <div
                        onClick={() => handleSelect(company)}
                        className="flex-shrink-0 me-3"
                        style={{ cursor: "pointer" }}
                      >

                        <div
                          className="avatar-lg rounded-circle overflow-hidden shadow-sm transition-transform hover-scale-110"
                          style={{
                            width: "75px",
                            height: "75px",
                            border: "3px solid var(--bs-primary-bg-subtle)",
                          }}
                        >

                          <img
                            src={
                              company.Logo
                                ? `data:image/jpeg;base64,${company.Logo}`
                                : "assets/img/icons/company-icon-01.svg"
                            }
                            className="w-100 h-100 object-fit-cover"
                            alt="Company"
                          />

                        </div>

                      </div>

                      <div className="flex-grow-1">

                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="text-dark mb-1">{company.Name}</h6>
                          {company.IMIE?.includes("RMC") ? (
                            <span className="badge bg-secondary font-weight-bold">RMC</span>
                          ) : company.IMIE?.includes("IMIE") ? (
                            <span className="badge bg-primary font-weight-bold">Crusher</span>
                          ) : null}
                        </div>

                        <p className="text-dark small mb-0 d-flex align-items-center">
                          <i className="ti ti-map-pin me-2 text-primary" />
                          {company.AddressLine1 || "No Address"}
                        </p>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="row g-3 small text-secondary">

                      <div className="col-12">
                        <p className="d-flex align-items-center mb-0">
                          <i className="ti ti-user me-2 text-primary" />
                          <span className="fw-medium text-dark">
                            {(company.UserName || "User Name").toUpperCase()}
                          </span>
                        </p>
                      </div>

                      <div className="col-md-6 col-12">
                        <p className="d-flex align-items-center mb-0">
                          <i className="ti ti-id me-2 text-primary" />
                          <span className="fw-medium text-dark">{company.IMIE || "N/A"}</span>
                        </p>
                      </div>

                      <div className="col-md-6 col-12">
                        <p className="d-flex align-items-center mb-0">
                          <i className="ti ti-phone me-2 text-primary" />
                          <span className="fw-medium text-dark">{company.Contact || "N/A"}</span>
                        </p>
                      </div>

                      <div className="col-12">
                        <p className="d-flex align-items-center mb-0">
                          <i className="ti ti-file-text me-2 text-primary" />
                          <span className="fw-medium text-dark">{company.GST || "N/A"}</span>
                        </p>
                      </div>

                    </div>

                    <div className="d-flex gap-2 mt-4 pt-3 border-top">

                      <button
                        className="btn btn-outline-primary w-50"
                        onClick={() => handleEdit(company)}
                      >
                        <i className="ti ti-edit me-1" /> Edit
                      </button>

                      <button
                        className="btn btn-outline-success w-50"
                        onClick={() => handleSelect(company)}
                      >
                        <i className="ti ti-eye me-1" /> Preview
                      </button>

                    </div>

                  </div>
                </div>

              ))}

            </div>

          )}

        </div>

      </div>

      {/* EDIT MODAL */}

      {showModal && (

        <ModalCompanies
          show={showModal}
          onClose={() => setShowModal(false)}
          modeldata={modelData}
        />

      )}

      {/* VERIFY MODAL */}

      {showVerifyModal && (

        <div className="modal show d-block">

          <div className="modal-dialog">

            <div className="modal-content p-4">

              <h5>Verify Company</h5>

              <div className="mb-3">

                <label className="form-label">IMIE</label>

                <input
                  type="text"
                  className="form-control"
                  value={selectedCompany?.IMIE}
                  disabled
                />

              </div>

              <div className="mb-3">

                <label className="form-label">Enter GSTIN</label>

                <input
                  type="text"
                  className="form-control"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />

              </div>

              {verifyError && (
                <div className="text-danger mb-2">{verifyError}</div>
              )}

              <button
                className="btn btn-primary w-100"
                onClick={handleGSTVerify}
              >
                Verify
              </button>

              <button
                className="btn btn-secondary w-100 mt-2"
                onClick={() => setShowVerifyModal(false)}
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default CompanyList;


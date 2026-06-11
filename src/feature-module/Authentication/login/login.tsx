import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../../core/redux/userSlice";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../../core/redux/store";
type PasswordField = "password" | "confirmPassword";
const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.user);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleSubmit = async () => {
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      navigate("/Company-list");
    }
  };
  return (
    <div className="overflow-hidden p-3 acc-vh">
      <div className="row vh-100 w-100 g-0">
        <div className="col-lg-6 vh-100 overflow-y-auto overflow-x-hidden">
          <div className="row">
            <div className="col-md-10 mx-auto">
              <form
                className=" vh-100 d-flex justify-content-between flex-column p-4 pb-0"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="text-center mb-4 auth-logo">
                  <h4>Crusher</h4>
                </div>
                <div>
                  <div className="mb-3">
                    <h5 className="mb-2">Sign In</h5>
                  </div>
                  {/* Username */}
                  <div className="mb-3">
                    <label className="form-label">User Name</label>
                    <div className="input-group input-group-flat">
                      <input
                        type="text"
                        className="form-control"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                      <span className="input-group-text">
                        <i className="ti ti-user" />
                      </span>
                    </div>
                  </div>
                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="input-group input-group-flat pass-group">
                      <input
                        type={passwordVisibility.password ? "text" : "password"}
                        className="form-control pass-input"
                        placeholder="****************"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <span
                        className={`ti toggle-password input-group-text toggle-password ${
                          passwordVisibility.password ? "ti-eye" : "ti-eye-off"
                        }`}
                        onClick={() => togglePasswordVisibility("password")}
                      ></span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="form-check form-check-md d-flex align-items-center">
                      <input
                        className="form-check-input mt-0"
                        type="checkbox"
                        id="checkebox-md"
                        defaultChecked
                      />
                      <label
                        className="form-check-label text-dark ms-1"
                        htmlFor="checkebox-md"
                      >
                        Remember Me
                      </label>
                    </div>
                    <div className="text-end">
                      <Link
                        to={all_routes.forgotPassword}
                        className="link-danger fw-medium link-hover"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>
                  <div
                    className="mb-3 btn btn-primary w-100"
                    onClick={handleSubmit}
                    style={{ cursor: "pointer" }}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </div>
                  {error && <div className="text-danger text-center">{error}</div>}
                </div>
                <div className="text-center pb-4">
                  <p className="text-dark mb-0">--------------</p>
                </div>
              </form>
            </div>{" "}
          </div>
        </div>
        <div className="col-lg-6 account-bg-01" />
      </div>
    </div>
  );
};
export default Login;
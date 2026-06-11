import { Navigate, Route } from "react-router";
import { all_routes } from "./all_routes";
// pages
import { lazy } from "react";

// pages
const CompanyList = lazy(() => import("../views/Company/CompanyList"));
const Login = lazy(() => import("../feature-module/Authentication/login/login"));
const IncomeStatement = lazy(() => import("../views/FinancialReports/IncomeStatement/IncomeStatement"));
const Register = lazy(() => import("../feature-module/Authentication/register/register"));
const ResetPassword = lazy(() => import("../feature-module/Authentication/reset-password/resetPassword"));
const ForgotPassword = lazy(() => import("../feature-module/Authentication/forgot-password/forgotPassword"));
const EmailVerification = lazy(() => import("../feature-module/Authentication/email-verification/emailVerification"));
const TwoStepVerification = lazy(() => import("../feature-module/Authentication/two-step-verification/twoStepVerification"));
const LockScreen = lazy(() => import("../feature-module/Authentication/lock-screen/lockScreen"));
const Ageing = lazy(() => import("../views/Accounts/Aging/aging"));
const SalesRegDebitors1 = lazy(() => import("../views/Sales/RegDebitors/RegDebitors1"));
const FinancialDashborad = lazy(() => import("../views/Dashboards/financial-dashboards"));
const Material = lazy(() => import("../views/Dashboards/material"));
const SourcesList = lazy(() => import("../views/Masters/sources/sourcesList"));
const LoginList = lazy(() => import("../views/Masters/logins/loginList"));
const BanksList = lazy(() => import("../views/Masters/banks/banksList"));
const DCSlipsList = lazy(() => import("../views/QurryCursher/DCSlips/dcSlipsList"));
const InputMaterialsList = lazy(() => import("../views/QurryCursher/InputMaterials/inputMaterialsList"));
const CompresserList = lazy(() => import("../views/QurryCursher/compresser/compresserList"));
const ContractorList = lazy(() => import("../views/QurryCursher/contractor/contractorList"));
const ContractorStatement = lazy(() => import("../views/QurryCursher/contractor-statement/contractorStatement"));
const ReportList = lazy(() => import("../views/QurryCursher/reports/reportList"));
const TransportList = lazy(() => import("../views/QurryCursher/Transport/transportList"));
const TransporterStatement = lazy(() => import("../views/Transport/TransporterStatement/TransporterStatement"));
const IssueList = lazy(() => import("../views/Inventory/issue/IssueList"));
const DieselIssueList = lazy(() => import("../views/Diesel/issue/DieselIssueList"));
const MonthlyList = lazy(() => import("../views/Production/monthly/monthlyList"));
const DailyList = lazy(() => import("../views/Production/daily/dailyList"));
const YearlyList = lazy(() => import("../views/Production/yearly/yearlyList"));
const SalesAmount = lazy(() => import("../views/Production/salesAmount/SalesAmount"));
const InventoryStock = lazy(() => import("../views/Inventory/stock/inventoryStock"));
const BalanceList = lazy(() => import("../views/Inventory/balance/balanceList"));
const DieselFlow = lazy(() => import("../views/Diesel/flow/DieselFlow"));
const DieselMileage = lazy(() => import("../views/Diesel/mileage/DieselMileage"));
const DieselReports = lazy(() => import("../views/Diesel/reports/DieselReports"));
const VehicleList = lazy(() => import("../views/Vehicle/Vehicle/VehicleList"));
const MaintainanceList = lazy(() => import("../views/Vehicle/Maintainance/MaintainanceList"));
const KMReading = lazy(() => import("../views/Vehicle/KM Reading/KMReading"));
const TransPortReports = lazy(() => import("../views/Transport/Reports/TransPortReports"));
const TransPorterList = lazy(() => import("../views/Transport/TransPorter/TransPorterList"));
const YardNormalWmt = lazy(() => import("../views/Yard/normalWmt/YardNormalWmt"));
const YardReports = lazy(() => import("../views/Yard/reports/YardReports"));
const YardStock = lazy(() => import("../views/Yard/stock/YardStock"));
const SalesDebitorReport = lazy(() => import("../views/Sales/DebitorReport/salesDebitorReport"));
const SaleDebitorSummary = lazy(() => import("../views/Sales/DebitorSummary/saleDebitorSummary"));
const OtherSales = lazy(() => import("../views/Sales/OtherSales/otherSales"));
const SaleGstSales = lazy(() => import("../views/Sales/GSTSales/saleGstSales"));
const SalesRegDebitors = lazy(() => import("../views/Sales/RegDebitors/regDebitors"));
const SalesReports = lazy(() => import("../views/Sales/SalesReports/salesReports"));
const SalesStatement = lazy(() => import("../views/Sales/Statement/statement"));
const SaleUnRegDebitors = lazy(() => import("../views/Sales/Un-RegDebitors/Un-RegDebitors"));
const NonGstSales = lazy(() => import("../views/Sales/NonGSTSales/nonGstSales"));
const AcccountCashIn = lazy(() => import("../views/Accounts/cashIn/AcccountCashIN"));
const AccountCashOut = lazy(() => import("../views/Accounts/cashOut/AccountCashOut"));
const AccountDayBook = lazy(() => import("../views/Accounts/dayBook/AccountDayBook"));
const AccountJourmal = lazy(() => import("../views/Accounts/Journal/AccountJourmal"));
const AccountLedgerList = lazy(() => import("../views/Accounts/ledger/AccountLedgerList"));
const AccountRegList = lazy(() => import("../views/Accounts/regCreators/AccountRegList"));
const AccountReports = lazy(() => import("../views/Accounts/reports/AccountReports"));
const AccountVoucher = lazy(() => import("../views/Accounts/vouchers/Voucher"));
const AccountLedgerType = lazy(() => import("../views/Accounts/ledgerType/LedgerType"));
const AccountContra = lazy(() => import("../views/Accounts/contra/AccountContra"));
const InvoiceList = lazy(() => import("../views/GST/Invoice/Invoice"));
const MaterialList = lazy(() => import("../views/Masters/Materials/materialList"));
const Spares = lazy(() => import("../views/Accounts/Spares/Spares"));
const WeightBridge = lazy(() => import("../views/Accounts/WeightBridge/WeightBridge"));
const Aging = lazy(() => import("../views/Accounts/Aging/aging"));
const Recurring = lazy(() => import("../views/Accounts/Recurring/recurring"));
const Roles = lazy(() => import("../views/Masters/Roles/roles"));
const EmployeeList = lazy(() => import("../views/Employee/employees/EmployeeList"));
const EmployeeAttendance = lazy(() => import("../views/Employee/attendance/EmployeeAttendance"));
const EmployeeAdvances = lazy(() => import("../views/Employee/advances/EmployeeAdvances"));
const EmployeeStatement = lazy(() => import("../views/Employee/statement/EmployeeStatement"));
const EmployeeAnalysis = lazy(() => import("../views/Employee/analysis/EmployeeAnalysis"));
const MaterialRatesList = lazy(() => import("../views/Misc/MaterialRates/materialRatesList"));
const TransporterVehicleList = lazy(() => import("../views/Transport/TransporterVehicle/TransporterVehicleList"));
const route = all_routes;
export const publicRoutes = [
  {
    path: "/",
    name: "Root",
    element: <Navigate to={route.login} />,
    route: Route,
  },
  {
    id: "200",
    path: route.CompanyList,
    element: <CompanyList />,
    route: Route,
    meta_title: "Companys",
  },
  {
    id: "201",
    path: route.FinancialDashborad,
    element: <FinancialDashborad />,
    route: Route,
    meta_title: "FinancialDashborad",
  },
  {
    id: "202",
    path: route.Material,
    element: <Material />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "203",
    path: route.SourcesList,
    element: <SourcesList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "204",
    path: route.LoginList,
    element: <LoginList />,
    route: Route,
    meta_title: "Material",
  },
  {
  id: "247",
  path: route.Spares,
  element: <Spares />,
  route: Route,
  meta_title: "Spares",
},
 {
  id: "250",
  path: route.WeightBridge,
  element: <WeightBridge />,
  route: Route,
  meta_title: "WeightBridge",
},
  {
    id: "205",
    path: route.BanksList,
    element: <BanksList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "206",
    path: route.CompresserList,
    element: <CompresserList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "206.1",
    path: route.DCSlips,
    element: <DCSlipsList />,
    route: Route,
    meta_title: "DCSlips",
  },
  {
    id: "206.2",
    path: route.InputMaterials,
    element: <InputMaterialsList />,
    route: Route,
    meta_title: "InputMaterials",
  },
  {
    id: "207",
    path: route.ContractorList,
    element: <ContractorList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "208",
    path: route.ContractorStatement,
    element: <ContractorStatement />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "208.1",
    path: route.SalesRegDebitors1,
    element: <SalesRegDebitors1 />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "209",
    path: route.ReportList,
    element: <ReportList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "210",
    path: route.TransportList,
    element: <TransportList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "999",
    path: route.TransporterStatement,
    element: <TransporterStatement />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "211",
    path: route.InventoryIssue,
    element: <IssueList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "212",
    path: route.DieselIssueList,
    element: <DieselIssueList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "213",
    path: route.DailyList,
    element: <DailyList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "214",
    path: route.MonthlyList,
    element: <MonthlyList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "215",
    path: route.YearlyList,
    element: <YearlyList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "216",
    path: route.SalesAmount,
    element: <SalesAmount />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "217",
    path: route.InventoryStock,
    element: <InventoryStock />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "218",
    path: route.BalanceList,
    element: <BalanceList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "219",
    path: route.DieselFlow,
    element: <DieselFlow />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "220",
    path: route.DieselMileage,
    element: <DieselMileage />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "221",
    path: route.DieselReports,
    element: <DieselReports />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "222",
    path: route.VehicleList,
    element: <VehicleList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "223",
    path: route.MaintainanceList,
    element: <MaintainanceList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "224",
    path: route.KMReading,
    element: <KMReading />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "225",
    path: route.TransPortReports,
    element: <TransPortReports />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "226",
    path: route.TransPorterList,
    element: <TransPorterList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "490",
    path: route.Aging,
    element: <Aging />,
    route: Route,
    meta_title: "Material",
  },
  { 
    id:"491",
    path: route.Roles,
    element: <Roles />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "227",
    path: route.YardNormalWmt,
    element: <YardNormalWmt />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "228",
    path: route.YardReports,
    element: <YardReports />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "229",
    path: route.YardStock,
    element: <YardStock />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "230",
    path: route.SalesDebitorReport,
    element: <SalesDebitorReport />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "230",
    path: route.SalesDebitorReport,
    element: <SalesDebitorReport />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "231",
    path: route.SaleDebitorSummary,
    element: <SaleDebitorSummary />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "232",
    path: route.SaleGstSales,
    element: <SaleGstSales />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "233",
    path: route.SalesRegDebitors,
    element: <SalesRegDebitors />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "234",
    path: route.SalesReports,
    element: <SalesReports />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "235",
    path: route.SalesStatement,
    element: <SalesStatement />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "236",
    path: route.SaleUnRegDebitors,
    element: <SaleUnRegDebitors />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "237",
    path: route.NonGstSales,
    element: <NonGstSales />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "237_1",
    path: route.OtherSales,
    element: <OtherSales />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "238",
    path: route.AcccountCashIn,
    element: <AcccountCashIn />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "239",
    path: route.AccountCashOut,
    element: <AccountCashOut />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "240",
    path: route.AccountDayBook,
    element: <AccountDayBook />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "241",
    path: route.AccountJourmal,
    element: <AccountJourmal />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "242",
    path: route.AccountLedgerList,
    element: <AccountLedgerList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "243",
    path: route.AccountRegList,
    element: <AccountRegList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "244",
    path: route.AccountReports,
    element: <AccountReports />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "244.1",
    path: route.AccountVoucher,
    element: <AccountVoucher />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "244.2",
    path: route.AccountLedgerType,
    element: <AccountLedgerType />,
    route: Route,
    meta_title: "Ledger Type",
  },
  {
    id: "244.3",
    path: route.AccountContra,
    element: <AccountContra />,
    route: Route,
    meta_title: "Contra",
  },
  {
    id: "244.4",
    path: route.Recurring,
    element: <Recurring />,
    route: Route,
    meta_title: "Recurring Subscriptions",
  },
  {
    id: "245",
    path: route.InvoiceList,
    element: <InvoiceList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "246",
    path: route.MaterialList,
    element: <MaterialList />,
    route: Route,
    meta_title: "Material",
  },
  {
    id: "301",
    path: route.EmployeeList,
    element: <EmployeeList />,
    route: Route,
    meta_title: "Employee",
  },
  {
    id: "302",
    path: route.EmployeeAttendance,
    element: <EmployeeAttendance />,
    route: Route,
    meta_title: "Employee",
  },
  {
    id: "303",
    path: route.EmployeeAdvances,
    element: <EmployeeAdvances />,
    route: Route,
    meta_title: "Employee",
  },
  {
    id: "304",
    path: route.EmployeeStatement,
    element: <EmployeeStatement />,
    route: Route,
    meta_title: "Employee",
  },
  {
    id: "306",
    path: route.EmployeeAnalysis,
    element: <EmployeeAnalysis />,
    route: Route,
    meta_title: "Employee",
  },
  {
    id: "305",
    path: route.IncomeStatement,
    element: <IncomeStatement />,
    route: Route,
    meta_title: "IncomeStatement",
  },
  {
    id: "601",
    path: route.MaterialRates,
    element: <MaterialRatesList />,
    route: Route,
    meta_title: "Material Rates",
  },
  {
    path: route.TransporterVehicle,
    element: <TransporterVehicleList />,
    route: Route,
  }
];

export const authRoutes = [
  {
    id: "1",
    path: route.login,
    element: <Login />,
    route: Route,
    meta_title: "Login",
  },
  {
    id: "2",
    path: route.register,
    element: <Register />,
    route: Route,
    meta_title: "Register",
  },
  {
    id: "3",
    path: route.resetPassword,
    element: <ResetPassword />,
    route: Route,
    meta_title: "Reset Password",
  },
  {
    id: "4",
    path: route.forgotPassword,
    element: <ForgotPassword />,
    route: Route,
    meta_title: "Forgot Password",
  },
  {
    id: "5",
    path: route.emailVerification,
    element: <EmailVerification />,
    route: Route,
    meta_title: "Email Verification",
  },
  {
    id: "6",
    path: route.twoStepVerification,
    element: <TwoStepVerification />,
    route: Route,
    meta_title: "TwoStep Verification",
  },
  {
    id: "7",
    path: route.lockScreen,
    element: <LockScreen />,
    route: Route,
    meta_title: "Lock Screen",
  },



];

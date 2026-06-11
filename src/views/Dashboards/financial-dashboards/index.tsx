import { Link } from "react-router"
import CollapseIcons from "../../../components/collapse-icons/collapseIcons"
import { all_routes } from "../../../routes/all_routes"
import FinancialWidgets from "./financialWidgets"
import FinancialDebitors from "./financialDebitors"
import MaterialTopList from "./financialMaterialSale"
import { Card, CardBody, CardHeader, Col, Row } from "react-bootstrap"
import DieselTopList from "./dieselTop"
import FinanicalPieChart from "./pieChartMatrial"
import { useEffect, useState } from "react"
import { checkPageAccess } from "../../../utils/permission"


const FinancialDashborad = () => {
    const accessDenied = checkPageAccess("DashBoard", "Financial");
    if (accessDenied) return accessDenied;

    const [company,setCompany]=useState<any>({})
    useEffect(()=>{
      const userData = JSON.parse(sessionStorage.getItem("selectedItems1") || "[]");
    setCompany(userData)
    console.log(userData)
    },[])
    return (
        <>
            <div className="page-wrapper">
                <div className="content p-1">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap p-2">
                        <div>
                            <h5 className="mb-0">Financial Dashboard</h5>
                        </div>
                        <div className="gap-2 d-flex align-items-center flex-wrap">
                            <CollapseIcons />
                        </div>
                    </div>
                    <div className="welcome-wrap mb-1">
                        <div className=" d-flex align-items-center justify-content-between flex-wrap gap-3 bg-primary bg-opacity-10 rounded p-4">
                            <div>
                                <h2 className="mb-1 fs-24 text-primary">Welcome Back {company.UserName}</h2>
                            </div>
                            <div className="d-flex align-items-center flex-wrap gap-2">
                                <Link to={all_routes.CompanyList} className="btn btn-primary btn-sm">
                                    Companies
                                </Link>
                            </div>
                        </div>
                    </div>
                    <FinancialWidgets />
                    <Row>
                        <Col xs={12} md={6}>
                            <Card>
                                <CardHeader className="fw-bold text-start text-primary">
                                    Material Net Percent-wise
                                </CardHeader>
                                <CardBody>
                                    <FinanicalPieChart />
                                </CardBody>
                            </Card>

                        </Col>
                        <Col xs={12} md={6}>
                            <DieselTopList />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6}>
                            <FinancialDebitors />
                        </Col>
                        <Col xs={12} md={6}>
                            <MaterialTopList />
                        </Col>
                    </Row>
                </div>
            </div></>
    )
}
export default FinancialDashborad;


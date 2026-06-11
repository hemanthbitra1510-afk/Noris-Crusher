import { Link } from "react-router"
import CollapseIcons from "../../../components/collapse-icons/collapseIcons"
import { all_routes } from "../../../routes/all_routes"
import DealsReportChart from "./productionVsSales"
import { Col, Row } from "react-bootstrap"
import ProdcutionVsSale from "./productionVsSale"
import TodayDiesel from "./todayDiesel"
import TodaySales from "./todaySales"
import TodayBoulders from "./todayBoulders"
import { useEffect, useState } from "react"
import { checkPageAccess } from "../../../utils/permission"

const Material = () => {
    const accessDenied = checkPageAccess("DashBoard", "Material");
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
                <div className="content p-2">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
                        <div>
                            <h4 className="mb-0">Material</h4>
                        </div>
                        <div className="gap-2 d-flex align-items-center flex-wrap">
                            <CollapseIcons />
                        </div>
                    </div>
                     <div className="welcome-wrap mb-4">
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

                    <Row>
                        <Col xs={12} md={6}>
                            <DealsReportChart />
                        </Col>
                        <Col xs={12} md={6}>
                            <ProdcutionVsSale />
                        </Col>
                    </Row>
                    <Row>
                        <TodayDiesel />
                    </Row>
                     <Row>
                        <Col xs={12} md={6}>
                            <TodayBoulders />
                        </Col>
                        <Col xs={12} md={6}>
                            <TodaySales />
                        </Col>
                    </Row>
                </div>

            </div></>
    )
}
export default Material;


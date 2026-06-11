/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'number-to-words';

import { useState } from "react";
import { Modal, Form, Button as RBButton } from "react-bootstrap";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "../../../components/reuse-components/Toast";
import { checkPageAccess } from "../../../utils/permission";

/* ================= TYPES ================= */

interface AddressTable {
  Name: string;
  AddressLine1: string;
  State1: string;
  GST?: string;
  GSTCode?: string;
  Contact?: string;
  Logo?: string;
}

interface InvoiceDetailsProps {
  data: any;
  address: AddressTable | null;
  loadingAddress: boolean;
  series?: string;
}

/* ================= HELPER FUNCTIONS ================= */

const convertNumberToIndianWords = (num: number): string => {
  if (isNaN(num) || num < 0) return "";
  
  const parts = num.toFixed(2).split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);
  
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const getLessThanHundred = (n: number): string => {
    if (n < 10) return singleDigits[n];
    if (n < 20) return doubleDigits[n - 10];
    const tensDigit = Math.floor(n / 10);
    const onesDigit = n % 10;
    return tens[tensDigit] + (onesDigit !== 0 ? " " + singleDigits[onesDigit] : "");
  };
  
  const getLessThanThousand = (n: number): string => {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    let res = "";
    if (hundreds > 0) {
      res += singleDigits[hundreds] + " Hundred";
    }
    if (remainder > 0) {
      if (res !== "") res += " ";
      res += getLessThanHundred(remainder);
    }
    return res;
  };
  
  const convertInteger = (n: number): string => {
    if (n === 0) return "Zero";
    
    let words = "";
    
    // Crores (1,00,00,000)
    const crores = Math.floor(n / 10000000);
    let remainder = n % 10000000;
    if (crores > 0) {
      words += convertInteger(crores) + " Crore";
    }
    
    // Lakhs (1,00,000)
    const lakhs = Math.floor(remainder / 100000);
    remainder = remainder % 100000;
    if (lakhs > 0) {
      if (words !== "") words += " ";
      words += getLessThanHundred(lakhs) + " Lakh";
    }
    
    // Thousands (1,000)
    const thousands = Math.floor(remainder / 1000);
    remainder = remainder % 1000;
    if (thousands > 0) {
      if (words !== "") words += " ";
      words += getLessThanHundred(thousands) + " Thousand";
    }
    
    // Hundreds & units
    if (remainder > 0) {
      if (words !== "") words += " ";
      words += getLessThanThousand(remainder);
    }
    
    return words;
  };
  
  let result = "";
  if (integerPart > 0) {
    result = convertInteger(integerPart);
  }
  
  if (decimalPart > 0) {
    if (result !== "") {
      result += " and " + getLessThanHundred(decimalPart) + " Paise";
    } else {
      result = getLessThanHundred(decimalPart) + " Paise";
    }
  }
  
  if (result === "") {
    result = "Zero";
  }
  
  return result;
};

/* ================= COMPONENT ================= */

const InvoiceDetails = ({
  data,
  address,
  series,
}: InvoiceDetailsProps) => {

  const showToast = useToast();

  const [showEmailModal, setShowEmailModal] = useState(false);

  const [emailData, setEmailData] = useState({
    senderName: "",
    senderEmail: "",
    ccEmail: "",
  });

  const [isSending, setIsSending] = useState(false);

  const accessDenied = checkPageAccess("GST", "Invoice");

  if (accessDenied) return accessDenied;

  /* ================= GUARD ================= */

  if (
    !data ||
    !data.InvoiceDetails ||
    data.InvoiceDetails.length === 0
  ) {
    return (
      <p className="p-3 text-dark">
        No invoice found
      </p>
    );
  }

  /* ================= DATA ================= */

  const items = data.InvoiceDetails;
  const invoice = items[0];
  const party = data?.PartyDetails?.[0];

  const subTotal = items.reduce(
    (sum: number, i: any) =>
      sum + Number(i.Amount || 0),
    0
  );

  const totalTax = items.reduce(
    (sum: number, i: any) =>
      sum + Number(i.TaxAmount || 0),
    0
  );

  const grandTotal = (
    subTotal + totalTax
  ).toFixed(2);

  const totalInWords = convertNumberToIndianWords(
    Number(grandTotal)
  );

  /* ================= GST ================= */

  const supplierGST = address?.GST || "";
  const buyerGST = party?.GST || "";

  const supplierStateCode =
    supplierGST.substring(0, 2);

  const buyerStateCode =
    buyerGST.substring(0, 2);

  const isIntraState =
    supplierStateCode !== "" &&
    buyerStateCode !== "" &&
    supplierStateCode === buyerStateCode;

  const taxAmount = Number(totalTax);

  const taxRate = Number(items?.[0]?.Tax || 0);

  const igstAmount = isIntraState
    ? 0
    : taxAmount;

  const cgstAmount = isIntraState
    ? taxAmount / 2
    : 0;

  const sgstAmount = isIntraState
    ? taxAmount / 2
    : 0;

  const igstRate = isIntraState
    ? 0
    : taxRate;

  const cgstRate = isIntraState
    ? taxRate / 2
    : 0;

  const sgstRate = isIntraState
    ? taxRate / 2
    : 0;

  const roundedGrandTotal =
    Math.round((subTotal + totalTax) * 100) / 100;

  const roundOffAmount = +(
    roundedGrandTotal -
    (subTotal + totalTax)
  ).toFixed(2);

  const formatINR = (value: number) =>
    value > 0
      ? `₹ ${value.toFixed(2)}`
      : "";

  /* ================= PDF ================= */

  const generatePDF = async () => {

    const element =
      document.getElementById("print-card");

    if (!element) {
      showToast(
        "Error",
        "Could not find invoice content",
        "danger"
      );
      return null;
    }

    try {

      const canvas = await html2canvas(
        element,
        {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        }
      );

      const imgData =
        canvas.toDataURL("image/jpeg", 0.98);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const margin = 5;

      const imgWidth =
        pageWidth - 2 * margin;

      const imgHeight =
        (canvas.height * imgWidth) /
        canvas.width;

      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        margin,
        imgWidth,
        imgHeight
      );

      return pdf;

    } catch (err) {

      console.error(err);

      showToast(
        "Error",
        "Failed to generate PDF",
        "danger"
      );

      return null;
    }
  };

  /* ================= EMAIL ================= */

  const handleEmailSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setIsSending(true);

    try {

      const doc = await generatePDF();

      if (!doc) return;

      const base64Content =
        doc
          .output("datauristring")
          .split(",")[1];

      const fileName =
        `Invoice_${invoice.Invoice}.pdf`;

      const response = await axios.post(
        "https://norissolutions.in/SendMail/MailAttachment.php",
        {
          SenderEmail: emailData.senderEmail,
          SenderName: emailData.senderName,
          Subject: `Tax Invoice - ${invoice.Invoice}`,
          message:
            "Please find attached invoice.",
          filename: fileName,
          filedata: base64Content,
          CC: emailData.ccEmail,
          CompanyName: address?.Name,
        }
      );

      if (response.status === 200) {

        showToast(
          "Success",
          "Email Sent Successfully",
          "success"
        );

        setShowEmailModal(false);

      } else {

        showToast(
          "Error",
          "Failed to Send Email",
          "danger"
        );
      }

    } catch (error) {

      console.error(error);

      showToast(
        "Error",
        "Unexpected Error",
        "danger"
      );

    } finally {

      setIsSending(false);
    }
  };

  return (

    <div className="p-2 text-dark">

      <div
        id="print-card"
        className="InvoiceContent"
      >

        <style>
{`

body{
  font-size:10px;
}

.InvoiceContent{
  border:1px solid #000;
  padding:2px;
}

table{
  width:100%;
  border-collapse:collapse;
}

td,th{
  border:1px solid #000;
  padding:3px;
}

tr{
  height:18px;
}

@media print{

  body *{
    visibility:hidden !important;
  }

  #print-card,
  #print-card *{
    visibility:visible !important;
  }

  #print-card{
    position:fixed;
    top:0;
    left:0;
    width:100%;
  }

  #PrintButton,
  #EmailButton{
    display:none !important;
  }

  @page{
    size:A4 portrait;
    margin:5mm;
  }
}

`}
        </style>

        <center>
          <h3>
            <u>TAX INVOICE</u>
          </h3>
        </center>

        {/* ================= HEADER ================= */}

        <table>

          <tbody>

            <tr>

              <td rowSpan={4} width="50%">

                <h5>{address?.Name}</h5>

                {address?.AddressLine1}<br />

                {address?.State1}<br />

                GSTIN :
                {address?.GST || "-"}<br />

                Contact :
                {address?.Contact || "-"}

              </td>

              <td width="25%">
                Invoice No :
                {(invoice.Series || series) ? `${invoice.Series || series}` : ""}{invoice.Invoice}
              </td>

              <td width="25%">
                Date :
                {invoice.InvDate}
              </td>

            </tr>

            <tr>

              <td>
                Delivery Note
              </td>

              <td>
                Payment Terms
              </td>

            </tr>

            <tr>

              <td>
                Supplier Ref
              </td>

              <td>
                Order Ref
              </td>

            </tr>

            <tr>

              <td>
                PO No :
                {invoice.PONo}
              </td>

              <td>
                PO Date :
                {invoice.PODate}
              </td>

            </tr>

            <tr>

              <td rowSpan={7}>

                Buyer :

                <h5>
                  M/s {party?.Party || invoice.Party}
                </h5>

                {party?.Address}
                {party?.Address1 &&
                  `, ${party.Address1}`}
                {party?.Address2 &&
                  `, ${party.Address2}`}<br />

                {party?.City &&
                  `${party.City}, `}

                {party?.State}

                {party?.ZIP &&
                  ` - ${party.ZIP}`}<br />

                GSTIN :
                {party?.GST || "-"}<br />

                Contact :
                {party?.Contact || "-"}<br />

                Contact Person :
                {invoice.ContactPerson || "-"}<br />

                Email :
                {invoice.EmailID || "-"}

              </td>

              <td>
                Vehicle No :
                {invoice.VehicleNo}
              </td>

              <td>
                DC No :
                {invoice.DCNo}
              </td>

            </tr>

            <tr>

              <td>
                Driver Name :
                {invoice.DriverName}
              </td>

              <td>
                Mobile :
                {invoice.MobileNo}
              </td>

            </tr>

            <tr>

              <td>
                Site :
                {invoice.SiteName}
              </td>

              <td>
                Destination :
                {invoice.Destination}
              </td>

            </tr>

            <tr>

              <td>
                Loading Point :
                {invoice.LoadingPoint}
              </td>

              <td>
                Unloading Point :
                {invoice.UnloadingPoint}
              </td>

            </tr>

            <tr>

              <td colSpan={2}>
                Billing Address :
                {invoice.BillingAddress}
              </td>

            </tr>

            <tr>

              <td colSpan={2}>
                Shipping Address :
                {invoice.ShippingAddress}
              </td>

            </tr>

            <tr>

              <td>
                E-Way Bill :
                {invoice.EWayBillNo}
              </td>

              <td>
                Transport :
                {invoice.TransportName}
              </td>

            </tr>

          </tbody>

        </table>

        {/* ================= ITEMS ================= */}

        <table>

          <thead>

            <tr>

              <th>S.No</th>

              <th>Description</th>

              <th>HSN</th>

              <th>Qty</th>

              <th>Unit</th>

              <th>Rate</th>

              <th>Royalty</th>

              <th>Freight</th>

              <th>Loading</th>

              <th>Amount</th>

            </tr>

          </thead>

          <tbody>

            {items.map(
              (i:any, idx:number)=>(

              <tr key={idx}>

                <td>
                  {idx+1}
                </td>

                <td>
                  {i.Material}
                </td>

                <td>
                  {i.HSN}
                </td>

                <td align="right">
                  {i.Tonnes}
                </td>

                <td align="center">
                  {i.Unit || "MTS"}
                </td>

                <td align="right">
                  {Number(i.Rate).toFixed(2)}
                </td>

                <td align="right">
                  {Number(
                    i.Royalty || 0
                  ).toFixed(2)}
                </td>

                <td align="right">
                  {Number(
                    i.Freight || 0
                  ).toFixed(2)}
                </td>

                <td align="right">
                  {Number(
                    i.LoadingCharges || 0
                  ).toFixed(2)}
                </td>

                <td align="right">
                  {Number(
                    i.Amount
                  ).toFixed(2)}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {/* ================= TOTAL ================= */}

        <table>

          <tbody>

            <tr>

              <td
                align="right"
                width="75%"
              >
                Sub Total
              </td>

              <td align="right">
                ₹ {subTotal.toFixed(2)}
              </td>

            </tr>

            <tr>

              <td align="right">
                IGST
              </td>

              <td align="right">
                {formatINR(igstAmount)}
              </td>

            </tr>

            <tr>

              <td align="right">
                CGST
              </td>

              <td align="right">
                {formatINR(cgstAmount)}
              </td>

            </tr>

            <tr>

              <td align="right">
                SGST
              </td>

              <td align="right">
                {formatINR(sgstAmount)}
              </td>

            </tr>

            <tr>

              <td align="right">
                Round Off
              </td>

              <td align="right">
                {formatINR(roundOffAmount)}
              </td>

            </tr>

            <tr>

              <td align="right">
                Total Tax
              </td>

              <td align="right">
                ₹ {totalTax.toFixed(2)}
              </td>

            </tr>

            <tr>

              <td align="right">
                <b>Total</b>
              </td>

              <td align="right">
                <b>
                  ₹ {grandTotal}
                </b>
              </td>

            </tr>

          </tbody>

        </table>

        <br />

        <b>
          Amount Chargeable
          (in Words)
        </b>

        <br />

        INR {totalInWords} Only

        {/* ================= GST TABLE ================= */}

        <table>

          <thead>

            <tr>

              <th rowSpan={2}>
                HSN / SAC
              </th>

              <th rowSpan={2}>
                Taxable Value
              </th>

              <th colSpan={2}>
                IGST
              </th>

              <th colSpan={2}>
                CGST
              </th>

              <th colSpan={2}>
                SGST
              </th>

              <th>
                Total Tax
              </th>

            </tr>

            <tr>

              <th>Rate</th>
              <th>Amount</th>

              <th>Rate</th>
              <th>Amount</th>

              <th>Rate</th>
              <th>Amount</th>

              <th>Amount</th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td>
                {items[0]?.HSN}
              </td>

              <td align="right">
                ₹ {subTotal.toFixed(2)}
              </td>

              <td align="center">
                {igstRate}
              </td>

              <td align="right">
                {formatINR(igstAmount)}
              </td>

              <td align="center">
                {cgstRate}
              </td>

              <td align="right">
                {formatINR(cgstAmount)}
              </td>

              <td align="center">
                {sgstRate}
              </td>

              <td align="right">
                {formatINR(sgstAmount)}
              </td>

              <td align="right">
                {formatINR(taxAmount)}
              </td>

            </tr>

          </tbody>

        </table>

        {/* ================= BANK ================= */}

        <table>

          <tbody>

            <tr>

              <td width="50%">

                <b>
                  Bank Details
                </b>

                <br />

                Bank :
                {invoice.BankName}<br />

                A/C No :
                {invoice.AccountNo}<br />

                IFSC :
                {invoice.IFSC}<br />

                Branch :
                {invoice.Branch}<br />

                Payment Terms :
                {invoice.PaymentTerms || "-"}

              </td>

              <td
                align="center"
                style={{
                  verticalAlign:"top"
                }}
              >

                <h4>
                  {address?.Name}
                </h4>

                <br /><br />

                Authorized Signatory

              </td>

            </tr>

          </tbody>

        </table>

        {/* ================= DECLARATION ================= */}

        <u>Declaration</u>

        <p>

          We declare that this invoice
          shows the actual price of
          the goods described and all
          particulars are true and
          correct.

        </p>

        <center>

          THIS IS A COMPUTER
          GENERATED INVOICE

        </center>

      </div>

      {/* ================= BUTTONS ================= */}

      <div
        style={{
          textAlign:"center",
          marginTop:"10px"
        }}
      >

        <button
          id="PrintButton"
          onClick={()=>window.print()}
          style={{
            background:"#ff0000",
            color:"#fff",
            border:"none",
            padding:"8px 20px",
            marginRight:"10px",
            cursor:"pointer",
          }}
        >
          PRINT
        </button>

        <button
          id="EmailButton"
          onClick={()=>
            setShowEmailModal(true)
          }
          style={{
            background:"#0d6efd",
            color:"#fff",
            border:"none",
            padding:"8px 20px",
            cursor:"pointer",
          }}
        >
          EMAIL
        </button>

      </div>

      {/* ================= EMAIL MODAL ================= */}

      <Modal
        show={showEmailModal}
        onHide={()=>
          setShowEmailModal(false)
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Send Invoice Email
          </Modal.Title>

        </Modal.Header>

        <Form onSubmit={handleEmailSubmit}>

          <Modal.Body>

            <Form.Group className="mb-3">

              <Form.Label>
                Sender Name
              </Form.Label>

              <Form.Control
                type="text"
                value={emailData.senderName}
                onChange={(e)=>
                  setEmailData({
                    ...emailData,
                    senderName:e.target.value
                  })
                }
                required
              />

            </Form.Group>

            <Form.Group className="mb-3">

              <Form.Label>
                Sender Email
              </Form.Label>

              <Form.Control
                type="email"
                value={emailData.senderEmail}
                onChange={(e)=>
                  setEmailData({
                    ...emailData,
                    senderEmail:e.target.value
                  })
                }
                required
              />

            </Form.Group>

            <Form.Group className="mb-3">

              <Form.Label>
                CC Email
              </Form.Label>

              <Form.Control
                type="email"
                value={emailData.ccEmail}
                onChange={(e)=>
                  setEmailData({
                    ...emailData,
                    ccEmail:e.target.value
                  })
                }
              />

            </Form.Group>

          </Modal.Body>

          <Modal.Footer>

            <RBButton
              variant="secondary"
              onClick={()=>
                setShowEmailModal(false)
              }
            >
              Cancel
            </RBButton>

            <RBButton
              type="submit"
              variant="primary"
              disabled={isSending}
            >
              {isSending
                ? "Sending..."
                : "Send Email"}
            </RBButton>

          </Modal.Footer>

        </Form>

      </Modal>

    </div>
  );
};

export default InvoiceDetails;
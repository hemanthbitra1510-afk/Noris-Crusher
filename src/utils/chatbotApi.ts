import axios from "axios";

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  ts: number;
}

export interface ChatApiPayload {
  message: string;
  history: { role: "user" | "bot"; text: string }[];
}

export interface ChatApiResponse {
  reply: string;
  route?: string;
}

const CHATBOT_API_URL = "https://norisapi.noris.in/Crusher/Ask.php";

const callPhpBackend = async (
  payload: ChatApiPayload
): Promise<{ reply: string; route?: string } | null> => {
  try {
    const id = sessionStorage.getItem("selectedItems") ?? "";
    if (!id) return null;
    const res = await axios.post(
      `${CHATBOT_API_URL}?ID=${encodeURIComponent(id)}`,
      { Question: payload.message },
      { timeout: 20000 }
    );

    const answer =
      res?.data?.Answer ||
      res?.data?.answer ||
      res?.data?.reply ||
      res?.data?.message ||
      "";
    if (typeof answer !== "string" || !answer.trim()) return null;

    const route =
      typeof res?.data?.route === "string" ? res.data.route : undefined;
    return { reply: answer.trim(), route };
  } catch {
    return null;
  }
};

/**
 * Offline fallback — mirrors a slice of the server's knowledge base so the bot
 * still gives useful answers if the network or PHP file is unreachable.
 */
const offlineKnowledge: {
  keywords: string[];
  answer: string;
  route?: string;
}[] = [
    {
      keywords: ["hi", "hello", "hey", "hai", "namaste"],
      answer:
        "Hello! I'm the Noris Crusher assistant. Ask me anything about the system — sales, vehicles, materials, reports, you name it.",
    },
    {
      keywords: ["help", "what can you do", "modules", "menu"],
      answer:
        "I know all the modules: Dashboards, Sales, Purchases, Materials, Vehicles, Production, Accounts, Inventory, Employees, Diesel, GST/Invoices, Reports, and Masters/Setup. Ask about any of them.",
    },
    {
      keywords: ["vehicle", "fleet", "truck", "lorry"],
      answer:
        "Manage the fleet (with insurance, pollution, fitness, permit, tax expiry dates) under Vehicles. Use Add to create a new vehicle.",
      route: "/vehicle-list",
    },
    {
      keywords: ["maintenance", "service", "repair"],
      answer: "Vehicle service logs are under Vehicles → Maintenance.",
      route: "/maintainance-list",
    },
    {
      keywords: ["km reading", "odometer", "kilometer"],
      answer: "Track odometer readings under Vehicles → KM Reading.",
      route: "/km-reading",
    },
    {
      keywords: ["sales", "sell", "revenue"],
      answer:
        "Sales covers debitors (registered & unregistered), GST and Non-GST sales, statements, debitor reports, summary, and aging.",
      route: "/sales-reports",
    },
    {
      keywords: ["invoice", "gst invoice", "tax invoice"],
      answer:
        "GST invoice generation and tracking is under Invoices. You can Add, Edit, Delete, and Export.",
      route: "/invoices",
    },
    {
      keywords: ["aging", "ageing", "overdue"],
      answer: "Receivables aging analysis is under Sales → Aging.",
      route: "/aging",
    },
    {
      keywords: ["debitor", "debtor", "customer"],
      answer:
        "Registered debitors → Sales → Reg Debitors. Unregistered/walk-in customers → Sales → Un-Reg Debitors.",
      route: "/sales-reg-debitors-1",
    },
    {
      keywords: ["material", "stock", "inventory"],
      answer:
        "Material master is under Masters → Materials. Stock levels are under Inventory → Stock. Material rates are under Material Rates.",
      route: "/inventory-stock",
    },
    {
      keywords: ["production", "daily production", "output"],
      answer:
        "Production tracking: Daily, Monthly, and Yearly views are all under Production.",
      route: "/daily-list",
    },
    {
      keywords: ["vehicle service", "maintenance log"],
      answer: "Vehicle maintenance logs are under Vehicles → Maintenance.",
      route: "/maintainance-list",
    },
    {
      keywords: ["account", "ledger", "voucher"],
      answer:
        "Accounts covers Ledger Creation, Ledger Types, Vouchers, Contra, Reg Creditors, Purchase Bills, Journals, Cash In/Out, and Reports.",
      route: "/account-ledger-list",
    },
    {
      keywords: ["cash in", "receipt", "received"],
      answer:
        "Record money received under Accounts → Cash In / Receipts. Bulk update is supported.",
      route: "/acccount-cash-in",
    },
    {
      keywords: ["cash out", "payment", "paid"],
      answer:
        "Record money paid under Accounts → Cash Out / Payments. Bulk update is supported.",
      route: "/account-cash-out",
    },
    {
      keywords: ["creditor", "supplier", "vendor"],
      answer: "Supplier/creditor accounts are under Accounts → Reg Creditors.",
      route: "/account-reg-list",
    },
    {
      keywords: ["purchase", "purchase bill", "day book"],
      answer:
        "Enter and track purchase bills under Accounts → Purchase Bills (Day Book).",
      route: "/account-day-book",
    },
    {
      keywords: ["employee", "staff", "worker"],
      answer:
        "Employees, attendance, advances, and statements are all under the Employee module.",
      route: "/employee-list",
    },
    {
      keywords: ["attendance", "present", "absent"],
      answer: "Mark daily attendance under Employee → Attendance.",
      route: "/employee-attendance",
    },
    {
      keywords: ["diesel", "fuel", "mileage"],
      answer:
        "Diesel module: Issue, Flow, Mileage, and Reports — all for fuel tracking.",
      route: "/diesel-issue-list",
    },
    {
      keywords: ["report", "reports", "summary"],
      answer:
        "Reports are available throughout: Sales Reports, Yard Reports, Transporter Reports, Diesel Reports, Quarry Reports, and the Income Statement under Financial Reports.",
      route: "/sales-reports",
    },
    {
      keywords: ["dashboard", "financial dashboard"],
      answer:
        "Financial Dashboard shows revenue, receivables, payables, and cash position. Material Dashboard shows inventory KPIs. AI Analytics gives insights.",
      route: "/financial-dashborad",
    },
    {
      keywords: ["role", "permission", "access"],
      answer:
        "Roles and permissions are managed under Masters → Roles. Assign a role to a user under Masters → Logins.",
      route: "/roles",
    },
    {
      keywords: ["login", "sign in", "password"],
      answer:
        "Sign in with your registered mobile number and password. Use Forgot Password to reset if needed.",
      route: "/login",
    },
    {
      keywords: ["company", "switch company", "multi company"],
      answer: "Multi-company configuration is under Company List.",
      route: "/Company-list",
    },
    {
      keywords: ["thanks", "thank you", "thx"],
      answer: "You're welcome! Let me know if anything else comes up.",
    },
    {
      keywords: ["bye", "goodbye"],
      answer: "Goodbye! Have a great day.",
    },
  ];

const offlineLookup = (msg: string): { reply: string; route?: string } => {
  const lower = msg.toLowerCase();
  let best: { score: number; entry: (typeof offlineKnowledge)[number] } | null =
    null;
  for (const e of offlineKnowledge) {
    let score = 0;
    for (const kw of e.keywords) {
      if (lower.includes(kw)) score += 1 + kw.split(" ").length * 0.3;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, entry: e };
  }
  if (best && best.score >= 0.9) {
    return { reply: best.entry.answer, route: best.entry.route };
  }
  return {
    reply:
      "I couldn't reach the assistant just now, and your question doesn't match anything I know offline. Try again in a moment, or ask me about a specific module (Sales, Vehicles, Materials, Reports, etc.).",
  };
};

export const sendChatMessage = async (
  payload: ChatApiPayload
): Promise<ChatApiResponse> => {
  const fromPhp = await callPhpBackend(payload);
  if (fromPhp) return fromPhp;
  return offlineLookup(payload.message);
};

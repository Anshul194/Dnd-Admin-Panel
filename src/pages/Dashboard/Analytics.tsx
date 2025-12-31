import React, { useState, useEffect } from "react";
import {
  Users,
  Package,
  FolderTree,
  Tags,
  ShoppingCart,
  Clock,
  Ticket,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import axiosInstance from "../../services/axiosConfig";
import DatePicker from "../../components/form/date-picker";
import { Link } from "react-router-dom";

interface AnalyticsData {
  salesDashboard: any;
  operationsDashboard: any;
}

function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const today = new Date();
  const defaultEnd = formatDate(today);
  const defaultStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatDate(d);
  })();

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const getData = async () => {
    try {
      let url = "analytics";
      const params: string[] = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length) url += `?${params.join("&")}`;
      const response = await axiosInstance(url);
      setData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Sales Dashboard cards
  const sales = data.salesDashboard || {};
  const salesCards = [
    {
      title: "Total Users",
      value: sales.totalUsers ?? 0,
      description: "Total registered users.",
    },
    {
      title: "Total Buyers",
      value: sales.totalBuyers ?? 0,
      description: "Users who have made at least one purchase.",
    },
    {
      title: "Non-Buying Users",
      value: sales.nonBuyingUsers ?? 0,
      description: "Users who have not made any purchase.",
    },
    {
      title: "Total Revenue",
      value: `₹${sales.totalRevenue?.toLocaleString("en-IN") ?? 0}`,
      description: "Total revenue generated.",
    },
    {
      title: "Total GST",
      value: `₹${sales.totalGst?.toLocaleString("en-IN") ?? 0}`,
      description: "Total Goods and Services Tax collected.",
    },
    {
      title: "Total Payment Gateway Charges",
      value: `₹${
        sales.totalPaymentGatewayCharges?.toLocaleString("en-IN") ?? 0
      }`,
      description: "Total charges incurred from payment gateways.",
    },

    {
      title: "Successful Orders",
      value: sales.totalSuccessfulOrders ?? 0,
      description: "Total successful orders.",
    },
    {
      title: "Average Order Value",
      value: `₹${sales.aov ?? 0}`,
      description: "Average value of all orders placed.",
    },
    {
      title: "Customer Lifetime Value",
      value: `₹${sales.ltv ?? 0}`,
      description: "Average lifetime value per customer.",
    },
    {
      title: "ROC",
      value: sales.roc ?? 0,
      description: "Rate of change (ROC) metric.",
    },
    {
      title: "New Customers",
      value: sales.newCustomers ?? 0,
      description: "Number of new customers.",
    },
    {
      title: "Repeat Customers",
      value: sales.repeatCustomers ?? 0,
      description: "Number of repeat customers.",
    },
    {
      title: "Repeat Customer Ratio",
      value: `${sales.repeatCustomerRatio ?? 0}%`,
      description: "Percentage of repeat customers.",
    },
    {
      title: "COD/Prepaid Ratio",
      value: sales.codPrepaidRatio ?? "0",
      description: "Ratio of Cash on Delivery to Prepaid orders.",
    },
    {
      title: "COD Orders",
      value: sales.codCount ?? 0,
      description: "Number of Cash on Delivery orders.",
    },
    {
      title: "Prepaid Orders",
      value: sales.prepaidCount ?? 0,
      description: "Number of prepaid orders.",
    },
    {
      title: "Total Discount",
      value: `₹${sales.totalDiscount ?? 0}`,
      description: "Total discount given.",
    },
    {
      title: "Total Coupons Used",
      value: sales.totalCoupons ?? 0,
      description: "Number of coupons used.",
    },
  ];

  // Operations Dashboard cards
  const ops = data.operationsDashboard || {};
  const opsCards = [
    {
      title: "Total Orders",
      value: ops.totalOrders ?? 0,
      description: "Total orders placed.",
    },
    {
      title: "Pending Orders",
      value: ops.pendingOrders ?? 0,
      description: "Orders pending fulfillment.",
    },
    {
      title: "Shipped Orders",
      value: ops.shippedOrders ?? 0,
      description: "Orders shipped to customers.",
    },
    {
      title: "Cancelled Orders",
      value: ops.cancelledOrders ?? 0,
      description: "Orders that were cancelled.",
    },
    {
      title: "Pending Tickets",
      value: ops.totalPendingTickets ?? 0,
      description: "Support tickets pending resolution.",
    },
  ];

  // Prepare data for Orders Radar Chart
  const ordersRadarData = ops.ordersByStatus
    ? Object.entries(ops.ordersByStatus || {}).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }))
    : [];

  // Prepare data for Tickets Radar Chart
  const ticketsRadarData = ops.ticketsByStatus
    ? Object.entries(ops.ticketsByStatus || {}).map(([status, count]) => ({
        status: status
          .replace("_", " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        value: count,
      }))
    : [];

  // Helper function to determine redirect URL based on card title
  const getRedirectUrl = (title: string) => {
    switch (title) {
      case "Repeating Customers":
      case "Repeat Customers":
        return "/customers/list?repeatcustomers=true";
      case "New Customers":
        return `/customers/list?newcustomers=true&startDate=${startDate}&endDate=${endDate}`;
      case "Total Buyers":
        return "/customers/list?buys=buyer";
      case "Non-Buying Users":
        return "/customers/list?buys=nonbuyer";
      case "Total Users":
        return "/customers/list";
      case "Successful Orders":
        return "/orders/list?status=completed";
      default:
        break;
    }

    // For order-related cards, append status filter
    const statusMap: { [key: string]: string } = {
      "Pending Orders": "pending",
      "Shipped Orders": "shipped",
      "Cancelled Orders": "cancelled",
      "Delivered Orders": "delivered",
      "Processing Orders": "processing",
      "Confirmed Orders": "confirmed",
    };

    // Check if title matches any key in statusMap
    if (title in statusMap) {
      return `/orders/list?status=${statusMap[title]}`;
    }

    return "/";
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-1 dark:text-gray-300">
          Overview of your e-commerce platform
        </p>
        {/* Date Range Filters */}
        <div className="flex gap-4 mt-4 flex-wrap justify-end">
          <div className="w-48">
            <DatePicker
              id="analytics-start-date"
              label="Start Date"
              defaultDate={startDate || undefined}
              onChange={(_selectedDates: Date[], dateStr: string) =>
                setStartDate(dateStr)
              }
            />
          </div>
          <div className="w-48">
            <DatePicker
              id="analytics-end-date"
              label="End Date"
              defaultDate={endDate || undefined}
              onChange={(_selectedDates: Date[], dateStr: string) =>
                setEndDate(dateStr)
              }
            />
          </div>
          <button
            onClick={() => getData()}
            className="self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="self-end px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Sales Dashboard */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Sales Dashboard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesCards.map((card) => (
            <Link
              key={card.title}
              to={getRedirectUrl(card.title)}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow dark:bg-gray-800 focus:outline-none block overflow-hidden"
            >
              <div>
                <p className="text-gray-500 text-sm font-medium dark:text-gray-300">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2 dark:text-gray-100 break-words">
                  {card.value}
                </p>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Operations Dashboard */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Operations Dashboard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {opsCards.map((card) => (
            <Link
              key={card.title}
              to={getRedirectUrl(card.title)}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow dark:bg-gray-800 focus:outline-none block"
            >
              <div>
                <p className="text-gray-500 text-sm font-medium dark:text-gray-300">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2 dark:text-gray-100">
                  {card.value}
                </p>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 dark:text-gray-100">
            Orders by Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={ordersRadarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="status"
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, "auto"]} />
              <Radar
                name="Orders"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 dark:text-gray-100">
            Tickets by Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={ticketsRadarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="status"
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, "auto"]} />
              <Radar
                name="Tickets"
                dataKey="value"
                stroke="#f43f5e"
                fill="#f43f5e"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">
          Recent Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Items
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {(ops.recentOrders ?? []).map((order) => (
                <tr
                  key={order._id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {order._id.slice(-8)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {order.user.name || "N/A"}
                      </div>
                      <div className="text-gray-500 dark:text-gray-300">
                        {order.user.email || order.user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    items
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ₹{order.total}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        order.status === "pending"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          : order.status === "paid"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : order.status === "shipped"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          : order.status === "completed"
                          ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {order.paymentMode || "-"}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(order.placedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">
          Recent Tickets
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Ticket ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {(ops?.recentTickets ?? [])?.map((ticket) => (
                <tr
                  key={ticket._id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {ticket._id.slice(-8)}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ticket.subject}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {ticket?.customer?.name}
                      </div>
                      <div className="text-gray-500 dark:text-gray-300">
                        {ticket?.customer?.email || ticket?.customer?.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        ticket?.priority === "low"
                          ? "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          : ticket?.priority === "medium"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                      }`}
                    >
                      {ticket?.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        ticket.status === "open"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                          : ticket?.status === "in_progress"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          : ticket?.status === "resolved"
                          ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {ticket?.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(ticket?.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

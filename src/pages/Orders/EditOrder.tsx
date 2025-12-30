/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import { fetchOrderById, updateOrderDelivery } from "../../store/slices/Orders";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { useParams } from "react-router-dom";
import { DELIVERY_OPTIONS, ORDER_STATUS_OPTIONS } from "../../types/order";
import axiosInstance from "../../services/axiosConfig";

const image_url = import.meta.env.VITE_IMAGE_URL;

export default function EditOrder() {
  const [deliveryOption, setDeliveryOption] = useState("");
  const [labelLoading, setLabelLoading] = useState(false);
  const [awbLoading, setAwbLoading] = useState(false);

  const [orderStatus, setOrderStatus] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("DTDC");
  const [selectedService, setSelectedService] = useState("");
  const [selectedLabelCode, setSelectedLabelCode] = useState("SHIP_LABEL_POD");
  // simple type for service options returned from API
  type ServiceOption = {
    code: string;
    name?: string;
    courier?: string;
    [k: string]: any;
  };

  const [availableServices, setAvailableServices] = useState<ServiceOption[]>(
    []
  );
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const deleiveryOptions = ["DTDC", "DELHIVERY", "BLUEDART"];

  const params = useParams();
  const orderId = params.id || "";

  const dispatch = useDispatch<AppDispatch>();
  const { currentOrder, loading } = useSelector(
    (state: RootState) => state.orders
  );

  const getServices = useCallback(async () => {
    try {
      const response = await axiosInstance.post("/orders/shipment", {
        orderId: orderId,
      });
      console.log("Shipping Services:", response.data);
      setAvailableServices(response.data.services || []);
    } catch (error) {
      console.error("Error fetching shipping services:", error);
    }
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryOption && !orderStatus) {
      toast.error("Please select at least one option to update.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    try {
      await dispatch(
        updateOrderDelivery({
          id: orderId,
          deliveryOption: deliveryOption || currentOrder?.deliveryOption || "",
          status: orderStatus || currentOrder?.status || "",
        })
      ).unwrap();

      toast.success("Order updated successfully!", {
        duration: 3000,
        position: "top-right",
      });

      // Redirect to orders list after successful update
      setTimeout(() => {
        window.location.href = "/orders/list";
      }, 1000);
    } catch (err: any) {
      setPopup({
        isVisible: true,
        message: "Failed to update Order. Please try again.",
        type: "error",
      });
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    const dateStr = typeof dateInput === "object" ? dateInput.$date || dateInput.$oid : dateInput;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getData = useCallback(async () => {
    try {
      await dispatch(fetchOrderById(orderId)).unwrap();
    } catch (error) {
      console.error("Error fetching order data:", error);
      setPopup({
        isVisible: true,
        message: "Failed to fetch order data.",
        type: "error",
      });
    }
  }, [dispatch, orderId]);

  const createShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Step 1: Update order metadata first (Status, delivery option, and shipping method)
      await dispatch(
        updateOrderDelivery({
          id: orderId,
          deliveryOption: deliveryOption || currentOrder?.deliveryOption || "",
          status: orderStatus || currentOrder?.status || "",
          shippingMethod: selectedMethod,
        })
      ).unwrap();

      // Step 2: Check if we should attempt to create a shipment
      const upMethod = String(selectedMethod).toUpperCase();
      const isBluedart = upMethod === "BLUEDART";
      const isDelhivery = upMethod === "DELHIVERY";
      const serviceCode = isBluedart ? "D" : isDelhivery ? "SD1" : selectedService;

      // If user hasn't picked a service and it's not one of the auto-pick ones, just show success for the metadata
      if (!serviceCode && !isBluedart && !isDelhivery) {
        toast.success("Order updated successfully!", {
          duration: 3000,
          position: "top-right",
        });
        // Redirect to orders list after a short delay
        setTimeout(() => {
          window.location.href = "/orders/list";
        }, 1000);
        return;
      }

      // Step 3: Create shipment using the correct endpoint
      const payload: Record<string, unknown> = {
        orderId: orderId,
        courier: upMethod,
        serviceCode: serviceCode,
      };

      try {
        const response = await axiosInstance.post(
          "/orders/shipment",
          payload
        );
        console.log("shipping response ===>", response.data);

        toast.success("Order updated and shipment created successfully!", {
          duration: 3000,
          position: "top-right",
        });
        // Redirect to orders list after a short delay
        setTimeout(() => {
          window.location.href = "/orders/list";
        }, 1000);
      } catch (shipError: any) {
        console.error("Error creating shipment:", shipError);
        const errMsg = shipError?.response?.data?.message || "Order updated, but shipment creation failed.";
        setPopup({
          isVisible: true,
          message: errMsg,
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      const errMsg = (error as any)?.response?.data?.message || "Failed to update order details. Please try again.";
      setPopup({
        isVisible: true,
        message: errMsg,
        type: "error",
      });
    }
  };

  const GenerateLabel = async () => {
    try {
      setLabelLoading(true);
      const response = await axiosInstance.post("/orders/shipment/label", {
        orderId: orderId,
        courier: currentOrder?.shipping_details?.platform.toUpperCase(),
        labelCode: selectedLabelCode,
      });
      console.log("label generating response ===>", response.data);
      setLabelLoading(false);
      window.location.reload();
    } catch (error) {
      console.error("Error generating label:", error);
      setLabelLoading(false);
      const errMsg = (error as any)?.response?.data?.message || "Failed to generate label. Please try again.";
      setPopup({
        isVisible: true,
        message: errMsg,
        type: "error",
      });
    }
  };

  const openAwbPdf = async () => {
    try {
      setAwbLoading(true);

      let awbContentRaw: unknown =
        currentOrder?.shipping_details?.raw_response?.GenerateWayBillResult
          ?.AWBPrintContent;

      if (!awbContentRaw) {
        setPopup({
          isVisible: true,
          message: "AWB content not available.",
          type: "error",
        });
        setAwbLoading(false);
        return;
      }

      const toUint8ArrayFromBase64 = (b64: string) => {
        const binary = atob(b64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      };

      const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 20000);
      };

      // 1) If AWBPrintContent is an array of numeric bytes: [12,120,...]
      if (Array.isArray(awbContentRaw)) {
        // Try to interpret as numeric bytes first
        const nums = awbContentRaw.map((v: any) =>
          typeof v === "number" ? v : parseInt(String(v).trim(), 10)
        );
        const allNums = nums.every(
          (n: any) => Number.isFinite(n) && n >= 0 && n <= 255
        );

        if (allNums && nums.length > 0) {
          const bytes = new Uint8Array(nums as number[]);
          const blob = new Blob([bytes], { type: "application/pdf" });
          downloadBlob(blob, "awb.pdf");
          setAwbLoading(false);
          return;
        }

        // If not numeric bytes, maybe it's array of base64 chunks or strings -> join and handle below
        const joined = awbContentRaw.join("");
        // continue with joined string handling
        awbContentRaw = joined;
      }

      // Ensure content is a string from here
      const content =
        typeof awbContentRaw === "string"
          ? awbContentRaw
          : String(awbContentRaw);

      const trimNoSpace = (s: string) => s.replace(/\s+/g, "");
      const cTrim = trimNoSpace(content);

      // 2) If data URI like data:application/pdf;base64,...
      if (content.startsWith("data:application/pdf;base64,")) {
        const b64 = content.split(",")[1];
        const blob = new Blob([toUint8ArrayFromBase64(b64)], {
          type: "application/pdf",
        });
        downloadBlob(blob, "awb.pdf");
        setAwbLoading(false);
        return;
      }

      // 3) If pure base64 PDF (starts with JVBER, possibly with whitespace)
      if (/^JVBER/i.test(cTrim)) {
        const bytes = toUint8ArrayFromBase64(cTrim);
        const blob = new Blob([bytes], { type: "application/pdf" });
        downloadBlob(blob, "awb.pdf");
        setAwbLoading(false);
        return;
      }

      // 4) If content is a sequence of numbers in text (e.g. "12 120 37 ..."), parse them to bytes
      if (/^[\s\d,;]+$/.test(content)) {
        const parts = content.split(/[^0-9]+/).filter(Boolean);
        const nums = parts.map((p) => parseInt(p, 10));
        const allNums = nums.every(
          (n) => Number.isFinite(n) && n >= 0 && n <= 255
        );
        if (allNums && nums.length > 0) {
          const bytes = new Uint8Array(nums);
          const blob = new Blob([bytes], { type: "application/pdf" });
          downloadBlob(blob, "awb.pdf");
          setAwbLoading(false);
          return;
        }
      }

      // 5) If looks like HTML content, wrap and download as HTML
      if (/<\/?html|<\/?body/i.test(content)) {
        const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><title>AWB</title><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body>${content}</body></html>`;
        const blob = new Blob([fullHtml], { type: "text/html" });
        downloadBlob(blob, "awb.html");
        setAwbLoading(false);
        return;
      }

      // 6) Fallback: try treating content as base64 (even if it doesn't start with JVBER)
      try {
        // Remove whitespace/newlines
        const maybeB64 = content.replace(/\s+/g, "");
        // quick validation: length multiple of 4 and only base64 chars
        if (/^[A-Za-z0-9+/=]+$/.test(maybeB64) && maybeB64.length % 4 === 0) {
          const bytes = toUint8ArrayFromBase64(maybeB64);
          // Heuristic: check PDF header bytes (%PDF => 0x25 0x50 0x44 0x46)
          if (
            bytes[0] === 0x25 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x44 &&
            bytes[3] === 0x46
          ) {
            const blob = new Blob([bytes], { type: "application/pdf" });
            downloadBlob(blob, "awb.pdf");
            setAwbLoading(false);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback below
      }

      // Final fallback: download as plain text
      const blob = new Blob([content], { type: "text/plain" });
      downloadBlob(blob, "awb.txt");
      setAwbLoading(false);
    } catch (err) {
      console.error("Error downloading AWB:", err);
      setPopup({
        isVisible: true,
        message: "Failed to download AWB content.",
        type: "error",
      });
      setAwbLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      getData();
      getServices();
    }
  }, [orderId]);

  useEffect(() => {
    if (currentOrder) {
      setDeliveryOption(currentOrder.deliveryOption);
      setOrderStatus(currentOrder.status);
      if (currentOrder.shippingMethod) {
        setSelectedMethod(currentOrder.shippingMethod);
      }
    }
  }, [currentOrder]);

  const shippingPlatform = currentOrder?.shipping_details?.platform
    ? String(currentOrder?.shipping_details?.platform).toUpperCase()
    : "";

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Edit Order | TailAdmin"
        description="Edit order details and shipping method"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Edit Order" />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : currentOrder ? (
            <div className="space-y-8">
              {/* Order Overview */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Order Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Order ID
                    </p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {typeof currentOrder?._id === "object" ? (currentOrder?._id as any).$oid : currentOrder?._id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize
                      ${currentOrder.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : currentOrder.status === "confirmed"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : currentOrder.status === "processing"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : currentOrder.status === "shipped"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                : currentOrder.status === "delivered"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                    >
                      {currentOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Amount
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      ₹{currentOrder.total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Placed On
                    </p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {formatDate(currentOrder.createdAt)}
                    </p>
                  </div>

                  {currentOrder?.shipping_details?.current_status && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Shipping status
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white px-4 py-1 mt-1 rounded-full bg-blue-100 text-xs w-fit">
                        {currentOrder?.shipping_details?.current_status ||
                          "N/A"}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Order track number
                    </p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {currentOrder?.shipping_details?.reference_number ||
                        currentOrder?.shipping_details?.raw_response
                          ?.packages[0]?.waybill ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    {currentOrder?.shipping_details?.reference_number ||
                      (currentOrder?.shipping_details?.platform && (
                        <p className="font-medium text-gray-800 dark:text-white">
                          {currentOrder?.shipping_details?.labelUrl ? (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Label
                              </p>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                href={
                                  currentOrder?.shipping_details?.platform ===
                                    "delhivery"
                                    ? currentOrder?.shipping_details?.labelUrl
                                    : `${image_url}${currentOrder?.shipping_details?.labelUrl}`
                                }
                                className="font-medium text-blue-500 underline cursor-pointer dark:text-white"
                              >
                                Download Label
                              </a>
                            </div>
                          ) : String(
                            currentOrder?.shipping_details?.platform
                          ).toUpperCase() === "BLUEDART" ? (
                            <div className="mt-2 flex items-center gap-3">
                              {currentOrder?.shipping_details?.raw_response
                                ?.GenerateWayBillResult?.AWBPrintContent ? (
                                <>
                                  <button
                                    onClick={openAwbPdf}
                                    className="px-4 py-1 w-fit bg-blue-500 text-white rounded-full text-sm"
                                  >
                                    {awbLoading ? "Opening..." : "Open AWB"}
                                  </button>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  AWB not available
                                </p>
                              )}
                            </div>
                          ) : String(
                            currentOrder?.shipping_details?.platform
                          ).toUpperCase() === "DELHIVERY" ? (
                            <div>
                              {labelLoading ? (
                                <div className="px-4 py-1 w-fit bg-blue-500 opacity-60 text-white rounded-full text-sm">
                                  Generating...
                                </div>
                              ) : (
                                <button
                                  onClick={GenerateLabel}
                                  className="px-4 py-1 w-fit bg-blue-500 text-white rounded-full text-sm"
                                >
                                  Generate Label
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="mt-2 flex items-center gap-3">
                                <select
                                  value={selectedLabelCode}
                                  onChange={(e) =>
                                    setSelectedLabelCode(e.target.value)
                                  }
                                  className="rounded border border-gray-300 px-3 py-2 bg-white text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                >
                                  <option value="">Select </option>
                                  <option value="SHIP_LABEL_A4">
                                    Shipping Label A4
                                  </option>
                                  <option value="SHIP_LABEL_A6">
                                    Shipping Label A6
                                  </option>
                                  <option value="SHIP_LABEL_POD">
                                    Shipping Label POD
                                  </option>
                                  <option value="SHIP_LABEL_4X6">
                                    Shipping Label 4x6
                                  </option>
                                  <option value="ROUTE_LABEL_A4">
                                    Routing Label A4
                                  </option>
                                  <option value="ROUTE_LABEL_4X4">
                                    Routing Label 4x4
                                  </option>
                                </select>

                                {labelLoading ? (
                                  <div className="px-4 py-1 w-fit bg-blue-500 opacity-60 text-white rounded-full text-sm">
                                    Generating...
                                  </div>
                                ) : (
                                  <button
                                    onClick={GenerateLabel}
                                    className="px-4 py-1 w-fit bg-blue-500 text-white rounded-full text-sm"
                                  >
                                    Generate Label
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </p>
                      ))}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {currentOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex  gap-4  p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <img
                        src={
                          image_url +
                          (item?.product?.thumbnail?.url ||
                            item?.product?.images[0]?.url)
                        }
                        alt={item?.product?.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex flex-1 justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            Product ID: {item?.product?._id}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Variant ID: {item?.variant?._id}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Quantity: {item?.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800 dark:text-white">
                            ₹{item.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            per item
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        ₹
                        {(
                          currentOrder.total + (currentOrder.discount || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    {currentOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Discount:
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                          -₹{currentOrder.discount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-800 dark:text-white">
                        Total:
                      </span>
                      <span className="text-gray-800 dark:text-white">
                        ₹{currentOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {currentOrder?.shipping_details?.status_history &&
                currentOrder?.shipping_details?.status_history.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Shipping Status History
                    </h3>
                    <div className="relative">
                      <div
                        // ref callback to initialize arrow visibility and attach scroll handler
                        ref={(el: HTMLDivElement | null) => {
                          if (!el) return;
                          const arrow = el.parentElement?.querySelector(
                            ".status-scroll-arrow"
                          ) as HTMLElement | null;

                          const update = () => {
                            const isScrollable =
                              el.scrollHeight > el.clientHeight;
                            const atBottom =
                              el.scrollHeight -
                              el.scrollTop -
                              el.clientHeight <=
                              1;
                            if (arrow) {
                              // hide arrow when not scrollable or scrolled to bottom
                              arrow.style.opacity =
                                !isScrollable || atBottom ? "0" : "1";
                              arrow.style.pointerEvents =
                                !isScrollable || atBottom ? "none" : "auto";
                            }
                          };

                          // attach handler
                          el.onscroll = update;
                          // run once on mount
                          setTimeout(update, 0);
                        }}
                        className="space-y-4 max-h-64 overflow-y-auto pr-2"
                      >
                        {currentOrder?.shipping_details?.status_history &&
                          currentOrder?.shipping_details?.status_history.map(
                            (status: any, index: number) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                              >
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {status.action}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(status.actionDate)}
                                </p>
                              </div>
                            )
                          )}
                      </div>

                      {/* down arrow indicator */}
                      <div
                        className="status-scroll-arrow pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-3 rounded-full bg-white/90 dark:bg-black/60 p-1 transition-opacity duration-200"
                        aria-hidden="true"
                        style={{ opacity: 0 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500 dark:text-gray-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

              {/* Addresses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Shipping Address
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {currentOrder.shippingAddress.fullName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentOrder.shippingAddress.addressLine1}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentOrder.shippingAddress.city},{" "}
                      {currentOrder.shippingAddress.state}{" "}
                      {currentOrder.shippingAddress.postalCode}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentOrder.shippingAddress.country}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Phone: {currentOrder.shippingAddress.phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Billing Address
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {currentOrder.billingAddress.fullName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentOrder.billingAddress.addressLine1}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentOrder.billingAddress.city},{" "}
                      {currentOrder.billingAddress.state}{" "}
                      {currentOrder.billingAddress.postalCode}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentOrder.billingAddress.country}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Phone: {currentOrder.billingAddress.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Update Form */}
              <form
                onSubmit={createShipment}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
                  Update Order
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Status Select */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Order Status
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="">Select Status</option>
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delivery Option
                    </label>
                    <select
                      value={deliveryOption}
                      onChange={(e) => setDeliveryOption(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="">Select Option</option>
                      {DELIVERY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Shipping method
                    </label>
                    <select
                      value={selectedMethod}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedMethod(val);
                        const up = String(val).toUpperCase();
                        // If user selects BLUEDART or DELHIVERY set static service codes
                        if (up === "BLUEDART") {
                          setSelectedService("D");
                        } else if (up === "DELHIVERY") {
                          setSelectedService("SD1");
                        } else {
                          // Reset service for other couriers so user can pick from list
                          setSelectedService("");
                        }
                      }}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="">Select Method</option>
                      {deleiveryOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Only show service dropdown when courier is not BLUEDART or DELHIVERY */}
                  {!["BLUEDART", "DELHIVERY"].includes(
                    String(selectedMethod).toUpperCase()
                  ) && (
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select Service
                        </label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          {availableServices
                            .filter((option) => option.courier === selectedMethod)
                            .map((option) => (
                              <option key={option.code} value={option.code}>
                                {option.code} - {option.name}
                              </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {
                            DELIVERY_OPTIONS.find(
                              (opt) => opt.value === deliveryOption
                            )?.description
                          }
                        </p>
                      </div>
                    )}
                </div>

                {["pending", "confirmed", "processing"].includes(currentOrder.status) && (
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? "Updating Order..." : "Update Order"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Order not found
              </p>
            </div>
          )}
        </div>
      </div>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
    </div>
  );
}

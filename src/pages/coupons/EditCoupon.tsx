/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCouponById, updateCoupon } from "../../store/slices/coupon";
import { RootState, AppDispatch } from "../../store";
import PopupAlert from "../../components/popUpAlert";
import { Toaster } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom"; // changed to react-router-dom
import { fetchProducts } from "../../store/slices/product"; // added
import { fetchCustomers } from "../../store/slices/customersSlice"; // added

const initialCoupon = {
  code: "",
  type: "percent",
  value: 0,
  isActive: true,
  expiresAt: "",
  startAt: "",
  endAt: "",
  usageLimit: 1,
  usedCount: 0,
  minCartValue: 0,
  products: [] as string[],
  oncePerOrder: false,
  minCartAppliesToSelectedProducts: false,
  limitToOnePerCustomer: false,
  combinations: {
    productDiscounts: false,
    orderDiscounts: false,
    shippingDiscounts: false,
  },
  eligibility: {
    allCustomers: true,
    specificCustomers: [] as string[],
    specificSegments: [] as string[],
  },
  paymentSpecific: false,
  paymentDiscounts: {
    prepaid: { type: "percent", value: 0, specialAmount: 0 },
    cod: { type: "percent", value: 0, specialAmount: 0 },
  },
  minQuantity: 0,
  minQuantityAppliesToSelectedProducts: false,
  shippingDiscount: { type: "none", value: 0 },
  codMaxOrderValue: undefined as number | undefined,
  enforceSingleOutstandingCOD: false,
  applyOnActualPrice: true,
  specialAmount: 0, // added
};

const EditCoupon: React.FC = () => {
  const [coupon, setCoupon] = useState(initialCoupon);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const params = useParams<{ id?: string }>();
  const couponId = params.id;
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.coupon.loading);

  // get products and users from store
  const productsOptions = useSelector((state: RootState) => (state as any).product?.products || []);
  const usersOptions = useSelector((state: RootState) => (state as any).customers?.customers || []);

  // fetch products/customers (same as AddCoupon) so selections populate
  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 200 }));
    dispatch(fetchCustomers({ page: 1, limit: 200 }));
  }, [dispatch]);

  const setField = (path: string, val: any) => {
    if (!path.includes(".")) {
      setCoupon((prev) => ({ ...prev, [path]: val }));
      return;
    }
    const parts = path.split(".");
    setCoupon((prev) => {
      const copy: any = { ...prev };
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = cur[p] === undefined ? {} : { ...cur[p] };
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = val;
      return copy;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as any;
    if (type === "checkbox") {
      setField(name, (e.target as HTMLInputElement).checked);
    } else if (type === "number") {
      setField(name, value === "" ? "" : parseFloat(value));
    } else if (type === "date") {
      // Validate and format date input
      const formattedDate = formatDateForInput(value);
      if (formattedDate || value === "") {
        setField(name, formattedDate);
      }
    } else if (type === "datetime-local") {
      // Validate and format datetime-local input
      const formattedDateTime = formatToDateTimeLocal(value);
      if (formattedDateTime || value === "") {
        setField(name, formattedDateTime);
      }
    } else {
      setField(name, value);
    }
  };

  const handleCommaList = (name: string, raw: string) => {
    const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setField(name, arr);
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, name: string) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setField(name, values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon.code) {
      setPopup({
        isVisible: true,
        message: "Coupon code is required.",
        type: "error",
      });
      return;
    }
    if (!coupon.expiresAt || !validateDate(coupon.expiresAt)) {
      setPopup({
        isVisible: true,
        message: "Please enter a valid expiry date.",
        type: "error",
      });
      return;
    }
    // Validate start date if provided
    if (coupon.startAt && !validateDate(coupon.startAt)) {
      setPopup({
        isVisible: true,
        message: "Please enter a valid start date.",
        type: "error",
      });
      return;
    }
    // Validate end date if provided
    if (coupon.endAt && !validateDate(coupon.endAt)) {
      setPopup({
        isVisible: true,
        message: "Please enter a valid end date.",
        type: "error",
      });
      return;
    }
    if (!couponId) {
      setPopup({
        isVisible: true,
        message: "Invalid coupon id.",
        type: "error",
      });
      return;
    }
    // Ensure dates are properly formatted before submission
    const formattedCoupon = {
      ...coupon,
      expiresAt: formatDateForInput(coupon.expiresAt),
      startAt: coupon.startAt ? formatToDateTimeLocal(coupon.startAt) : "",
      endAt: coupon.endAt ? formatToDateTimeLocal(coupon.endAt) : "",
    };
    try {
      const updatedCoupon = await dispatch(updateCoupon({ id: couponId, data: formattedCoupon })).unwrap();
      console.log("Coupon updated successfully:", updatedCoupon);
      
      setPopup({
        isVisible: true,
        message: "Coupon updated successfully!",
        type: "success",
      });
      
      // Refresh the coupon data to show updated values
      if (updatedCoupon) {
        setCoupon((prev) => ({
          ...prev,
          ...updatedCoupon,
          expiresAt: formatDateForInput(updatedCoupon.expiresAt),
          startAt: updatedCoupon.startAt ? formatToDateTimeLocal(updatedCoupon.startAt) : "",
          endAt: updatedCoupon.endAt ? formatToDateTimeLocal(updatedCoupon.endAt) : "",
        }));
      }
    } catch (error: any) {
      console.error("Error updating coupon:", error);
      setPopup({
        isVisible: true,
        message: error?.message || "Failed to update coupon. Please try again.",
        type: "error",
      });
    }
  };

  // Date validation and formatting helpers
  const formatDateForInput = (dateValue: string | null | undefined): string => {
    if (!dateValue) return "";
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // Try to parse and format the date
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const formatToDateTimeLocal = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      // convert to local time and remove seconds
      const tzOffset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - tzOffset * 60000);
      return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    } catch {
      return "";
    }
  };

  const validateDate = (dateValue: string): boolean => {
    if (!dateValue) return true; // Optional dates are valid if empty
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  };

  useEffect(() => {
    // Fetch coupon details if editing an existing coupon
    const fetchCoupon = async () => {
      if (!couponId) return;
      try {
        const payload = await dispatch(getCouponById(couponId)).unwrap();
        const data = payload?.coupon || payload?.data || payload || null;
        if (data) {
          setCoupon((prev) => ({
            ...prev,
            code: data.code || "",
            type: data.type || "percent",
            value: data.value ?? 0,
            isActive: typeof data.isActive === "boolean" ? data.isActive : true,
            startAt: formatToDateTimeLocal(data.startAt),
            endAt: formatToDateTimeLocal(data.endAt),
            expiresAt: formatDateForInput(data.expiresAt),
            usageLimit: data.usageLimit || 1,
            usedCount: data.usedCount || 0,
            minCartValue: data.minCartValue || 0,
            products: Array.isArray(data.products) ? data.products.map(String) : [],
            oncePerOrder: !!data.oncePerOrder,
            minCartAppliesToSelectedProducts: !!data.minCartAppliesToSelectedProducts,
            limitToOnePerCustomer: !!data.limitToOnePerCustomer,
            combinations: {
              productDiscounts: !!data.combinations?.productDiscounts,
              orderDiscounts: !!data.combinations?.orderDiscounts,
              shippingDiscounts: !!data.combinations?.shippingDiscounts,
            },
            eligibility: {
              allCustomers: data.eligibility?.allCustomers ?? true,
              specificCustomers: Array.isArray(data.eligibility?.specificCustomers) ? data.eligibility.specificCustomers.map(String) : [],
              specificSegments: Array.isArray(data.eligibility?.specificSegments) ? data.eligibility.specificSegments : [],
            },
            paymentSpecific: !!data.paymentSpecific,
            paymentDiscounts: {
              prepaid: {
                type: data.paymentDiscounts?.prepaid?.type || "percent",
                value: data.paymentDiscounts?.prepaid?.value ?? 0,
                specialAmount: data.paymentDiscounts?.prepaid?.specialAmount ?? 0,
              },
              cod: {
                type: data.paymentDiscounts?.cod?.type || "percent",
                value: data.paymentDiscounts?.cod?.value ?? 0,
                specialAmount: data.paymentDiscounts?.cod?.specialAmount ?? 0,
              },
            },
            minQuantity: data.minQuantity ?? 0,
            minQuantityAppliesToSelectedProducts: !!data.minQuantityAppliesToSelectedProducts,
            shippingDiscount: {
              type: data.shippingDiscount?.type || "none",
              value: data.shippingDiscount?.value ?? 0,
            },
            codMaxOrderValue: data.codMaxOrderValue ?? undefined,
            enforceSingleOutstandingCOD: !!data.enforceSingleOutstandingCOD,
            applyOnActualPrice: data.applyOnActualPrice ?? true,
            specialAmount: data.specialAmount ?? 0,
          }));
        } else {
          setPopup({
            isVisible: true,
            message: "Failed to load coupon details.",
            type: "error",
          });
        }
      } catch (err) {
        setPopup({
          isVisible: true,
          message: "Failed to load coupon details.",
          type: "error",
        });
      }
    };

    fetchCoupon();
  }, [couponId, dispatch]);

  const SEGMENT_OPTIONS = [
    { key: "neverPurchased", label: "Never purchased" },
    { key: "purchasedMoreThanOnce", label: "Purchased more than once" },
    { key: "purchasedAtLeastOnce", label: "Purchased at least once" },
    { key: "abandonedCart30Days", label: "Abandoned checkout (30 days)" },
    { key: "emailSubscribers", label: "Email subscribers" },
    { key: "purchasedMoreThan3Times", label: "Purchased more than 3 times" },
  ];

  const toggleSegment = (segKey: string) => {
    const current: string[] = (coupon.eligibility?.specificSegments as string[]) || [];
    const exists = current.includes(segKey);
    const updated = exists ? current.filter((s) => s !== segKey) : [...current, segKey];
    setField("eligibility.specificSegments", updated);
  };

  // helper to toggle id in an array field
  const toggleArrayValue = (path: string, id: string) => {
    const current: string[] = (path.includes(".")
      ? (path.split(".").reduce((acc: any, k: string) => acc?.[k], coupon) || [])
      : (coupon as any)[path]) || [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setField(path, updated);
  };

  return (
    <div>
      <Toaster position="top-right" />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full ">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white/90">
            Edit Coupon
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Coupon Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={coupon.code}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter coupon code"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    name="type"
                    value={coupon.type}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="percent">Percentage</option>
                    <option value="flat">Flat</option>
                    <option value="special">Special</option> {/* added */}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={coupon.value}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter value"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Cart Value
                  </label>
                  <input
                    type="number"
                    name="minCartValue"
                    value={coupon.minCartValue}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={coupon.usageLimit}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={formatDateForInput(coupon.expiresAt)}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={coupon.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Active
                </label>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startAt"
                  value={formatToDateTimeLocal(coupon.startAt)}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={formatToDateTimeLocal(coupon.endAt)}
                  onChange={handleChange}
                  min={coupon.startAt || undefined}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Products */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Product(s)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto border rounded p-2">
                {productsOptions.map((p: any) => {
                  const id = p._id || p.id || p.slug;
                  const checked = (coupon.products || []).includes(String(id));
                  return (
                    <label key={id} className="flex items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleArrayValue("products", String(id))} className="w-4 h-4" />
                      <span className="text-sm">{p.name || p.title || id}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Eligibility */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  name="eligibility.allCustomers"
                  type="checkbox"
                  checked={coupon.eligibility.allCustomers}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                All customers
              </label>

              <label className="block mt-2">
                <span className="text-sm">Specific Customers</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto border rounded p-2 mt-1">
                  {usersOptions.map((u: any) => {
                    const id = u._id || u.id;
                    const checked = (coupon.eligibility.specificCustomers || []).includes(String(id));
                    return (
                      <label key={id} className="flex items-center gap-2">
                        <input type="checkbox" checked={checked} onChange={() => toggleArrayValue("eligibility.specificCustomers", String(id))} className="w-4 h-4" />
                        <span className="text-sm">{u.name || u.email || id}</span>
                      </label>
                    );
                  })}
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {SEGMENT_OPTIONS.map((seg) => {
                  const checked = (coupon.eligibility?.specificSegments || []).includes(seg.key);
                  return (
                    <label key={seg.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSegment(seg.key)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{seg.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Payment specific (prepaid/cod) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  name="paymentSpecific"
                  type="checkbox"
                  checked={coupon.paymentSpecific}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                Payment specific discounts
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  name="paymentDiscounts.prepaid.type"
                  value={coupon.paymentDiscounts.prepaid.type}
                  onChange={handleChange}
                  className="rounded border px-2 py-1"
                >
                  <option value="percent">Percent</option>
                  <option value="flat">Flat</option>
                  <option value="special">Special</option>
                </select>
                <input
                  name="paymentDiscounts.prepaid.value"
                  type="number"
                  value={coupon.paymentDiscounts.prepaid.value}
                  onChange={handleChange}
                  className="rounded border px-2 py-1"
                />
                <input
                  name="paymentDiscounts.prepaid.specialAmount"
                  type="number"
                  value={coupon.paymentDiscounts.prepaid.specialAmount}
                  onChange={handleChange}
                  className="rounded border px-2 py-1"
                  placeholder="special amount"
                />
                <select
                  name="paymentDiscounts.cod.type"
                  value={coupon.paymentDiscounts.cod.type}
                  onChange={handleChange}
                  className="rounded border px-2 py-1"
                >
                  <option value="percent">Percent</option>
                  <option value="flat">Flat</option>
                  <option value="special">Special</option>
                </select>
                <input
                  name="paymentDiscounts.cod.value"
                  type="number"
                  value={coupon.paymentDiscounts.cod.value}
                  onChange={handleChange}
                  className="rounded border px-2 py-1"
                />
                <input
                  name="paymentDiscounts.cod.specialAmount"
                  type="number"
                  value={coupon.paymentDiscounts.cod.specialAmount}
                  onChange={handleChange}
                  className="rounded border px-2 py-1"
                  placeholder="special amount"
                />
              </div>
            </div>

            {/* Shipping & COD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                name="shippingDiscount.type"
                value={coupon.shippingDiscount.type}
                onChange={handleChange}
                className="rounded border px-2 py-1"
              >
                <option value="none">None</option>
                <option value="free">Free</option>
                <option value="flat">Flat</option>
                <option value="percent">Percent</option>
              </select>
              <input
                name="shippingDiscount.value"
                type="number"
                value={coupon.shippingDiscount.value}
                onChange={handleChange}
                className="rounded border px-2 py-1"
              />
              <input
                name="codMaxOrderValue"
                type="number"
                value={coupon.codMaxOrderValue ?? ""}
                onChange={handleChange}
                className="rounded border px-2 py-1"
                placeholder="COD max value"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                name="enforceSingleOutstandingCOD"
                type="checkbox"
                checked={coupon.enforceSingleOutstandingCOD}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
              />
              Enforce single outstanding COD
            </label>

            {/* Other rules and combinations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="minQuantity"
                type="number"
                value={coupon.minQuantity}
                onChange={handleChange}
                className="rounded border px-2 py-1"
                placeholder="min quantity"
              />
              <label className="flex items-center gap-2">
                <input
                  name="minQuantityAppliesToSelectedProducts"
                  type="checkbox"
                  checked={coupon.minQuantityAppliesToSelectedProducts}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                Min qty applies to selected products
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="applyOnActualPrice"
                  type="checkbox"
                  checked={coupon.applyOnActualPrice}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                Apply on actualPrice
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  name="combinations.productDiscounts"
                  type="checkbox"
                  checked={coupon.combinations.productDiscounts}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                Product discounts combination
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="combinations.orderDiscounts"
                  type="checkbox"
                  checked={coupon.combinations.orderDiscounts}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                Order discounts combination
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="combinations.shippingDiscounts"
                  type="checkbox"
                  checked={coupon.combinations.shippingDiscounts}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                />
                Shipping discounts combination
              </label>
            </div>
            <div className="pt-6">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Updating Coupon..." : "Update Coupon"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => {
          setPopup({ ...popup, isVisible: false });
          if (popup.type === "success") {
            navigate("/coupon&promo/list");
          }
        }}
      />
    </div>
  );
};

export default EditCoupon;

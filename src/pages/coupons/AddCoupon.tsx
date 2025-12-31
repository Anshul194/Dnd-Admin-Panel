import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCoupon, fetchCoupons } from "../../store/slices/coupon";
import { RootState, AppDispatch } from "../../store";
import PopupAlert from "../../components/popUpAlert";
import { Toaster } from "react-hot-toast";
import { fetchProducts } from "../../store/slices/product";
import { fetchCustomers } from "../../store/slices/customersSlice";
import { useNavigate } from "react-router-dom";

const initialCoupon = {
  code: "",
  type: "percent",
  value: 0,
  isActive: true,
  startAt: "",
  endAt: "",
  usageLimit: 1,
  usedCount: 0,
  minCartValue: 0,
  products: [] as string[],
  oncePerOrder: false,
  minCartAppliesToSelectedProducts: false,
  limitToOnePerCustomer: false,
  usageByCustomer: [] as any[],
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
  specialAmount: 0,
};

const AddCoupon: React.FC = () => {
  const [coupon, setCoupon] = useState(initialCoupon);
  const [popup, setPopup] = useState({ isVisible: false, message: "", type: "" });
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const loading = useSelector((state: RootState) => state.coupon.loading);

  const productsOptions = useSelector((state: RootState) => (state as any).product?.products || []);
  const usersOptions = useSelector((state: RootState) => (state as any).customers?.customers || []);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 200 }));
    dispatch(fetchCustomers({ page: 1, limit: 200 }));
  }, [dispatch]);

  const SEGMENT_OPTIONS = [
    { key: "neverPurchased", label: "Never purchased" },
    { key: "purchasedMoreThanOnce", label: "Purchased more than once" },
    { key: "purchasedAtLeastOnce", label: "Purchased at least once" },
    { key: "abandonedCart30Days", label: "Abandoned checkout (30 days)" },
    { key: "emailSubscribers", label: "Email subscribers" },
    { key: "purchasedMoreThan3Times", label: "Purchased more than 3 times" },
  ];

  const toggleSegment = (segKey: string) => {
    const current = coupon.eligibility.specificSegments || [];
    const updated = current.includes(segKey)
      ? current.filter((s) => s !== segKey)
      : [...current, segKey];
    setField("eligibility.specificSegments", updated);
  };

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

  // Date validation and formatting helpers
  const formatDateForInput = (dateValue: string): string => {
    if (!dateValue) return "";
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
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

  const formatDateTimeForInput = (dateValue: string): string => {
    if (!dateValue) return "";
    // If it's already in YYYY-MM-DDTHH:mm format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      return dateValue;
    }
    // Try to parse and format the datetime
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      // Convert to local time and format as YYYY-MM-DDTHH:mm
      const tzOffset = date.getTimezoneOffset();
      const local = new Date(date.getTime() - tzOffset * 60000);
      return local.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const validateDate = (dateValue: string): boolean => {
    if (!dateValue) return true; // Optional dates are valid if empty
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === "checkbox") {
      setField(name, (e.target as HTMLInputElement).checked);
    } else if (type === "number") {
      setField(name, value === "" ? 0 : parseFloat(value));
    } else if (type === "date") {
      // Validate and format date input
      const formattedDate = formatDateForInput(value);
      if (formattedDate || value === "") {
        setField(name, formattedDate);
      }
    } else if (type === "datetime-local") {
      // Validate and format datetime-local input
      const formattedDateTime = formatDateTimeForInput(value);
      if (formattedDateTime || value === "") {
        setField(name, formattedDateTime);
      }
    } else {
      setField(name, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon.code) {
      setPopup({ isVisible: true, message: "Coupon code is required.", type: "error" });
      return;
    }

    // Validate start date if provided
    if (coupon.startAt && !validateDate(coupon.startAt)) {
      setPopup({ isVisible: true, message: "Please enter a valid start date.", type: "error" });
      return;
    }
    // Validate end date if provided
    if (coupon.endAt && !validateDate(coupon.endAt)) {
      setPopup({ isVisible: true, message: "Please enter a valid end date.", type: "error" });
      return;
    }
    // Ensure dates are properly formatted before submission
    const formattedCoupon = {
      ...coupon,
      startAt: coupon.startAt ? formatDateTimeForInput(coupon.startAt) : "",
      endAt: coupon.endAt ? formatDateTimeForInput(coupon.endAt) : "",
    };
    try {
      const createdCoupon = await dispatch(createCoupon(formattedCoupon)).unwrap();
      console.log("Created coupon:", createdCoupon);

      setPopup({ isVisible: true, message: "Coupon created successfully!", type: "success" });
      setCoupon(initialCoupon);

      // Redirect immediately - the coupon is already in Redux state
      // The list page will fetch fresh data when it mounts
      setTimeout(() => {
        navigate("/coupon&promo/list");
      }, 1000);
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      setPopup({
        isVisible: true,
        message: error?.message || "Failed to create coupon.",
        type: "error"
      });
    }
  };

  // Beautiful MultiSelect Dropdown Component
  const MultiSelectDropdown: React.FC<{
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
    label: string;
  }> = ({ options, selected, onChange, placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
      onChange(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value]
      );
    };

    const selectedLabels = options
      .filter((opt) => selected.includes(opt.value))
      .map((opt) => opt.label);

    return (
      <div ref={dropdownRef} className="relative">
        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full min-h-[56px] rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 cursor-pointer transition-all duration-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 flex flex-wrap gap-2 items-center"
        >
          {selectedLabels.length > 0 ? (
            selectedLabels.map((lbl) => (
              <span
                key={lbl}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {lbl}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const value = options.find((o) => o.label === lbl)?.value;
                    if (value) toggleOption(value);
                  }}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {selected.length > 0 && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {selected.length} selected
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
            <div className="p-2">
              {options.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No items found</p>
              ) : (
                options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 py-8 px-4">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-start flex gap-4 items-start">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-2">
              Create New Coupon
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Design powerful promotional offers</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
          <form className="p-8 lg:p-12 space-y-10" onSubmit={handleSubmit}>

            {/* Basic Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={coupon.code}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Discount Type
                  </label>
                  <select
                    name="type"
                    value={coupon.type}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Discount Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                      {coupon.type === "percent" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      name="value"
                      value={coupon.value}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-3.5 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Minimum Cart Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      name="minCartValue"
                      value={coupon.minCartValue}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-3.5 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Applicable Products */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Applicable Products</h2>
              </div>

              <MultiSelectDropdown
                label="Select Products (Leave empty for all products)"
                placeholder="Search and select products..."
                options={productsOptions.map((p: any) => ({
                  value: p._id || p.id,
                  label: p.name || p.title || p._id,
                }))}
                selected={coupon.products}
                onChange={(selected) => setField("products", selected)}
              />

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="minCartAppliesToSelectedProducts"
                  checked={coupon.minCartAppliesToSelectedProducts}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm">Minimum cart value applies only to selected products</span>
              </label>
            </section>

            {/* Customer Eligibility */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Eligibility</h2>
              </div>

              <label className="flex items-center gap-3 text-lg">
                <input
                  type="checkbox"
                  name="eligibility.allCustomers"
                  checked={coupon.eligibility.allCustomers}
                  onChange={handleChange}
                  className="w-6 h-6 text-blue-600 rounded"
                />
                <span className="font-medium">Apply to all customers</span>
              </label>

              {!coupon.eligibility.allCustomers && (
                <div className="space-y-6 pl-8 border-l-4 border-blue-200 dark:border-blue-800">
                  <MultiSelectDropdown
                    label="Specific Customers"
                    placeholder="Choose specific customers..."
                    options={usersOptions.map((u: any) => ({
                      value: u._id || u.id,
                      label: u.name || u.email || u.phone || u._id,
                    }))}
                    selected={coupon.eligibility.specificCustomers}
                    onChange={(selected) => setField("eligibility.specificCustomers", selected)}
                  />

                  <div>
                    <label className="block mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Customer Segments
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SEGMENT_OPTIONS.map((seg) => {
                        const checked = coupon.eligibility.specificSegments.includes(seg.key);
                        return (
                          <label
                            key={seg.key}
                            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSegment(seg.key)}
                              className="w-5 h-5 text-blue-600 rounded"
                            />
                            <span className="text-sm font-medium">{seg.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Usage Settings */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usage & Schedule</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 text-sm font-semibold">Usage Limit (Total)</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={coupon.usageLimit}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 text-sm font-semibold">Start Date (Optional)</label>
                  <input
                    type="datetime-local"
                    name="startAt"
                    value={formatDateTimeForInput(coupon.startAt)}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-3 text-sm font-semibold">End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    value={formatDateTimeForInput(coupon.endAt)}
                    onChange={handleChange}
                    min={coupon.startAt || undefined}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={coupon.isActive}
                  onChange={handleChange}
                  className="w-6 h-6 text-blue-600 rounded"
                />
                <span className="text-lg font-medium">Activate coupon immediately</span>
              </label>
            </section>

            {/* Payment Specific */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Method Discounts</h2>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="paymentSpecific"
                  checked={coupon.paymentSpecific}
                  onChange={handleChange}
                  className="w-6 h-6 text-blue-600 rounded"
                />
                <span className="font-medium">Enable different discounts for payment methods</span>
              </label>

              {coupon.paymentSpecific && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-green-200 dark:border-green-800">
                    <h4 className="font-bold text-green-700 dark:text-green-400 mb-4">Prepaid (UPI, Card, Wallet)</h4>
                    <select name="paymentDiscounts.prepaid.type" value={coupon.paymentDiscounts.prepaid.type} onChange={handleChange} className="w-full mb-3 rounded-lg border px-4 py-2">
                      <option value="percent">Percent</option>
                      <option value="flat">Flat</option>
                      <option value="special">Special</option>
                    </select>
                    <input name="paymentDiscounts.prepaid.value" type="number" value={coupon.paymentDiscounts.prepaid.value} onChange={handleChange} placeholder="Value" className="w-full mb-3 rounded-lg border px-4 py-2" />
                    <input name="paymentDiscounts.prepaid.specialAmount" type="number" value={coupon.paymentDiscounts.prepaid.specialAmount} onChange={handleChange} placeholder="Special amount (optional)" className="w-full rounded-lg border px-4 py-2" />
                  </div>

                  <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-orange-200 dark:border-orange-800">
                    <h4 className="font-bold text-orange-700 dark:text-orange-400 mb-4">Cash on Delivery (COD)</h4>
                    <select name="paymentDiscounts.cod.type" value={coupon.paymentDiscounts.cod.type} onChange={handleChange} className="w-full mb-3 rounded-lg border px-4 py-2">
                      <option value="percent">Percent</option>
                      <option value="flat">Flat</option>
                      <option value="special">Special</option>
                    </select>
                    <input name="paymentDiscounts.cod.value" type="number" value={coupon.paymentDiscounts.cod.value} onChange={handleChange} placeholder="Value" className="w-full mb-3 rounded-lg border px-4 py-2" />
                    <input name="paymentDiscounts.cod.specialAmount" type="number" value={coupon.paymentDiscounts.cod.specialAmount} onChange={handleChange} placeholder="Special amount (optional)" className="w-full rounded-lg border px-4 py-2" />
                  </div>
                </div>
              )}
            </section>

            {/* Shipping & COD Rules */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shipping & COD Rules</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-3 text-sm font-semibold">Shipping Discount</label>
                  <select name="shippingDiscount.type" value={coupon.shippingDiscount.type} onChange={handleChange} className="w-full rounded-xl border px-4 py-3">
                    <option value="none">No discount</option>
                    <option value="free">Free Shipping</option>
                    <option value="flat">Flat Amount</option>
                    <option value="percent">Percentage</option>
                  </select>
                </div>
                {coupon.shippingDiscount.type !== "none" && coupon.shippingDiscount.type !== "free" && (
                  <div>
                    <label className="block mb-3 text-sm font-semibold">Shipping Discount Value</label>
                    <input name="shippingDiscount.value" type="number" value={coupon.shippingDiscount.value} onChange={handleChange} className="w-full rounded-xl border px-4 py-3" />
                  </div>
                )}
                <div>
                  <label className="block mb-3 text-sm font-semibold">Max Order Value for COD</label>
                  <input name="codMaxOrderValue" type="number" value={coupon.codMaxOrderValue ?? ""} onChange={handleChange} placeholder="e.g., 5000" className="w-full rounded-xl border px-4 py-3" />
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="enforceSingleOutstandingCOD"
                  checked={coupon.enforceSingleOutstandingCOD}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span>Enforce only one outstanding COD order per customer</span>
              </label>
            </section>

            {/* Other Rules */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Other Rules</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-3 text-sm font-semibold">Minimum Quantity</label>
                  <input
                    type="number"
                    name="minQuantity"
                    value={coupon.minQuantity}
                    onChange={handleChange}
                    className="w-full rounded-xl border px-4 py-3"
                    min="0"
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="minQuantityAppliesToSelectedProducts"
                    checked={coupon.minQuantityAppliesToSelectedProducts}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span>Min quantity applies to selected products only</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="limitToOnePerCustomer"
                    checked={coupon.limitToOnePerCustomer}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span>Limit to one use per customer</span>
                </label>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="applyOnActualPrice"
                    checked={coupon.applyOnActualPrice}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span>Apply discount on actual price (if higher than selling price)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["productDiscounts", "orderDiscounts", "shippingDiscounts"].map((key) => (
                    <label key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name={`combinations.${key}`}
                        checked={(coupon.combinations as any)[key]}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span className="text-sm">Allow combination with {key.replace("Discounts", "").toLowerCase()} discounts</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setCoupon(initialCoupon)}
                className="px-8 py-4 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {loading ? (
                  <>Creating Coupon...</>
                ) : (
                  <>Create Coupon</>
                )}
              </button>
            </div>
          </form>
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
};

export default AddCoupon;
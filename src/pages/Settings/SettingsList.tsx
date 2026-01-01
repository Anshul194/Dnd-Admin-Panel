/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings, updateSettings } from "../../store/slices/structure";
import { RootState, AppDispatch } from "../../store";
import {
  Settings,
  CreditCard,
  Truck,
  Shield,
  AlertTriangle,
  Check,
  X,
  ChartNoAxesCombined,
  Percent,
} from "lucide-react";

const fieldGroups = [
  {
    title: "Payment & Billing",
    icon: <CreditCard className="w-5 h-5" />,
    fields: [
      {
        name: "codLimit",
        label: "COD Limit",
        type: "number",
        description: "Maximum amount for Cash on Delivery orders",
        unit: "₹",
      },
      {
        name: "codOtpRequired",
        label: "COD OTP Verification",
        type: "checkbox",
        description: "Require OTP verification for COD orders",
      },
    ],
  },
  {
    title: "Shipping Configuration",
    icon: <Truck className="w-5 h-5" />,
    fields: [
      {
        name: "freeShippingThreshold",
        label: "Free Shipping Threshold",
        type: "number",
        description: "Minimum order value for free shipping",
        unit: "₹",
      },
      {
        name: "codShippingChargeBelowThreshold",
        label: "COD Shipping Charge",
        type: "number",
        description: "Shipping charge for COD orders below threshold",
        unit: "₹",
      },
      {
        name: "prepaidShippingChargeBelowThreshold",
        label: "Prepaid Shipping Charge",
        type: "number",
        description: "Shipping charge for prepaid orders below threshold",
        unit: "₹",
      },
    ],
  },
  {
    title: "Risk Management",
    icon: <Shield className="w-5 h-5" />,
    fields: [
      {
        name: "codDisableForHighRTO",
        label: "Disable COD for High RTO",
        type: "checkbox",
        description:
          "Automatically disable COD for customers with high return rates",
      },
      {
        name: "codBlockOnRTOAddress",
        label: "Block RTO Addresses",
        type: "checkbox",
        description: "Block COD orders from addresses with previous RTOs",
      },
      {
        name: "highRTOOrderCount",
        label: "High RTO Threshold",
        type: "number",
        description: "Number of RTO orders to consider as high risk",
        unit: "orders",
      },
    ],
  },
  {
    title: "Order Restrictions",
    icon: <AlertTriangle className="w-5 h-5" />,
    fields: [
      {
        name: "repeatOrderRestrictionDays",
        label: "Repeat Order Restriction",
        type: "number",
        description: "Days to wait before allowing repeat orders",
        unit: "days",
      },
    ],
  },
  {
    title: "Meta Integration",
    icon: <ChartNoAxesCombined className="w-5 h-5" />,
    fields: [
      {
        name: "metaIntegration.adAccountId",
        label: "Ad Account ID",
        type: "text",
        description: "Your Meta Ad Account ID (e.g., act_YOUR_AD_ACCOUNT_ID)",
      },
      {
        name: "metaIntegration.pixelId",
        label: "Pixel ID",
        type: "text",
        description: "Your Meta Pixel ID for tracking",
      },
      {
        name: "metaIntegration.pageId",
        label: "Page ID",
        type: "text",
        description: "Your Facebook Page ID",
      },
      {
        name: "metaIntegration.accessToken",
        label: "Access Token",
        type: "password",
        description: "Your Meta API Access Token",
      },
      {
        name: "metaIntegration.appId",
        label: "App ID",
        type: "text",
        description: "Your Meta App ID",
      },
      {
        name: "metaIntegration.appSecret",
        label: "App Secret",
        type: "password",
        description: "Your Meta App Secret",
      },
      {
        name: "metaIntegration.isConnected",
        label: "Connection Status",
        type: "checkbox",
        description: "Enable Meta integration",
      },
    ],
  },
  {
    title: "Charges",
    icon: <Percent className="w-5 h-5" />,
    fields: [
      {
        name: "gstCharge",
        label: "GST Charge",
        type: "number",
        description: "GST charge amount applied to orders",
        unit: "₹",
      },
      {
        name: "paymentGatewayCharge",
        label: "Payment Gateway Charge",
        type: "number",
        description: "Payment gateway charge amount applied to orders",
        unit: "₹",
      },
    ],
  },
];

const SettingsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, loading, error } = useSelector(
    (state: RootState) => state.structure
  );
  const [form, setForm] = useState(settings || {});
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    setForm(settings || {});
  }, [settings]);

  useEffect(() => {
    if (JSON.stringify(form) !== JSON.stringify(settings)) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [form, settings]);

  // Show toast for error from redux
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
      setTimeout(() => setToast({ message: "", type: null }), 3000);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;

    // Handle nested fields (e.g., metaIntegration.adAccountId)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm((prev: any) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] || {}),
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setForm((prev: any) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
              ? Number(value)
              : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(updateSettings(form));
    if (updateSettings.fulfilled.match(result)) {
      // Determine which settings were updated based on the active tab
      let successMessage = "Settings updated successfully!";

      switch (activeTab) {
        case 0:
          successMessage = "Payment & Billing settings updated successfully!";
          break;
        case 1:
          successMessage =
            "Shipping Configuration settings updated successfully!";
          break;
        case 2:
          successMessage = "Risk Management settings updated successfully!";
          break;
        case 3:
          successMessage = "Order Restrictions settings updated successfully!";
          break;
        case 4:
          successMessage = "Meta Integration settings updated successfully!";
          break;
        case 5:
          successMessage = "Charges settings updated successfully!";
          break;
        default:
          successMessage = "Settings updated successfully!";
      }

      setToast({ message: successMessage, type: "success" });
      setTimeout(() => setToast({ message: "", type: null }), 5000);
      dispatch(fetchSettings());
    } else if (updateSettings.rejected.match(result)) {
      setToast({
        message: (result.payload as string) || "Failed to update settings.",
        type: "error",
      });
      setTimeout(() => setToast({ message: "", type: null }), 5000);
    }
  };

  const handleReset = () => {
    setForm(settings || {});
  };

  // Helper to get nested field value
  const getFieldValue = (fieldName: string) => {
    if (!form) return "";
    if (fieldName.includes(".")) {
      const [parent, child] = fieldName.split(".");
      return (form as any)[parent]?.[child] ?? "";
    }
    return (form as any)[fieldName] ?? "";
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Toast Message */}
        {toast.type && (
          <div
            className={`fixed top-6 right-6 px-6 py-4 rounded-lg shadow-2xl z-[9999] flex items-center gap-3 min-w-80 max-w-md
              ${toast.type === "success"
                ? "bg-green-50 border-l-4 border-green-500 text-green-800"
                : "bg-red-50 border-l-4 border-red-500 text-red-800"
              }`}
            style={{
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            {toast.type === "success" ? (
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <span className="font-medium text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => setToast({ message: "", type: null })}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ecommerce Settings
              </h1>
            </div>
            <p className="text-gray-600">
              Configure your store's payment, shipping, and risk management
              settings
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
            {fieldGroups.map((group, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-3 font-medium rounded-t-lg transition-all duration-200 ${activeTab === index
                  ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {group.icon}
                <span className="hidden sm:inline">{group.title}</span>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {/* Active Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {fieldGroups[activeTab].icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {fieldGroups[activeTab].title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {activeTab === 0 &&
                        "Configure payment methods and billing settings"}
                      {activeTab === 1 &&
                        "Set up shipping charges and delivery options"}
                      {activeTab === 2 &&
                        "Manage risk prevention and fraud protection"}
                      {activeTab === 3 &&
                        "Control order frequency and restrictions"}
                      {activeTab === 4 &&
                        "Configure Meta (Facebook) advertising integration"}
                      {activeTab === 5 &&
                        "Configure GST and payment gateway charges for orders"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {fieldGroups[activeTab].fields.map((field) => (
                  <div
                    key={field.name}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start"
                  >
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {field.label}
                      </label>
                      <p className="text-sm text-gray-500">
                        {field.description}
                      </p>
                    </div>

                    <div className="lg:col-span-2">
                      {field.type === "checkbox" ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name={field.name}
                            checked={!!getFieldValue(field.name)}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {getFieldValue(field.name) ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={field.type}
                            name={field.name}
                            value={getFieldValue(field.name)}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                          {field.unit && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-gray-500 text-sm">
                                {field.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      You have unsaved changes
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">COD Limit</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{(form as any).codLimit || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Free Shipping At</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{(form as any).freeShippingThreshold || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">RTO Protection</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(form as any).codDisableForHighRTO
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Restriction</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(form as any).repeatOrderRestrictionDays || 0} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsList;

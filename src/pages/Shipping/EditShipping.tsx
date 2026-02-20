import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import {
  createShipping,
  fetchShippingById,
  updateShipping,
} from "../../store/slices/shippingSlice";
import { useParams, useNavigate } from "react-router";

export default function EditShipping() {
  const navigate = useNavigate();
  const [shipping, setShipping] = useState({
    name: "",
    slug: "",
    description: "",
    priority: 0,
    shippingMethod: "standard" as
      | "standard"
      | "express"
      | "overnight"
      | "international"
      | "pickup",
    cost: 0,
    freeShippingThreshold: "",
    estimatedDeliveryDays: {
      min: 1,
      max: 7,
    },
    supportedRegions: [
      {
        country: "",
        states: [""],
        postalCodes: [""],
      },
    ],
    weightLimit: {
      min: 0,
      max: 0,
    },
    dimensionsLimit: {
      length: 0,
      width: 0,
      height: 0,
    },
    carrier: "Blue Dart",
    trackingAvailable: true,
    trackingNumber: "",
    cod: {
      available: false,
      fee: 0,
    },
    additionalCharges: {
      fuelSurcharge: 0,
      remoteAreaSurcharge: 0,
      oversizedSurcharge: 0,
      dangerousGoodsSurcharge: 0,
    },
    customs: {
      clearanceRequired: false,
      documentation: [""],
    },
    proofOfDelivery: {
      available: false,
      details: {
        consigneeName: "",
        deliveryDate: "",
        signature: "",
      },
    },
    status: "active" as "active" | "inactive",
  });
  const params = useParams();
  const id = params.id as string;

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  // Service list (for couriers like DTDC)
  type ServiceOption = {
    _id?: string;
    serviceCode?: string;
    serviceName?: string;
    isDefaultService?: boolean;
    [k: string]: any;
  };

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [defaultServiceCodes, setDefaultServiceCodes] = useState<string[]>([]);
  const [servicePriorities, setServicePriorities] = useState<Record<string, number>>({});

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(
    (state: RootState) => state.shipping?.loading || false
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;

      // Handle nested checkbox fields
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setShipping({
          ...shipping,
          [parent]: {
            ...shipping[parent as keyof typeof shipping],
            [child]: checked,
          },
        });
      } else {
        setShipping({ ...shipping, [name]: checked });
      }
    } else if (type === "number") {
      const numValue = parseFloat(value) || 0;

      // Handle nested number fields
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setShipping({
          ...shipping,
          [parent]: {
            ...shipping[parent as keyof typeof shipping],
            [child]: numValue,
          },
        });
      } else {
        setShipping({ ...shipping, [name]: numValue });
      }
    } else {
      // Handle nested text fields
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setShipping({
          ...shipping,
          [parent]: {
            ...shipping[parent as keyof typeof shipping],
            [child]: value,
          },
        });
      } else {
        setShipping({ ...shipping, [name]: value });
      }
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setShipping({
      ...shipping,
      name,
      slug: generateSlug(name),
    });
  };

  // Handle supported regions
  const handleRegionChange = (index: number, field: string, value: string) => {
    const updatedRegions = [...shipping.supportedRegions];
    updatedRegions[index] = { ...updatedRegions[index], [field]: value };
    setShipping({ ...shipping, supportedRegions: updatedRegions });
  };

  const handleRegionArrayChange = (
    regionIndex: number,
    field: "states" | "postalCodes",
    itemIndex: number,
    value: string
  ) => {
    const updatedRegions = [...shipping.supportedRegions];
    updatedRegions[regionIndex][field][itemIndex] = value;
    setShipping({ ...shipping, supportedRegions: updatedRegions });
  };

  const addRegion = () => {
    setShipping({
      ...shipping,
      supportedRegions: [
        ...shipping.supportedRegions,
        { country: "", states: [""], postalCodes: [""] },
      ],
    });
  };

  const removeRegion = (index: number) => {
    const updatedRegions = shipping.supportedRegions.filter(
      (_, i) => i !== index
    );
    setShipping({ ...shipping, supportedRegions: updatedRegions });
  };

  const addRegionItem = (
    regionIndex: number,
    field: "states" | "postalCodes"
  ) => {
    const updatedRegions = [...shipping.supportedRegions];
    updatedRegions[regionIndex][field].push("");
    setShipping({ ...shipping, supportedRegions: updatedRegions });
  };

  const removeRegionItem = (
    regionIndex: number,
    field: "states" | "postalCodes",
    itemIndex: number
  ) => {
    const updatedRegions = [...shipping.supportedRegions];
    updatedRegions[regionIndex][field] = updatedRegions[regionIndex][
      field
    ].filter((_, i) => i !== itemIndex);
    setShipping({ ...shipping, supportedRegions: updatedRegions });
  };

  // Handle customs documentation
  const handleDocumentationChange = (index: number, value: string) => {
    const updatedDocs = [...shipping.customs.documentation];
    updatedDocs[index] = value;
    setShipping({
      ...shipping,
      customs: { ...shipping.customs, documentation: updatedDocs },
    });
  };

  const addDocumentation = () => {
    setShipping({
      ...shipping,
      customs: {
        ...shipping.customs,
        documentation: [...shipping.customs.documentation, ""],
      },
    });
  };

  const removeDocumentation = (index: number) => {
    const updatedDocs = shipping.customs.documentation.filter(
      (_, i) => i !== index
    );
    setShipping({
      ...shipping,
      customs: { ...shipping.customs, documentation: updatedDocs },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!shipping.name.trim()) {
      toast.error("Shipping name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!shipping.slug.trim()) {
      toast.error("Shipping slug is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (shipping.cost < 0) {
      toast.error("Cost cannot be negative.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (
      shipping.estimatedDeliveryDays.min > shipping.estimatedDeliveryDays.max
    ) {
      toast.error(
        "Minimum delivery days cannot be greater than maximum delivery days.",
        {
          duration: 8000,
          position: "top-right",
        }
      );
      return;
    }

    // Clean up data before submission
    const shippingData = {
      ...shipping,
      ...(isDtdc && defaultServiceCodes.length
        ? { defaultServices: defaultServiceCodes }
        : {}),
      ...(isDtdc && services && services.length
        ? {
            services: services.map((s) => ({
              serviceCode: s.serviceCode || s.serviceCode || s.name || s._id,
              servicePriority: servicePriorities[String(s.serviceCode ?? s._id ?? s.code ?? s.id ?? "")] ?? 0,
              isDefaultService: defaultServiceCodes.includes(String(s.serviceCode ?? s._id ?? s.code ?? s.id ?? "")),
            })),
          }
        : {}),
      freeShippingThreshold: shipping.freeShippingThreshold
        ? parseFloat(shipping.freeShippingThreshold.toString())
        : null,
      supportedRegions: shipping.supportedRegions
        .map((region) => ({
          ...region,
          states: region.states.filter((state) => state.trim() !== ""),
          postalCodes: region.postalCodes.filter((code) => code.trim() !== ""),
        }))
        .filter((region) => region.country.trim() !== ""),
      customs: {
        ...shipping.customs,
        documentation: shipping.customs.documentation.filter(
          (doc) => doc.trim() !== ""
        ),
      },
    };

    try {
      const updatedShipping = await dispatch(
        updateShipping({ id, data: shippingData })
      ).unwrap();

      console.log("Updated Shipping:", updatedShipping);

      toast.success("Shipping method updated successfully!", {
        duration: 3000,
        position: "top-right",
      });

      // Redirect to list page after successful update
      setTimeout(() => {
        navigate("/shipping/list");
      }, 1000);
    } catch (err: any) {
      console.error("Error updating shipping:", err);
      setPopup({
        isVisible: true,
        message:
          err?.message || "Failed to update shipping method. Please try again.",
        type: "error",
      });
    }
  };

  const getData = async () => {
    try {
      const response = await dispatch(fetchShippingById(id)).unwrap();
  console.log("Fetched Shipping Data:", response);
  const rawResp: any = response as any;
      setShipping({
        name: response.name,
        slug: response.slug,
        description: response.description,
        priority: response.priority,
        shippingMethod: response.shippingMethod,
        cost: response.cost,
        freeShippingThreshold: response.freeShippingThreshold,
        estimatedDeliveryDays: {
          min: response.estimatedDeliveryDays.min,
          max: response.estimatedDeliveryDays.max,
        },
        supportedRegions: response.supportedRegions,
        weightLimit: {
          min: response.weightLimit.min,
          max: response.weightLimit.max,
        },
        dimensionsLimit: {
          length: response.dimensionsLimit.length,
          width: response.dimensionsLimit.width,
          height: response.dimensionsLimit.height,
        },
        carrier: response.carrier || "Blue Dart",
        trackingAvailable: response.trackingAvailable,
        trackingNumber: response.trackingNumber || "",
        cod: {
          available: response.cod.available,
          fee: response.cod.fee || 0,
        },
        additionalCharges: {
          fuelSurcharge: response.additionalCharges.fuelSurcharge || 0,
          remoteAreaSurcharge:
            response.additionalCharges.remoteAreaSurcharge || 0,
          oversizedSurcharge:
            response.additionalCharges.oversizedSurcharge || 0,
          dangerousGoodsSurcharge:
            response.additionalCharges.dangerousGoodsSurcharge || 0,
        },
        customs: {
          clearanceRequired: response.customs.clearanceRequired || false,
          documentation: response.customs.documentation || [""],
        },
        proofOfDelivery: {
          available: response.proofOfDelivery.available || false,
          details: {
            consigneeName:
              response?.proofOfDelivery?.details?.consigneeName || "",
            deliveryDate:
              response?.proofOfDelivery?.details?.deliveryDate || "",
            signature: response?.proofOfDelivery?.details?.signature || "",
          },
        },
        status: response.status || "active",
      });

      // Try to extract service list from response (if API includes it)
      const svcList =
        rawResp.services || rawResp.availableServices || rawResp.serviceList || rawResp.servicesList || [];
      if (Array.isArray(svcList) && svcList.length > 0) {
        // normalize services to expected fields (serviceCode/serviceName/isDefaultService)
        const normalized = svcList.map((s: any) => ({
          _id: s._id || s.id || undefined,
          serviceCode: s.serviceCode || s.code || s.service_code || s.codeString || s.name,
          serviceName: s.serviceName || s.serviceName || s.name || s.service_name || s.title,
          isDefaultService: Boolean(s.isDefaultService || s.isDefault || s.default),
          ...s,
        }));
        setServices(normalized);

        // If response indicates default services, pick their serviceCodes
        const foundDefaults = normalized.filter((s: any) => s.isDefaultService).map((s: any) => String(s.serviceCode));
        if (foundDefaults && foundDefaults.length) setDefaultServiceCodes(foundDefaults);

        // Populate initial priorities map from response
        const priMap: Record<string, number> = {};
        normalized.forEach((s: any) => {
          const code = String(s.serviceCode ?? s._id ?? s.code ?? s.id ?? "");
          priMap[code] = Number(s.servicePriority ?? s.servicePriority === 0 ? s.servicePriority : s.priority ?? 0) || 0;
        });
        setServicePriorities(priMap);
      }
    } catch (error) {
      console.error("Error fetching shipping data:", error);
      setPopup({
        isVisible: true,
        message: "Failed to fetch shipping data. Please try again.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    getData();
  }, [id]);

  const isDtdc = String(shipping.name || "").toLowerCase().includes("dtdc");

  const handleToggleDefaultService = (serviceCode: string) => {
    setDefaultServiceCodes((prev) => {
      if (prev.includes(serviceCode)) return prev.filter((c) => c !== serviceCode);
      return [...prev, serviceCode];
    });
  };

  const handlePriorityChange = (serviceCode: string, value: number) => {
    setServicePriorities((prev) => ({ ...prev, [serviceCode]: Number(value) || 0 }));
  };

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Edit Shipping Method | TailAdmin"
        description="Edit an existing shipping method for TailAdmin"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Edit Shipping Method" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shipping Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={shipping.name}
                  onChange={handleNameChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter shipping method name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={shipping.slug}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter shipping slug"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  URL-friendly version of the name. Auto-generated from name.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={shipping.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter shipping method description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Shipping Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="shippingMethod"
                    value={shipping.shippingMethod}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="overnight">Overnight</option>
                    <option value="international">International</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cost <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={shipping.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Free Shipping Threshold
                </label>
                <input
                  type="number"
                  name="freeShippingThreshold"
                  value={shipping.freeShippingThreshold}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Leave empty if not applicable"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum order amount for free shipping
                </p>
              </div>
            </div>

            {/* Delivery Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Delivery Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Delivery Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedDeliveryDays.min"
                    value={shipping.estimatedDeliveryDays.min}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Delivery Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedDeliveryDays.max"
                    value={shipping.estimatedDeliveryDays.max}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Carrier
                  </label>
                  <input
                    type="text"
                    name="carrier"
                    value={shipping.carrier}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Blue Dart"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    name="trackingNumber"
                    value={shipping.trackingNumber}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={shipping.priority}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="trackingAvailable"
                  name="trackingAvailable"
                  checked={shipping.trackingAvailable}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label
                  htmlFor="trackingAvailable"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tracking Available
                </label>
              </div>
            </div>

            {/* Weight and Dimensions Limits Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Weight and Dimensions Limits
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weightLimit.min"
                    value={shipping.weightLimit.min}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weightLimit.max"
                    value={shipping.weightLimit.max}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    name="dimensionsLimit.length"
                    value={shipping.dimensionsLimit.length}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    name="dimensionsLimit.width"
                    value={shipping.dimensionsLimit.width}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="dimensionsLimit.height"
                    value={shipping.dimensionsLimit.height}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Supported Regions Section */}
            {/* <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Supported Regions
                </h3>
                <button
                  type="button"
                  onClick={addRegion}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                >
                  Add Region
                </button>
              </div>

              {shipping.supportedRegions.map((region, regionIndex) => (
                <div
                  key={regionIndex}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                      Region {regionIndex + 1}
                    </h4>
                    {shipping.supportedRegions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRegion(regionIndex)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Country
                    </label>
                    <input
                      type="text"
                      value={region.country}
                      onChange={(e) =>
                        handleRegionChange(
                          regionIndex,
                          "country",
                          e.target.value
                        )
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter country name"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        States
                      </label>
                      <button
                        type="button"
                        onClick={() => addRegionItem(regionIndex, "states")}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        Add State
                      </button>
                    </div>
                    {region.states.map((state, stateIndex) => (
                      <div key={stateIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={state}
                          onChange={(e) =>
                            handleRegionArrayChange(
                              regionIndex,
                              "states",
                              stateIndex,
                              e.target.value
                            )
                          }
                          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          placeholder="Enter state name"
                        />
                        {region.states.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeRegionItem(
                                regionIndex,
                                "states",
                                stateIndex
                              )
                            }
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Postal Codes
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          addRegionItem(regionIndex, "postalCodes")
                        }
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        Add Postal Code
                      </button>
                    </div>
                    {region.postalCodes.map((code, codeIndex) => (
                      <div key={codeIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) =>
                            handleRegionArrayChange(
                              regionIndex,
                              "postalCodes",
                              codeIndex,
                              e.target.value
                            )
                          }
                          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          placeholder="Enter postal code"
                        />
                        {region.postalCodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeRegionItem(
                                regionIndex,
                                "postalCodes",
                                codeIndex
                              )
                            }
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div> */}

            {/* Cash on Delivery Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Cash on Delivery (COD)
              </h3>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="codAvailable"
                  name="cod.available"
                  checked={shipping.cod.available}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label
                  htmlFor="codAvailable"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  COD Available
                </label>
              </div>

              {shipping.cod.available && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    COD Fee
                  </label>
                  <input
                    type="number"
                    name="cod.fee"
                    value={shipping.cod.fee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Additional Charges Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Additional Charges
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fuel Surcharge
                  </label>
                  <input
                    type="number"
                    name="additionalCharges.fuelSurcharge"
                    value={shipping.additionalCharges.fuelSurcharge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Remote Area Surcharge
                  </label>
                  <input
                    type="number"
                    name="additionalCharges.remoteAreaSurcharge"
                    value={shipping.additionalCharges.remoteAreaSurcharge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Oversized Surcharge
                  </label>
                  <input
                    type="number"
                    name="additionalCharges.oversizedSurcharge"
                    value={shipping.additionalCharges.oversizedSurcharge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dangerous Goods Surcharge
                  </label>
                  <input
                    type="number"
                    name="additionalCharges.dangerousGoodsSurcharge"
                    value={shipping.additionalCharges.dangerousGoodsSurcharge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Customs Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Customs Information
              </h3>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="clearanceRequired"
                  name="customs.clearanceRequired"
                  checked={shipping.customs.clearanceRequired}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label
                  htmlFor="clearanceRequired"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Customs Clearance Required
                </label>
              </div>

              {shipping.customs.clearanceRequired && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Documentation
                    </label>
                    <button
                      type="button"
                      onClick={addDocumentation}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                      Add Document
                    </button>
                  </div>
                  {shipping.customs.documentation.map((doc, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={doc}
                        onChange={(e) =>
                          handleDocumentationChange(index, e.target.value)
                        }
                        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter required document"
                      />
                      {shipping.customs.documentation.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDocumentation(index)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proof of Delivery Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Proof of Delivery
              </h3>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="proofOfDeliveryAvailable"
                  name="proofOfDelivery.available"
                  checked={shipping.proofOfDelivery.available}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label
                  htmlFor="proofOfDeliveryAvailable"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Proof of Delivery Available
                </label>
              </div>

              {shipping.proofOfDelivery.available && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Consignee Name
                    </label>
                    <input
                      type="text"
                      name="proofOfDelivery.details.consigneeName"
                      value={shipping.proofOfDelivery.details.consigneeName}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter consignee name"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      name="proofOfDelivery.details.deliveryDate"
                      value={shipping.proofOfDelivery.details.deliveryDate}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Signature
                    </label>
                    <input
                      type="text"
                      name="proofOfDelivery.details.signature"
                      value={shipping.proofOfDelivery.details.signature}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter signature details"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Status
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shipping Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={shipping.status}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Inactive shipping methods are not available for selection
                </p>
              </div>
            </div>

            {/* Service List Section (only for DTDC shipping names) */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Service List
              </h3>

              {isDtdc ? (
                services && services.length > 0 ? (
                  <div className="space-y-2">
                    {services.map((svc, idx) => {
                      const code = String(svc.serviceCode ?? svc._id ?? svc.code ?? svc.id ?? idx);
                      return (
                        <div
                          key={code + idx}
                          className="flex items-center justify-between border p-3 rounded"
                        >
                          <div>
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {svc.serviceName || svc.serviceCode || svc.title || code}
                            </div>
                            {svc.description && (
                              <div className="text-xs text-gray-500">{svc.description}</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600 dark:text-gray-400">Default</label>
                              <input
                                type="checkbox"
                                name={`defaultService-${code}`}
                                checked={defaultServiceCodes.includes(code)}
                                onChange={() => handleToggleDefaultService(code)}
                                className="h-4 w-4 text-blue-600"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600 dark:text-gray-400">Priority</label>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={servicePriorities[code] ?? 0}
                                onChange={(e) => handlePriorityChange(code, parseInt(e.target.value || "0", 10))}
                                className="w-20 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Services are not available for this shipping method.</div>
                )
              ) : (
                <div className="text-sm text-gray-500">No need to set service for book shipment.</div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading
                  ? "Updating Shipping Method..."
                  : "Update Shipping Method"}
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
}

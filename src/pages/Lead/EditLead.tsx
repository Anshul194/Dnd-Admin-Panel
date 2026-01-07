import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { User, Mail, Phone, FileText, Users, Search, X, Tag, DollarSign, Briefcase, Layers, Calendar, Package, Check, Link, CheckCircle, PhoneCall, Hash } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { updateLead, fetchLeadById, clearError } from "../../store/slices/lead";
import { fetchStaff } from "../../store/slices/staff";
import { fetchProducts } from "../../store/slices/product";
import { RootState, AppDispatch } from "../../store";
import IverLead from "../Ivr/IverLead";

type LeadStatus = "new" | "contacted" | "assigned" | "qualified" | "converted" | "lost";
type LeadSource = "website" | "newsletter" | "popup" | "referral" | "manual" | "other" | "IVR" | "facebook_lead_ads";
type CallStatus =
  | "call_not_answered"
  | "number_not_reachable"
  | "call_back"
  | "interested"
  | "number_not_connected"
  | "order_enquiry"
  | "not_interested"
  | "switch_off"
  | "missed_call"
  | "busy"
  | "no_response"
  | "other"
  | "";

interface LeadFormData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource | "";
  description: string;
  category: string;
  department: string;
  expectedPrice: number;
  lastRemark: string;
  tags: string; // Comma separated for UI
  products: string[]; // Array of product names/IDs
  assignedTo: string;
  nextFollowUpAt: string;
  // New fields
  media: string;
  converted: boolean;
  convertedTo: string;
  lastContactedAt: string;
  lastCallStatus: CallStatus;
  followUpCount: number;
}

interface PopupAlert {
  isVisible: boolean;
  message: string;
  type: string;
}

const PopupAlert: React.FC<PopupAlert & { onClose: () => void }> = ({
  message,
  type,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
          >
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const PageBreadcrumb: React.FC<{ pageTitle: string }> = ({ pageTitle }) => (
  <div className="mb-6">
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 md:space-x-3">
        <li className="flex items-center">
          <a href="#" className="text-gray-700 hover:text-blue-600 dark:text-gray-300">
            Home
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <span className="mx-2 text-gray-400">/</span>
            <a href="/leads" className="text-gray-700 hover:text-blue-600 dark:text-gray-300">
              Leads
            </a>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-500 dark:text-gray-400">{pageTitle}</span>
          </div>
        </li>
      </ol>
    </nav>
    <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">
      {pageTitle}
    </h1>
  </div>
);

const EditLead: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { leads, loading, error } = useSelector((state: RootState) => state.lead);
  const { staff, loading: staffLoading } = useSelector((state: RootState) => state.staff);
  const { products, loading: productsLoading } = useSelector((state: RootState) => state.product);

  const [popup, setPopup] = useState<PopupAlert>({
    isVisible: false,
    message: "",
    type: "",
  });

  const [formData, setFormData] = useState<LeadFormData>({
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    phone: "",
    status: "new",
    source: "",
    description: "",
    category: "",
    department: "",
    expectedPrice: 0,
    lastRemark: "",
    tags: "",
    products: [],
    assignedTo: "",
    nextFollowUpAt: "",
    media: "",
    converted: false,
    convertedTo: null,
    lastContactedAt: "",
    lastCallStatus: "",
    followUpCount: 0,
  });

  const [isFormLoaded, setIsFormLoaded] = useState(false);

  // Search functionality for staff dropdown (Assigned To)
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  // Search functionality for staff dropdown (Converted To)
  const [convertedToSearchTerm, setConvertedToSearchTerm] = useState("");
  const [isConvertedToDropdownOpen, setIsConvertedToDropdownOpen] = useState(false);
  const convertedToDropdownRef = useRef<HTMLDivElement>(null);

  // Search functionality for product dropdown
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch lead data when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchLeadById(id));
    }
  }, [dispatch, id]);

  // Populate form when lead data is available
  useEffect(() => {
    if (id && leads.length > 0) {
      const currentLead = leads.find(lead => lead._id === id);
      if (currentLead && !isFormLoaded) {
        // Handle assignedTo - it can be either a string ID or a populated staff object
        let assignedToId = "";
        if (currentLead.assignedTo) {
          if (typeof currentLead.assignedTo === "string") {
            assignedToId = currentLead.assignedTo;
          } else if (typeof currentLead.assignedTo === "object" && currentLead.assignedTo._id) {
            assignedToId = currentLead.assignedTo._id;
          }
        }

        setFormData({
          firstName: currentLead.firstName || "",
          lastName: currentLead.lastName || "",
          fullName: currentLead.fullName || "",
          email: currentLead.email || "",
          phone: currentLead.phone || "",
          status: currentLead.status || "new",
          source: currentLead.source || "",
          description: currentLead.description || "",
          category: currentLead.category || "",
          department: currentLead.department || "",
          expectedPrice: currentLead.expectedPrice || 0,
          lastRemark: currentLead.lastRemark || "",
          tags: currentLead.tags ? currentLead.tags.join(", ") : "",
          products: currentLead.products || [],
          assignedTo: assignedToId,
          nextFollowUpAt: currentLead.nextFollowUpAt ? new Date(currentLead.nextFollowUpAt).toISOString().slice(0, 16) : "",
          media: currentLead.media || "",
          converted: currentLead.converted || false,
          convertedTo: currentLead.convertedTo || "",
          lastContactedAt: currentLead.lastContactedAt ? new Date(currentLead.lastContactedAt).toISOString().slice(0, 16) : "",
          lastCallStatus: currentLead.lastCallStatus || "",
          followUpCount: currentLead.followUpCount || 0,
        });
        setIsFormLoaded(true);
      }
    }
  }, [leads, id, isFormLoaded]);

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearError());
    // Fetch staff data for the dropdown
    dispatch(fetchStaff({}));
    // Fetch products
    dispatch(fetchProducts({ limit: 100 })); // Fetch enough products for the dropdown
  }, [dispatch]);

  // Show error popup if there's an error from Redux
  useEffect(() => {
    if (error) {
      setPopup({
        isVisible: true,
        message: error,
        type: "error",
      });
    }
  }, [error]);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setIsStaffDropdownOpen(false);
      }
      if (convertedToDropdownRef.current && !convertedToDropdownRef.current.contains(event.target as Node)) {
        setIsConvertedToDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const statusOptions: { value: LeadStatus; label: string }[] = [
    { value: "new", label: "New Lead (Unprocessed)" },
    { value: "contacted", label: "Contacted (In Conversation)" },
    { value: "assigned", label: "Assigned (Under Follow-up)" },
    { value: "qualified", label: "Qualified (Interested)" },
    { value: "converted", label: "Converted (Successful)" },
    { value: "lost", label: "Lost (Not Interested)" },
  ];


  const sourceOptions: { value: LeadSource | ""; label: string }[] = [
    { value: "", label: "Select Source" },
    { value: "website", label: "Website" },
    { value: "newsletter", label: "Newsletter" },
    { value: "popup", label: "Popup" },
    { value: "referral", label: "Referral" },
    { value: "manual", label: "Manual" },
    { value: "IVR", label: "IVR" },
    { value: "facebook_lead_ads", label: "Facebook Lead Ads" },
    { value: "other", label: "Other" },
  ];

  // Filter staff based on search term
  const filteredStaff = staff.filter(staffMember =>
    staffMember.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(staffSearchTerm.toLowerCase())
  );

  const filteredConvertedToStaff = staff.filter(staffMember =>
    staffMember.name.toLowerCase().includes(convertedToSearchTerm.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(convertedToSearchTerm.toLowerCase())
  );

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Get selected staff member details
  // First check if we have the staff in the staff list, otherwise check the lead's populated assignedTo
  const currentLead = leads.find(lead => lead._id === id);
  let selectedStaff = staff.find(s => s._id === formData.assignedTo);

  // If not found in staff list but lead has populated assignedTo, use that
  if (!selectedStaff && currentLead?.assignedTo && typeof currentLead.assignedTo === "object") {
    selectedStaff = {
      _id: currentLead.assignedTo._id,
      name: currentLead.assignedTo.name,
      email: currentLead.assignedTo.email,
      isVerified: currentLead.assignedTo.isVerified,
      role: currentLead.assignedTo.role,
      tenant: currentLead.assignedTo.tenant,
      isSuperAdmin: currentLead.assignedTo.isSuperAdmin,
      isActive: currentLead.assignedTo.isActive,
      isDeleted: currentLead.assignedTo.isDeleted,
      createdAt: currentLead.assignedTo.createdAt,
    };
  }

  const selectedConvertedToStaff = staff.find(s => s._id === formData.convertedTo);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleStaffSelect = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: staffId,
    }));
    setIsStaffDropdownOpen(false);
    setStaffSearchTerm("");
  };

  const handleConvertedToSelect = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      convertedTo: staffId,
    }));
    setIsConvertedToDropdownOpen(false);
    setConvertedToSearchTerm("");
  };

  const handleProductSelect = (productName: string) => {
    if (!formData.products.includes(productName)) {
      setFormData((prev) => ({
        ...prev,
        products: [...prev.products, productName],
      }));
    }
    setIsProductDropdownOpen(false);
    setProductSearchTerm("");
  };

  const handleRemoveProduct = (productName: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter(p => p !== productName),
    }));
  };

  const handleStaffSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffSearchTerm(e.target.value);
    setIsStaffDropdownOpen(true);
  };

  const handleConvertedToSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConvertedToSearchTerm(e.target.value);
    setIsConvertedToDropdownOpen(true);
  };

  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductSearchTerm(e.target.value);
    setIsProductDropdownOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      setPopup({
        isVisible: true,
        message: "Lead ID is missing.",
        type: "error",
      });
      return;
    }

    try {
      const leadData = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== ""),
        // products is already an array of strings
        products: formData.products,
        // Ensure fullName is updated if firstName/lastName changed
        fullName: formData.fullName || `${formData.firstName} ${formData.lastName}`.trim(),
      };

      console.log("Update Lead Data:", leadData);

      // Dispatch the updateLead action
      // @ts-ignore - Ignoring type check for now as the slice type might need to propagate
      const result = await dispatch(updateLead({ id, data: leadData }));

      if (updateLead.fulfilled.match(result)) {
        setPopup({
          isVisible: true,
          message: "Lead updated successfully!",
          type: "success",
        });

        // Navigate back to leads list after a short delay to show the popup
        setTimeout(() => {
          navigate("/lead/list");
        }, 2000);
      } else {
        throw new Error(result.payload as string || "Failed to update lead 123");
      }
    } catch (error) {
      setPopup({
        isVisible: true,
        message: error instanceof Error ? error.message : "Failed to update lead. Please try again.",
        type: "error",
      });
    }
  };

  if (loading && !isFormLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading lead data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Edit Lead" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </div>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Lead Details Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Lead Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Category
                    </div>
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g. Hot, Cold, Warm"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Department
                    </div>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g. Sales, Marketing"
                  />
                </div>

                {/* Expected Price */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Expected Price
                    </div>
                  </label>
                  <input
                    type="number"
                    name="expectedPrice"
                    value={formData.expectedPrice}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                {/* Next Follow Up */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Next Follow Up
                    </div>
                  </label>
                  <input
                    type="datetime-local"
                    name="nextFollowUpAt"
                    value={formData.nextFollowUpAt}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assigned To
                    </div>
                  </label>
                  <div className="relative" ref={staffDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedStaff ? `${selectedStaff.name} - ${selectedStaff.email}` : staffSearchTerm}
                        onChange={handleStaffSearchChange}
                        onFocus={() => setIsStaffDropdownOpen(true)}
                        placeholder={staffLoading ? "Loading staff..." : "Search and select staff member"}
                        className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        disabled={staffLoading}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {selectedStaff ? (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, assignedTo: "" }));
                              setStaffSearchTerm("");
                            }}
                            className="pointer-events-auto text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <Search className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isStaffDropdownOpen && !staffLoading && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-60 overflow-y-auto">
                        {filteredStaff.length > 0 ? (
                          <>
                            <div
                              className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => handleStaffSelect("")}
                            >
                              Clear selection
                            </div>
                            {filteredStaff.map((staffMember) => (
                              <div
                                key={staffMember._id}
                                onClick={() => handleStaffSelect(staffMember._id)}
                                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex flex-col"
                              >
                                <span className="font-medium">{staffMember.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{staffMember.email}</span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No staff members found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {staffLoading && (
                    <p className="text-sm text-gray-500 mt-1">Loading staff...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking & Conversion Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Tracking & Conversion
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Last Contacted At */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last Contacted At
                    </div>
                  </label>
                  <input
                    type="datetime-local"
                    name="lastContactedAt"
                    value={formData.lastContactedAt}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Last Call Status */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4" />
                      Last Call Status
                    </div>
                  </label>
                  <select
                    name="lastCallStatus"
                    value={formData.lastCallStatus || ""}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Select Call Status</option>
                    <option value="call_not_answered">📞 Call Not Answered</option>
                    <option value="number_not_reachable">🚫 Number Not Reachable</option>
                    <option value="call_back">🔄 Call Back Requested</option>
                    <option value="interested">✅ Interested</option>
                    <option value="number_not_connected">❌ Number Not Connected</option>
                    <option value="order_enquiry">🛒 Order Enquiry</option>
                    <option value="not_interested">⛔ Not Interested</option>
                    <option value="switch_off">📴 Phone Switched Off</option>
                    <option value="missed_call">📵 Missed Call</option>
                    <option value="busy">📞 Line Busy</option>
                    <option value="no_response">🔇 No Response</option>
                    <option value="other">💬 Other</option>
                  </select>
                </div>

                {/* Follow Up Count */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Follow Up Count
                    </div>
                  </label>
                  <input
                    type="number"
                    name="followUpCount"
                    value={formData.followUpCount}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

                {/* Media */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Media (URL)
                    </div>
                  </label>
                  <input
                    type="text"
                    name="media"
                    value={formData.media}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter media URL"
                  />
                </div>

                {/* Converted To */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Converted To (Staff)
                    </div>
                  </label>
                  <div className="relative" ref={convertedToDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedConvertedToStaff ? `${selectedConvertedToStaff.name} - ${selectedConvertedToStaff.email}` : convertedToSearchTerm}
                        onChange={handleConvertedToSearchChange}
                        onFocus={() => setIsConvertedToDropdownOpen(true)}
                        placeholder={staffLoading ? "Loading staff..." : "Search and select staff member"}
                        className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        disabled={staffLoading}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {selectedConvertedToStaff ? (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, convertedTo: "" }));
                              setConvertedToSearchTerm("");
                            }}
                            className="pointer-events-auto text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <Search className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isConvertedToDropdownOpen && !staffLoading && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-60 overflow-y-auto">
                        {filteredConvertedToStaff.length > 0 ? (
                          <>
                            <div
                              className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => handleConvertedToSelect("")}
                            >
                              Clear selection
                            </div>
                            {filteredConvertedToStaff.map((staffMember) => (
                              <div
                                key={staffMember._id}
                                onClick={() => handleConvertedToSelect(staffMember._id)}
                                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex flex-col"
                              >
                                <span className="font-medium">{staffMember.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{staffMember.email}</span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No staff members found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Converted Checkbox */}
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="converted"
                      checked={formData.converted}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mark as Converted
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Additional Information
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {/* Description */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Description
                    </div>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter lead description..."
                  />
                </div>

                {/* Last Remark */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Remark
                  </label>
                  <textarea
                    name="lastRemark"
                    value={formData.lastRemark}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter last remark..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tags */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags (comma separated)
                      </div>
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="e.g. urgent, follow-up, vip"
                    />
                  </div>

                  {/* Products Multi-Select */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Products
                      </div>
                    </label>
                    <div className="relative" ref={productDropdownRef}>
                      <div className="w-full rounded border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700 p-2 min-h-[42px] flex flex-wrap gap-2">
                        {formData.products.map((product, index) => (
                          <div key={index} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                            <span>{product}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={handleProductSearchChange}
                          onFocus={() => setIsProductDropdownOpen(true)}
                          placeholder={formData.products.length === 0 ? "Select products..." : ""}
                          className="flex-1 bg-transparent outline-none min-w-[120px] text-sm dark:text-white"
                        />
                      </div>

                      {isProductDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-60 overflow-y-auto">
                          {productsLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                              Loading products...
                            </div>
                          ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                              const isSelected = formData.products.includes(product.name);
                              return (
                                <div
                                  key={product._id}
                                  onClick={() => !isSelected && handleProductSelect(product.name)}
                                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${isSelected
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-gray-400 cursor-default"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                >
                                  <span>{product.name}</span>
                                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 flex gap-4">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Updating Lead..." : "Update Lead"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/leads")}
                className="rounded bg-gray-600 px-6 py-3 text-white font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {id && (
        <div className="mt-8">
          <IverLead leadId={id} />
        </div>
      )}

      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
    </div>
  );
};

export default EditLead;

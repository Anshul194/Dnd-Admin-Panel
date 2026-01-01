import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  FileText,
  Users,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { createLead, clearError } from "../../store/slices/lead";
import { fetchStaff } from "../../store/slices/staff";
import { RootState, AppDispatch } from "../../store";

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

interface LeadFormData {
  fullName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  notes: string;
  assignedTo: string;
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
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${type === "success" ? "text-green-600" : "text-red-600"
              }`}
          >
            {type === "success" ? "Success" : "Error"}
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
          <a
            href="#"
            className="text-gray-700 hover:text-blue-600 dark:text-gray-300"
          >
            Home
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-500 dark:text-gray-400">
              {pageTitle}
            </span>
          </div>
        </li>
      </ol>
    </nav>
    <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">
      {pageTitle}
    </h1>
  </div>
);

const AddLead: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.lead);
  const { staff, loading: staffLoading } = useSelector(
    (state: RootState) => state.staff
  );
  const [popup, setPopup] = useState<PopupAlert>({
    isVisible: false,
    message: "",
    type: "",
  });

  const [formData, setFormData] = useState<LeadFormData>({
    fullName: "",
    email: "",
    phone: "",
    status: "new",
    source: "",
    notes: "",
    assignedTo: "",
  });

  // Search functionality for staff dropdown
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearError());
    // Fetch staff data for the dropdown
    dispatch(fetchStaff({}));
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

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsStaffDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const statusOptions: { value: LeadStatus; label: string }[] = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

  const sourceOptions = [
    { value: "", label: "Select Source" },
    { value: "website", label: "Website" },
    { value: "newsletter", label: "Newsletter" },
    { value: "popup", label: "Popup" },
    { value: "referral", label: "Referral" },
    { value: "manual", label: "Manual" },
    { value: "other", label: "Other" },
  ];

  // Filter staff based on search term
  const filteredStaff = staff.filter(
    (staffMember) =>
      staffMember?.name
        ?.toLowerCase()
        ?.includes(staffSearchTerm?.toLowerCase()) ||
      staffMember?.email
        ?.toLowerCase()
        ?.includes(staffSearchTerm?.toLowerCase())
  );

  // Get selected staff member details
  const selectedStaff = staff.find((s) => s._id === formData.assignedTo);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  const handleStaffSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffSearchTerm(e.target.value);
    setIsStaffDropdownOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName) {
      toast.error("Full name is required.");
      return;
    }

    if (!formData.email) {
      toast.error("Email is required.");
      return;
    }

    if (!formData.phone) {
      toast.error("Phone number is required.");
      return;
    }

    try {
      // Format data to match your schema
      const leadData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        source: formData.source as
          | "website"
          | "newsletter"
          | "popup"
          | "referral"
          | "manual"
          | "other",
        status: formData.status,
        notes: formData.notes
          ? [
            {
              note: formData.notes,
              createdAt: new Date().toISOString(),
            },
          ]
          : [],
        assignedTo: formData.assignedTo || undefined,
      };

      console.log("Lead Data:", leadData);

      // Dispatch the createLead action
      const result = await dispatch(createLead(leadData));

      if (createLead.fulfilled.match(result)) {
        toast.success("Lead created successfully!");

        // Reset form
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          status: "new",
          source: "",
          notes: "",
          assignedTo: "",
        });

        // Redirect to Lead List page
        setTimeout(() => {
          navigate("/lead/list");
        }, 1500);
      } else {
        const errorMessage = (result.payload as string) || "Failed to create lead";
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to create lead. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Add Lead" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone<span className="text-red-500">*</span>
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

                {/* Assigned To */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assigned To
                    </div>
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={
                          selectedStaff
                            ? `${selectedStaff.name} - ${selectedStaff.email}`
                            : staffSearchTerm
                        }
                        onChange={handleStaffSearchChange}
                        onFocus={() => setIsStaffDropdownOpen(true)}
                        placeholder={
                          staffLoading
                            ? "Loading staff..."
                            : "Search and select staff member"
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        disabled={staffLoading}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {selectedStaff ? (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                assignedTo: "",
                              }));
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
                                onClick={() =>
                                  handleStaffSelect(staffMember._id)
                                }
                                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex flex-col"
                              >
                                <span className="font-medium">
                                  {staffMember.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {staffMember.email}
                                </span>
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
                    <p className="text-sm text-gray-500 mt-1">
                      Loading staff...
                    </p>
                  )}
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
              </div>

              {/* Notes */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </div>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Adding Lead..." : "Add Lead"}
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

export default AddLead;

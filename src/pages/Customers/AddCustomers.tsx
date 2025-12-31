import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import { createCustomer } from "../../store/slices/customersSlice";
import { fetchRoles } from "../../store/slices/roles";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";

const AddCustomer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.customers.loading);
  const { roles = [], loading: rolesLoading = false } = useSelector((state: RootState) => state.role || {});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    isSuperAdmin: false,
  });

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  // Fetch roles when component mounts
  useEffect(() => {
    dispatch(fetchRoles({}));
  }, [dispatch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const result = await dispatch(createCustomer(formData)).unwrap();
      console.log("✅ Created customer:", result);

      toast.success("Customer created successfully!", {
        duration: 2000,
        position: "top-right",
      });

      // Redirect to customers list page (page 1) after successful creation
      setTimeout(() => {
        navigate("/customers/list?page=1");
      }, 500);
    } catch (err: any) {
      console.error("Error creating customer:", err);
      
      // Extract error message from different possible structures
      let errorMessage = "Failed to create customer.";
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.error) {
        errorMessage = err.error;
      }
      
      // Check for timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('buffering')) {
        errorMessage = "Database connection timeout. Please check your database connection and try again.";
      }
      
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta title="Add Customer" description="Create a new customer account" />

      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <PageBreadcrumb pageTitle="Add Customer" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customer Information
          </h3>

          {/* Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-900 dark:text-white"
              placeholder="Enter name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-900 dark:text-white"
              placeholder="Enter email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-900 dark:text-white"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-600"
              required
            >
              <option value="">Select a role</option>
              {rolesLoading ? (
                <option value="" disabled>Loading roles...</option>
              ) : (
                Array.isArray(roles) && roles.length > 0 ? (
                  roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No roles available</option>
                )
              )}
            </select>
          </div>

          {/* Is Super Admin */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isSuperAdmin"
                checked={formData.isSuperAdmin}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Is Super Admin
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Grant super admin privileges to this customer
            </p>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Customer"}
            </button>
          </div>
        </form>
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

export default AddCustomer;

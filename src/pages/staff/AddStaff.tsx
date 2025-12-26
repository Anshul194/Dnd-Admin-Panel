import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { createStaff } from "../../store/slices/staff"; // You'll need to create this slice
import { fetchRoles } from "../../store/slices/roles";
import { signup } from "../../store/slices/authslice";
import { useNavigate } from "react-router-dom";

// const ROLES = [
//   { value: "admin", label: "Admin" },
//   { value: "editor", label: "Editor" },
//   { value: "author", label: "Author" },
//   { value: "contributor", label: "Contributor" },
//   { value: "viewer", label: "Viewer" },
// ];

export default function AddStaff() {
  const [staff, setStaff] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { roles = [], loading: rolesLoading = false } = useSelector((state: RootState) => state.role || {});
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const loading = useSelector(
    (state: RootState) => state.staff?.loading || false
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setStaff({ ...staff, [name]: value });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, contains uppercase, lowercase, and number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!staff.name.trim()) {
      toast.error("Name is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!staff.email.trim()) {
      toast.error("Email is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!validateEmail(staff.email)) {
      toast.error("Please enter a valid email address.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!staff.password) {
      toast.error("Password is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!validatePassword(staff.password)) {
      toast.error(
        "Password must be at least 8 characters with uppercase, lowercase, and number.",
        {
          duration: 6000,
          position: "top-right",
        }
      );
      return;
    }

    if (staff.password !== staff.confirmPassword) {
      toast.error("Passwords do not match.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!staff.role) {
      toast.error("Role is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    // Ensure role is a valid ID
    if (!staff.role || staff.role.trim() === '') {
      toast.error("Please select a valid role.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    const staffData = {
      name: staff.name.trim(),
      email: staff.email.trim().toLowerCase(),
      password: staff.password,
      role: staff.role.trim(), // Ensure it's trimmed
      roleId: staff.role.trim(), // Also send as roleId in case backend expects it
      isActive: true,
    };

    try {
      const createdStaff = await dispatch(createStaff(staffData)).unwrap();

      console.log("Created Staff:", createdStaff);

      setPopup({
        isVisible: true,
        message: "Staff member created successfully!",
        type: "success",
      });

      // Reset form
      setStaff({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
      // Redirect to list page after successful creation
      setTimeout(() => {
        navigate("/staff/list");
      }, 1000);
    } catch (err: any) {
      console.error("Error creating staff:", err);
      const errorMessage = 
        err?.response?.data?.body?.message ||
        err?.response?.data?.message || 
        err?.message || 
        "Failed to create staff member. Please try again.";
      
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
      
      // Also show toast notification as backup
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Add Staff | TailAdmin"
        description="Add a new staff member page for TailAdmin"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full ">
          <PageBreadcrumb pageTitle="Add Staff" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Personal Information
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={staff.name}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={staff.email}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Security
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={staff.password}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 8 characters with uppercase,
                  lowercase, and number.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={staff.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
            </div>

            {/* Role Section */}
            <div className="space-y-6 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Role & Permissions
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={staff.role}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select a role</option>
                  {rolesLoading ? (
                    <option value="" disabled>Loading roles...</option>
                  ) : (
                    Array.isArray(roles) && roles.length > 0 ? (
                      roles.map((role) => (
                        <option key={role._id || role.value} value={role._id}>
                          {role.name} {role.scope ? `- ${role.scope}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No roles available</option>
                    )
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select the appropriate role based on the staff member's
                  responsibilities.
                </p>
              </div>

              {/* Role Descriptions */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Descriptions:
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>
                    <strong>Admin:</strong> Full system access and user
                    management
                  </li>
                  <li>
                    <strong>Editor:</strong> Can create, edit, and publish
                    content
                  </li>
                  <li>
                    <strong>Author:</strong> Can create and edit their own
                    content
                  </li>
                  <li>
                    <strong>Contributor:</strong> Can create content but cannot
                    publish
                  </li>
                  <li>
                    <strong>Viewer:</strong> Read-only access to content
                  </li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full sm:w-auto rounded bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Adding Staff..." : "Add Staff Member"}
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

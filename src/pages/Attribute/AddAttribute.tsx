import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { createAttribute } from "../../store/slices/attribute";
import toast, { Toaster } from "react-hot-toast";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

const AddAttribute = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.attributes);

  const [form, setForm] = useState({
    name: "",
    description: "",
    values: [""],
    status: "active",
  });
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else if (type === "number") {
      setForm({ ...form, [name]: parseInt(value) || 0 });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleValueChange = (idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      values: prev.values.map((v, i) => (i === idx ? value : v)),
    }));
  };

  const addValueField = () => {
    setForm((prev) => ({ ...prev, values: [...prev.values, ""] }));
  };

  const removeValueField = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      toast.error("Attribute name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    try {
      await dispatch(
        createAttribute({
          name: form.name,
          description: form.description,
          values: form.values.filter((v) => v.trim()),
          status: form.status,
        })
      ).unwrap();

      setPopup({
        isVisible: true,
        message: "Attribute created successfully!",
        type: "success",
      });

      setForm({
        name: "",
        description: "",
        values: [""],
        status: "active",
      });

      // Redirect to attribute list page after successful creation
      setTimeout(() => {
        navigate("/attribute/list");
      }, 1000);
    } catch (err: any) {
      // Show API error message if available
      const errorMsg = typeof err === 'string' 
        ? err 
        : err?.message || 
          err?.response?.data?.message || 
          "Failed to create attribute. Please try again.";
      
      console.error("Attribute creation error:", err);
      
      setPopup({
        isVisible: true,
        message: errorMsg,
        type: "error",
      });
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Add Attribute | TailAdmin"
        description="Create a new attribute page for TailAdmin"
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 px-5 py-7 xl:px-10 xl:py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Add Attribute
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create a new attribute with values
            </p>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full">
            <PageBreadcrumb pageTitle="Add Attribute" />
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Attribute Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      placeholder="Enter attribute name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white resize-none"
                    placeholder="Enter attribute description"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <svg
                    className="w-5 h-5 relative z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="relative z-10">
                    {loading ? "Creating Attribute..." : "Create Attribute"}
                  </span>
                </button>
              </div>
            </form>
          </div>
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

export default AddAttribute;

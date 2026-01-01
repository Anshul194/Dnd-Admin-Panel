import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createFaq, clearError } from "../../store/slices/faq";
import { fetchProducts } from "../../store/slices/product";
import { RootState, AppDispatch } from "../../store";

// PopupAlert component (copied from AddLead for consistent UI)
interface PopupAlertProps {
  isVisible: boolean;
  message: string;
  type: string;
  onClose: () => void;
}

const PopupAlert: React.FC<PopupAlertProps> = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
        <button onClick={onClose} className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
          Close
        </button>
      </div>
    </div>
  );
};

// Breadcrumb component for page title
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

const AddFaq: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.faq);
  const { products, loading: productsLoading } = useSelector((state: RootState) => state.product);
  const [popup, setPopup] = useState<PopupAlertProps>({
    isVisible: false,
    message: "",
    type: "",
    onClose: () => { },
  });

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    type: "website",
    status: "active" as "active" | "inactive",
    product: ""
  });

  useEffect(() => {
    if (formData.type === "product") {
      dispatch(fetchProducts({ page: 1, limit: 50 }));
    }
  }, [dispatch, formData.type]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setPopup((prev) => ({ ...prev, isVisible: true, message: error, type: "error" }));
    }
  }, [error]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Reset product if type changes to website/app
    if (name === "type" && value !== "product") {
      setFormData((prev) => ({ ...prev, type: value, product: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      setPopup((prev) => ({ ...prev, isVisible: true, message: "Question and answer are required.", type: "error" }));
      return;
    }
    if (formData.type === "product" && !formData.product) {
      setPopup((prev) => ({ ...prev, isVisible: true, message: "Please select a product.", type: "error" }));
      return;
    }
    // Prepare payload
    const payload: any = {
      question: formData.question,
      answer: formData.answer,
      type: formData.type,
      status: formData.status,
    };
    if (formData.type === "product") {
      payload.product = formData.product;
    }
    try {
      const result = await dispatch(createFaq(payload));
      if (createFaq.fulfilled.match(result)) {
        setPopup((prev) => ({ ...prev, isVisible: true, message: "FAQ added successfully!", type: "success" }));
        setFormData({ question: "", answer: "", type: "website", status: "active", product: "" });

        // Redirect to FAQ List page
        setTimeout(() => {
          navigate("/faq/list");
        }, 1500);
      } else {
        throw new Error(result.payload || "Failed to add FAQ");
      }
    } catch (err: any) {
      setPopup((prev) => ({ ...prev, isVisible: true, message: err.message || "Failed to add FAQ.", type: "error" }));
    }
  };

  return (
    <div>
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Add FAQ" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FAQ Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                FAQ Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Question */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter FAQ question"
                    required
                  />
                </div>
                {/* Type */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="website">Website</option>
                    <option value="product">Product</option>
                  </select>
                </div>
                {/* Product dropdown (only for product type) */}
                {formData.type === "product" && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="product"
                      value={formData.product}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      disabled={productsLoading}
                    >
                      <option value="">Select Product</option>
                      {(products || []).map((product) => (
                        <option key={product._id} value={product._id}>{product.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {/* Answer */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter FAQ answer"
                  required
                />
              </div>
            </div>
            {/* Status Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Adding FAQ..." : "Add FAQ"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default AddFaq;
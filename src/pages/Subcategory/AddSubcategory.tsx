import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import { createSubcategory } from "../../store/slices/subCategory";
import { fetchCategories } from "../../store/slices/categorySlice";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { Sparkles } from "lucide-react";
import axiosInstance from "../../services/axiosConfig";
import { useNavigate } from "react-router";

interface SubCategoryInput {
  name: string;
}

export default function AddSubcategory() {
  const navigate = useNavigate();
  const [category, setCategory] = useState({
    name: "",
    slug: "",
    description: "",
    status: "Active",
    parentCategory: null as string | null,
    image: null as File | null,
    thumbnail: null as File | null,
    seoTitle: "",
    seoDescription: "",
    sortOrder: 0,
    isFeatured: false,
  });

  const [allCategories, setAllCategories] = useState([]);

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.subcategory.loading);

  const fetchCategories = async () => {
    const queryParams = new URLSearchParams();
    queryParams.append("page", "1");
    queryParams.append("limit", "100");

    queryParams.append(
      "filters",
      JSON.stringify({
        status: "Active",
        deletedAt: null,
      })
    );

    const response = await axiosInstance.get(
      `/category?${queryParams.toString()}`
    );
    console.log("Response from fetchCategories:", response.data);
    const data = response.data?.data?.body?.data;

    setAllCategories(data?.result || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setCategory({ ...category, [name]: checked });
    } else if (type === "number") {
      setCategory({ ...category, [name]: parseInt(value) || 0 });
    } else {
      setCategory({ ...category, [name]: value });

      // Auto-generate slug when name changes
      if (name === "name" && value && !category.slug) {
        setCategory((prev) => ({
          ...prev,
          name: value,
          slug: generateSlug(value),
        }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (e.target.files && e.target.files[0]) {
      setCategory({ ...category, [name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.name) {
      toast.error("Category name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!category.slug) {
      toast.error("Category slug is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", category.name);
    formData.append("slug", category.slug);
    formData.append("description", category.description);
    formData.append("status", category.status);
    formData.append("seoTitle", category.seoTitle);
    formData.append("seoDescription", category.seoDescription);
    formData.append("sortOrder", category.sortOrder.toString());
    formData.append("isFeatured", category.isFeatured.toString());
    if (category.parentCategory) {
      formData.append("parentCategory", category.parentCategory);
    }

    if (category.image) {
      formData.append("image", category.image);
    }
    if (category.thumbnail) {
      formData.append("thumbnail", category.thumbnail);
    }

    try {
      // Create the subcategory and get the result
      // @ts-expect-error: FormData is accepted by the thunk for file upload
      const createdSubcategory = await dispatch(
        createSubcategory(formData)
      ).unwrap();

      console.log("Created Subcategory:", createdSubcategory);

      setPopup({
        isVisible: true,
        message: "Subcategory created successfully!",
        type: "success",
      });
      setCategory({
        name: "",
        slug: "",
        description: "",
        status: "Active",
        image: null,
        parentCategory: null,
        thumbnail: null,
        seoTitle: "",
        seoDescription: "",
        sortOrder: 0,
        isFeatured: false,
      });

      // Redirect to subcategory list page after successful creation
      setTimeout(() => {
        navigate("/subcategory/list");
      }, 1000);
    } catch (err: any) {
      const errorMessage =
        typeof err === 'string' 
          ? err 
          : err?.response?.data?.body?.message || err?.response?.data?.message || err?.message || "Failed to create Subcategory. Please try again.";
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
      <PageMeta
        title="Add Subcategory | TailAdmin"
        description="Add a new subcategory page for TailAdmin"
      />

      {/* Outer gradient container like EditSubcategory */}
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 px-5 py-7 xl:px-10 xl:py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Add Subcategory
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create a new subcategory with images and SEO settings
            </p>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full ">
            <PageBreadcrumb pageTitle="Add Subcategory" />
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section (styled like EditSubcategory) */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Parent Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="parentCategory"
                      value={category.parentCategory ?? ""}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Parent Category</option>
                      {/* Map through categories to create options */}
                      {allCategories?.map((cat: any, index: number) => {
                      if (cat.status === "Inactive" || cat.deletedAt !== null) {
                        return null;
                      }
                      return (
                          <option key={cat?._id} value={cat?._id}>
                            {cat?.name}
                          </option>
                        );
                    })}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Sub-Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={category.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      placeholder="Enter category name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={category.slug}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      placeholder="category-slug"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      URL-friendly version of the name. Auto-generated from name if left empty.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={category.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white resize-none"
                    placeholder="Enter category description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Status
                    </label>
                    <select
                      name="status"
                      value={category.status}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={category.sortOrder}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      placeholder="0"
                      min="0"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Lower numbers appear first
                    </p>
                  </div>

                  <div className="flex items-start pt-8">
                    <div className="flex items-center h-11">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        name="isFeatured"
                        checked={category.isFeatured}
                        onChange={handleChange}
                        className="w-5 h-5 text-indigo-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 cursor-pointer transition-all"
                      />
                      <label
                        htmlFor="isFeatured"
                        className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-200 cursor-pointer select-none"
                      >
                        Featured SubCategory
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Images
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Subcategory Image
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition-all duration-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-600 dark:bg-gray-800/30 dark:text-gray-400 dark:file:bg-indigo-500 dark:hover:file:bg-indigo-600"
                      />
                    </div>
                    {category.image && (
                      <div className="mt-4 relative group">
                        <div className="overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                          <img
                            src={URL.createObjectURL(category.image)}
                            alt="Category Preview"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg">
                          Preview
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Thumbnail Image
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="thumbnail"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition-all duration-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-600 dark:bg-gray-800/30 dark:text-gray-400 dark:file:bg-indigo-500 dark:hover:file:bg-indigo-600"
                      />
                    </div>
                    {category.thumbnail && (
                      <div className="mt-4 relative group">
                        <div className="overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                          <img
                            src={URL.createObjectURL(category.thumbnail)}
                            alt="Thumbnail Preview"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg">
                          Preview
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  SEO Settings
                </h3>

                <div>
                  <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    name="seoTitle"
                    value={category.seoTitle}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    placeholder="SEO optimized title"
                    maxLength={60}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 50-60 characters
                    </p>
                    <span className={`text-xs font-semibold ${
                      category.seoTitle.length > 60 ? 'text-red-600' : 
                      category.seoTitle.length >= 50 ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {category.seoTitle.length}/60
                    </span>
                  </div>
                  {category.seoTitle.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          category.seoTitle.length > 60 ? 'bg-red-500' : 
                          category.seoTitle.length >= 50 ? 'bg-green-500' : 
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min((category.seoTitle.length / 60) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    SEO Description
                  </label>
                  <textarea
                    name="seoDescription"
                    value={category.seoDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white resize-none"
                    placeholder="SEO optimized description"
                    maxLength={160}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 150-160 characters
                    </p>
                    <span className={`text-xs font-semibold ${
                      category.seoDescription.length > 160 ? 'text-red-600' : 
                      category.seoDescription.length >= 150 ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {category.seoDescription.length}/160
                    </span>
                  </div>
                  {category.seoDescription.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          category.seoDescription.length > 160 ? 'bg-red-500' : 
                          category.seoDescription.length >= 150 ? 'bg-green-500' : 
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min((category.seoDescription.length / 160) * 100, 100)}%` }}
                      />
                    </div>
                  )}
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
                  <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="relative z-10">
                    {loading ? "Adding Subcategory..." : "Add Subcategory"}
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
}

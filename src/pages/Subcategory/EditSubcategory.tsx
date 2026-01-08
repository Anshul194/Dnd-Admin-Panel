/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import { Sparkles } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import {
  fetchSubcategoryById,
  updateSubcategory,
} from "../../store/slices/subCategory";
import { useParams, useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils/imageHelper";
import axiosInstance from "../../services/axiosConfig";

export default function EditSubcategory() {
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

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const params = useParams();
  const subcategoryId = params.id || "";
  const navigate = useNavigate();

  const [allCategories, setAllCategories] = useState([]);

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.category.loading);

  const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || "";

  const fetchCategories = async () => {
    try {
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
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      // Silently handle error for categories dropdown - don't show popup
    }
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

      // Auto-generate slug when name changes, but ONLY if not manually edited
      if (name === "name" && value && !isSlugManuallyEdited) {
        setCategory((prev) => ({
          ...prev,
          name: value,
          slug: generateSlug(value),
        }));
      }

      // If user manually edits slug, stop auto-generation
      if (name === "slug") {
        setIsSlugManuallyEdited(true);
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
    if (!subcategoryId) {
      toast.error("Subcategory ID is missing.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }
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
      // Create the main category and get the result (should include the new category's ID)
      const createdCategory = await dispatch(
        updateSubcategory({ id: subcategoryId, data: formData as any })
      ).unwrap();

      console.log(
        "Updated Subcategory:",

        createdCategory
      );

      setPopup({
        isVisible: true,
        message: "Subcategory updated successfully!",
        type: "success",
      });
      setTimeout(() => {
        navigate("/subcategory/list");
      }, 1000);

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
    } catch (err: any) {
      // When using unwrap(), if rejectWithValue was used, err is the rejected value (the message string)
      // Otherwise, it's the error object
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.response?.data?.body?.message || err?.response?.data?.message || err?.message || "Failed to update Subcategory. Please try again.";
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
    }
  };

  const getData = async () => {
    if (!subcategoryId) {
      setPopup({
        isVisible: true,
        message: "Subcategory ID is missing",
        type: "error",
      });
      return;
    }
    try {
      const data = await dispatch(fetchSubcategoryById(subcategoryId)).unwrap();
      console.log("Fetched subcategory data:", data);
      setCategory({
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        status: data.status || "Active",
        parentCategory: typeof data.parentCategory === 'object' && data.parentCategory?._id
          ? data.parentCategory._id
          : (typeof data.parentCategory === 'string' ? data.parentCategory : null),
        image: typeof data.image === 'string' ? null : (data.image instanceof File ? data.image : null), // Convert string URLs to null, keep File objects
        thumbnail: typeof data.thumbnail === 'string' ? null : (data.thumbnail instanceof File ? data.thumbnail : null), // Convert string URLs to null, keep File objects
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        sortOrder: data.sortOrder || 0,
        isFeatured: data.isFeatured || false,
      });

      // Since we are loading existing data, we consider it "manually edited" 
      // if the user starts changing the name later, but actually for Edit 
      // we usually want it to stay as is unless they change the name.
      // However, if they change the name, we should auto-generate UNLESS 
      // they manually change the slug.
      // So we keep isSlugManuallyEdited false initially.
    } catch (error: any) {
      console.error("Failed to fetch subcategory:", error);
      // When using unwrap(), if rejectWithValue was used, error is the rejected value (the message string)
      // Otherwise, it's the error object
      const errorMessage =
        typeof error === 'string'
          ? error
          : error?.response?.data?.body?.message || error?.response?.data?.message || error?.message || "Failed to fetch subcategory. Please try again.";
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
    }
  };

  useEffect(() => {
    // Fetch the subcategory data when the component mounts
    getData();
  }, []);

  // getImageUrl is now imported from utils

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Edit Subcategory | TailAdmin"
        description="Edit an existing subcategory page for TailAdmin"
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
              Edit Subcategory
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update subcategory details and SEO settings
            </p>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full ">
            <PageBreadcrumb pageTitle="Edit Subcategory" />
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Parent Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="parentCategory"
                      value={category.parentCategory || ""}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={category.name}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                      URL-friendly version of the name. Auto-generated from name if
                      left empty.
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

                  {/* <div>
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
                  </div> */}
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Category Name <span className="text-red-500">*</span>
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
                        Featured Category
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Images
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Category Image
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
                            src={getImageUrl(category.image)}
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
                            src={getImageUrl(category.thumbnail)}
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
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
                    <span
                      className={`text-xs font-semibold ${category.seoTitle.length > 60
                        ? "text-red-600"
                        : category.seoTitle.length >= 50
                          ? "text-green-600"
                          : "text-gray-500"
                        }`}
                    >
                      {category.seoTitle.length}/60
                    </span>
                  </div>
                  {category.seoTitle.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div
                        className={`h-full transition-all duration-300 ${category.seoTitle.length > 60
                          ? "bg-red-500"
                          : category.seoTitle.length >= 50
                            ? "bg-green-500"
                            : "bg-indigo-500"
                          }`}
                        style={{
                          width: `${Math.min(
                            (category.seoTitle.length / 60) * 100,
                            100
                          )}%`,
                        }}
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
                    <span
                      className={`text-xs font-semibold ${category.seoDescription.length > 160
                        ? "text-red-600"
                        : category.seoDescription.length >= 150
                          ? "text-green-600"
                          : "text-gray-500"
                        }`}
                    >
                      {category.seoDescription.length}/160
                    </span>
                  </div>
                  {category.seoDescription.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div
                        className={`h-full transition-all duration-300 ${category.seoDescription.length > 160
                          ? "bg-red-500"
                          : category.seoDescription.length >= 150
                            ? "bg-green-500"
                            : "bg-indigo-500"
                          }`}
                        style={{
                          width: `${Math.min(
                            (category.seoDescription.length / 160) * 100,
                            100
                          )}%`,
                        }}
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
                    {loading ? "Updating Subcategory..." : "Update Subcategory"}
                  </span>
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
    </div>
  );
}

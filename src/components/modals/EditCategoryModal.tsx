import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchCourseCategoryById,
  updateCourseCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../../store/slices/categorySlice";
import {
  X,
  Save,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import PopupAlert from "../popUpAlert";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  status: "active" | "inactive";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  subCategoryCount: number;
  subCategories?: SubCategory[];
  subcategories?: SubCategory[]; // Add this to handle the API response
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  __v?: number;
}

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | null;
  onSuccess?: () => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  useAppSelector((state) => state.courseCategory);

  // Category state
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    status: "active" as "active" | "inactive",
  });
  const [isCategorySlugManuallyEdited, setIsCategorySlugManuallyEdited] =
    useState(false);

  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<
    string | null
  >(null);

  // Subcategory state
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState({
    name: "",
    slug: "",
    status: "active" as "active" | "inactive",
  });
  const [isNewSubCategorySlugManuallyEdited, setIsNewSubCategorySlugManuallyEdited] =
    useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(
    null
  );
  const [editSubCategoryForm, setEditSubCategoryForm] = useState({
    name: "",
    slug: "",
    status: "active" as "active" | "inactive",
  });
  const [isEditSubCategorySlugManuallyEdited, setIsEditSubCategorySlugManuallyEdited] =
    useState(false);

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    subCategoryId: string | null;
    subCategoryName: string;
  }>({
    isOpen: false,
    subCategoryId: null,
    subCategoryName: "",
  });

  // Loading states
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const [isUpdatingSubCategory, setIsUpdatingSubCategory] = useState(false);
  const [isDeletingSubCategory, setIsDeletingSubCategory] = useState(false);
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Load category data when modal opens
  useEffect(() => {
    if (isOpen && categoryId) {
      loadCategoryData();
    }
  }, [isOpen, categoryId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCategoryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setCategoryImage(file);
    setCategoryImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const loadCategoryData = async () => {
    if (!categoryId) return;

    setIsLoadingCategory(true);
    try {
      const result = await dispatch(
        fetchCourseCategoryById(categoryId)
      ).unwrap();

      // Handle the API response structure
      const categoryData = result.category || result;

      setCategoryData({
        ...categoryData,
        status: categoryData.status === "active" ? "active" : "inactive",
      });
      setCategoryImagePreview(
        categoryData.image
          ? `${import.meta.env.VITE_IMAGE_URL}/${categoryData.image}`
          : null
      );

      setCategoryForm({
        name: categoryData.name,
        slug: categoryData.slug,
        status:
          categoryData.status === "active" || categoryData.status === "inactive"
            ? categoryData.status
            : "active",
      });

      // Load subcategories - check both possible keys
      const subcategories =
        categoryData.subcategories || categoryData.subCategories || [];
      setSubCategories(subcategories);

      console.log("Loaded subcategories:", subcategories); // Debug log
    } catch (error) {
      console.error("Failed to load category:", error);
      toast.error("Failed to load category data");
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const resetForm = () => {
    setCategoryData(null);
    setCategoryForm({ name: "", slug: "", status: "active" });
    setIsCategorySlugManuallyEdited(false);
    setCategoryImage(null);
    setCategoryImagePreview(null);
    setSubCategories([]);
    setShowAddSubCategory(false);
    setNewSubCategory({ name: "", slug: "", status: "active" });
    setIsNewSubCategorySlugManuallyEdited(false);
    setEditingSubCategory(null);
    setEditSubCategoryForm({ name: "", slug: "", status: "active" });
    setIsEditSubCategorySlugManuallyEdited(false);
    setDeleteConfirmation({
      isOpen: false,
      subCategoryId: null,
      subCategoryName: "",
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleCategoryInputChange = (field: string, value: string) => {
    setCategoryForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" &&
        !isCategorySlugManuallyEdited && { slug: generateSlug(value) }),
    }));

    if (field === "slug") {
      setIsCategorySlugManuallyEdited(true);
    }
  };

  const handleSubCategoryInputChange = (field: string, value: string) => {
    setNewSubCategory((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" &&
        !isNewSubCategorySlugManuallyEdited && { slug: generateSlug(value) }),
    }));

    if (field === "slug") {
      setIsNewSubCategorySlugManuallyEdited(true);
    }
  };

  const handleEditSubCategoryInputChange = (field: string, value: string) => {
    setEditSubCategoryForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" &&
        !isEditSubCategorySlugManuallyEdited && { slug: generateSlug(value) }),
    }));

    if (field === "slug") {
      setIsEditSubCategorySlugManuallyEdited(true);
    }
  };

  const handleUpdateCategory = async () => {
    if (!categoryData || !categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSavingCategory(true);
    try {
      const formData = new FormData();
      formData.append("name", categoryForm.name.trim());
      formData.append("slug", categoryForm.slug.trim());
      formData.append("status", categoryForm.status);
      if (categoryImage) {
        formData.append("image", categoryImage);
      }

      await dispatch(
        updateCourseCategory({
          categoryId: categoryData._id,
          formData,
        })
      ).unwrap();

      // toast.success("Category updated successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update category:", error);
      // toast.error("Failed to update category");
      setPopup({
        message: "Failed to update category",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleAddSubCategory = async () => {
    if (!categoryData || !newSubCategory.name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    setIsAddingSubCategory(true);
    try {
      const subCategoryData = {
        name: newSubCategory.name.trim(),
        slug: newSubCategory.slug.trim(),
        categoryId: categoryData._id,
        status: newSubCategory.status,
      };

      const result = await dispatch(
        createSubCategory(subCategoryData)
      ).unwrap();

      // Add the new subcategory to the local state
      setSubCategories((prev) => [
        ...prev,
        {
          ...result,
          status: result.status === "active" ? "active" : "inactive",
        },
      ]);

      // Reset the form
      setNewSubCategory({ name: "", slug: "", status: "active" });
      setShowAddSubCategory(false);

      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Failed to add subcategory:", error);
      toast.error("Failed to add subcategory");
    } finally {
      setIsAddingSubCategory(false);
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategory || !editSubCategoryForm.name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    setIsUpdatingSubCategory(true);
    try {
      const updateData = {
        name: editSubCategoryForm.name.trim(),
        slug: editSubCategoryForm.slug.trim(),
        status: editSubCategoryForm.status,
      };

      const result = await dispatch(
        updateSubCategory({
          subCategoryId: editingSubCategory,
          data: updateData,
        })
      ).unwrap();

      // Update the subcategory in local state
      setSubCategories((prev) =>
        prev.map((sub) =>
          sub._id === editingSubCategory
            ? {
              ...result,
              status: result.status === "active" ? "active" : "inactive",
            }
            : sub
        )
      );

      setEditingSubCategory(null);
      setEditSubCategoryForm({ name: "", slug: "", status: "active" });

      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error("Failed to update subcategory:", error);
      toast.error("Failed to update subcategory");
    } finally {
      setIsUpdatingSubCategory(false);
    }
  };

  const startEditingSubCategory = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory._id);
    setEditSubCategoryForm({
      name: subCategory.name,
      slug: subCategory.slug,
      status: subCategory.status,
    });
    setIsEditSubCategorySlugManuallyEdited(false);
  };

  const cancelEditingSubCategory = () => {
    setEditingSubCategory(null);
    setEditSubCategoryForm({ name: "", slug: "", status: "active" });
    setIsEditSubCategorySlugManuallyEdited(false);
  };

  const openDeleteConfirmation = (subCategory: SubCategory) => {
    setDeleteConfirmation({
      isOpen: true,
      subCategoryId: subCategory._id,
      subCategoryName: subCategory.name,
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      subCategoryId: null,
      subCategoryName: "",
    });
  };

  const handleDeleteSubCategory = async () => {
    if (!deleteConfirmation.subCategoryId || !categoryData) {
      return;
    }

    setIsDeletingSubCategory(true);
    try {
      await dispatch(
        deleteSubCategory({
          subCategoryId: deleteConfirmation.subCategoryId,
          categoryId: categoryData._id,
        })
      ).unwrap();

      // Remove the subcategory from local state
      setSubCategories((prev) =>
        prev.filter((sub) => sub._id !== deleteConfirmation.subCategoryId)
      );

      toast.success("Subcategory deleted successfully");
      closeDeleteConfirmation();
    } catch (error) {
      console.error("Failed to delete subcategory:", error);
      toast.error("Failed to delete subcategory");
    } finally {
      setIsDeletingSubCategory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
      <div className="fixed inset-0 z-[1000000] overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-transparent backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Category
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoadingCategory ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Category Form */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Category Information
                    </h4>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) =>
                            handleCategoryInputChange("name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter category name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Image
                        </label>
                        {categoryImagePreview && (
                          <img
                            src={categoryImagePreview}
                            alt="Category Preview"
                            className="mb-2 h-20 w-20 object-cover rounded"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status *
                        </label>
                        <select
                          value={categoryForm.status}
                          onChange={(e) =>
                            handleCategoryInputChange("status", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={handleUpdateCategory}
                        disabled={isSavingCategory}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSavingCategory ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Category
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Section */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Subcategories ({subCategories.length})
                      </h4>
                      <button
                        onClick={() =>
                          setShowAddSubCategory(!showAddSubCategory)
                        }
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Subcategory
                      </button>
                    </div>

                    {/* Add Subcategory Form */}
                    {showAddSubCategory && (
                      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                          Add New Subcategory
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={newSubCategory.name}
                              onChange={(e) =>
                                handleSubCategoryInputChange(
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter subcategory name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Slug *
                            </label>
                            <input
                              type="text"
                              value={newSubCategory.slug}
                              onChange={(e) =>
                                handleSubCategoryInputChange(
                                  "slug",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter subcategory slug"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Status *
                            </label>
                            <select
                              value={newSubCategory.status}
                              onChange={(e) =>
                                handleSubCategoryInputChange(
                                  "status",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={handleAddSubCategory}
                            disabled={isAddingSubCategory}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isAddingSubCategory ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Add Subcategory
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowAddSubCategory(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subcategories List */}
                    <div className="space-y-3">
                      {subCategories.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No subcategories found. Add one to get started.
                        </p>
                      ) : (
                        subCategories.map((subCategory) => (
                          <div
                            key={subCategory._id}
                            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            {editingSubCategory === subCategory._id ? (
                              // Edit Form
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={editSubCategoryForm.name}
                                      onChange={(e) =>
                                        handleEditSubCategoryInputChange(
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Slug *
                                    </label>
                                    <input
                                      type="text"
                                      value={editSubCategoryForm.slug}
                                      onChange={(e) =>
                                        handleEditSubCategoryInputChange(
                                          "slug",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Status *
                                    </label>
                                    <select
                                      value={editSubCategoryForm.status}
                                      onChange={(e) =>
                                        handleEditSubCategoryInputChange(
                                          "status",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateSubCategory}
                                    disabled={isUpdatingSubCategory}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                  >
                                    {isUpdatingSubCategory ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-3 h-3" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={cancelEditingSubCategory}
                                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display Mode
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <h6 className="font-medium text-gray-900 dark:text-white">
                                      {subCategory.name}
                                    </h6>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Slug: {subCategory.slug}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subCategory.status === "active" ? (
                                      <CheckCircle className="text-green-500 h-4 w-4" />
                                    ) : (
                                      <XCircle className="text-red-500 h-4 w-4" />
                                    )}
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {subCategory.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      startEditingSubCategory(subCategory)
                                    }
                                    className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                                    title="Edit subcategory"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      openDeleteConfirmation(subCategory)
                                    }
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    title="Delete subcategory"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeDeleteConfirmation}
            ></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Subcategory
                    </h3>
                  </div>
                  <button
                    onClick={closeDeleteConfirmation}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to delete the subcategory{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      "{deleteConfirmation.subCategoryName}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeDeleteConfirmation}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSubCategory}
                      disabled={isDeletingSubCategory}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeletingSubCategory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default EditCategoryModal;

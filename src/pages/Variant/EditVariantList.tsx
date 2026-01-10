import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { AppDispatch, RootState } from "../../store";
import {
  fetchProducts,
  updateVariant,
  fetchAttributes,
  fetchVariants,
} from "../../store/slices/variant";
import toast, { Toaster } from "react-hot-toast";
import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";
import { ArrowLeft, Plus, X, Upload, Trash2, Sparkles } from "lucide-react";
import axiosInstance from "../../services/axiosConfig";

import { getImageUrl } from "../../utils/imageHelper";

interface Variant {
  _id: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  offerTag?: string;
  images: string[];
  attributes: Array<{
    attributeId: string;
    value: string;
    _id: string;
  }>;
  isDefault?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const EditVariantList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const {
    products = [],
    attributes = [],
    variants = [],
    loading,
  } = useSelector((state: RootState) => state.variant);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const [currentVariant, setCurrentVariant] = useState<Variant | null>(null);
  const [variant, setVariant] = useState({
    productId: "",
    title: "",
    sku: "",
    price: 0,
    salePrice: 0,
    stock: 0,
    offerTag: "",
    images: [] as File[],
    existingImages: [] as string[],
    attributes: [{ attributeId: "", value: "" }],
  });
  const [tenant] = useState("tenant1"); // Replace with actual tenant logic
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchProducts({ tenant })),
          dispatch(fetchAttributes({ page: 1, limit: 50 })),
          dispatch(fetchVariants({ tenant })),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [dispatch, tenant]);

  useEffect(() => {
    if (id && variants.length > 0) {
      const foundVariant = variants.find((v: Variant) => v._id === id);
      if (foundVariant) {
        setCurrentVariant(foundVariant);
        setVariant({
          productId: foundVariant.productId,
          title: foundVariant.title,
          sku: foundVariant.sku,
          price: foundVariant.price,
          salePrice: foundVariant.salePrice || 0,
          stock: foundVariant.stock,
          offerTag: foundVariant.offerTag || "",
          images: [],
          existingImages: foundVariant.images || [],
          attributes:
            foundVariant.attributes.length > 0
              ? foundVariant.attributes.map((attr) => ({
                attributeId: attr.attributeId,
                value: attr.value,
              }))
              : [{ attributeId: "", value: "" }],
        });
      } else {
        toast.error("Variant not found", {
          duration: 8000,
          position: "top-right",
        });
        navigate("/variants");
      }
    }
  }, [id, variants, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setVariant({ ...variant, [name]: parseFloat(value) || 0 });
    } else {
      setVariant({ ...variant, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setVariant({ ...variant, images: [...variant.images, ...newImages] });
    }
  };

  const removeNewImage = (index: number) => {
    const updatedImages = variant.images.filter((_, i) => i !== index);
    setVariant({ ...variant, images: updatedImages });
  };

  const removeExistingImage = (index: number) => {
    const updatedExistingImages = variant.existingImages.filter(
      (_, i) => i !== index
    );
    setVariant({ ...variant, existingImages: updatedExistingImages });
  };


  const handleRemoveImage = async (image, index) => {
    try {
      console.log("Removing image:", image);
      const response = await axiosInstance.delete(
        `/variant/image/${index}?index=${index}&type=images&variantId=${id}`
      );
      console.log("Image removed successfully:", response);

      removeExistingImage(index);
    } catch (error) {
      console.error("Error removing image:", error);
      setPopup({
        isVisible: true,
        message: "Failed to remove image.",
        type: "error",
      });
    }
  };

  const handleAttributeChange = (idx: number, field: string, value: string) => {
    const updated = [...variant.attributes];
    updated[idx][field] = value;
    setVariant({ ...variant, attributes: updated });
  };

  const addAttribute = () => {
    setVariant({
      ...variant,
      attributes: [...variant.attributes, { attributeId: "", value: "" }],
    });
  };

  const removeAttribute = (idx: number) => {
    if (variant.attributes.length > 1) {
      setVariant({
        ...variant,
        attributes: variant.attributes.filter((_, i) => i !== idx),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting variant:", variant);

    if (
      !variant.productId ||
      !variant.title ||
      !variant.sku ||
      !variant.price ||
      !variant.stock
    ) {
      toast.error("Please fill all required fields.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!id) {
      toast.error("Variant ID is missing.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    try {
      await dispatch(
        updateVariant({
          tenant,
          variantId: id,
          productId: variant.productId,
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          offerTag: variant.offerTag,
          images: variant.images,
          attributes: variant.attributes.filter(
            (attr) => attr.attributeId && attr.value
          ),
        })
      ).unwrap();

      setPopup({
        isVisible: true,
        message: "Variant updated successfully!",
        type: "success",
      });

      // Redirect to variant list page after successful update
      setTimeout(() => {
        navigate("/variant/list");
      }, 1000);
    } catch (err: any) {
      console.error("Update error:", err);
      setPopup({
        isVisible: true,
        message: err || "Failed to update variant. Please try again.",
        type: "error",
      });
    }
  };

  const handleBackClick = () => {
    navigate("/variants");
  };

  if (isLoading || !currentVariant) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Edit Variant | TailAdmin"
        description="Edit product variant"
      />

      {/* Outer gradient container like EditSubcategory */}
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 px-5 py-7 xl:px-10 xl:py-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Edit Variant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update product variant
            </p>
          </div>
        </div>

        {/* Inner white card (form lives here) */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full">
            {/* Back button / breadcrumb area kept — existing code */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackClick}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Variants</span>
                </button>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  Edit Variant
                </h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Update the basic details of your variant
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="productId"
                      value={variant.productId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                    >
                      <option value="">Select Product</option>
                      {products?.map((prod: any) => (
                        <option key={prod._id} value={prod._id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Variant Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={variant.title}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                      placeholder="Enter variant title"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={variant.sku}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                      placeholder="Enter SKU"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Pricing & Inventory
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Set pricing and stock information
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={variant.price}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sale Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="salePrice"
                        value={variant.salePrice}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={variant.stock}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Offer Tag
                    </label>
                    <input
                      type="text"
                      name="offerTag"
                      value={variant.offerTag}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition-colors"
                      placeholder="e.g., Best Seller, New Arrival"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Images
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add or update variant images
                  </p>
                </div>

                {/* Existing Images */}
                {variant.existingImages.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Images
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {variant.existingImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600"
                        >
                          <img
                            src={getImageUrl(img)}
                            alt={`Existing ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img, idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload New Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <input
                      type="file"
                      name="images"
                      multiple
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Click to upload images
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>

                  {/* New Images Preview */}
                  {variant.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {variant.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-600"
                        >
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`New ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Attributes
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Define variant attributes like color, size, etc.
                  </p>
                </div>

                <div className="space-y-4">
                  {variant.attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <select
                          value={attr.attributeId}
                          onChange={(e) =>
                            handleAttributeChange(
                              idx,
                              "attributeId",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 transition-colors"
                        >
                          <option value="">Select Attribute</option>
                          {attributes.map((attribute) => (
                            <option key={attribute._id} value={attribute._id}>
                              {attribute.value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Attribute value"
                          value={attr.value}
                          onChange={(e) =>
                            handleAttributeChange(idx, "value", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttribute(idx)}
                        disabled={variant.attributes.length === 1}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove attribute"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addAttribute}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40"
                  >
                    <Plus className="w-4 h-4" />
                    Add Attribute
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleBackClick}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Variant"
                  )}
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

export default EditVariantList;

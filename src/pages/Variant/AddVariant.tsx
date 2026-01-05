import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  fetchProducts,
  createVariant,
  fetchAttributes,
} from "../../store/slices/variant";
import { updateProduct } from "../../store/slices/product";
import toast, { Toaster } from "react-hot-toast";
import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";
import axiosInstance from "../../services/axiosConfig";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { createProduct } from "../../store/slices/product";
import { createFaq } from "../../store/slices/faq";

export default function AddVariant() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for pending product data from AddProduct page
  const pendingProductData = location.state?.productData;

  const {
    products = [],
    attributes = [],
    loading,
  } = useSelector((state: RootState) => state.variant);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const [attributesList, setAttributesList] = useState([]);
  const [variant, setVariant] = useState({
    productId: "",
    title: "",
    sku: "",
    price: 0,
    salePrice: 0,
    stock: 0,
    offerTag: "",
    images: [] as File[],
    attributes: [{ attributeId: "", value: "" }],
  });
  // On mount, check for product in URL and set variant.productId
  useEffect(() => {
    const urlProductId = searchParams.get("product");
    if (urlProductId && urlProductId !== variant.productId) {
      setVariant((prev) => ({ ...prev, productId: urlProductId }));
    }
  }, [searchParams]);

  // When productId changes, update the URL query param
  useEffect(() => {
    if (variant.productId) {
      searchParams.set("product", variant.productId);
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete("product");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.productId]);
  const [tenant] = useState("tenant1"); // Replace with actual tenant logic

  useEffect(() => {
    dispatch(fetchProducts({ tenant }));
    dispatch(fetchAttributes({ page: 1, limit: 50 }));
  }, [dispatch, tenant]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setVariant((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setVariant((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVariant({ ...variant, images: Array.from(e.target.files) });
    }
  };

  const handleAttributeChange = (
    idx: number,
    field: "attributeId" | "value",
    value: string
  ) => {
    const updated = [...variant.attributes];
    updated[idx] = { ...updated[idx], [field]: value };
    setVariant({ ...variant, attributes: updated });
  };

  const addAttribute = () => {
    setVariant({
      ...variant,
      attributes: [...variant.attributes, { attributeId: "", value: "" }],
    });
  };

  const removeAttribute = (idx: number) => {
    setVariant({
      ...variant,
      attributes: variant.attributes.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty attributes before validation
    const validAttributes = variant.attributes.filter(
      (attr) => attr.attributeId && attr.value && attr.attributeId.trim() && attr.value.trim()
    );

    // Validate required fields
    if (
      !variant.productId ||
      !variant.productId.trim() ||
      !variant.title ||
      !variant.title.trim() ||
      !variant.sku ||
      !variant.sku.trim() ||
      !variant.price ||
      variant.price <= 0 ||
      !variant.stock ||
      variant.stock < 0
    ) {
      toast.error("Please fill all required fields correctly.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    // Validate that at least one attribute is provided (backend requirement)
    if (validAttributes.length === 0) {
      toast.error("At least one attribute is required. Please add an attribute with both attribute type and value.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    try {
      let targetProductId = variant.productId;

      // ATOMIC CREATION FLOW: If we have pending product data, create the product FIRST
      if (pendingProductData && !targetProductId) {
        setPopup({
          isVisible: true,
          message: "Creating product...",
          type: "info",
        });

        // Construct FormData for Product (Replicated from AddProduct)
        const formData = new FormData();
        const product = pendingProductData;

        formData.append("name", product.name);
        formData.append("description", product.description);
        formData.append("category", product.category);
        formData.append("subcategory", product.subcategory);
        formData.append("brand", product.brand);
        formData.append("howToUseTitle", product.howToUseTitle);
        formData.append("howToUseVideo", product.howToUseVideo);
        formData.append("descriptionVideo", product.descriptionVideo);
        // Force status to active effectively since we are creating variant right now
        formData.append("status", "active");

        product.searchKeywords.forEach((kw: string, index: number) => {
          formData.append(`searchKeywords[${index}]`, kw);
        });

        if (product.storyVideoUrl) formData.append("storyVideoUrl", product.storyVideoUrl);

        product.images.forEach((image: any, index: number) => {
          formData.append(`images[${index}].url`, image.file);
          formData.append(`images[${index}].alt`, image.alt);
        });

        if (product.thumbnail && product.thumbnail.file) {
          formData.append("thumbnail.url", product.thumbnail.file);
          formData.append("thumbnail.alt", product.thumbnail.alt);
        }

        product.descriptionImages.forEach((image: any, index: number) => {
          formData.append(`descriptionImages[${index}].url`, image.file);
          formData.append(`descriptionImages[${index}].alt`, image.alt);
        });

        product.howToUseSteps.forEach((step: any, index: number) => {
          formData.append(`howToUseSteps[${index}].title`, step.title);
          formData.append(`howToUseSteps[${index}].description`, step.description);
        });

        product.highlights.forEach((highlight: string, index: number) => {
          formData.append(`highlights[${index}]`, highlight);
        });

        product.attributeSet.forEach((attributeId: string, index: number) => {
          formData.append(`attributeSet[${index}].attributeId`, attributeId);
        });

        product.ingredients.forEach((ing: any, index: number) => {
          formData.append(`ingredients[${index}].name`, ing.name);
          formData.append(`ingredients[${index}].quantity`, ing.quantity);
          formData.append(`ingredients[${index}].description`, ing.description);
          if (ing.image) formData.append(`ingredients[${index}].image`, ing.image);
          formData.append(`ingredients[${index}].alt`, ing.alt);
        });

        product.benefits.forEach((b: any, index: number) => {
          formData.append(`benefits[${index}].title`, b.title);
          formData.append(`benefits[${index}].description`, b.description);
          if (b.image) formData.append(`benefits[${index}].image`, b.image);
          formData.append(`benefits[${index}].alt`, b.alt);
        });

        product.precautions.forEach((p: any, index: number) => {
          formData.append(`precautions[${index}].title`, p.title);
          formData.append(`precautions[${index}].description`, p.description);
          if (p.image) formData.append(`precautions[${index}].image`, p.image);
          formData.append(`precautions[${index}].alt`, p.alt);
        });

        product.qa.forEach((item: any, index: number) => {
          formData.append(`qa[${index}].question`, item.question);
          formData.append(`qa[${index}].answer`, item.answer);
          formData.append(`qa[${index}].status`, item.status);
          formData.append(`qa[${index}].type`, "product");
        });

        if (product.custom_template) {
          formData.append("custom_template", "true");
          formData.append("templateId", product.templateId);
        }

        formData.append("isAddon", product.showInAddons?.toString() || "false");

        // Create the Product
        const prodResponse: any = await dispatch(createProduct(formData)).unwrap();
        const createdProductId = prodResponse?.product?.data?._id;

        if (!createdProductId) {
          throw new Error("Failed to create product - no ID returned");
        }

        targetProductId = createdProductId;

        // Process FAQ if needed (replicated logic)
        if (product.qa && product.qa.length > 0) {
          product.qa.map(async (item: any) => {
            try {
              await dispatch(createFaq({ ...item, product: createdProductId, type: "product" })).unwrap();
            } catch (e) { console.error(e) }
          });
        }
      }
      // END ATOMIC CREATION BLOCK

      if (!targetProductId) {
        toast.error("Product ID is missing.");
        return;
      }

      await dispatch(
        createVariant({
          tenant,
          productId: targetProductId, // Use the new ID or selected ID
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          offerTag: variant.offerTag,
          images: variant.images,
          attributes: validAttributes,
        })
      ).unwrap();
      setPopup({
        isVisible: true,
        message: pendingProductData
          ? "Product and Variant created successfully!"
          : "Variant created successfully!",
        type: "success",
      });

      // Activate the product
      try {
        await dispatch(updateProduct({
          id: variant.productId,
          data: { status: 'active' }
        })).unwrap();

        setPopup({
          isVisible: true,
          message: "Product published successfully!",
          type: "success",
        });
      } catch (activationError) {
        console.error("Failed to activate product:", activationError);
        // Continue anyway, as variant is created
      }

      setVariant({
        productId: "",
        title: "",
        sku: "",
        price: 0,
        salePrice: 0,
        stock: 0,
        offerTag: "",
        images: [],
        attributes: [{ attributeId: "", value: "" }],
      });

      // Redirect to product list page after successful creation
      setTimeout(() => {
        navigate("/product/list");
      }, 1500);
    } catch (err: any) {
      // Handle Redux Toolkit error format
      const errorMessage =
        err?.payload ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create variant. Please try again.";
      setPopup({
        isVisible: true,
        message: typeof errorMessage === 'string' ? errorMessage : "Failed to create variant. Please try again.",
        type: "error",
      });
      console.error("Variant creation error:", {
        error: err,
        payload: err?.payload,
        response: err?.response?.data,
        message: errorMessage
      });
    }
  };

  const getAttributeOptions = async () => {
    try {
      const response = await axiosInstance.get(
        `/product/attribute/${variant.productId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setAttributesList(response.data.data);
      console.log("Fetched attributes: ===>", response.data);
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
      // setPopup({
      //   isVisible: true,
      //   message: "Failed to fetch attributes. Please try again.",
      //   type: "error",
      // });
    }
  };

  useEffect(() => {
    getAttributeOptions();
  }, [variant.productId]);

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Add Variant | TailAdmin"
        description="Add a new product variant"
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
              Add Variant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create a new product variant
            </p>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full">
            {/* Keep breadcrumb unchanged */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Product <span className="text-red-500">*</span>
                  </label>
                  {pendingProductData ? (
                    <div className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900 font-medium">
                      Creating for: {pendingProductData.name}
                    </div>
                  ) : (
                    <select
                      name="productId"
                      value={variant.productId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select Product</option>
                      {products?.length > 0 &&
                        products?.map((prod: any) => (
                          <option key={prod._id} value={prod._id}>
                            {prod.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={variant.title}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    placeholder="Variant Title"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={variant.sku}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    placeholder="SKU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={variant.price === 0 ? "" : variant.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    min={0}
                    step="any"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={variant.salePrice === 0 ? "" : variant.salePrice}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    min={0}
                    step="any"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={variant.stock === 0 ? "" : variant.stock}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    min={0}
                    step="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Offer Tag
                  </label>
                  <input
                    type="text"
                    name="offerTag"
                    value={variant.offerTag}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                    placeholder="Offer Tag"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Images
                  </label>
                  <input
                    type="file"
                    name="images"
                    multiple
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                  />
                  {variant.images.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {variant.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={URL.createObjectURL(img)}
                          alt="Preview"
                          className="w-16 h-16 rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Attributes
                  </label>
                  {variant.attributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center gap-4 mb-2">
                      <select
                        value={attr.attributeId}
                        onChange={(e) =>
                          handleAttributeChange(idx, "attributeId", e.target.value)
                        }
                        className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      >
                        <option value="">Select Attribute</option>
                        {attributesList.map((attribute) => (
                          <option key={attribute._id} value={attribute._id}>
                            {attribute.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Value"
                        value={attr.value}
                        onChange={(e) =>
                          handleAttributeChange(idx, "value", e.target.value)
                        }
                        className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttribute(idx)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                        title="Remove attribute"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="rounded-xl bg-blue-100 px-3 py-1 text-blue-700 font-semibold hover:bg-blue-200"
                  >
                    Add Attribute
                  </button>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10">
                    {loading ? "Processing..." : pendingProductData ? "Create Product & Variant" : "Add Variant"}
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

import { use, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import {
  createBrand,
  fetchBrandById,
  updateBrand,
} from "../../store/slices/brandSlice";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { useParams, useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils/imageHelper";

export default function EditBrand() {
  const [brand, setBrand] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    country: "",
    status: true,
    image: null as File | null,
    isFeatured: false,
  });
  const params = useParams();
  const brandId = params.id;

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const loading = useSelector(
    (state: RootState) => state.brand?.loading || false
  );

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
      setBrand({ ...brand, [name]: checked });
    } else {
      setBrand({ ...brand, [name]: value });

      // Auto-generate slug when name changes
      if (name === "name" && value && !brand.slug) {
        setBrand((prev) => ({
          ...prev,
          name: value,
          slug: generateSlug(value),
        }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBrand({ ...brand, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.name) {
      toast.error("Brand name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!brand.slug) {
      toast.error("Brand slug is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", brand.name);
    formData.append("slug", brand.slug);
    formData.append("description", brand.description);
    formData.append("website", brand.website);
    formData.append("country", brand.country);
    formData.append("isFeatured", brand.isFeatured.toString());
    formData.append("status", brand.status.toString());

    if (brand.image) {
      formData.append("image", brand.image);
    }

    try {
      const createdBrand = await dispatch(
        updateBrand({ id: brandId, data: formData })
      ).unwrap();

      console.log("Updated Brand:", createdBrand);

      setPopup({
        isVisible: true,
        message: "Brand updated successfully!",
        type: "success",
      });
      setBrand({
        name: "",
        slug: "",
        description: "",
        website: "",
        country: "",
        status: true,
        image: null,
        isFeatured: false,
      });
      // Redirect to list page after successful update
      setTimeout(() => {
        navigate("/brand/list");
      }, 1000);
    } catch (err: any) {
      setPopup({
        isVisible: true,
        message: "Failed to update Brand. Please try again.",
        type: "error",
      });
    }
  };

  const getData = async () => {
    try {
      const res = await dispatch(fetchBrandById(brandId));
      console.log("Fetched Brand Data:", res);
      const data = res.payload;
      setBrand({
        name: data.name,
        slug: data.slug,
        description: data.description,
        website: data.website,
        country: data.country,
        status: data.status,
        image: data.image,
        isFeatured: data.isFeatured,
      });
    } catch (error) {
      console.error("Error fetching brand data:", error);
    }
  };

  useEffect(() => {
    getData();
  }, [brandId, dispatch]);

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Edit Brand | TailAdmin"
        description="Edit an existing brand page for TailAdmin"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full ">
          <PageBreadcrumb pageTitle="Edit Brand" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={brand.name}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter brand name (e.g., Nike)"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={brand.slug}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="brand-slug (e.g., nike)"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    URL-friendly version of the name. Auto-generated from name
                    if left empty.
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={brand.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter brand description (e.g., Leading sportswear brand)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={brand.website}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={brand.country}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter country (e.g., USA)"
                  />
                </div>
              </div>
            </div>

            {/* Brand Image Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Brand Image
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brand Logo/Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                {brand.image && (
                  <div className="mt-2">
                    <img
                      src={getImageUrl(brand.image)}
                      alt="Brand Preview"
                      className="max-w-xs h-auto rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status & Featured Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Status & Visibility
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="status"
                    name="status"
                    checked={brand.status}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                  />
                  <label
                    htmlFor="status"
                    className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Active Status
                  </label>
                  <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (Brand is visible and available)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={brand.isFeatured}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Featured Brand
                  </label>
                  <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (Show in featured brands section)
                  </p>
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
                {loading ? "Updating Brand..." : "Update Brand"}
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

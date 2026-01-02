import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Upload,
  Package,
  Image,
  FileText,
  Sparkles,
  Settings,
  Search,
  Heart,
  ShieldAlert,
  Info,
  Layout,
  HelpCircle,
} from "lucide-react";
import { createProduct } from "../../store/slices/product";
import { fetchCategories } from "../../store/slices/categorySlice";
import {
  fetchSubcategories,
  getSubcategoriesByCategory,
} from "../../store/slices/subCategory";
import CustomEditor from "../../components/common/TextEditor";
import { fetchAttributes } from "../../store/slices/attributeSlice";
import PopupAlert from "../../components/popUpAlert";
import { useAppSelector } from "../../hooks/redux";
import { fetchTemplates } from "../../store/slices/template";
import { fetchBrands } from "../../store/slices/brandSlice";
import { createFaq } from "../../store/slices/faq"; // Import the FAQ thunk
import { Link, useNavigate } from "react-router-dom";

// Interfaces
interface Category {
  _id: string;
  name: string;
}

interface Attribute {
  _id: string;
  name: string;
}

interface HowToUseStep {
  title: string;
  description: string;
}

interface Image {
  file: File | null;
  alt: string;
}

interface Ingredient {
  name: string;
  quantity: string;
  description: string;
  image: File | null;
  alt: string;
}

interface Benefit {
  title: string;
  description: string;
  image?: File | null;
  alt?: string;
}

interface Precaution {
  title: string;
  description: string;
  image?: File | null;
  alt?: string;
}

interface QAItem {
  question: string;
  answer: string;
  status: string;
  type?: string;
  product?: string;
}

interface ProductState {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  // price: string;
  // salePrice: string;
  images: Image[];
  thumbnail: Image | null;
  howToUseTitle: string;
  howToUseVideo: string;
  howToUseSteps: HowToUseStep[];
  descriptionImages: Image[];
  descriptionVideo: string;
  highlights: string[];
  attributeSet: string[];
  status: string;
  ingredients: Ingredient[];
  benefits: Benefit[];
  precautions: Precaution[];
  searchKeywords: string[];
  qa: QAItem[];
  _id?: string; // Add this if you want to store product id after creation
}

export default function AddProduct() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [productId, setProductId] = useState<string>("");
  const [variantPopup, setVariantPopup] = useState<boolean>(false);
  const [product, setProduct] = useState<ProductState>({
    name: "",
    description: "",
    category: "",
    // price: "",
    // salePrice: "",
    subcategory: "",
    brand: "",
    images: [],
    thumbnail: null,
    howToUseTitle: "",
    howToUseVideo: "",
    howToUseSteps: [{ title: "", description: "" }],
    descriptionImages: [],
    descriptionVideo: "",
    highlights: [""],
    attributeSet: [],
    status: "active",
    ingredients: [
      { name: "", quantity: "", description: "", image: null, alt: "" },
    ],
    benefits: [{ title: "", description: "", image: null, alt: "" }],
    precautions: [{ title: "", description: "", image: null, alt: "" }],
    searchKeywords: [""],
    qa: [{ question: "", answer: "", status: "active", type: "product" }],
    custom_template: false,
    storyVideoUrl: "",
    templateId: "",
    // _id: undefined, // If you want to store product id after creation
    showInAddons: false,
  });

  const tabs = [
    { id: 0, name: "Basic Info", icon: Info, color: "bg-blue-500" },
    { id: 1, name: "Images", icon: Image, color: "bg-purple-500" },
    { id: 2, name: "How to Use", icon: FileText, color: "bg-green-500" },
    { id: 3, name: "Media", icon: Upload, color: "bg-orange-500" },
    { id: 4, name: "Highlights", icon: Sparkles, color: "bg-yellow-500" },
    { id: 5, name: "Attributes", icon: Settings, color: "bg-indigo-500" },
    { id: 6, name: "Ingredients", icon: Package, color: "bg-teal-500" },
    { id: 7, name: "Keywords", icon: Search, color: "bg-pink-500" },
    { id: 8, name: "Benefits", icon: Heart, color: "bg-red-500" },
    { id: 9, name: "Precautions", icon: ShieldAlert, color: "bg-gray-500" },
    { id: 10, name: "Template", icon: Layout, color: "bg-indigo-500" },
    // faq
    { id: 11, name: "FAQ", icon: HelpCircle, color: "bg-gray-500" },
  ];

  // Search Keywords handlers
  const addSearchKeyword = () => {
    setProduct({ ...product, searchKeywords: [...product.searchKeywords, ""] });
  };
  const removeSearchKeyword = (index: number) => {
    if (product.searchKeywords.length > 1) {
      setProduct({
        ...product,
        searchKeywords: product.searchKeywords.filter((_, i) => i !== index),
      });
    }
  };
  const updateSearchKeyword = (index: number, value: string) => {
    setProduct({
      ...product,
      searchKeywords: product.searchKeywords.map((kw, i) =>
        i === index ? value : kw
      ),
    });
  };

  // Ingredient handlers
  const addIngredient = () => {
    setProduct({
      ...product,
      ingredients: [
        ...product.ingredients,
        { name: "", quantity: "", description: "", image: null, alt: "" },
      ],
    });
  };

  const removeIngredient = (index: number) => {
    if (product.ingredients.length > 1) {
      const updated = product.ingredients.filter((_, i) => i !== index);
      setProduct({ ...product, ingredients: updated });
    }
  };

  const updateIngredient = (
    index: number,
    field: "name" | "quantity" | "description",
    value: string
  ) => {
    const updated = product.ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    );
    setProduct({ ...product, ingredients: updated });
  };

  const updateIngredientImage = (index: number, file: File | null) => {
    const updated = product.ingredients.map((ing, i) =>
      i === index ? { ...ing, image: file, alt: file ? ing.alt : "" } : ing
    );
    setProduct({ ...product, ingredients: updated });
  };

  const updateIngredientAlt = (index: number, value: string) => {
    const updated = product.ingredients.map((ing, i) =>
      i === index ? { ...ing, alt: value } : ing
    );
    setProduct({ ...product, ingredients: updated });
  };

  // Benefit handlers
  const addBenefit = () => {
    setProduct({
      ...product,
      benefits: [
        ...product.benefits,
        { title: "", description: "", image: null, alt: "" },
      ],
    });
  };

  const removeBenefit = (index: number) => {
    if (product.benefits.length > 1) {
      const updated = product.benefits.filter((_, i) => i !== index);
      setProduct({ ...product, benefits: updated });
    }
  };

  const updateBenefit = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updated = product.benefits.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    setProduct({ ...product, benefits: updated });
  };

  const updateBenefitImage = (index: number, file: File | null) => {
    const updated = product.benefits.map((b, i) =>
      i === index ? { ...b, image: file, alt: file ? b.alt : "" } : b
    );
    setProduct({ ...product, benefits: updated });
  };

  const updateBenefitAlt = (index: number, value: string) => {
    const updated = product.benefits.map((b, i) =>
      i === index ? { ...b, alt: value } : b
    );
    setProduct({ ...product, benefits: updated });
  };

  // Precaution handlers
  const addPrecaution = () => {
    setProduct({
      ...product,
      precautions: [
        ...product.precautions,
        { title: "", description: "", image: null, alt: "" },
      ],
    });
  };

  const removePrecaution = (index: number) => {
    if (product.precautions.length > 1) {
      const updated = product.precautions.filter((_, i) => i !== index);
      setProduct({ ...product, precautions: updated });
    }
  };

  const updatePrecaution = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updated = product.precautions.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    setProduct({ ...product, precautions: updated });
  };

  const updatePrecautionImage = (index: number, file: File | null) => {
    const updated = product.precautions.map((p, i) =>
      i === index ? { ...p, image: file, alt: file ? p.alt : "" } : p
    );
    setProduct({ ...product, precautions: updated });
  };

  const updatePrecautionAlt = (index: number, value: string) => {
    const updated = product.precautions.map((p, i) =>
      i === index ? { ...p, alt: value } : p
    );
    setProduct({ ...product, precautions: updated });
  };

  // FAQ handlers
  const addQA = () => {
    setProduct({
      ...product,
      qa: [
        ...product.qa,
        {
          question: "",
          answer: "",
          status: "active",
          type: "product",
          product: product._id || "",
        },
      ],
    });
  };

  const removeQA = (index: number) => {
    if (product.qa.length > 1) {
      setProduct({
        ...product,
        qa: product.qa.filter((_, i) => i !== index),
      });
    }
  };

  const updateQA = (
    index: number,
    field: "question" | "answer" | "status",
    value: string
  ) => {
    const updatedQA = product.qa.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setProduct({ ...product, qa: updatedQA });
  };

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const { templates } = useAppSelector((state) => state.template);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: any) => state.product);
  const { categories } = useSelector((state: any) => state.category);
  const { attributes, loading: attributesLoading } = useSelector((state: any) => state.attributes);
  const { brands } = useSelector((state: any) => state.brand);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleMultipleImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "images" | "descriptionImages"
  ) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => ({
        file,
        alt: "",
      }));
      setProduct({
        ...product,
        [fieldName]: [...product[fieldName], ...filesArray],
      });
    }
  };

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)[0];
      setProduct({
        ...product,
        storyVideoUrl: filesArray,
      });
    }
  };

  const updateImageAlt = (
    index: number,
    fieldName: "images" | "descriptionImages",
    value: string
  ) => {
    const updatedImages = product[fieldName].map((img, i) =>
      i === index ? { ...img, alt: value } : img
    );
    setProduct({ ...product, [fieldName]: updatedImages });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProduct({
        ...product,
        thumbnail: { file: e.target.files[0], alt: "" },
      });
    }
  };

  const updateThumbnailAlt = (value: string) => {
    if (product.thumbnail) {
      setProduct({
        ...product,
        thumbnail: { ...product.thumbnail, alt: value },
      });
    }
  };

  const removeImage = (
    index: number,
    fieldName: "images" | "descriptionImages"
  ) => {
    const updatedImages = product[fieldName].filter((_, i) => i !== index);
    setProduct({ ...product, [fieldName]: updatedImages });
  };

  const addHowToUseStep = () => {
    setProduct({
      ...product,
      howToUseSteps: [...product.howToUseSteps, { title: "", description: "" }],
    });
  };

  const removeHowToUseStep = (index: number) => {
    if (product.howToUseSteps.length > 1) {
      const updatedSteps = product.howToUseSteps.filter((_, i) => i !== index);
      setProduct({ ...product, howToUseSteps: updatedSteps });
    }
  };

  const updateHowToUseStep = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updatedSteps = product.howToUseSteps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    );
    setProduct({ ...product, howToUseSteps: updatedSteps });
  };

  const addHighlight = () => {
    setProduct({ ...product, highlights: [...product.highlights, ""] });
  };

  const removeHighlight = (index: number) => {
    if (product.highlights.length > 1) {
      const updatedHighlights = product.highlights.filter(
        (_, i) => i !== index
      );
      setProduct({ ...product, highlights: updatedHighlights });
    }
  };

  const updateHighlight = (index: number, value: string) => {
    const updatedHighlights = product.highlights.map((highlight, i) =>
      i === index ? value : highlight
    );
    setProduct({ ...product, highlights: updatedHighlights });
  };

  const handleAttributeChange = (attributeId: string, checked: boolean) => {
    if (checked) {
      setProduct({
        ...product,
        attributeSet: [...product.attributeSet, attributeId],
      });
    } else {
      setProduct({
        ...product,
        attributeSet: product.attributeSet.filter((id) => id !== attributeId),
      });
    }
  };

  const handleSubmit = async () => {
    if (!product.name) {
      toast.error("Product name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!product.category) {
      toast.error("Category is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("category", product.category);
    formData.append("subcategory", product.subcategory);
    formData.append("brand", product.brand);
    formData.append("howToUseTitle", product.howToUseTitle);
    formData.append("howToUseVideo", product.howToUseVideo);
    formData.append("descriptionVideo", product.descriptionVideo);
    formData.append("status", product.status);
    // formData.append("price", product.price);
    // formData.append("salePrice", product.salePrice);
    // Add search keywords
    product.searchKeywords.forEach((kw, index) => {
      formData.append(`searchKeywords[${index}]`, kw);
    });

    // Add images with alt text
    product.storyVideoUrl &&
      formData.append("storyVideoUrl", product.storyVideoUrl);
    product.images.forEach((image, index) => {
      formData.append(`images[${index}].url`, image.file);
      formData.append(`images[${index}].alt`, image.alt);
    });

    // Add thumbnail with alt text
    if (product.thumbnail && product.thumbnail.file) {
      formData.append("thumbnail.url", product.thumbnail.file);
      formData.append("thumbnail.alt", product.thumbnail.alt);
    }

    // Add description images with alt text
    product.descriptionImages.forEach((image, index) => {
      formData.append(`descriptionImages[${index}].url`, image.file);
      formData.append(`descriptionImages[${index}].alt`, image.alt);
    });

    // Add how to use steps
    product.howToUseSteps.forEach((step, index) => {
      formData.append(`howToUseSteps[${index}].title`, step.title);
      formData.append(`howToUseSteps[${index}].description`, step.description);
    });

    // Add highlights
    product.highlights.forEach((highlight, index) => {
      formData.append(`highlights[${index}]`, highlight);
    });

    // Add attribute set
    product.attributeSet.forEach((attributeId, index) => {
      formData.append(`attributeSet[${index}].attributeId`, attributeId);
    });

    // Add ingredients with alt text
    product.ingredients.forEach((ing, index) => {
      formData.append(`ingredients[${index}].name`, ing.name);
      formData.append(`ingredients[${index}].quantity`, ing.quantity);
      formData.append(`ingredients[${index}].description`, ing.description);
      if (ing.image) {
        formData.append(`ingredients[${index}].image`, ing.image);
      }
      formData.append(`ingredients[${index}].alt`, ing.alt);
    });

    // Add benefits with alt text
    product.benefits.forEach((b, index) => {
      formData.append(`benefits[${index}].title`, b.title);
      formData.append(`benefits[${index}].description`, b.description);
      if (b.image) {
        formData.append(`benefits[${index}].image`, b.image);
      }
      formData.append(`benefits[${index}].alt`, b.alt);
    });

    // Add precautions with alt text
    product.precautions.forEach((p, index) => {
      formData.append(`precautions[${index}].title`, p.title);
      formData.append(`precautions[${index}].description`, p.description);
      if (p.image) {
        formData.append(`precautions[${index}].image`, p.image);
      }
      formData.append(`precautions[${index}].alt`, p.alt);
    });

    // Add FAQ (Q&A)
    product.qa.forEach((item, index) => {
      formData.append(`qa[${index}].question`, item.question);
      formData.append(`qa[${index}].answer`, item.answer);
      formData.append(`qa[${index}].status`, item.status);
      formData.append(`qa[${index}].type`, "product");
      // If you have product._id after creation, you can use it here
      // formData.append(`qa[${index}].product`, product._id || "");
    });

    if (product.custom_template) {
      formData.append("custom_template", "true");
      formData.append("templateId", product.templateId);
    }

    formData.append("isAddon", product.showInAddons);

    try {
      const response = await dispatch(createProduct(formData)).unwrap();
      console.log("Product created successfully: >>> ", response);
      const createdProductId = response?.product?.data?._id;

      setProductId(createdProductId);

      const isSuccess = response?.success || !!createdProductId;

      if (isSuccess && createdProductId) {
        // FAQ integration: create FAQ for each item in product.qa
        if (product.qa && product.qa.length > 0) {
          const faqPromises = product.qa.map(async (item) => {
            const faqPayload = {
              ...item,
              product: createdProductId,
              type: "product",
            };
            try {
              return await dispatch(createFaq(faqPayload)).unwrap();
            } catch (err) {
              console.error("FAQ Error", err);
              return null;
            }
          });
          await Promise.all(faqPromises);
        }

        setVariantPopup(true);
        setPopup({
          isVisible: true,
          message: "Product created successfully! Redirecting...",
          type: "success",
        });

        setTimeout(() => {
          navigate("/product/list");
        }, 2000);

        setProduct({
          name: "",
          description: "",
          category: "",
          subcategory: "",
          images: [],
          thumbnail: null,
          howToUseTitle: "",
          howToUseVideo: "",
          howToUseSteps: [{ title: "", description: "" }],
          descriptionImages: [],
          descriptionVideo: "",
          highlights: [""],
          attributeSet: [],
          status: "active",
          ingredients: [
            { name: "", quantity: "", description: "", image: null, alt: "" },
          ],
          benefits: [{ title: "", description: "", image: null, alt: "" }],
          precautions: [{ title: "", description: "", image: null, alt: "" }],
          searchKeywords: [""],
          qa: [
            {
              question: "",
              answer: "",
              status: "active",
              type: "product",
              product: createdProductId || "",
            },
          ],
          custom_template: false,
          templateId: "",
          _id: createdProductId || undefined,
        });

        setPopup({
          isVisible: true,
          message: "Product created successfully!",
          type: "success",
        });
      }
    } catch (err: any) {
      setPopup({
        isVisible: true,
        message: "Failed to create product. Please try again.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (categories?.length === 0) {
      dispatch(fetchCategories()).unwrap();
    }
    if (attributes?.length === 0) {
      // Fetch all active attributes with a high limit to get all of them
      dispatch(fetchAttributes({
        page: 1,
        limit: 1000,
        filters: { status: 'active' }
      })).unwrap();
    }
  }, [dispatch, categories?.length, attributes?.length]);

  const getSubcategories = async () => {
    try {
      const res = await dispatch(getSubcategoriesByCategory(product.category));
      setSubcategories(res.payload);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setPopup({
        isVisible: true,
        message: "Failed to fetch subcategories.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (product.category && product.category !== "") {
      getSubcategories();
    }

    if (brands?.length === 0) {
      dispatch(fetchBrands()).unwrap();
    }
  }, [dispatch, product.category]);

  useEffect(() => {
    if (templates?.length === 0) {
      dispatch(fetchTemplates()).unwrap();
    }
  }, [dispatch]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: Category) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={product.subcategory}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories?.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand
              </label>
              <select
                name="brand"
                value={product.brand}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
              >
                <option value="">Select brand</option>
                {brands?.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <div className="border border-gray-300 rounded-lg dark:border-gray-700">
                <CustomEditor
                  value={product.description}
                  onChange={(value: string) => {
                    setProduct({ ...product, description: value });
                  }}
                />
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-4">
              <div className="">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
                  placeholder="Enter product price"
                  required
                />
              </div>
              <div className="">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sale Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="salePrice"
                  value={product.salePrice}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
                  placeholder="Enter product sale price"
                  required
                />
              </div>
            </div> */}

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={product.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                name="showInAddons"
                id="showInAddons"
                checked={product.showInAddons}
                onChange={(e) =>
                  setProduct({ ...product, showInAddons: e.target.checked })
                }
                className="w-4 h-4 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
              ></input>
              <label
                htmlFor="showInAddons"
                className="block  text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Show in Addons
              </label>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Story (video OR Gif)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                <input
                  type="file"
                  multiple
                  accept="video/*,image/gif"
                  onChange={(e) => handleStoryFileChange(e)}
                  className="hidden"
                  id="product-story"
                />
                <label htmlFor="product-story" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload product story (MP4/WebM/OGG or GIF)
                  </p>
                </label>
              </div>
              {product?.storyVideoUrl && (
                <div className="space-y-4">
                  <div className="relative group">
                    {product.storyVideoUrl.type === "image/gif" ? (
                      <img
                        src={URL.createObjectURL(product.storyVideoUrl)}
                        alt="Product Story Preview"
                        className="w-full h-48 object-cover rounded-lg border shadow-sm"
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(product.storyVideoUrl)}
                        controls
                        className="w-full h-48 object-cover rounded-lg border shadow-sm"
                      />
                    )}

                    <input
                      type="text"
                      value={product.storyVideoUrl.name}
                      onChange={(e) => handleStoryFileChange(e)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProduct((prev) => ({
                          ...prev,
                          storyVideoUrl: "",
                        }))
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleMultipleImagesChange(e, "images")}
                    className="hidden"
                    id="product-images"
                  />
                  <label htmlFor="product-images" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload product images
                    </p>
                  </label>
                </div>
                {product.images.length > 0 && (
                  <div className="space-y-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image.file)}
                          alt={image.alt || `Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) =>
                            updateImageAlt(index, "images", e.target.value)
                          }
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                          placeholder={`Alt text for image ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, "images")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Thumbnail Image
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-image"
                  />
                  <label htmlFor="thumbnail-image" className="cursor-pointer">
                    <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload thumbnail
                    </p>
                  </label>
                </div>
                {product.thumbnail && product.thumbnail.file && (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(product.thumbnail.file)}
                      alt={product.thumbnail.alt || "Thumbnail Preview"}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm"
                    />
                    <input
                      type="text"
                      value={product.thumbnail.alt}
                      onChange={(e) => updateThumbnailAlt(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                      placeholder="Alt text for thumbnail"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  How to Use Title
                </label>
                <input
                  type="text"
                  name="howToUseTitle"
                  value={product.howToUseTitle}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter how to use title"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  How to Use Video URL
                </label>
                <input
                  type="url"
                  name="howToUseVideo"
                  value={product.howToUseVideo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter video URL"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  How to Use Steps
                </label>
                <button
                  type="button"
                  onClick={addHowToUseStep}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus size={16} />
                  Add Step
                </button>
              </div>

              {product.howToUseSteps.map((step, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-6 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      Step {index + 1}
                    </h4>
                    {product.howToUseSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHowToUseStep(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) =>
                        updateHowToUseStep(index, "title", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                      placeholder="Step title"
                    />
                    <div className="border border-gray-300 rounded-lg dark:border-gray-700">
                      <CustomEditor
                        value={step.description}
                        onChange={(value: string) =>
                          updateHowToUseStep(index, "description", value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description Images
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-orange-400 transition-colors duration-200">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      handleMultipleImagesChange(e, "descriptionImages")
                    }
                    className="hidden"
                    id="description-images"
                  />
                  <label
                    htmlFor="description-images"
                    className="cursor-pointer"
                  >
                    <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload description images
                    </p>
                  </label>
                </div>
                {product.descriptionImages.length > 0 && (
                  <div className="space-y-4">
                    {product.descriptionImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image.file)}
                          alt={image.alt || `Description ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) =>
                            updateImageAlt(
                              index,
                              "descriptionImages",
                              e.target.value
                            )
                          }
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                          placeholder={`Alt text for description image ${index + 1
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeImage(index, "descriptionImages")
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description Video URL
                </label>
                <input
                  type="url"
                  name="descriptionVideo"
                  value={product.descriptionVideo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter description video URL"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Highlights
              </label>
              <button
                type="button"
                onClick={addHighlight}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Highlight
              </button>
            </div>

            {product.highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-gray-700"
              >
                <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => updateHighlight(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter product highlight"
                />
                {product.highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 w-full">
            <div className="w-full">
              <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Attributes
              </label>
              {attributesLoading && attributes.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">Loading attributes...</div>
                </div>
              ) : attributes && attributes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {attributes
                    .filter((attr: Attribute) => attr.status === 'active')
                    .map((attribute: Attribute) => (
                      <div
                        key={attribute._id}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 dark:border-gray-700 dark:hover:bg-indigo-900/20 transition-colors duration-200 w-full"
                      >
                        <input
                          type="checkbox"
                          id={`attribute-${attribute._id}`}
                          checked={product.attributeSet.includes(attribute._id)}
                          onChange={(e) =>
                            handleAttributeChange(attribute._id, e.target.checked)
                          }
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                        />
                        <label
                          htmlFor={`attribute-${attribute._id}`}
                          className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1 truncate"
                          title={attribute.name}
                        >
                          {attribute.name}
                        </label>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 border border-gray-200 rounded-lg dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400">
                    No attributes available. Please add attributes first.
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ingredients
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {product.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    Ingredient {index + 1}
                  </h4>
                  {product.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) =>
                      updateIngredient(index, "name", e.target.value)
                    }
                    className="rounded-lg border border-gray-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Ingredient name"
                  />
                  <input
                    type="text"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      updateIngredient(index, "quantity", e.target.value)
                    }
                    className="rounded-lg border border-gray-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Quantity"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 text-center hover:border-teal-400 transition-colors duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateIngredientImage(
                          index,
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                      className="hidden"
                      id={`ingredient-image-${index}`}
                    />
                    <label
                      htmlFor={`ingredient-image-${index}`}
                      className="cursor-pointer"
                    >
                      <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Upload Image
                      </p>
                    </label>
                  </div>
                </div>

                {ingredient.image && (
                  <div className="mb-4 space-y-2">
                    <img
                      src={URL.createObjectURL(ingredient.image)}
                      alt={ingredient.alt || `Ingredient ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                    />
                    <input
                      type="text"
                      value={ingredient.alt}
                      onChange={(e) =>
                        updateIngredientAlt(index, e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                      placeholder="Alt text for ingredient image"
                    />
                  </div>
                )}

                <div className="border border-gray-300 rounded-lg dark:border-gray-700">
                  <CustomEditor
                    value={ingredient.description}
                    onChange={(value: string) =>
                      updateIngredient(index, "description", value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Keywords
              </label>
              <button
                type="button"
                onClick={addSearchKeyword}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Keyword
              </button>
            </div>

            {product.searchKeywords.map((keyword, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 dark:border-gray-700"
              >
                <div className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => updateSearchKeyword(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter search keyword"
                />
                {product.searchKeywords.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSearchKeyword(index)}
                    className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Benefits
              </label>
              <button
                type="button"
                onClick={addBenefit}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Benefit
              </button>
            </div>

            {product.benefits.map((benefit, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    Benefit {index + 1}
                  </h4>
                  {product.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={benefit.title}
                    onChange={(e) =>
                      updateBenefit(index, "title", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Benefit title"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 text-center hover:border-red-400 transition-colors duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateBenefitImage(
                          index,
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                      className="hidden"
                      id={`benefit-image-${index}`}
                    />
                    <label
                      htmlFor={`benefit-image-${index}`}
                      className="cursor-pointer"
                    >
                      <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Upload Benefit Image
                      </p>
                    </label>
                  </div>
                  {benefit.image && (
                    <div className="mb-4 space-y-2">
                      <img
                        src={URL.createObjectURL(benefit.image)}
                        alt={benefit.alt || `Benefit ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                      />
                      <input
                        type="text"
                        value={benefit.alt}
                        onChange={(e) =>
                          updateBenefitAlt(index, e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                        placeholder="Alt text for benefit image"
                      />
                    </div>
                  )}
                  <div className="border border-gray-300 rounded-lg dark:border-gray-700">
                    <CustomEditor
                      value={benefit.description}
                      onChange={(value: string) =>
                        updateBenefit(index, "description", value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Precautions
              </label>
              <button
                type="button"
                onClick={addPrecaution}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Precaution
              </button>
            </div>

            {product.precautions.map((precaution, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    Precaution {index + 1}
                  </h4>
                  {product.precautions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrecaution(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={precaution.title}
                    onChange={(e) =>
                      updatePrecaution(index, "title", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Precaution title"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 text-center hover:border-gray-400 transition-colors duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updatePrecautionImage(
                          index,
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                      className="hidden"
                      id={`precaution-image-${index}`}
                    />
                    <label
                      htmlFor={`precaution-image-${index}`}
                      className="cursor-pointer"
                    >
                      <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Upload Precaution Image
                      </p>
                    </label>
                  </div>
                  {precaution.image && (
                    <div className="mb-4 space-y-2">
                      <img
                        src={URL.createObjectURL(precaution.image)}
                        alt={precaution.alt || `Precaution ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                      />
                      <input
                        type="text"
                        value={precaution.alt}
                        onChange={(e) =>
                          updatePrecautionAlt(index, e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                        placeholder="Alt text for precaution image"
                      />
                    </div>
                  )}
                  <div className="border border-gray-300 rounded-lg dark:border-gray-700">
                    <CustomEditor
                      value={precaution.description}
                      onChange={(value: string) =>
                        updatePrecaution(index, "description", value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 10:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-2xl font-medium text-gray-700 dark:text-gray-300">
                Custom Template
              </label>
            </div>

            <div className=" flex items-center gap-3">
              <input
                type="checkbox"
                name="custom_template"
                id="custom-template"
                checked={product.custom_template}
                onChange={handleChange}
                className="w-fit rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter plan name"
                required
              />
              <label
                htmlFor="custom-template"
                className=" text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Custom Template
              </label>
            </div>
            {product.custom_template && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="templateId"
                  value={product.templateId}
                  onChange={(e) =>
                    setProduct({ ...product, templateId: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.layoutName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Q&A
              </label>
              <button
                type="button"
                onClick={addQA}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Question
              </button>
            </div>

            {product.qa.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    Question {index + 1}
                  </h4>
                  {product.qa.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQA(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) =>
                      updateQA(index, "question", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Enter the question"
                  />

                  <div className="border border-gray-300 rounded-lg dark:border-gray-700">
                    <CustomEditor
                      value={item.answer}
                      onChange={(value: string) =>
                        updateQA(index, "answer", value)
                      }
                    />
                  </div>

                  <select
                    value={item.status}
                    onChange={(e) => updateQA(index, "status", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Add New Product
            </h1>
            <p className="text-blue-100">
              Create and manage your product catalog
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                      ? `border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20`
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${activeTab === tab.id
                        ? tab.color
                        : "bg-gray-200 dark:bg-gray-700"
                        } text-white`}
                    >
                      <IconComponent size={16} />
                    </div>
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(100vh-300px)]">{renderTabContent()}</div>

          {/* Footer with Submit Button */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setProduct({
                    name: "",
                    description: "",
                    category: "",
                    subcategory: "",
                    images: [],
                    thumbnail: null,
                    howToUseTitle: "",
                    howToUseVideo: "",
                    howToUseSteps: [{ title: "", description: "" }],
                    descriptionImages: [],
                    descriptionVideo: "",
                    highlights: [""],
                    attributeSet: [],
                    status: "active",
                    ingredients: [
                      {
                        name: "",
                        quantity: "",
                        description: "",
                        image: null,
                        alt: "",
                      },
                    ],
                    benefits: [
                      { title: "", description: "", image: null, alt: "" },
                    ],
                    precautions: [
                      { title: "", description: "", image: null, alt: "" },
                    ],
                    searchKeywords: [""],
                    qa: [
                      {
                        question: "",
                        answer: "",
                        status: "active",
                        type: "product",
                      },
                    ],
                    custom_template: false,
                    templateId: "",
                  });
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      {/* Popup Alert */}
      {popup.isVisible && (
        <PopupAlert
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, isVisible: false })}
        />
      )}
      {variantPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-[9999]">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] mx-4 animate-fadeIn">

            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mx-auto mb-3">
              <span className="text-yellow-600 text-2xl">⚠️</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 text-center">
              Variant Needed to Publish Product
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mt-2 leading-relaxed">
              This product cannot be displayed on your website until at least one
              variant is added. Please create a variant to continue.
            </p>

            {/* Button */}
            <Link to={`/variant/add?product=${productId}`}>
              <button className="mt-6 w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm">
                Add Variant
              </button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

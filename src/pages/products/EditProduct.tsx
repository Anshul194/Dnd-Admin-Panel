/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Users,
} from "lucide-react";
import { fetchProductById, updateProduct } from "../../store/slices/product";
import { getImageUrl } from "../../utils/imageHelper";
import { fetchCategories } from "../../store/slices/categorySlice";
import { getSubcategoriesByCategory } from "../../store/slices/subCategory";
import CustomEditor from "../../components/common/TextEditor";
import { fetchAttributes } from "../../store/slices/attributeSlice";
import { showAlert } from "../../store/slices/alertSlice";
import { useParams, useNavigate } from "react-router";
import { useAppSelector } from "../../hooks/redux";
import { fetchTemplates } from "../../store/slices/template";
import { updateFaq } from "../../store/slices/faq"; // <-- import updateFaq thunk
import { fetchBrands } from "../../store/slices/brandSlice";
import axiosInstance from "../../services/axiosConfig";

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
  file: File | string | null;
  alt: string;
  _id?: string;
  localId?: string;
}

interface Ingredient {
  name: string;
  quantity: string;
  description: string;
  image: File | string | null;
  alt: string;
}

interface Benefit {
  title: string;
  description: string;
  image?: File | string | null;
  alt?: string;
}

interface Precaution {
  title: string;
  description: string;
  image?: File | string | null;
  alt?: string;
}

interface TargetAudience {
  idealFor: string[];
  consultDoctor: string[];
}

interface ProductState {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: string;
  salePrice: string;
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
  targetAudience: TargetAudience;
  comparison?: {
    headers: string[];
    rows: { title: string; cells: string[] }[];
  };
}

// Add QAItem interface for FAQ tab
interface QAItem {
  _id?: string;
  question: string;
  answer: string;
  status: string;
  type?: string;
  product?: string;
  referenceType?: string;
  referenceId?: string;
}



export default function EditProduct() {
  const [activeTab, setActiveTab] = useState(0);
  const [product, setProduct] = useState<ProductState>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    // price: "",
    // salePrice: "",
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
    targetAudience: {
      idealFor: [""],
      consultDoctor: [""],
    },
    comparison: {
      headers: [""],
      rows: [{ title: "", cells: [""] }],
    },
    custom_template: false,
    templateId: "",
    storyVideoUrl: "",
    showInAddons: false,
    isFrequentlyPurchased: false,
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
    { id: 10, name: "Target Audience", icon: Users, color: "bg-cyan-500" },
    { id: 11, name: "Template", icon: Layout, color: "bg-indigo-500" },
    { id: 12, name: "FAQ", icon: HelpCircle, color: "bg-gray-500" },
    { id: 13, name: "Comparison", icon: Layout, color: "bg-emerald-500" },
  ];

  // global alerts are dispatched via redux showAlert

  const dispatch = useDispatch();
  const { loading } = useSelector((state: any) => state.product);
  const { categories } = useSelector((state: any) => state.category);
  const { attributes } = useSelector((state: any) => state.attributes);
  const { brands } = useSelector((state: any) => state.brand);

  const { templates } = useAppSelector((state) => state.template);

  const params = useParams();
  const productId = params.id;
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  // Add FAQ state to product
  const [faqList, setFaqList] = useState<QAItem[]>([]);

  // Handlers
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
        localId: Math.random().toString(36).slice(2),
      }));
      setProduct({
        ...product,
        [fieldName]: [...product[fieldName], ...filesArray],
      });
    }
  };

  const updateImageAlt = (
    localId: string,
    fieldName: "images" | "descriptionImages",
    value: string
  ) => {
    const updatedImages = product[fieldName].map((img) =>
      img.localId === localId ? { ...img, alt: value } : img
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

  const addHowToUseStep = () => {
    setProduct({
      ...product,
      howToUseSteps: [...product.howToUseSteps, { title: "", description: "" }],
    });
  };

  const removeHowToUseStep = (index: number) => {
    if (product.howToUseSteps.length > 1) {
      setProduct({
        ...product,
        howToUseSteps: product.howToUseSteps.filter((_, i) => i !== index),
      });
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
      setProduct({
        ...product,
        highlights: product.highlights.filter((_, i) => i !== index),
      });
    }
  };

  const updateHighlight = (index: number, value: string) => {
    const updatedHighlights = product.highlights.map((highlight, i) =>
      i === index ? value : highlight
    );
    setProduct({ ...product, highlights: updatedHighlights });
  };

  const handleAttributeChange = (attributeId: string, checked: boolean) => {
    setProduct({
      ...product,
      attributeSet: checked
        ? [...product.attributeSet, attributeId]
        : product.attributeSet.filter((id) => id !== attributeId),
    });
  };

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
      setProduct({
        ...product,
        ingredients: product.ingredients.filter((_, i) => i !== index),
      });
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
      setProduct({
        ...product,
        benefits: product.benefits.filter((_, i) => i !== index),
      });
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
      setProduct({
        ...product,
        precautions: product.precautions.filter((_, i) => i !== index),
      });
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

  // Target Audience handlers
  const addIdealFor = () => {
    setProduct({
      ...product,
      targetAudience: {
        ...product.targetAudience,
        idealFor: [...product.targetAudience.idealFor, ""],
      },
    });
  };

  const removeIdealFor = (index: number) => {
    if (product.targetAudience.idealFor.length > 1) {
      setProduct({
        ...product,
        targetAudience: {
          ...product.targetAudience,
          idealFor: product.targetAudience.idealFor.filter((_, i) => i !== index),
        },
      });
    }
  };

  const updateIdealFor = (index: number, value: string) => {
    setProduct({
      ...product,
      targetAudience: {
        ...product.targetAudience,
        idealFor: product.targetAudience.idealFor.map((item, i) =>
          i === index ? value : item
        ),
      },
    });
  };

  const addConsultDoctor = () => {
    setProduct({
      ...product,
      targetAudience: {
        ...product.targetAudience,
        consultDoctor: [...product.targetAudience.consultDoctor, ""],
      },
    });
  };

  const removeConsultDoctor = (index: number) => {
    if (product.targetAudience.consultDoctor.length > 1) {
      setProduct({
        ...product,
        targetAudience: {
          ...product.targetAudience,
          consultDoctor: product.targetAudience.consultDoctor.filter(
            (_, i) => i !== index
          ),
        },
      });
    }
  };

  const updateConsultDoctor = (index: number, value: string) => {
    setProduct({
      ...product,
      targetAudience: {
        ...product.targetAudience,
        consultDoctor: product.targetAudience.consultDoctor.map((item, i) =>
          i === index ? value : item
        ),
      },
    });
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

    const storyFile = (product as any).storyVideoUrl;
    if (storyFile instanceof File) {
      formData.append("storyVideoUrl", storyFile);
    }

    product.searchKeywords.forEach((kw, index) => {
      formData.append(`searchKeywords[${index}]`, kw);
    });

    product.images.forEach((image, index) => {
      if (image.file instanceof File) {
        formData.append(`images[${index}].file`, image.file);
      }
      formData.append(`images[${index}].alt`, image.alt);
    });

    if (product.thumbnail && product.thumbnail.file) {
      if (product.thumbnail.file instanceof File) {
        formData.append("thumbnail.file", product.thumbnail.file);
      }
      formData.append("thumbnail.alt", product.thumbnail.alt);
    }

    product.descriptionImages.forEach((image, index) => {
      if (image.file instanceof File) {
        formData.append(`descriptionImages[${index}].file`, image.file);
      }
      formData.append(`descriptionImages[${index}].alt`, image.alt);
    });

    product.howToUseSteps.forEach((step, index) => {
      formData.append(`howToUseSteps[${index}].title`, step.title);
      formData.append(`howToUseSteps[${index}].description`, step.description);
    });

    product.highlights.forEach((highlight, index) => {
      formData.append(`highlights[${index}]`, highlight);
    });

    if (product.attributeSet.length === 0) {
      // Send a dummy value to ensure the key exists, backend will filter it out
      formData.append(`attributeSet[0].attributeId`, "");
    } else {
      product.attributeSet.forEach((attributeId, index) => {
        formData.append(`attributeSet[${index}].attributeId`, attributeId);
      });
    }

    product.ingredients.forEach((ing, index) => {
      formData.append(`ingredients[${index}].name`, ing.name);
      formData.append(`ingredients[${index}].quantity`, ing.quantity);
      formData.append(`ingredients[${index}].description`, ing.description);
      if (ing.image instanceof File) {
        formData.append(`ingredients[${index}].image`, ing.image);
      } else if (typeof ing.image === "string") {
        formData.append(`ingredients[${index}].image`, ing.image);
      } else {
        formData.append(`ingredients[${index}].image`, "");
      }
      formData.append(`ingredients[${index}].alt`, ing.alt);
    });

    product.benefits.forEach((b, index) => {
      formData.append(`benefits[${index}].title`, b.title);
      formData.append(`benefits[${index}].description`, b.description);
      if (b.image instanceof File) {
        formData.append(`benefits[${index}].image`, b.image);
      } else if (typeof b.image === "string") {
        formData.append(`benefits[${index}].image`, b.image);
      } else {
        formData.append(`benefits[${index}].image`, "");
      }
      formData.append(`benefits[${index}].alt`, b.alt);
    });

    product.precautions.forEach((p, index) => {
      formData.append(`precautions[${index}].title`, p.title);
      formData.append(`precautions[${index}].description`, p.description);
      if (p.image instanceof File) {
        formData.append(`precautions[${index}].image`, p.image);
      } else if (typeof p.image === "string") {
        formData.append(`precautions[${index}].image`, p.image);
      } else {
        formData.append(`precautions[${index}].image`, "");
      }
      formData.append(`precautions[${index}].alt`, p.alt);
    });

    // Add target audience
    product.targetAudience.idealFor.forEach((item, index) => {
      formData.append(`targetAudience.idealFor[${index}]`, item);
    });
    product.targetAudience.consultDoctor.forEach((item, index) => {
      formData.append(`targetAudience.consultDoctor[${index}]`, item);
    });

    if (product.custom_template) {
      formData.append("custom_template", "true");
      formData.append("templateId", product.templateId);
    }
    formData.append("isAddon", product.showInAddons);
    formData.append("isFrequentlyPurchased", product.isFrequentlyPurchased);
    if (product.comparison) {
      formData.append("comparison", JSON.stringify(product.comparison));
    }
    try {
      const response = await dispatch(
        updateProduct({ id: productId, data: formData })
      );
      if (updateProduct.fulfilled.match(response)) {
        dispatch(
          showAlert({
            message: "Product updated successfully!",
            type: "success",
          })
        );
        // toast.success("Product updated successfully!", {
        //   duration: 4000,
        //   position: "top-right",
        // });
        // Give the toast a moment to appear then navigate back to product list
        setTimeout(() => {
          navigate("/product/list");
        }, 900);
      } else {
        // Extract error message from the rejected action
        const errorMessage =
          typeof response.payload === "string"
            ? response.payload
            : (response.payload as any)?.message ||
            "Failed to update product. Please try again.";
        dispatch(showAlert({ message: errorMessage, type: "error" }));
      }
    } catch (err: any) {
      // When using unwrap(), if rejectWithValue was used, err is the rejected value (the message string)
      // Otherwise, it's the error object
      const errorMessage =
        typeof err === "string"
          ? err
          : err?.response?.data?.body?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update product. Please try again.";
      dispatch(showAlert({ message: errorMessage, type: "error" }));
    }
  };

  const getProductData = async () => {
    try {
      // Ensure categories are fetched before product data
      if (categories.length === 0) {
        await dispatch(fetchCategories()).unwrap();
      }
      const response = await dispatch(fetchProductById(productId)).unwrap();
      const data = response;
      console.log("Fetched product data:", data);
      setProduct({
        name: data.name || "",
        description: data.description || "",
        category: data.category?._id || data.category || "",
        subcategory: data.subcategory?._id || data.subcategory || "",
        brand: data.brand?._id || data.brand || "",
        storyVideoUrl: data.storyVideoUrl || "",
        // price: data.price || "",
        // salePrice: data.salePrice || "",
        images:
          data.images?.map((img: any) => ({
            file: img.url || img,
            alt: img.alt || "",
            _id: img._id || "",
            localId: img._id || Math.random().toString(36).slice(2),
          })) || [],
        thumbnail: data.thumbnail
          ? {
            file: data.thumbnail.url || data.thumbnail,
            alt: data.thumbnail.alt || "",
          }
          : null,
        howToUseTitle: data.howToUseTitle || "",
        howToUseVideo: data.howToUseVideo || "",
        howToUseSteps: data.howToUseSteps || [{ title: "", description: "" }],
        descriptionImages:
          data.descriptionImages?.map((img: any) => ({
            file: img.url || img,
            alt: img.alt || "",
            _id: img._id || "",
            localId: img._id || Math.random().toString(36).slice(2),
          })) || [],
        descriptionVideo: data.descriptionVideo || "",
        highlights: data.highlights || [""],
        attributeSet:
          data.attributeSet?.map(
            (att: any) => att.attributeId?._id || att.attributeId
          ) || [],
        status: data.status || "active",
        ingredients: data.ingredients?.map((ing: any) => ({
          name: ing.name || "",
          quantity: ing.quantity || "",
          description: ing.description || "",
          image: ing.image?.url || ing.image || null,
          alt: ing.image?.alt || "",
        })) || [
            { name: "", quantity: "", description: "", image: null, alt: "" },
          ],
        benefits: Object.values(data?.benefits)?.map((b: any) => ({
          title: b.title || "",
          description: b.description || "",
          image: b.image?.url || b.image || null,
          alt: b.image?.alt || "",
        })) || [{ title: "", description: "", image: null, alt: "" }],
        precautions: Object.values(data?.precautions)?.map((p: any) => ({
          title: p.title || "",
          description: p.description || "",
          image: p.image?.url || p.image || null,
          alt: p.image?.alt || "",
        })) || [{ title: "", description: "", image: null, alt: "" }],
        searchKeywords: data.searchKeywords || [""],
        targetAudience: {
          idealFor: data.targetAudience?.idealFor || [""],
          consultDoctor: data.targetAudience?.consultDoctor || [""],
        },
        custom_template: data.custom_template || false,
        templateId: data.templateId || "",
        showInAddons: data.isAddon || false,
        isFrequentlyPurchased: data.isFrequentlyPurchased || false,
        comparison: (() => {
          const comp = data.comparison ?? data.comparisonTable ?? null;
          if (!comp) return { headers: [""], rows: [{ title: "", cells: [""] }] };
          try {
            if (typeof comp === "string") return JSON.parse(comp);
            return comp;
          } catch (e) {
            return { headers: [""], rows: [{ title: "", cells: [""] }] };
          }
        })(),
      });
    } catch (error) {
      console.error("Error fetching product data:", error);
      dispatch(
        showAlert({ message: "Failed to fetch product data.", type: "error" })
      );
    }
  };

  const getSubcategories = async () => {
    if (!product.category) return;
    try {
      const res = await dispatch(
        getSubcategoriesByCategory(product.category)
      ).unwrap();
      setSubcategories(res || []);
      console.log("Fetched subcategories:", res);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      dispatch(
        showAlert({ message: "Failed to fetch subcategories.", type: "error" })
      );
    }
  };

  // Update FAQ handler
  const handleUpdateFaq = async (faq: QAItem) => {
    if (!faq._id) return;
    try {
      await dispatch(
        updateFaq({
          id: faq._id,
          faqData: {
            question: faq.question,
            answer: faq.answer,
            status: faq.status,
            type: "product", // always product
            product: productId, // always current product id
            referenceType: faq.referenceType || "product",
            referenceId: faq.referenceId || productId,
          },
        })
      ).unwrap();
      toast.success("FAQ updated!");
    } catch (err) {
      toast.error("FAQ update failed!");
    }
  };

  // Reference types and options for FAQ tab
  const referenceTypes = [
    { value: "product", label: "Product" },

    // ...add more types if needed
  ];
  const referenceOptions = {
    product: [
      { value: productId || "", label: product.name || "Current Product" },
    ],
    category: categories.map((cat: Category) => ({
      value: cat._id,
      label: cat.name,
    })),
    // ...add more if needed
  };

  // AddQA handler for FAQ tab
  const addQA = () => {
    setFaqList([
      ...faqList,
      {
        question: "",
        answer: "",
        status: "active",
        type: "product", // always product
        product: productId || "",
        referenceType: "product",
        referenceId: productId || "",
      },
    ]);
  };

  // Update QA handler for FAQ tab
  const updateQA = (index: number, field: keyof QAItem, value: any) => {
    setFaqList((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
            ...item,
            [field]: value,
            type: "product", // always product
            product: productId || "",
          }
          : item
      )
    );
  };

  // Remove QA handler for FAQ tab
  const removeQA = (index: number) => {
    setFaqList((prev) => prev.filter((_, i) => i !== index));
  };

  // Comparison handlers
  const addComparisonHeader = () => {
    setProduct((prev) => ({
      ...prev,
      comparison: {
        ...(prev.comparison || { headers: [""], rows: [] }),
        headers: [...(prev.comparison?.headers || [""]), ""],
        rows: (prev.comparison?.rows || []).map((r) => ({
          ...r,
          cells: [...(r.cells || []), ""],
        })),
      },
    }));
  };

  const removeComparisonHeader = (index: number) => {
    setProduct((prev) => {
      const comp = prev.comparison || { headers: [], rows: [] };
      const headers = comp.headers.filter((_, i) => i !== index);
      const rows = comp.rows.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== index) }));
      return { ...prev, comparison: { headers, rows } };
    });
  };

  const updateComparisonHeader = (index: number, value: string) => {
    setProduct((prev) => {
      const comp = prev.comparison || { headers: [], rows: [] };
      const headers = comp.headers.map((h, i) => (i === index ? value : h));
      return { ...prev, comparison: { ...comp, headers } };
    });
  };

  const addComparisonRow = () => {
    setProduct((prev) => ({
      ...prev,
      comparison: {
        ...(prev.comparison || { headers: [""], rows: [] }),
        rows: [
          ...(prev.comparison?.rows || []),
          { title: "", cells: prev.comparison?.headers.map(() => "") || [""] },
        ],
      },
    }));
  };

  const removeComparisonRow = (index: number) => {
    setProduct((prev) => {
      const comp = prev.comparison || { headers: [], rows: [] };
      const rows = comp.rows.filter((_, i) => i !== index);
      return { ...prev, comparison: { ...comp, rows } };
    });
  };

  const updateComparisonRowTitle = (rowIndex: number, value: string) => {
    setProduct((prev) => {
      const comp = prev.comparison || { headers: [], rows: [] };
      const rows = comp.rows.map((r, i) => (i === rowIndex ? { ...r, title: value } : r));
      return { ...prev, comparison: { ...comp, rows } };
    });
  };

  const updateComparisonCell = (rowIndex: number, cellIndex: number, value: string) => {
    setProduct((prev) => {
      const comp = prev.comparison || { headers: [], rows: [] };
      const rows = comp.rows.map((r, i) => {
        if (i !== rowIndex) return r;
        const cells = r.cells.map((c, ci) => (ci === cellIndex ? value : c));
        return { ...r, cells };
      });
      return { ...prev, comparison: { ...comp, rows } };
    });
  };

  const removeImage = (
    localId: string | undefined,
    fieldName: "images" | "descriptionImages"
  ) => {
    if (!localId) return;
    const updatedImages = product[fieldName].filter(
      (img) => img.localId !== localId
    );
    setProduct({ ...product, [fieldName]: updatedImages });
  };

  const handleRemoveImage = async (
    image: any,
    fieldName: "images" | "descriptionImages"
  ) => {
    try {
      console.log("Removing image:", image);
      if (image._id) {
        await axiosInstance.delete(`/product/image/${image._id}`);
        console.log("Image removed successfully from server");

        // After server deletion, re-fetch the product images only to sync ids
        try {
          if (productId) {
            const resp = await dispatch(fetchProductById(productId)).unwrap();
            const latestImages =
              resp.images?.map((img: any) => ({
                file: img.url || img,
                alt: img.alt || "",
                _id: img._id || "",
                localId: img._id || Math.random().toString(36).slice(2),
              })) || [];
            const latestDescriptionImages =
              resp.descriptionImages?.map((img: any) => ({
                file: img.url || img,
                alt: img.alt || "",
                _id: img._id || "",
                localId: img._id || Math.random().toString(36).slice(2),
              })) || [];

            setProduct((prev) => ({
              ...prev,
              images: latestImages,
              descriptionImages: latestDescriptionImages,
            }));
            return;
          }
        } catch (fetchErr) {
          console.error("Failed to re-fetch images after delete:", fetchErr);
          // fallback to removing locally
          removeImage(image.localId, fieldName);
          return;
        }
      }

      // If image had no server id or re-fetch not performed, remove locally
      removeImage(image.localId, fieldName);
    } catch (error) {
      console.error("Error removing image:", error);
      dispatch(
        showAlert({ message: "Failed to remove image.", type: "error" })
      );
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and attributes first
        await Promise.all([
          categories.length === 0 && dispatch(fetchCategories()).unwrap(),
          attributes.length === 0 && dispatch(fetchAttributes()).unwrap(),
        ]);
        // Fetch product data
        await getProductData();
      } catch (error) {
        console.error("Error in initial data fetch:", error);
      }
    };
    fetchData();
  }, [dispatch, productId]);

  useEffect(() => {
    if (product.category) {
      getSubcategories();
    } else {
      setSubcategories([]);
      setProduct((prev) => ({ ...prev, subcategory: "" }));
    }

    if (brands?.length === 0) {
      dispatch(fetchBrands()).unwrap();
    }
  }, [product.category]);

  useEffect(() => {
    if (templates?.length === 0) {
      dispatch(fetchTemplates()).unwrap();
    }
  }, [dispatch]);

  // On product fetch, set FAQ list
  useEffect(() => {
    // If product has faqs, setFaqList
    if ((product as any).faqs) {
      setFaqList(
        (product as any).faqs.map((faq: QAItem) => ({
          ...faq,
          type: "product", // always product
          product: productId || "",
        }))
      );
    }
  }, [product]);

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
                  {subcategories.map((sub: Category) => (
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
                  onChange={(value) =>
                    setProduct({ ...product, description: value })
                  }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  name="isFrequentlyPurchased"
                  id="isFrequentlyPurchased"
                  checked={product.isFrequentlyPurchased}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      isFrequentlyPurchased: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-800 transition-all duration-200"
                ></input>
                <label
                  htmlFor="isFrequentlyPurchased"
                  className="block  text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Is Frequently Purchased
                </label>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            {" "}
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
                        src={getImageUrl(product?.storyVideoUrl)}
                        alt="Product Story Preview"
                        className="w-full h-48 object-cover rounded-lg border shadow-sm"
                      />
                    ) : (
                      <video
                        src={getImageUrl(product?.storyVideoUrl)}
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
                  <div className="grid grid-cols-2 gap-3">
                    {product.images.map((image, index) => (
                      <div key={image.localId} className="relative group">
                        <img
                          src={getImageUrl(image.file)}
                          alt={image.alt || `Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) =>
                            updateImageAlt(
                              image.localId || "",
                              "images",
                              e.target.value
                            )
                          }
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                          placeholder={`Alt text for image ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image, "images")}
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
                      src={getImageUrl(product.thumbnail.file)}
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
                        onChange={(value) =>
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
                  <div className="grid grid-cols-2 gap-3">
                    {product.descriptionImages.map((image, index) => (
                      <div key={image.localId} className="relative group">
                        <img
                          src={getImageUrl(image.file)}
                          alt={image.alt || `Description ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) =>
                            updateImageAlt(
                              image.localId || "",
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
                            handleRemoveImage(image, "descriptionImages")
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

        case 13:
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comparison Table
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addComparisonHeader}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg transition-all duration-200 shadow-md"
                  >
                    <Plus size={16} />
                    Add Column
                  </button>
                  <button
                    type="button"
                    onClick={addComparisonRow}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg transition-all duration-200 shadow-md"
                  >
                    <Plus size={16} />
                    Add Row
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.comparison?.headers.map((h, hi) => (
                    <div key={hi} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateComparisonHeader(hi, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                        placeholder={`Column ${hi + 1} header`}
                      />
                      {product.comparison && product.comparison.headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComparisonHeader(hi)}
                          className="text-red-500 hover:text-red-700 p-2 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {product.comparison?.rows.map((row, ri) => (
                    <div
                      key={ri}
                      className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) => updateComparisonRowTitle(ri, e.target.value)}
                          className="w-2/3 rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                          placeholder="Row title"
                        />
                        <div className="flex items-center gap-2">
                          {product.comparison && (
                            <button
                              type="button"
                              onClick={() => removeComparisonRow(ri)}
                              className="text-red-500 hover:text-red-700 p-2 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {row.cells.map((cell, ci) => (
                          <input
                            key={ci}
                            type="text"
                            value={cell}
                            onChange={(e) => updateComparisonCell(ri, ci, e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                            placeholder={`Cell ${ci + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Attributes
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attributes.map((attribute: Attribute) => (
                  <div
                    key={attribute._id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 dark:border-gray-700 dark:hover:bg-indigo-900/20 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      id={`attribute-${attribute._id}`}
                      checked={product.attributeSet.includes(attribute._id)}
                      onChange={(e) =>
                        handleAttributeChange(attribute._id, e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor={`attribute-${attribute._id}`}
                      className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {attribute.name}
                    </label>
                  </div>
                ))}
              </div>
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
                    <div className="relative w-fit">
                      <img
                        src={getImageUrl(ingredient.image)}
                        alt={ingredient.alt || `Ingredient ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => updateIngredientImage(index, null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
                        title="Remove Image"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
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
                    onChange={(value) =>
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
                      <div className="relative w-fit">
                        <img
                          src={getImageUrl(benefit.image as any)}
                          alt={benefit.alt || `Benefit ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateBenefitImage(index, null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
                      onChange={(value) =>
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
                      <div className="relative w-fit">
                        <img
                          src={getImageUrl(precaution.image as any)}
                          alt={precaution.alt || `Precaution ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updatePrecautionImage(index, null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
                      onChange={(value) =>
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
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-cyan-200 dark:border-cyan-800">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Target Audience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Define who this product is perfect for and when to consult a doctor
              </p>
            </div>

            {/* Perfect for you if... */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  Perfect for you if...
                </label>
                <button
                  type="button"
                  onClick={addIdealFor}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
              {product.targetAudience.idealFor.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <span className="text-green-600 dark:text-green-400 mt-2 text-xl font-bold">
                    ✓
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateIdealFor(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="e.g., You need daily heart & circulation support"
                  />
                  <button
                    type="button"
                    onClick={() => removeIdealFor(index)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Consult a doctor if... */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-lg font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <span className="text-2xl">⚠</span>
                  Consult a doctor if...
                </label>
                <button
                  type="button"
                  onClick={addConsultDoctor}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
              {product.targetAudience.consultDoctor.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-start p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <span className="text-orange-600 dark:text-orange-400 mt-2 text-xl">
                    ⚠
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateConsultDoctor(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all duration-200"
                    placeholder="e.g., You have thyroid or severe autoimmune conditions"
                  />
                  <button
                    type="button"
                    onClick={() => removeConsultDoctor(index)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 11:
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

      case 12:
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

            {faqList.map((item, index) => (
              <div
                key={item._id || index}
                className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    Question {index + 1}
                  </h4>
                  {faqList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQA(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Reference slider and dropdown */}
                <div className="flex gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Reference Type
                    </label>
                    <select
                      value={item.referenceType || "product"}
                      onChange={(e) =>
                        updateQA(index, "referenceType", e.target.value)
                      }
                      className="rounded border px-2 py-1"
                    >
                      {referenceTypes.map((rt) => (
                        <option key={rt.value} value={rt.value}>
                          {rt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Reference
                    </label>
                    <select
                      value={item.referenceId || ""}
                      onChange={(e) =>
                        updateQA(index, "referenceId", e.target.value)
                      }
                      className="rounded border px-2 py-1"
                    >
                      <option value="">Select Reference</option>
                      {(
                        referenceOptions[item.referenceType || "product"] || []
                      ).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                {/* Update FAQ button */}
                {item._id && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdateFaq(item)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Update FAQ
                    </button>
                  </div>
                )}
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Product</h1>
            <p className="text-blue-100">Update your product details</p>
          </div>
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
          <div className="p-8">{renderTabContent()}</div>
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={getProductData}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Update Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#363636", color: "#fff" },
        }}
      />
      {/* Global alerts are rendered by AppLayout via Redux */}
    </div>
  );
}

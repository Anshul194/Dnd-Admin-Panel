import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Edit3,
  Save,
  X,
  Image,
  Type,
  Layout,
  Eye,
  Settings,
  Home,
  Package,
  Star,
  Info,
  Check,
  AlertCircle,
  Loader,
  Heart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  fetchHomePageContent,
  updateSectionContent,
  clearError,
} from "../../store/slices/contentSlice";
import axiosInstance from "../../services/axiosConfig";

const ProfessionalCMS = () => {
  const dispatch = useDispatch();
  const { sections, loading, updateLoading, error } = useSelector(
    (state) => state.content
  );
  console?.log("Content sections:", Object.keys(sections), sections);
  const BASE_IMAGE_URL =
    import.meta.env.VITE_IMAGE_URL || "http://localhost:3000/";

  const tabs = [
    { id: "hero", name: "Hero Section", icon: Home, color: "blue" },
    {
      id: "categoryPick",
      name: "Product Picker",
      icon: Package,
      color: "purple",
    },
    {
      id: "secondaryBanner",
      name: "Secondary Banner",
      icon: Image,
      color: "teal",
    },
    { id: "offerBanner", name: "Special Offers", icon: Star, color: "orange" },
    { id: "productSlider", name: "Product Slider", icon: Plus, color: "green" },
    { id: "whyUs", name: "Why Us", icon: Info, color: "indigo" },
    {
      id: "uniqueSellingPoints",
      name: "Unique Points",
      icon: Settings,
      color: "red",
    },
    {
      id: "genuineHeartStory",
      name: "Genuine Heart Story",
      icon: Heart,
      color: "pink",
    },
    {
      id: "blogs",
      name: "Blogs",
      icon: BookOpen,
      color: "yellow",
    },
    {
      id: "noConfusion",
      name: "No Confusion",
      icon: AlertCircle,
      color: "red",
    },
    {
      id: "3V",
      name: "3V",
      icon: Eye,
      color: "blue",
    },
  ];

  const [activeTab, setActiveTab] = useState("hero");
  const [editingSection, setEditingSection] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMobileImage, setSelectedMobileImage] = useState(null);
  const [editingHeroIndex, setEditingHeroIndex] = useState(null); // index in sections.hero
  const [isNewHero, setIsNewHero] = useState(false);
  const [homePageLayout, setHomePageLayout] = useState("");
  const [layoutLoading, setLayoutLoading] = useState(false);
  const tabsNavRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    dispatch(fetchHomePageContent());
  }, [dispatch]);

  // Auto-start editing when content loads (but don't auto-edit hero list)
  useEffect(() => {
    if (activeTab !== "hero" && sections[activeTab]?.[0] && !editingSection) {
      setEditingSection(activeTab);
      setFormData({ ...sections[activeTab][0].content });
    }
    // ensure hero editing index resets when sections change
    if (activeTab === "hero") {
      setEditingHeroIndex(null);
      setIsNewHero(false);
      setFormData({});
      setSelectedImage(null);
      setSelectedMobileImage(null);
    }
  }, [sections, activeTab, editingSection]);

  useEffect(() => {
    if (error) {
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus(null);
        dispatch(clearError());
      }, 5000);
    }
  }, [error, dispatch]);

  const updateTabArrows = () => {
    const el = tabsNavRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
  };

  useEffect(() => {
    updateTabArrows();
    const onResize = () => updateTabArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sections]);

  const handleSave = async (sectionType) => {
    console.log("submit function called : ", sectionType);
    let currentSection = null;
    let creating = false;
    if (sectionType === "hero") {
      if (editingHeroIndex === null) return;
      currentSection = sections.hero?.[editingHeroIndex];
      creating = !currentSection || !currentSection._id || isNewHero;
    } else {
      currentSection = sections[sectionType]?.[0];
      if (!currentSection) return;
    }

    try {
      // Create FormData to match your API expectations
      const apiFormData = new FormData();

      // Add content as JSON string - this is what your API expects
      apiFormData.append("content", JSON.stringify(formData));

      // Add optional section metadata only when available; for new items we'll set below

      if (selectedImage) {
        apiFormData.append("image", selectedImage);
      }
      if (selectedMobileImage) {
        apiFormData.append("mobileImage", selectedMobileImage);
      }

      let response;
      if (creating) {
        // Create new section entry
        apiFormData.append("sectionType", sectionType);
        // set order to end by default
        apiFormData.append(
          "order",
          ((sections[sectionType]?.length || 0) + 1).toString()
        );
        apiFormData.append("isVisible", "true");
        response = await axiosInstance.post(`/content`, apiFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Update existing - include metadata from currentSection when available
        if (currentSection) {
          apiFormData.append("sectionType", currentSection.sectionType);
          apiFormData.append(
            "order",
            (currentSection.order !== undefined
              ? currentSection.order
              : 1
            ).toString()
          );
          apiFormData.append(
            "isVisible",
            typeof currentSection.isVisible !== "undefined"
              ? currentSection.isVisible.toString()
              : "true"
          );
        }

        response = await axiosInstance.put(
          `/content?id=${currentSection._id}`,
          apiFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // Handle successful response
      if (response.data.success || response.data.data) {
        // Refresh content to get updated data
        dispatch(fetchHomePageContent());

        setEditingSection(null);
        if (sectionType === "hero") {
          setEditingHeroIndex(null);
          setIsNewHero(false);
        }
        setHasUnsavedChanges(false);
        setSaveStatus("success");
        setFormData({});
        setSelectedImage(null);
        setSelectedMobileImage(null);

        // Show success popup for longer duration
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handelHomePageLayoutChange = async (layout) => {
    // update active homepage layout via API
    try {
      setLayoutLoading(true);
      // Optimistic local update
      setHomePageLayout(layout);
      setFormData((prev) => ({ ...prev, selectedLayout: layout }));

      const payload = { activeHomepageLayout: layout };
      const response = await axiosInstance.put(`/settings`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // handle possible response patterns
      if (response?.data) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      console.error("Failed to update homepage layout:", error);
      setSaveStatus("error");
      // revert to previous if we can read it from server or clear selection
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setLayoutLoading(false);
    }
  };

  // Fetch current settings (activeHomepageLayout) on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLayoutLoading(true);
        const res = await axiosInstance.get(`/settings`);
        console.log("setting is ====> ", res);
        const active =
          res?.data?.setting?.activeHomepageLayout ||
          res?.setting?.activeHomePageLayout ||
          "";
        if (active) {
          setHomePageLayout(active);
          setFormData((prev) => ({ ...prev, selectedLayout: active }));
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLayoutLoading(false);
      }
    };

    fetchSettings();
  }, []);
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  // Helper to handle image preview URLs correctly
  const getPreviewUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${BASE_IMAGE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
  };

  const handleEdit = (sectionType) => {
    const sectionData = sections[sectionType]?.[0];
    if (sectionData) {
      setEditingSection(sectionType);
      // Initialize form data with current section content
      setFormData({ ...sectionData.content });
      setSelectedImage(null); // Reset selected image
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      handleFormChange();
    }
  };

  const handleMobileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMobileImage(file);
      handleFormChange();
    }
  };

  const handleDeleteImage = () => {
    setSelectedImage(null);
    setFormData((prev) => ({ ...prev, image: "" }));
    handleFormChange();
  };

  const handleDeleteMobileImage = () => {
    setSelectedMobileImage(null);
    setFormData((prev) => ({ ...prev, mobileImage: "" }));
    handleFormChange();
  };

  // Hero management: add / edit / delete handlers for multiple hero items
  const handleAddHero = () => {
    const nextIndex = sections.hero ? sections.hero.length : 0;
    setEditingHeroIndex(nextIndex);
    setIsNewHero(true);
    setFormData({ title: "", description: "", cta: { title: "", link: "" } });
    setSelectedImage(null);
    setSelectedMobileImage(null);
    setHasUnsavedChanges(true);
  };
  const handleDeleteHero = async (index) => {
    const hero = sections.hero?.[index];
    if (!hero || !hero._id) {
      // If it's an unsaved/new draft just reset
      if (editingHeroIndex === index) {
        setEditingHeroIndex(null);
        setIsNewHero(false);
        setFormData({});
        setSelectedImage(null);
        setSelectedMobileImage(null);
        setHasUnsavedChanges(false);
      }
      return;
    }

    if (!window.confirm("Are you sure you want to delete this hero item?"))
      return;
    try {
      const res = await axiosInstance.delete(`/content?id=${hero._id}`);
      if (res?.data) {
        dispatch(fetchHomePageContent());
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete hero:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };
  const handleEditHero = (index) => {
    const hero = sections.hero?.[index];
    if (!hero) return;
    setEditingHeroIndex(index);
    setIsNewHero(false);
    setFormData({ ...hero.content });
    setSelectedImage(null);
    setSelectedMobileImage(null);
    setHasUnsavedChanges(false);
    setEditingSection("hero");
  };

  const renderEditForm = (sectionType, sectionData) => {
    const updateFormData = (updates) => {
      setFormData((prev) => ({ ...prev, ...updates }));
      handleFormChange();
    };

    // Sections for which we should NOT show image / mobile image upload fields
    const excludedImageSections = [
      "genuineHeartStory",
      "blogs",
      "noConfusion",
      "3V",
    ];

    const renderFieldsByType = () => {
      switch (sectionType) {
        case "hero":
          const heroItems = sections.hero || [];
          return (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium dark:text-white">
                    Manage Hero Slides
                  </h4>
                  <div>
                    <button
                      onClick={handleAddHero}
                      className="inline-flex items-center space-x-2 px-3 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300"
                    >
                      <Plus size={14} />
                      <span className="text-sm">Add New Hero</span>
                    </button>
                  </div>
                </div>

                {heroItems.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No hero slides yet. Click "Add New Hero" to create one.
                  </div>
                )}

                {heroItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {heroItems.map((h, idx) => (
                      <div
                        key={h._id || idx}
                        className="border p-3 rounded-lg flex flex-col"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={
                                h.content?.image
                                  ? `${BASE_IMAGE_URL}${h.content.image}`
                                  : ""
                              }
                              alt={h.content?.title || `Hero ${idx + 1}`}
                              className="w-20 h-12 object-cover rounded-md border mr-2"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {h.content?.title || `Hero ${idx + 1}`}
                              </div>
                              {/* <div className="text-xs text-gray-500">
                                {h.content?.description?.slice?.(0, 80)}
                              </div> */}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditHero(idx)}
                              className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteHero(idx)}
                              className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* If a hero is selected for editing, show the hero fields */}
                {editingHeroIndex !== null ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title || ""}
                          onChange={(e) =>
                            updateFormData({ title: e.target.value })
                          }
                          className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                          placeholder="Enter hero title"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={formData.cta?.title || ""}
                          onChange={(e) =>
                            updateFormData({
                              cta: { ...formData.cta, title: e.target.value },
                            })
                          }
                          className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                          placeholder="Enter button text"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        Button Link
                      </label>
                      <input
                        type="text"
                        value={formData.cta?.link || ""}
                        onChange={(e) =>
                          updateFormData({
                            cta: { ...formData.cta, link: e.target.value },
                          })
                        }
                        className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        placeholder="Enter button link"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) =>
                          updateFormData({ description: e.target.value })
                        }
                        rows={4}
                        className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        placeholder="Enter detailed description"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Select a hero slide to edit or click "Add New Hero".
                  </div>
                )}
              </div>
            </>
          );

        case "categoryPick":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter section title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta?.title || ""}
                    onChange={(e) =>
                      updateFormData({
                        cta: { ...formData.cta, title: e.target.value },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter button text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Button Link
                </label>
                <input
                  type="text"
                  value={formData.cta?.link || ""}
                  onChange={(e) =>
                    updateFormData({
                      cta: { ...formData.cta, link: e.target.value },
                    })
                  }
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter button link"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter detailed description"
                />
              </div>
            </>
          );

        case "offerBanner":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ""}
                    onChange={(e) =>
                      updateFormData({ tagline: e.target.value })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter tagline"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter section title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter detailed description"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta?.title || ""}
                    onChange={(e) =>
                      updateFormData({
                        cta: { ...formData.cta, title: e.target.value },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter button text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.cta?.link || ""}
                    onChange={(e) =>
                      updateFormData({
                        cta: { ...formData.cta, link: e.target.value },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter button link"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Offer End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      formData.countdown?.endDate
                        ? new Date(formData.countdown.endDate)
                          .toISOString()
                          .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateFormData({
                        countdown: {
                          ...formData.countdown,
                          endDate: e.target.value,
                        },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  />
                </div>
              </div>
            </>
          );

        case "productSlider":
          return (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter section title"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (HTML allowed)
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter detailed description with HTML if needed"
                />
              </div>
            </>
          );

        case "whyUs":
          return (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter section title"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter detailed description"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Points (one per line)
                </label>
                <textarea
                  value={formData.points?.join("\n") || ""}
                  onChange={(e) =>
                    updateFormData({
                      points: e.target.value
                        .split("\n")
                        .filter((point) => point.trim()),
                    })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter points, one per line"
                />
              </div>
            </>
          );

        case "uniqueSellingPoints":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter section title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta?.title || ""}
                    onChange={(e) =>
                      updateFormData({
                        cta: { ...formData.cta, title: e.target.value },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter button text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter detailed description"
                />
              </div>

              {/* Cards Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Feature Cards
                </label>
                {formData.cards?.map((card, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Card {index + 1}
                      </h4>
                      <button
                        onClick={() => {
                          const newCards = [...(formData.cards || [])];
                          newCards.splice(index, 1);
                          updateFormData({ cards: newCards });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={card.tag || ""}
                        onChange={(e) => {
                          const newCards = [...(formData.cards || [])];
                          newCards[index] = { ...card, tag: e.target.value };
                          updateFormData({ cards: newCards });
                        }}
                        placeholder="Tag (e.g., 01 FEATURE)"
                        className="p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                      />
                      <input
                        type="text"
                        value={card.title || ""}
                        onChange={(e) => {
                          const newCards = [...(formData.cards || [])];
                          newCards[index] = { ...card, title: e.target.value };
                          updateFormData({ cards: newCards });
                        }}
                        placeholder="Card title"
                        className="p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                      />
                      <textarea
                        value={card.description || ""}
                        onChange={(e) => {
                          const newCards = [...(formData.cards || [])];
                          newCards[index] = {
                            ...card,
                            description: e.target.value,
                          };
                          updateFormData({ cards: newCards });
                        }}
                        placeholder="Card description"
                        rows={2}
                        className="p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCards = [
                      ...(formData.cards || []),
                      { tag: "", title: "", description: "" },
                    ];
                    updateFormData({ cards: newCards });
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-300"
                >
                  <Plus size={16} className="inline mr-2" />
                  Add New Card
                </button>
              </div>
            </>
          );

        case "genuineHeartStory":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter section title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none"
                  placeholder="Enter detailed description"
                />
              </div>
            </>
          );

        case "blogs":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter section title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none"
                  placeholder="Enter detailed description"
                />
              </div>
            </>
          );

        case "noConfusion":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter section title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none"
                  placeholder="Enter detailed description"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta?.title || ""}
                    onChange={(e) =>
                      updateFormData({
                        cta: { ...formData.cta, title: e.target.value },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter button text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.cta?.link || ""}
                    onChange={(e) =>
                      updateFormData({
                        cta: { ...formData.cta, link: e.target.value },
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter button link"
                  />
                </div>
              </div>
            </>
          );

        case "3V":
          return (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Enter section title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none"
                  placeholder="Enter detailed description"
                />
              </div>
            </>
          );

        case "secondaryBanner":
          // For secondary banner we only need image, mobile image uploads,
          // and a single link field. The shared image upload UI (below)
          // will still render because this id is not in
          // `excludedImageSections`.
          return (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Link
                </label>
                <input
                  type="text"
                  value={formData.cta?.link || ""}
                  onChange={(e) =>
                    updateFormData({
                      cta: { ...formData.cta, link: e.target.value },
                    })
                  }
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="Enter link (e.g., https://example.com)"
                />
              </div>
            </>
          );

        default:
          return (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Enter section title"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none"
                  placeholder="Enter detailed description"
                />
              </div>
            </>
          );
      }
    };

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg dark:from-blue-900 dark:to-indigo-900 dark:border-gray-700 dark:bg-gradient-to-br">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl dark:from-slate-900 dark:to-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <Edit3 size={24} />
                <span>Edit {tabs.find((t) => t.id === sectionType)?.name}</span>
              </h3>
              <p className="text-blue-100 mt-1 dark:text-blue-50">
                Make changes to your content below
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSection(null);
                setHasUnsavedChanges(false);
                setFormData({});
                setSelectedImage(null);
                setSelectedMobileImage(null);
                if (sectionType === "hero") {
                  setEditingHeroIndex(null);
                  setIsNewHero(false);
                }
              }}
              className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {renderFieldsByType()}

          {/* Only show image upload + previews when the section is NOT in excluded list */}
          {!excludedImageSections.includes(sectionType) && (
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2 dark:text-gray-200">
                  <Image size={16} />
                  <span>Upload Image</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              </div>

              {(formData.image || selectedImage) && (
                <div className="mt-2 relative inline-block group">
                  <img
                    src={
                      selectedImage
                        ? URL.createObjectURL(selectedImage)
                        : getPreviewUrl(formData.image)
                    }
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  {/* Debug info - remove if verified */}
                  {/* <p className="text-xs text-gray-400 max-w-[200px] break-all">{formData.image}</p> */}
                  <button
                    onClick={handleDeleteImage}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2 dark:text-gray-200">
                  <Image size={16} />
                  <span>Upload Mobile Image</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMobileImageChange}
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              </div>

              {(formData.mobileImage || selectedMobileImage) && (
                <div className="mt-2 relative inline-block group">
                  <p className="text-xs text-gray-500 mb-1">Mobile preview</p>
                  <div className="relative inline-block">
                    <img
                      src={
                        selectedMobileImage
                          ? URL.createObjectURL(selectedMobileImage)
                          : getPreviewUrl(formData.mobileImage)
                      }
                      alt="Mobile Preview"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    {/* <p className="text-xs text-gray-400 max-w-[200px] break-all">{formData.mobileImage}</p> */}
                    <button
                      onClick={handleDeleteMobileImage}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Mobile Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-blue-200 bg-white/50 -mx-6 px-6 py-4 rounded-b-xl dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg dark:text-orange-300 dark:bg-orange-900/20">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg dark:text-red-300 dark:bg-red-900/20">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditingSection(null);
                  setHasUnsavedChanges(false);
                  setFormData({});
                  setSelectedImage(null);
                  setSelectedMobileImage(null);
                }}
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(sectionType)}
                disabled={updateLoading || !hasUnsavedChanges}
                className={`px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-medium shadow-lg disabled:opacity-50 ${updateLoading
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : hasUnsavedChanges
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {updateLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
          <Loader size={24} className="animate-spin" />
          <span>Loading content...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Success Popup Notification */}
      {saveStatus === "success" && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-auto animate-in slide-in-from-right-full duration-300">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Changes Saved Successfully!
                </h3>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  Your {tabs.find((t) => t.id === activeTab)?.name} content has
                  been updated.
                </p>
              </div>
              <button
                onClick={() => setSaveStatus(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup Notification */}
      {saveStatus === "error" && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-auto animate-in slide-in-from-right-full duration-300">
          <div className="bg-white rounded-lg shadow-2xl border border-red-200 p-4 max-w-sm dark:bg-gray-800 dark:border-red-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={16} className="text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Save Failed
                </h3>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  {error ||
                    "There was an error saving your changes. Please try again."}
                </p>
              </div>
              <button
                onClick={() => setSaveStatus(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Content Management System
                </h1>
                <p className="text-gray-600 mt-1 dark:text-gray-300">
                  Manage your website content
                </p>
                {/* Debug info */}
                <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                  Available sections:{" "}
                  {Object.keys(sections).length > 0
                    ? Object.keys(sections).join(", ")
                    : "Loading..."}
                </p>

                {/* Initial mobile preview for the active section if available */}
                {sections[activeTab]?.[0]?.content?.mobileImage && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Mobile preview:
                    </div>
                    <img
                      src={`${BASE_IMAGE_URL}${sections[activeTab][0].content.mobileImage}`}
                      alt="Mobile preview"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Tab Navigation */}
          <div className="px-6 pb-0 relative">
            {/* Left arrow (shows when there's hidden tabs to the left) */}
            {showLeftArrow && (
              <button
                onClick={() =>
                  tabsNavRef.current?.scrollBy({
                    left: -240,
                    behavior: "smooth",
                  })
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-white dark:bg-gray-700 rounded-full shadow flex items-center justify-center"
                aria-label="scroll left"
              >
                <ChevronLeft className="dark:text-white" size={18} />
              </button>
            )}

            {/* Right arrow (shows when there's hidden tabs to the right) */}
            {showRightArrow && (
              <button
                onClick={() =>
                  tabsNavRef.current?.scrollBy({
                    left: 240,
                    behavior: "smooth",
                  })
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-white dark:bg-gray-700 rounded-full shadow flex items-center justify-center"
                aria-label="scroll right"
              >
                <ChevronRight className="dark:text-white" size={18} />
              </button>
            )}

            <nav
              ref={tabsNavRef}
              onScroll={updateTabArrows}
              className="flex space-x-1 overflow-x-auto max-w-6xl px-2"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const hasContent =
                  sections[tab.id] && sections[tab.id].length > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Automatically start editing when switching tabs
                      if (sections[tab.id]?.[0]) {
                        setEditingSection(tab.id);
                        setFormData({ ...sections[tab.id][0].content });
                        setSelectedImage(null);
                        setSelectedMobileImage(null);
                      }
                    }}
                    className={`flex min-w-fit items-center space-x-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-all relative ${isActive
                      ? "text-blue-600 shadow-sm border-t border-l border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Icon size={16} />
                    <span>{tab.name}</span>
                    {/* Content indicator */}
                    {hasContent && (
                      <div
                        className={`w-2 h-2 rounded-full ${isActive ? "bg-blue-600" : "bg-green-500"
                          }`}
                      ></div>
                    )}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto p-6 mt-4 bg-white rounded-xl shadow-sm border dark:bg-gray-900 dark:border-gray-700">
        <div className="mx-auto p-6 pb-0 ">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">
            Select home page layout
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {["Modern & Detailed UI", "Minimal & Organic UI"].map((layout) => {
              const selectedLayout =
                homePageLayout || formData.selectedLayout || "";
              const isSelected = selectedLayout === layout;
              return (
                <button
                  key={layout}
                  type="button"
                  onClick={() => {
                    // Immediate local update and call API to persist change
                    setFormData((prev) => ({
                      ...prev,
                      selectedLayout: layout,
                    }));
                    handelHomePageLayoutChange(layout);
                  }}
                  disabled={layoutLoading}
                  className={`relative p-4 border rounded-lg text-left transition-colors text-sm ${isSelected
                    ? "border-blue-600 shadow-lg bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 dark:bg-gray-800"
                    }`}
                >
                  <h2 className="text-lg dark:text-white">{layout}</h2>
                  {layoutLoading && (
                    <div className="absolute top-2 right-2 text-xs text-gray-500">
                      Updating...
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border dark:bg-gray-900 dark:border-gray-700">
          {/* Section Header */}
          <div className="border-b bg-gray-50/50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit {tabs.find((t) => t.id === activeTab)?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">
                  Make changes to your content below
                </p>
                {/* Show current section info */}
                {sections[activeTab]?.[0] && (
                  <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                    Section ID: {sections[activeTab][0]._id} | Visible:{" "}
                    {sections[activeTab][0].isVisible ? "Yes" : "No"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* {sections[activeTab]?.[0] ? (
              renderEditForm(activeTab, sections[activeTab]?.[0])
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No content available for this section</p>
                <p className="text-sm mt-2">
                  Available sections: {Object.keys(sections).join(", ")}
                </p>
              </div>
            )} */}
            {renderEditForm(activeTab, sections[activeTab]?.[0])}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCMS;

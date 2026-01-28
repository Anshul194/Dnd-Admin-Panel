const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "http://localhost:3000";

/**
 * Robustly constructs an image URL.
 * Handles strings, objects with url property, and local File objects.
 * Prevents double slashes and ensures the base URL is prepended correctly.
 */
export const getImageUrl = (image: any): string => {
    if (!image) return "";

    // If it's a File object (from <input type="file">), create a local blob URL
    if (image instanceof File) {
        return URL.createObjectURL(image);
    }

    let path = "";
    if (typeof image === "string") {
        path = image;
    } else if (typeof image === "object" && image.url) {
        path = image.url;
    }

    if (!path) return "";

    // If path is already absolute, return it
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
        return path;
    }

    // Normalize slashes: ensure path starts with / and base URL doesn't end with /
    const normalizedBase = IMAGE_URL.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}`;
};

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

    // If path is already absolute, normalize it and return
    if (path.startsWith("http://") || path.startsWith("https://")) {
        // Normalize path in full URL: convert "Uploads" to "uploads" for case-sensitive servers
        const normalizedUrl = path.replace(/\/Uploads\//gi, "/uploads/");
        return normalizedUrl;
    }

    if (path.startsWith("blob:")) {
        return path;
    }

    // Normalize path: convert "Uploads" to "uploads" for case-sensitive servers
    let normalizedPath = path.replace(/\/Uploads\//gi, "/uploads/");
    
    // Normalize slashes: ensure path starts with / and base URL doesn't end with /
    const normalizedBase = IMAGE_URL.replace(/\/+$/, "");
    normalizedPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;

    return `${normalizedBase}${normalizedPath}`;
};

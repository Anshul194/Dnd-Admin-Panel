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

    const originalPath = path; // Store for debugging
    
    // Normalize path FIRST: convert "Uploads" to "uploads" for case-sensitive servers (Linux)
    // This handles existing database entries that may have "Uploads" with capital U
    // Do this BEFORE checking for full URLs so we normalize production URLs too
    // Use multiple patterns to catch all variations
    path = path.replace(/\/Uploads\//gi, "/uploads/");
    path = path.replace(/\/Uploads\//g, "/uploads/"); // Case-sensitive fallback
    path = path.replace(/Uploads\//gi, "uploads/"); // Without leading slash
    
    // Remove any duplicate /uploads/uploads/ patterns
    path = path.replace(/\/uploads\/uploads\//gi, "/uploads/");
    path = path.replace(/\/uploads\/\/uploads\//gi, "/uploads/");
    
    // If path is already absolute, check if we need to convert it
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
        // In development (localhost), convert production URLs to localhost (Next.js server)
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const isLocalhost = hostname === 'localhost' ||
                               hostname === '127.0.0.1' ||
                               hostname.includes('localhost') ||
                               hostname.endsWith('.localhost');

            // If we're running on localhost and the URL is a production URL, convert it to Next.js server
            if (isLocalhost && (path.includes('nexprism.in') || path.includes('bharat.nexprism.in'))) {
                try {
                    const urlObj = new URL(path);
                    const pathSegment = urlObj.pathname;
                    // Normalize path segment: convert "Uploads" to "uploads" (in case it wasn't normalized)
                    const normalizedPath = pathSegment.replace(/\/Uploads\//gi, "/uploads/");
                    // Use Next.js server port (3001) for images when admin runs on port 5173
                    const nextJsPort = window.location.port === '5173' ? '3001' : window.location.port;
                    const convertedUrl = `${window.location.protocol}//${window.location.hostname}:${nextJsPort}${normalizedPath}`;
                    console.log(`[Admin getImageUrl] Converting production URL to localhost: ${path} -> ${convertedUrl}`);
                    path = convertedUrl;
                } catch (e) {
                    console.warn(`[Admin getImageUrl] Failed to parse URL for conversion:`, path, e);
                }
            }
        }
        
        // Ensure no double slashes
        path = path.replace(/\/\//g, "/").replace(/http:\//g, "http://").replace(/https:\//g, "https://");
        
        // Debug logging in development
        if (import.meta.env.DEV && originalPath !== path) {
            console.log("[Admin getImageUrl] Normalized full URL:", {
                original: originalPath,
                normalized: path,
                changed: originalPath !== path
            });
        }
        
        return path;
    }

    // Normalize slashes: ensure path starts with / and base URL doesn't end with /
    // In development (localhost), use Next.js server for images
    let baseUrl = IMAGE_URL;
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' ||
                           hostname === '127.0.0.1' ||
                           hostname.includes('localhost') ||
                           hostname.endsWith('.localhost');

        if (isLocalhost) {
            // Use Next.js server port (3001) for images when admin runs on port 5173
            const nextJsPort = window.location.port === '5173' ? '3001' : window.location.port;
            baseUrl = `${window.location.protocol}//${window.location.hostname}:${nextJsPort}`;
            if (import.meta.env.DEV) {
                console.log(`[Admin getImageUrl] Using Next.js server (${baseUrl}) for development`);
            }
        }
    }
    
    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}`;
};

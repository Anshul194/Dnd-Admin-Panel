import axiosInstance from "./axiosConfig";

export interface InitiateCallRequest {
  leadId: string;
}

export interface InitiateCallResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Initiate a call to a lead
 */
export const initiateCall = async (
  leadId: string
): Promise<InitiateCallResponse> => {
  try {
    const response = await axiosInstance.post<InitiateCallResponse>(
      "/call/initiate",
      { leadId }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to initiate call"
    );
  }
};
/**
 * Fetch the recording link from MyOperator
 */
export const fetchRecordingLink = async (
  file: string
): Promise<string | null> => {
  try {
    const response = await axiosInstance.get("/ivr/recording-link", {
      params: { file }
    });

    const data = response.data;
    console.log("Recording Link API Response:", data);

    // Support diverse payload structures
    if (data.status === "success" || data.success === true || data.status === 200) {
      const link = data.data?.link || data.link || data.url;
      if (link) return link;
    }

    // Fallback directly to keys if status check failed
    if (data.link) return data.link;
    if (data.data?.link) return data.data.link;

    console.warn("Recording link not found in successful response:", data);
    return null;
  } catch (error: any) {
    console.error("Failed to fetch recording link via proxy:", error.response?.data || error.message);
    return null;
  }
};

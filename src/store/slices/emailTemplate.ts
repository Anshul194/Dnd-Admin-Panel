import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosConfig';

interface EmailTemplate {
    _id: string;
    name: string;
    subject: string;
    from?: string;
    content?: string;
    status?: 'active' | 'inactive';
    description?: string;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface EmailTemplateState {
    templates: EmailTemplate[];
    currentTemplate: EmailTemplate | null;
    loading: boolean;
    error: string | null;
    deleteLoading: boolean;
}

const initialState: EmailTemplateState = {
    templates: [],
    currentTemplate: null,
    loading: false,
    error: null,
    deleteLoading: false,
};

export const fetchEmailTemplates = createAsyncThunk(
    'emailTemplates/fetchEmailTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/email-templates');
            console?.log("e-templates fetched", response.data);
            return response.data.data || response.data?.emailTemplates?.data
;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to fetch email templates'
            );
        }
    }
);


export const updateEmailTemplate = createAsyncThunk(
    'emailTemplates/updateEmailTemplate',
    async (
        {
            id,
            data,
        }: {
            id: string;
            data: {
                name?: string;
                subject?: string;
                from?: string;
                content?: string;
                description?: string;
                type?: string;
                status?: 'active' | 'inactive';
            };
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axiosInstance.put(`/email-templates/${id}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to update email template'
            );
        }
    }
);

export const deleteEmailTemplate = createAsyncThunk(
    'emailTemplates/deleteEmailTemplate',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/email-templates/${id}`);
            return { id, ...response.data };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to delete email template'
            );
        }
    }
);

export const sendEmailTemplate = createAsyncThunk(
    'emailTemplates/sendEmailTemplate',
    async (
        {
            id,
            data,
        }: {
            id: string;
            data: {
                fullName: string;
                email: string;
                phone: string;
                source: string;
                status: string;
                score: number;
                tags: string[];
            };
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axiosInstance.post(
                `/email-templates/${id}/send`,
                data
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to send email template'
            );
        }
    }
);

export const fetchEmailTemplateById = createAsyncThunk(
    'emailTemplates/fetchEmailTemplateById',
    async (id: string, { rejectWithValue }) => {
        try {
            // Validate ID format before making request
            if (!id || id.trim() === '') {
                return rejectWithValue('Email template ID is required');
            }

            const response = await axiosInstance.get(`/email-templates/${id}`);
            console?.log("e-template fetched", response.data);
            
            // Handle the specific API response structure
            if (response.data.success === false) {
                return rejectWithValue(response.data.message || 'Invalid email template ID');
            }
            
            const template = response.data.emailTemplate || response.data.data || response.data;
            
            if (!template || !template._id) {
                return rejectWithValue('Email template not found');
            }
            
            return template;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to fetch email template';
            
            // Provide more specific error messages
            if (error.response?.status === 400) {
                return rejectWithValue(error.response?.data?.message || 'Invalid email template ID');
            }
            if (error.response?.status === 404) {
                return rejectWithValue('Email template not found');
            }
            
            return rejectWithValue(errorMessage);
        }
    }
);

const emailTemplateSlice = createSlice({
    name: 'emailTemplates',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetState: (state) => {
            state.templates = [];
            state.currentTemplate = null;
            state.loading = false;
            state.error = null;
            state.deleteLoading = false;
        },
        clearCurrentTemplate: (state) => {
            state.currentTemplate = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch email templates
            .addCase(fetchEmailTemplates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
                state.loading = false;
                state.templates = action.payload;
            })
            .addCase(fetchEmailTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateEmailTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(updateEmailTemplate.fulfilled, (state, action) => {
                state.loading = false;
                const updatedTemplate = action.payload.data || action.payload;
                const index = state.templates.findIndex(
                    (template) => template._id === updatedTemplate._id
                );
                if (index !== -1) {
                    state.templates[index] = updatedTemplate;
                }
                // Update current template if it's the one being edited
                if (state.currentTemplate && state.currentTemplate._id === updatedTemplate._id) {
                    state.currentTemplate = updatedTemplate;
                }
            })
            .addCase(updateEmailTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            }
            )
            

            // Delete email template
            .addCase(deleteEmailTemplate.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(deleteEmailTemplate.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.templates = state.templates.filter(
                    (template) => template._id !== action.payload.id
                );
            })
            .addCase(deleteEmailTemplate.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload as string;
            })

            // Send email template
            .addCase(sendEmailTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendEmailTemplate.fulfilled, (state, action) => {
                state.loading = false;
                // Update template if needed based on response
            })
            .addCase(sendEmailTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch email template by ID
            .addCase(fetchEmailTemplateById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmailTemplateById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTemplate = action.payload;
            })
            .addCase(fetchEmailTemplateById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    },
});

export const { clearError, resetState, clearCurrentTemplate } = emailTemplateSlice.actions;
export default emailTemplateSlice.reducer;
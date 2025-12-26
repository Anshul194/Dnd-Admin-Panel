import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Bold, Italic, Link, List, AlignLeft, Type, Palette, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    fetchEmailTemplateById,
    updateEmailTemplate,
    clearCurrentTemplate,
    clearError
} from '../../store/slices/emailTemplate';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PopupAlert from '../../components/popUpAlert';

// Custom HTML Editor Functions
const insertHtmlTag = (tag: string, content: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formattedText = '';
    const placeholder = content || selectedText || 'Text here';

    switch (tag) {
        case 'bold':
            formattedText = `<strong>${placeholder}</strong>`;
            break;
        case 'italic':
            formattedText = `<em>${placeholder}</em>`;
            break;
        case 'link':
            const url = prompt('Enter URL:') || 'https://';
            formattedText = `<a href="${url}">${placeholder}</a>`;
            break;
        case 'h1':
            formattedText = `<h1>${placeholder}</h1>`;
            break;
        case 'h2':
            formattedText = `<h2>${placeholder}</h2>`;
            break;
        case 'h3':
            formattedText = `<h3>${placeholder}</h3>`;
            break;
        case 'p':
            formattedText = `<p>${placeholder}</p>`;
            break;
        case 'ul':
            formattedText = `<ul>\n  <li>${placeholder}</li>\n</ul>`;
            break;
        case 'ol':
            formattedText = `<ol>\n  <li>${placeholder}</li>\n</ol>`;
            break;
        case 'blockquote':
            formattedText = `<blockquote>${placeholder}</blockquote>`;
            break;
        case 'div':
            formattedText = `<div>${placeholder}</div>`;
            break;
        case 'br':
            formattedText = '<br>';
            break;
        case 'hr':
            formattedText = '<hr>';
            break;
        default:
            formattedText = selectedText;
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    return { newText, cursorPos: start + formattedText.length };
};

interface FormData {
    name: string;
    subject: string;
    from: string;
    status: 'active' | 'inactive';
    description: string;
    content: string;
}

const EditEmailTemplate: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    // Add fallback for undefined emailTemplate state
    const emailTemplateState = useAppSelector((state) => state.emailTemplates);
    const { currentTemplate, loading, error } = emailTemplateState || {
        currentTemplate: null,
        loading: false,
        error: null
    };

    console.log("Current Template:", currentTemplate);
    
    const [formData, setFormData] = useState<FormData>({
        name: '',
        subject: '',
        from: '',
        status: 'active',
        description: '',
        content: '',
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popup, setPopup] = useState<{
        message: string;
        type: 'success' | 'error';
        isVisible: boolean;
    }>({
        message: '',
        type: 'success',
        isVisible: false,
    });

    // Fetch template data on component mount
    useEffect(() => {
        if (id) {
            dispatch(fetchEmailTemplateById(id));
        }
        
        return () => {
            dispatch(clearCurrentTemplate());
            dispatch(clearError());
        };
    }, [id, dispatch]);

    // Update form data when template is loaded
    useEffect(() => {
        if (currentTemplate) {
            console.log("Loading template data:", currentTemplate);
            const newFormData = {
                name: currentTemplate.name || '',
                subject: currentTemplate.subject || '',
                from: currentTemplate.from || '',
                status: currentTemplate.status || 'active',
                description: currentTemplate.description || '',
                content: currentTemplate.content || '',
            };
            console.log("New form data:", newFormData);
            setFormData(newFormData);
        }
    }, [currentTemplate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, content: e.target.value }));
    };

    const handleFormatting = (tag: string, content?: string) => {
        const result = insertHtmlTag(tag, content);
        if (result) {
            setFormData(prev => ({ ...prev, content: result.newText }));
            
            // Focus back to textarea and set cursor position
            setTimeout(() => {
                const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
                if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(result.cursorPos, result.cursorPos);
                }
            }, 10);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setIsSubmitting(true);
        try {
            await dispatch(updateEmailTemplate({ id, data: formData })).unwrap();
            
            setPopup({
                message: 'Email template updated successfully!',
                type: 'success',
                isVisible: true,
            });

            // Navigate back to list after a delay
            setTimeout(() => {
                navigate('/emailtemplate/list');
            }, 2000);
        } catch (error: any) {
            setPopup({
                message: error || 'Failed to update email template',
                type: 'error',
                isVisible: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbItems = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Email Templates', href: '/emailtemplate/list' },
        { label: 'Edit Template', href: '#' },
    ];

    if (loading && !currentTemplate) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="text-gray-600 dark:text-gray-300">Loading template...</span>
                </div>
            </div>
        );
    }

    if (error && !currentTemplate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Invalid Email Template
                        </h2>
                        <div className="text-red-600 text-sm font-medium mb-2">
                            {error}
                        </div>
                        <p className="text-gray-600 text-sm">
                            The email template ID "{id}" is invalid or the template may have been deleted.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/emailtemplate/list')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Back to Templates
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Edit Email Template" description="Edit email template" />
            
            <div className="min-h-screen">
                <PageBreadcrumb items={breadcrumbItems} />
                
                <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/emailtemplate/list')}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Edit Email Template
                            </h1>
                        </div>
                    </div>


                    {/* Instructional Variables Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            Available Variables for Email Content
                        </h2>
                        <div className="bg-yellow-50 dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 rounded-lg p-4 text-sm">
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{app_name}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">App Name</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{order_id}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Order Id</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{order_status}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Order Status</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{order_url}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Order URL</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{order_date}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Order Date</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{owner_name}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Owner Name</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{cart_table}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Cart Data (HTML Table)</span>
                                </li>
                                <li>
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400">{'{wishlist_table}'}</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">Wishlist Data (HTML Table)</span>
                                </li>
                            </ul>
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                You can use these variables in your email content. They will be replaced with actual values when the email is sent.
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter template name"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter email subject"
                                />
                            </div>

                            {/* From Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    From Email *
                                </label>
                                <input
                                    type="email"
                                    name="from"
                                    value={formData.from}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter from email address"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>


                        {/* Content with Custom HTML Editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Content *
                            </label>
                            
                            {/* Formatting Toolbar */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-800 p-3">
                                <div className="flex flex-wrap gap-2">
                                    {/* Text Formatting */}
                                    <div className="flex gap-1 mr-4">
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('bold')}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Bold"
                                        >
                                            <Bold className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('italic')}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Italic"
                                        >
                                            <Italic className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('link')}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Link"
                                        >
                                            <Link className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Headers */}
                                    <div className="flex gap-1 mr-4">
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('h1')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors font-semibold"
                                            title="Heading 1"
                                        >
                                            H1
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('h2')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors font-semibold"
                                            title="Heading 2"
                                        >
                                            H2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('h3')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors font-semibold"
                                            title="Heading 3"
                                        >
                                            H3
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('p')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Paragraph"
                                        >
                                            P
                                        </button>
                                    </div>

                                    {/* Lists */}
                                    <div className="flex gap-1 mr-4">
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('ul')}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Bullet List"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('ol')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors font-mono"
                                            title="Numbered List"
                                        >
                                            1.
                                        </button>
                                    </div>

                                    {/* Other Elements */}
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('blockquote')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Quote"
                                        >
                                            "
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('br')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Line Break"
                                        >
                                            BR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleFormatting('hr')}
                                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Horizontal Rule"
                                        >
                                            HR
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Textarea */}
                            <div className="relative">
                                <textarea
                                    id="content-editor"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleEditorChange}
                                    rows={20}
                                    required
                                    className="w-full px-4 py-3 border-x border-b border-gray-300 dark:border-gray-600 rounded-b-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm resize-vertical"
                                    placeholder="Enter your email content here... Use the toolbar above to add HTML formatting, or write HTML directly."
                                />
                                
                                {/* Character count */}
                                <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                    {formData.content.length} characters
                                </div>
                            </div>

                            {/* Character count */}
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                                {formData.content.replace(/<[^>]*>/g, '').length} characters (excluding HTML tags)
                            </div>

                            {/* Preview Toggle */}
                            <div className="mt-4">
                                <details className="group">
                                    <summary className="cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                        Preview HTML Content
                                    </summary>
                                    <div className="mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 max-h-60 overflow-y-auto">
                                        <div 
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: formData.content }}
                                        />
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/emailtemplate/list')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Popup Alert */}
            <PopupAlert
                message={popup.message}
                type={popup.type}
                isVisible={popup.isVisible}
                onClose={() => setPopup(prev => ({ ...prev, isVisible: false }))}
            />

            {/* Custom Editor Styles */}
            <style>{`
                #content-editor {
                    font-family: 'Courier New', Courier, monospace;
                    line-height: 1.5;
                }
                
                #content-editor:focus {
                    outline: none;
                }
                
                /* Custom scrollbar */
                #content-editor::-webkit-scrollbar {
                    width: 8px;
                }
                
                #content-editor::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                #content-editor::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                
                #content-editor::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                .dark #content-editor::-webkit-scrollbar-track {
                    background: #1e293b;
                }
                
                .dark #content-editor::-webkit-scrollbar-thumb {
                    background: #475569;
                }
                
                .dark #content-editor::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
            `}</style>
        </>
    );
};

export default EditEmailTemplate;
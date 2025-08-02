import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function FileManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useQuery(api.files.getAttachments, {});
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveAttachment = useMutation(api.files.saveAttachment);
  const deleteAttachment = useMutation(api.files.deleteAttachment);
  const userIEPs = useQuery(api.ieps.getUserIEPs);

  const categories = [
    { value: "all", label: "All Files", icon: "📁" },
    { value: "assessment", label: "Assessments", icon: "📊" },
    { value: "report", label: "Reports", icon: "📄" },
    { value: "evaluation", label: "Evaluations", icon: "🔍" },
    { value: "other", label: "Other", icon: "📎" },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!userIEPs?.length) {
      toast.error("Please create an IEP first before uploading files");
      return;
    }

    setIsUploading(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Save attachment record
      await saveAttachment({
        iepId: userIEPs[0]._id, // Default to first IEP for demo
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageId,
        category: "other",
        description: `Uploaded file: ${file.name}`,
      });

      toast.success("File uploaded successfully!");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (attachmentId: any) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteAttachment({ attachmentId });
      toast.success("File deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const filteredAttachments =
    attachments?.filter(
      (attachment) =>
        selectedCategory === "all" || attachment.category === selectedCategory
    ) || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    return "📎";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">File Management</h2>
          <p className="text-slate-600 mt-1">
            Upload and manage documents, assessments, and reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
            <span>{isUploading ? "Uploading..." : "Upload File"}</span>
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={
              selectedCategory === category.value ? "default" : "outline"
            }
            onClick={() => setSelectedCategory(category.value)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <span>{category.icon}</span>
            <span className="font-medium">{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAttachments.map((attachment) => (
          <div
            key={attachment._id}
            className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  {getFileIcon(attachment.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {attachment.fileName}
                  </h3>
                  <Badge variant="secondary" className="capitalize">
                    {attachment.category}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {attachment.url && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
                <button
                  onClick={() => handleDeleteFile(attachment._id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{formatFileSize(attachment.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded:</span>
                <span>
                  {new Date(attachment._creationTime).toLocaleDateString()}
                </span>
              </div>
            </div>

            {attachment.description && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-600 line-clamp-2">
                  {attachment.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAttachments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No Files Found
          </h3>
          <p className="text-slate-600 mb-4">
            {selectedCategory === "all"
              ? "Upload your first file to get started"
              : `No files in the ${categories.find((c) => c.value === selectedCategory)?.label.toLowerCase()} category`}
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload File
          </Button>
        </div>
      )}
    </div>
  );
}

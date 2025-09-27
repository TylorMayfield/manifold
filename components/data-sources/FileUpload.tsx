import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Eye } from "lucide-react";
import { ImportProgress } from "../../types";
import { clientLogger } from "../../lib/utils/ClientLogger";
import ImportProgressIndicator from "../ui/ImportProgressIndicator";
import DataPreviewModal, { DataPreviewInfo } from "../ui/DataPreviewModal";

interface FileUploadProps {
  onFileUploaded: (file: File, progress: ImportProgress) => void;
  onFilePreviewed?: (file: File, previewInfo: DataPreviewInfo) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  showPreview?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onFilePreviewed,
  acceptedTypes = [".csv", ".json"],
  maxSize = 50 * 1024 * 1024, // 50MB
  showPreview = true,
}) => {
  const [uploadProgress, setUploadProgress] = useState<ImportProgress | null>(
    null
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handlePreview = (file: File) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const handlePreviewConfirm = (previewInfo: DataPreviewInfo) => {
    if (onFilePreviewed) {
      onFilePreviewed(previewFile!, previewInfo);
    }
    setShowPreviewModal(false);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      clientLogger.info(
        "Files dropped for upload",
        "file-import",
        { fileCount: acceptedFiles.length },
        "FileUpload"
      );

      acceptedFiles.forEach((file) => {
        setUploadedFiles((prev) => [...prev, file]);

        clientLogger.info(
          "Starting file upload simulation",
          "file-import",
          {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
          "FileUpload"
        );

        // Simulate upload progress with enhanced details
        const startTime = new Date();
        const progress: ImportProgress = {
          stage: "reading",
          progress: 0,
          message: `Reading file: ${file.name}...`,
          startTime,
          totalBytes: file.size,
          bytesProcessed: 0,
        };

        setUploadProgress(progress);
        onFileUploaded(file, progress);

        // Simulate progress updates with more realistic details
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (!prev) return null;

            const newProgress = { ...prev };
            const increment = Math.random() * 15 + 5; // 5-20% increments

            if (newProgress.progress < 100) {
              newProgress.progress = Math.min(
                100,
                newProgress.progress + increment
              );

              // Update bytes processed
              if (newProgress.totalBytes) {
                newProgress.bytesProcessed = Math.round(
                  (newProgress.progress / 100) * newProgress.totalBytes
                );
              }

              // Stage transitions with detailed messages
              if (newProgress.progress >= 100) {
                newProgress.progress = 100;
                newProgress.stage = "complete";
                newProgress.message = "Import completed successfully!";
                newProgress.bytesProcessed = newProgress.totalBytes;
                newProgress.estimatedCompletion = new Date();

                clientLogger.success(
                  "File upload simulation completed",
                  "file-import",
                  { fileName: file.name, fileSize: file.size },
                  "FileUpload"
                );
                clearInterval(progressInterval);
              } else if (newProgress.progress >= 85) {
                newProgress.stage = "indexing";
                newProgress.message =
                  "Creating database indexes for optimal performance...";
                newProgress.totalRecords =
                  Math.floor(Math.random() * 10000) + 1000;
                newProgress.recordsProcessed = Math.floor(
                  ((newProgress.progress - 85) / 15) *
                    (newProgress.totalRecords || 0)
                );
              } else if (newProgress.progress >= 60) {
                newProgress.stage = "storing";
                newProgress.message = "Storing records in database...";
                if (newProgress.totalRecords) {
                  newProgress.recordsProcessed = Math.floor(
                    ((newProgress.progress - 60) / 25) *
                      newProgress.totalRecords
                  );
                }
              } else if (newProgress.progress >= 30) {
                newProgress.stage = "parsing";
                newProgress.message =
                  "Parsing and validating data structure...";
                newProgress.totalRecords =
                  Math.floor(Math.random() * 10000) + 1000;
                newProgress.recordsProcessed = Math.floor(
                  ((newProgress.progress - 30) / 30) * newProgress.totalRecords
                );
              } else {
                newProgress.message = `Reading file: ${file.name}...`;
              }

              // Estimate completion time
              if (newProgress.startTime && newProgress.progress > 0) {
                const elapsed = Date.now() - newProgress.startTime.getTime();
                const remaining =
                  (100 - newProgress.progress) / newProgress.progress;
                newProgress.estimatedCompletion = new Date(
                  Date.now() + elapsed * remaining
                );
              }
            }

            return newProgress;
          });
        }, 300);
      });
    },
    [onFileUploaded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/json": [".json"],
      },
      maxSize,
      multiple: false,
    });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${
            isDragActive && !isDragReject
              ? "border-blue-400/50 glass-button-primary"
              : isDragReject
              ? "border-red-400/50 glass-button"
              : "glass-button hover:glass-button-primary"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-white/60 mb-4" />
        <div className="text-lg font-semibold text-white mb-2">
          {isDragActive
            ? isDragReject
              ? "File type not supported"
              : "Drop the file here"
            : "Drag & drop a file here, or click to select"}
        </div>
        <div className="text-sm text-white/70">
          Supports CSV and JSON files up to {formatFileSize(maxSize)}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <ImportProgressIndicator
          progress={uploadProgress}
          fileName={uploadedFiles[0]?.name}
          fileSize={uploadedFiles[0]?.size}
          showDetails={true}
        />
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 glass-card rounded-xl"
            >
              <div className="flex items-center">
                {getFileIcon(file.name)}
                <div className="ml-3">
                  <div className="text-sm font-semibold text-white">
                    {file.name}
                  </div>
                  <div className="text-xs text-white/60">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {showPreview &&
                  (file.name.endsWith(".csv") ||
                    file.name.endsWith(".json")) && (
                    <button
                      onClick={() => handlePreview(file)}
                      className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all duration-300"
                      title="Preview data"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                <button
                  onClick={() => removeFile(index)}
                  className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all duration-300"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Preview Modal */}
      {previewFile && (
        <DataPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onConfirm={handlePreviewConfirm}
          file={previewFile}
        />
      )}
    </div>
  );
};

export default FileUpload;

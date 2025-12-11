import { useState, useCallback, useRef } from "react";
import { Upload, X, FileImage, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

/**
 * A modern drag-and-drop file upload component with inline preview
 *
 * Features:
 * - Drag and drop support with visual feedback
 * - Click to browse files
 * - File preview for images
 * - Upload progress indication
 * - File size validation
 * - Accepted file type validation
 * - Remove file option
 */
export function FileDropzone({
  maxFileSize = 5242880, // 5MB default
  acceptedFileTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  onFileSelect,
  onUpload,
  className,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedFileTypes
        .map((t) => t.split("/")[1])
        .join(", ")}`;
    }
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${formatFileSize(maxFileSize)}`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setUploadComplete(false);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [acceptedFileTypes, maxFileSize, onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    setUploadComplete(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      setUploadComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedFile ? (
        // Dropzone area
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 cursor-pointer",
            "flex flex-col items-center justify-center gap-2 min-h-[100px]",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive/50 bg-destructive/5"
          )}
        >
          <div
            className={cn(
              "p-2 rounded-full transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "w-5 h-5 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragging
                ? "Drop your file here"
                : "Drag & drop your file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              or <span className="text-primary font-medium">browse</span> to
              choose a file
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Max: {formatFileSize(maxFileSize)}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              PNG, JPG, GIF, WebP, SVG
            </span>
          </div>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>
      ) : (
        // Preview area
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex items-start gap-3">
            {/* Preview thumbnail */}
            <div className="relative shrink-0">
              {preview ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden border bg-white">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border bg-muted flex items-center justify-center">
                  <FileImage className="w-6 h-6 text-muted-foreground" />
                </div>
              )}

              {uploadComplete && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(selectedFile.size)}
              </p>

              {uploadComplete && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Uploaded successfully
                </p>
              )}

              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-2">
                {!uploadComplete && (
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading || disabled}
                    className="h-7 text-xs"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="h-7 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  {uploadComplete ? "Remove" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

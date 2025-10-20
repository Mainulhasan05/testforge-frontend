'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Cookie from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ImageUpload({
  entityType,
  entityId,
  orgId,
  multiple = false,
  maxFiles = 10,
  onUploadSuccess,
  existingImages = [],
  className = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(existingImages);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (multiple && files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (!multiple && files.length > 1) {
      toast.error('Only one file allowed');
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(
      file => !file.type.startsWith('image/')
    );

    if (invalidFiles.length > 0) {
      toast.error('Only image files are allowed');
      return;
    }

    // Create previews
    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);
  };

  const removePreview = (index) => {
    setPreviews(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async () => {
    if (previews.length === 0) {
      toast.error('No images selected');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      if (multiple) {
        previews.forEach(({ file }) => {
          formData.append('images', file);
        });
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        formData.append('orgId', orgId);

        const token = Cookie.get('authToken');
        const response = await fetch(`${API_BASE_URL}/images/upload-multiple`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Upload failed');
        }

        setImages(prev => [...prev, ...result.data.successful.map(s => s.image)]);
        setPreviews([]);

        toast.success(`${result.data.totalUploaded} images uploaded successfully`);

        if (result.data.totalFailed > 0) {
          toast.error(`${result.data.totalFailed} images failed to upload`);
        }

        if (onUploadSuccess) {
          onUploadSuccess(result.data.successful);
        }
      } else {
        // Single upload
        formData.append('image', previews[0].file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        formData.append('orgId', orgId);

        const token = Cookie.get('authToken');
        const response = await fetch(`${API_BASE_URL}/images/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Upload failed');
        }

        setImages(prev => [...prev, result.data.image]);
        setPreviews([]);

        toast.success('Image uploaded successfully');

        if (onUploadSuccess) {
          onUploadSuccess([result.data]);
        }
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const token = Cookie.get('authToken');
      const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Delete failed');
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete image');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 md:p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />

        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
          <div>
            <p className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
              Click to upload or drag and drop
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              PNG, JPG, GIF, WebP {multiple && `(up to ${maxFiles} files)`}
            </p>
          </div>
        </label>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Files ({previews.length})
            </h4>
            <Button
              onClick={uploadImages}
              disabled={uploading}
              size="sm"
              className="text-xs md:text-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload {previews.length > 1 ? 'All' : ''}
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={preview.preview}
                  alt={preview.name}
                  className="w-full h-32 md:h-40 object-cover"
                />
                <button
                  onClick={() => removePreview(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                  <p className="truncate">{preview.name}</p>
                  <p className="text-gray-300">{formatFileSize(preview.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Uploaded Images ({images.length})
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.fileName}
                    className="w-full h-32 md:h-40 object-cover hover:scale-105 transition-transform"
                  />
                </a>
                <button
                  onClick={() => deleteImage(image.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                  <p className="truncate">{image.fileName}</p>
                  <p className="text-gray-300">
                    {formatFileSize(image.fileSize)}
                    {image.compressionRatio && (
                      <span className="ml-1 text-green-300">
                        ({image.compressionRatio}x compressed)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && previews.length === 0 && (
        <div className="text-center py-6 md:py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 opacity-30" />
          <p className="text-xs md:text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}

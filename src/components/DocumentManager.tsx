import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import * as api from '../services/api';

interface Document {
  id: string;
  fileName: string;
  type: string;
  uploadDate: Date;
  status: 'indexed' | 'processing';
  size: string;
}

// Helper function to truncate filename for mobile display
const truncateFilename = (filename: string, maxLength: number = 15): string => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, Math.floor(maxLength * 0.4));
  return `${truncatedName}...${extension ? '.' + extension : ''}`;
};

// Helper function to show 70-80% of filename for tablets
const truncateFilenameTablet = (filename: string): string => {
  const targetLength = Math.floor(filename.length * 0.75); // 75% of full name
  if (filename.length <= 20) return filename; // Short names show fully
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, targetLength);
  return `${truncatedName}...${extension ? '.' + extension : ''}`;
};

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.listDocuments();
      const docs = response.documents.map((doc, index) => ({
        id: index.toString(),
        fileName: doc.filename,
        type: 'PDF',
        uploadDate: new Date(doc.upload_date * 1000),
        status: 'indexed' as const,
        size: doc.size,
      }));
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await uploadFile(file);
      } else {
        toast.error('Please upload PDF files only');
      }
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload to backend
      const result = await api.uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to document list
      const newDoc: Document = {
        id: Date.now().toString(),
        fileName: file.name,
        type: 'PDF',
        uploadDate: new Date(),
        status: 'indexed',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      };
      
      setDocuments((prev) => [newDoc, ...prev]);
      toast.success(`Document indexed successfully (${result.details?.chunks} chunks, ${result.details?.pages} pages)`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    try {
      await api.deleteDocument(filename);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success('Document deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Upload Card */}
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-6 sm:p-8 lg:p-12 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Upload New Document</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-2">
            Drag and drop your PDF files here, or click to browse
          </p>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>

          {uploading && (
            <div className="mt-4 max-w-md mx-auto px-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            aria-label="Upload PDF documents"
          />
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Uploaded Documents</h3>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 sm:py-3 px-0.5 sm:px-1 md:px-1.5 lg:px-2 font-semibold text-xs sm:text-sm">File Name</th>
                    <th className="text-left py-2 sm:py-3 px-0.5 sm:px-1 md:px-1.5 lg:px-2 font-semibold text-xs sm:text-sm">Type</th>
                    <th className="text-left py-2 sm:py-3 px-0.5 sm:px-1 md:px-1.5 lg:px-2 font-semibold text-xs sm:text-sm hidden sm:table-cell">Size</th>
                    <th className="text-left py-2 sm:py-3 px-0.5 sm:px-1 md:px-1.5 lg:px-2 font-semibold text-xs sm:text-sm hidden md:table-cell">Upload Date</th>
                    <th className="text-left py-2 sm:py-3 px-0.5 sm:px-1 md:px-1.5 lg:px-2 font-semibold text-xs sm:text-sm">Status</th>
                    <th className="text-right py-2 sm:py-3 px-0.5 sm:px-1 md:px-1.5 lg:px-2 font-semibold text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 sm:py-4 px-0.5 sm:px-1 md:px-1.5 lg:px-2">
                        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm">
                            <span className="sm:hidden">{truncateFilename(doc.fileName, 20)}</span>
                            <span className="hidden sm:inline md:hidden">{truncateFilenameTablet(doc.fileName)}</span>
                            <span className="hidden md:inline">{doc.fileName}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-0.5 sm:px-1 md:px-1.5 lg:px-2">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">{doc.type}</Badge>
                      </td>
                      <td className="py-3 sm:py-4 px-0.5 sm:px-1 md:px-1.5 lg:px-2 text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">{doc.size}</td>
                      <td className="py-3 sm:py-4 px-0.5 sm:px-1 md:px-1.5 lg:px-2 text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                        {doc.uploadDate.toLocaleDateString()}
                      </td>
                      <td className="py-3 sm:py-4 px-0.5 sm:px-1 md:px-1.5 lg:px-2">
                        {doc.status === 'indexed' ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 text-[10px] sm:text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Indexed</span>
                            <span className="sm:hidden">✓</span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 text-[10px] sm:text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Processing</span>
                            <span className="sm:hidden">⏳</span>
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-0.5 sm:px-1 md:px-1.5 lg:px-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id, doc.fileName)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
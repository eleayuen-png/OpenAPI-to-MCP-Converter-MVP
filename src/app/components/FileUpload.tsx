import { Upload } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all duration-300 ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 scale-[1.02]' 
          : 'border-slate-300 dark:border-slate-700 hover:border-[#141B41] dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 w-20 h-20 mx-auto rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6">
         <Upload className="h-10 w-10 text-[#141B41] dark:text-blue-400" />
      </div>
      <p className="text-xl md:text-2xl font-semibold mb-2 text-[#141B41] dark:text-white">Drop your Swagger file here</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Supports .json, .yaml, and .yml formats</p>
      
      <label className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#141B41] hover:bg-[#1a2352] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full cursor-pointer transition-all shadow-lg hover:shadow-xl font-medium">
        <Upload className="w-4 h-4" />
        Browse Files
        <input
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
    </div>
  );
}
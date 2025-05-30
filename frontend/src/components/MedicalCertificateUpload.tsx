import  { File, Upload, X } from 'lucide-react';

interface MedicalCertificateUploadProps {
  onChange: (file: File | null) => void;
  file: File | null;
}

const MedicalCertificateUpload = ({ onChange, file }: MedicalCertificateUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0] || null;
    onChange(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    onChange(null);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Certificat médical
      </label>

      {!file && (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload size={24} className="text-gray-400" />
            <div className="text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white font-medium text-blue-600 hover:text-blue-500 focus:outline-none">
                <span>Télécharger un fichier</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">ou glissez-déposez</p>
            </div>
            <p className="text-xs text-gray-500">
              PDF, JPG, PNG jusqu'à 10 MB
            </p>
          </div>
        </div>
      )}

      {file && (
        <div className="mt-2 flex items-center p-2 border border-gray-300 rounded-md bg-gray-50">
          <File size={20} className="text-blue-600 mr-2" />
          <span className="text-sm text-gray-700 truncate flex-grow">
            {file.name}
          </span>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={handleRemoveFile}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicalCertificateUpload;
 
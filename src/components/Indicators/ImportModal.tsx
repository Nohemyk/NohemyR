import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { parseHTMLFile, parseExcelFile, validateImportData } from '../../utils/importUtils';
import { ImportData } from '../../types';

interface ImportModalProps {
  onImport: (data: ImportData) => void;
  onCancel: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);

    try {
      let data: ImportData;

      if (selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm')) {
        const text = await selectedFile.text();
        data = parseHTMLFile(text);
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        data = await parseExcelFile(selectedFile);
      } else {
        throw new Error('Formato de archivo no soportado. Use archivos HTML o Excel.');
      }

      const validation = validateImportData(data);
      if (!validation.isValid) {
        setErrors(validation.errors);
      } else {
        setImportData(data);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Error procesando el archivo']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (importData) {
      onImport(importData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Importar Datos</h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra tu archivo aquí
              </h3>
              <p className="text-gray-600 mb-4">
                o haz clic para seleccionar un archivo
              </p>
              <input
                type="file"
                accept=".html,.htm,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Formatos soportados: HTML, Excel (.xlsx, .xls)
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Procesando archivo...</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-medium text-red-800">Errores encontrados:</h4>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {importData && errors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Archivo procesado exitosamente</h4>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>• {importData.indicators.length} indicadores encontrados</p>
                <p>• {importData.activities.length} actividades encontradas</p>
              </div>
            </div>
          )}

          {file && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            {importData && errors.length === 0 && (
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Importar Datos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
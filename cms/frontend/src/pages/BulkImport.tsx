import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { productsApi, customersApi } from '../services/api';

type ImportType = 'products' | 'customers';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const BulkImport: React.FC = () => {
  const [importType, setImportType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const downloadTemplate = (type: ImportType) => {
    let csv = '';
    let filename = '';

    if (type === 'products') {
      csv = 'name,slug,sku,description,price,stock,categoryId\n';
      csv += 'Example Product,example-product,EX-001,Product description,19.99,100,1\n';
      csv += 'Another Product,another-product,EX-002,Another description,29.99,50,1\n';
      filename = 'products-template.csv';
    } else {
      csv = 'email,firstName,lastName,phone,address,city,postalCode,country\n';
      csv += 'john@example.com,John,Doe,0612345678,Main Street 123,Amsterdam,1012AB,Nederland\n';
      csv += 'jane@example.com,Jane,Smith,0687654321,Second Ave 456,Rotterdam,3011WJ,Nederland\n';
      filename = 'customers-template.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      data.push(obj);
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      alert('Selecteer eerst een bestand');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        alert('Geen data gevonden in CSV bestand');
        setImporting(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          if (importType === 'products') {
            await productsApi.create({
              name: item.name,
              slug: item.slug,
              sku: item.sku,
              description: item.description,
              priceCents: Math.round(parseFloat(item.price) * 100),
              stockQuantity: parseInt(item.stock),
              categoryId: item.categoryId ? parseInt(item.categoryId) : null,
            });
            success++;
          } else {
            await customersApi.create({
              email: item.email,
              firstName: item.firstName,
              lastName: item.lastName,
              phone: item.phone,
              address: item.address,
              city: item.city,
              postalCode: item.postalCode,
              country: item.country || 'Nederland',
            });
            success++;
          }
        } catch (error: any) {
          failed++;
          errors.push(`Rij ${data.indexOf(item) + 2}: ${error.response?.data?.error || error.message}`);
        }
      }

      setResult({ success, failed, errors });
    } catch (error) {
      console.error('Import error:', error);
      alert('Fout bij importeren');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
        <p className="mt-2 text-sm text-gray-700">
          Importeer meerdere items tegelijk via CSV
        </p>
      </div>

      {/* Import Type Selection */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Type</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setImportType('products');
              setFile(null);
              setResult(null);
            }}
            className={`p-6 rounded-lg border-2 transition-all ${
              importType === 'products'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className="h-8 w-8 mb-2 mx-auto text-primary-600" />
            <p className="font-medium">Producten</p>
            <p className="text-xs text-gray-600 mt-1">Importeer producten via CSV</p>
          </button>

          <button
            onClick={() => {
              setImportType('customers');
              setFile(null);
              setResult(null);
            }}
            className={`p-6 rounded-lg border-2 transition-all ${
              importType === 'customers'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className="h-8 w-8 mb-2 mx-auto text-purple-600" />
            <p className="font-medium">Klanten</p>
            <p className="text-xs text-gray-600 mt-1">Importeer klanten via CSV</p>
          </button>
        </div>
      </div>

      {/* Template Download */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Download Template</h4>
            <p className="text-sm text-blue-700 mt-1">
              Download een CSV template met voorbeelddata en de juiste kolommen
            </p>
            <button
              onClick={() => downloadTemplate(importType)}
              className="mt-3 btn-secondary text-sm flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download {importType === 'products' ? 'Producten' : 'Klanten'} Template
            </button>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV Bestand</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            {file ? (
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">Klik om bestand te selecteren</p>
                <p className="text-sm text-gray-500 mt-1">Of sleep bestand hierheen</p>
              </div>
            )}
          </label>
        </div>

        {file && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importeren...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importeer
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Resultaten</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Succesvol</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{result.success}</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Mislukt</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{result.failed}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Fouten ({result.errors.length})</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <p key={index} className="text-sm text-yellow-800">
                    • {error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instructies</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1.</strong> Download de CSV template voor {importType === 'products' ? 'producten' : 'klanten'}</p>
          <p><strong>2.</strong> Vul de gegevens in Excel of Google Sheets in</p>
          <p><strong>3.</strong> Exporteer als CSV bestand</p>
          <p><strong>4.</strong> Upload het bestand hier</p>
          <p><strong>5.</strong> Klik op "Importeer" om te starten</p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Let op:</strong> Zorg dat je CSV bestand UTF-8 encoding heeft en gebruik komma's als scheidingsteken.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;



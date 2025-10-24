import React, { useState, useCallback, useRef } from 'react';
import { Expense, ExtractedData } from '../types';
import { extractExpenseInfo } from '../services/geminiService';
import Spinner from './Spinner';

interface EmployeeViewProps {
    addExpenses: (expenses: Expense[]) => void;
}

interface ExtractedInfo {
    id: string;
    file: File;
    data: ExtractedData;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const EmployeeView: React.FC<EmployeeViewProps> = ({ addExpenses }) => {
    const [employeeName, setEmployeeName] = useState('');
    const [tripName, setTripName] = useState('');
    const [extractedInfos, setExtractedInfos] = useState<ExtractedInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExtraction = useCallback(async () => {
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) {
            setError('Por favor, selecciona al menos un archivo de comprobante.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setExtractedInfos([]);

        const fileArray = Array.from(files);
        // FIX: Explicitly type `file` as `File` to resolve TypeScript inference issues.
        const results = await Promise.allSettled(
            fileArray.map((file: File) => extractExpenseInfo(file).then(data => ({ file, data })))
        );

        const successfulExtractions: ExtractedInfo[] = [];
        let extractionErrors = 0;

        // FIX: Restructure result handling to correctly differentiate between rejected promises and fulfilled promises with null data.
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                if (result.value.data) {
                    successfulExtractions.push({
                        id: `${result.value.file.name}-${Math.random()}`,
                        file: result.value.file,
                        data: result.value.data,
                    });
                } else {
                    extractionErrors++;
                    console.error("Extraction returned null for file:", result.value.file.name);
                }
            } else { // status is 'rejected'
                extractionErrors++;
                console.error("Extraction failed for a file:", result.reason);
            }
        });

        setExtractedInfos(successfulExtractions);

        if (extractionErrors > 0) {
            setError(`No se pudo extraer información de ${extractionErrors} archivo(s). Revisa los que se muestran a continuación.`);
        }

        setIsLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeName || !tripName || extractedInfos.length === 0) {
            setError('Por favor, completa tu nombre, el del viaje y extrae la información de al menos un comprobante.');
            return;
        }

        setIsSubmitting(true);

        const newExpenses: Expense[] = await Promise.all(extractedInfos.map(async (info) => {
            const fileContent = await fileToBase64(info.file);
            return {
                id: info.id,
                employeeName,
                tripName,
                vendor: info.data.vendor,
                date: info.data.date,
                amount: info.data.totalAmount,
                currency: info.data.currency,
                category: info.data.category,
                receiptFile: {
                    name: info.file.name,
                    type: info.file.type,
                    content: fileContent.split(',')[1],
                },
                status: 'Pendiente',
            };
        }));
        
        addExpenses(newExpenses);
        
        // Reset form but keep names
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setExtractedInfos([]);
        setError(null);
        setIsSubmitting(false);
    };
    
    const handleFieldChange = (id: string, field: keyof ExtractedData, value: any) => {
        setExtractedInfos(prevInfos =>
            prevInfos.map(info =>
                info.id === id ? { ...info, data: { ...info.data, [field]: value } } : info
            )
        );
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Registrar Nuevos Gastos</h2>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Nombre del Empleado</label>
                        <input type="text" id="employeeName" value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-noroeste-red focus:border-noroeste-red" required />
                    </div>
                    <div>
                        <label htmlFor="tripName" className="block text-sm font-medium text-gray-700">Nombre del Viaje/Proyecto</label>
                        <input type="text" id="tripName" value={tripName} onChange={e => setTripName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-noroeste-red focus:border-noroeste-red" required />
                    </div>
                </div>

                <div>
                    <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">Comprobantes (XML, PDF, JPG, PNG)</label>
                    <div className="mt-1 flex items-center space-x-4">
                        <input type="file" id="receipt" ref={fileInputRef} onChange={() => setExtractedInfos([])} multiple accept=".xml,.pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-noroeste-red hover:file:bg-red-100" />
                        <button type="button" onClick={handleExtraction} disabled={isLoading} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-noroeste-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-noroeste-red disabled:bg-gray-400">
                            {isLoading ? <Spinner /> : 'Extraer'}
                        </button>
                    </div>
                     <p className="text-xs text-gray-500 mt-1">Puedes seleccionar varios archivos a la vez.</p>
                </div>

                {extractedInfos.length > 0 && (
                     <div className="space-y-6">
                        {extractedInfos.map((info, index) => (
                            <div key={info.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4 animate-fade-in">
                                <h3 className="text-lg font-semibold text-gray-900">Comprobante {index + 1}: <span className="text-base font-normal text-gray-600">{info.file.name}</span></h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor={`vendor-${info.id}`} className="block text-sm font-medium text-gray-700">Vendedor</label>
                                        <input type="text" id={`vendor-${info.id}`} value={info.data.vendor} onChange={e => handleFieldChange(info.id, 'vendor', e.target.value)} className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label htmlFor={`date-${info.id}`} className="block text-sm font-medium text-gray-700">Fecha</label>
                                        <input type="date" id={`date-${info.id}`} value={info.data.date} onChange={e => handleFieldChange(info.id, 'date', e.target.value)} className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow">
                                            <label htmlFor={`amount-${info.id}`} className="block text-sm font-medium text-gray-700">Monto</label>
                                            <input type="number" step="0.01" id={`amount-${info.id}`} value={info.data.totalAmount} onChange={e => handleFieldChange(info.id, 'totalAmount', parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md" />
                                        </div>
                                        <div>
                                            <label htmlFor={`currency-${info.id}`} className="block text-sm font-medium text-gray-700">Moneda</label>
                                            <input type="text" id={`currency-${info.id}`} value={info.data.currency} onChange={e => handleFieldChange(info.id, 'currency', e.target.value)} className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor={`category-${info.id}`} className="block text-sm font-medium text-gray-700">Categoría</label>
                                        <input type="text" id={`category-${info.id}`} value={info.data.category} onChange={e => handleFieldChange(info.id, 'category', e.target.value)} className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    <button type="submit" disabled={extractedInfos.length === 0 || isSubmitting || isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-noroeste-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-noroeste-red disabled:bg-gray-400">
                        {isSubmitting ? 'Agregando...' : `Agregar ${extractedInfos.length} Gasto(s)`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeView;
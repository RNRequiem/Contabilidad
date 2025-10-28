import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from '../types';

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type
        }
    };
};

const textToGenerativePart = (text: string) => {
    return { text };
};

export const extractExpenseInfo = async (file: File): Promise<{ data: ExtractedData | null; error?: string }> => {
    // Se agrega una verificación explícita para la API_KEY.
    if (!process.env.API_KEY) {
        return { data: null, error: 'La variable de entorno API_KEY no está configurada. Por favor, configúrala en los ajustes de tu proyecto de Vercel y vuelve a desplegar la aplicación.' };
    }

    // Fix: Per @google/genai guidelines, API key must be from process.env.API_KEY and assumed to be present.
    // This also resolves the TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';

    const basePrompt = `
    Analiza la imagen o el texto del comprobante y extrae la siguiente información en formato JSON.
    - El nombre del vendedor o tienda (vendor).
    - La fecha de la transacción en formato AAAA-MM-DD (date).
    - El monto total de la transacción como un número (totalAmount).
    - El símbolo o código de la moneda (ej. $, MXN, USD) (currency).
    - Una categoría sugerida para el gasto (ej. Comida, Transporte, Alojamiento, Otro) (category).

    Si alguna información no está disponible, déjala como un string vacío o 0 para el monto.
    Asegúrate de que el resultado sea únicamente el objeto JSON.
    `;

    try {
        let parts: any[];

        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            const filePart = await fileToGenerativePart(file);
            const prompt = file.type === 'application/pdf' ? `Este archivo es un PDF, trátalo como una imagen. ${basePrompt}` : basePrompt;
            parts = [filePart, textToGenerativePart(prompt)];
        } else if (['application/xml', 'text/xml'].includes(file.type)) {
            const textContent = await file.text();
            const xmlPrompt = `Analiza el siguiente contenido XML de una factura y extrae la información requerida.\n\n${textContent}\n\n${basePrompt}`;
            parts = [textToGenerativePart(xmlPrompt)];
        } else {
            const errorMessage = `Tipo de archivo no soportado: ${file.type}`;
            console.error(errorMessage);
            return { data: null, error: errorMessage };
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vendor: { type: Type.STRING },
                        date: { type: Type.STRING },
                        totalAmount: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        category: { type: Type.STRING }
                    },
                    required: ["vendor", "date", "totalAmount", "currency", "category"]
                }
            }
        });

        const jsonString = response.text.trim();
        return { data: JSON.parse(jsonString) as ExtractedData };

    } catch (error: any) {
        console.error("Error extracting expense info from Gemini:", error);
        let errorMessage = "Ocurrió un error inesperado al procesar el archivo. Revisa la consola del navegador para más detalles.";
        if (error?.message) {
            // Fix: Updated error message to remove reference to VITE_API_KEY, aligning with API key handling change.
             if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
                errorMessage = "La API Key proporcionada no es válida o ha expirado. Verifícala en la configuración de variables de entorno.";
            } else if (error.message.includes('permission denied') || error.message.includes('IAM_PERMISSION_DENIED')) {
                errorMessage = "Permiso denegado. Asegúrate de que tu API Key tenga los permisos necesarios para usar la API de Gemini.";
            } else if (error.message.includes('quota')) {
                 errorMessage = "Se ha excedido la cuota de la API. Por favor, intenta de nuevo más tarde o revisa tu plan de facturación.";
            }
        }
        return { data: null, error: errorMessage };
    }
};
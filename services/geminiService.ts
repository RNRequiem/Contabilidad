
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    return {
        text: text
    };
};


export const extractExpenseInfo = async (file: File): Promise<ExtractedData | null> => {
    const model = 'gemini-2.5-flash';

    const prompt = `
    Analiza la imagen o el texto del comprobante y extrae la siguiente información en formato JSON.
    - El nombre del vendedor o tienda.
    - La fecha de la transacción en formato AAAA-MM-DD.
    - El monto total de la transacción como un número.
    - El símbolo o código de la moneda (ej. $, MXN, USD).
    - Una categoría sugerida para el gasto (ej. Comida, Transporte, Alojamiento, Otro).

    Si alguna información no está disponible, déjala como un string vacío o 0 para el monto.
    Asegúrate de que el resultado sea únicamente el objeto JSON.
    `;

    try {
        let parts;
        if (file.type.startsWith('image/')) {
            const imagePart = await fileToGenerativePart(file);
            parts = [imagePart, textToGenerativePart(prompt)];
        } else if (file.type === 'application/xml' || file.type === 'text/xml') {
            const textContent = await file.text();
            const xmlPrompt = `Analiza el siguiente contenido XML de una factura y extrae la información requerida.\n\n${textContent}\n\n${prompt}`;
            parts = [textToGenerativePart(xmlPrompt)];
        } else if (file.type === 'application/pdf') {
             // For simplicity, we handle PDFs as images. For real-world apps, a more robust PDF parsing would be needed.
            const imagePart = await fileToGenerativePart(file);
            const pdfPrompt = `Este archivo es un PDF, trátalo como una imagen. ${prompt}`;
            parts = [imagePart, textToGenerativePart(pdfPrompt)];
        } else {
            console.error("Unsupported file type:", file.type);
            return null;
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
        return JSON.parse(jsonString) as ExtractedData;

    } catch (error) {
        console.error("Error extracting expense info from Gemini:", error);
        return null;
    }
};

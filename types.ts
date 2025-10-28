
export enum Role {
    Employee = 'Empleado',
    Accountant = 'Contador'
}

export interface Expense {
    id: string;
    employeeName: string;
    tripName: string;
    tripStartDate: string;
    tripEndDate: string;
    vendor: string;
    date: string;
    amount: number;
    currency: string;
    category: string;
    receiptFile: {
        name: string;
        type: string;
        content: string; // base64 content
    };
    status: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

export interface ExtractedData {
    vendor: string;
    date: string; // YYYY-MM-DD
    totalAmount: number;
    currency: string;
    category: string;
}
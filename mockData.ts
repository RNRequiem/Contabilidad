import { Expense } from './types';

const mockExpenses: Expense[] = [
    {
        id: '1',
        employeeName: 'Juan Pérez',
        tripName: 'Visita Cliente Monterrey',
        vendor: 'Restaurante La Capital',
        date: '2024-05-10',
        amount: 850.50,
        currency: 'MXN',
        category: 'Comida',
        receiptFile: { name: 'comida.jpg', type: 'image/jpeg', content: '' }, // No content for mock
        status: 'Pendiente'
    },
    {
        id: '2',
        employeeName: 'Ana García',
        tripName: 'Conferencia CDMX',
        vendor: 'Hotel Marriott Reforma',
        date: '2024-05-12',
        amount: 4500.00,
        currency: 'MXN',
        category: 'Alojamiento',
        receiptFile: { name: 'hotel.pdf', type: 'application/pdf', content: '' },
        status: 'Pendiente'
    },
    {
        id: '3',
        employeeName: 'Juan Pérez',
        tripName: 'Visita Cliente Monterrey',
        vendor: 'Uber',
        date: '2024-05-10',
        amount: 230.00,
        currency: 'MXN',
        category: 'Transporte',
        receiptFile: { name: 'uber.png', type: 'image/png', content: '' },
        status: 'Pendiente'
    },
    {
        id: '4',
        employeeName: 'Maria Rodriguez',
        tripName: 'Capacitación Guadalajara',
        vendor: 'Office Depot',
        date: '2024-05-15',
        amount: 420.00,
        currency: 'MXN',
        category: 'Otro',
        receiptFile: { name: 'materiales.xml', type: 'application/xml', content: '' },
        status: 'Pendiente'
    },
    {
        id: '5',
        employeeName: 'Ana García',
        tripName: 'Conferencia CDMX',
        vendor: 'Volaris',
        date: '2024-05-11',
        amount: 2800.00,
        currency: 'MXN',
        category: 'Transporte',
        receiptFile: { name: 'vuelo.pdf', type: 'application/pdf', content: '' },
        status: 'Aprobado'
    },
    {
        id: '6',
        employeeName: 'Juan Pérez',
        tripName: 'Visita Cliente Monterrey',
        vendor: 'Cinepolis',
        date: '2024-05-10',
        amount: 350.00,
        currency: 'MXN',
        category: 'Otro',
        receiptFile: { name: 'cine.jpg', type: 'image/jpeg', content: '' },
        status: 'Rechazado'
    }
];

export default mockExpenses;

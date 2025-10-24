import React, { useState, useMemo } from 'react';
import { Expense } from '../types';

interface AccountantViewProps {
    expenses: Expense[];
    updateExpenseStatus: (expenseId: string, status: 'Aprobado' | 'Rechazado') => void;
}

const ReceiptModal: React.FC<{ expense: Expense; onClose: () => void }> = ({ expense, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-4 max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{`Comprobante de ${expense.vendor}`}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                {expense.receiptFile.type.startsWith('image/') ? (
                    <img src={`data:${expense.receiptFile.type};base64,${expense.receiptFile.content}`} alt={`Recibo de ${expense.vendor}`} className="max-w-full h-auto" />
                ) : (
                    <div className="bg-gray-100 p-4 rounded">
                        <p className="font-semibold">Visualización no disponible para {expense.receiptFile.type}</p>
                        <p>Nombre del archivo: {expense.receiptFile.name}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: Expense['status'] }> = ({ status }) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    const statusClasses = {
        Pendiente: "bg-yellow-100 text-yellow-800",
        Aprobado: "bg-green-100 text-green-800",
        Rechazado: "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const AccountantView: React.FC<AccountantViewProps> = ({ expenses, updateExpenseStatus }) => {
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterTrip, setFilterTrip] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterStatus, setFilterStatus] = useState<Expense['status'] | ''>('Pendiente');
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const employeeOptions = useMemo(() => {
        const allNames = expenses.flatMap(e => e.employeeName.split(',').map(name => name.trim()));
        return [...new Set(allNames)].sort();
    }, [expenses]);
    const tripOptions = useMemo(() => [...new Set(expenses.map(e => e.tripName))], [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            if (filterEmployee && !expense.employeeName.split(',').map(n => n.trim()).includes(filterEmployee)) return false;
            if (filterTrip && expense.tripName !== filterTrip) return false;
            if (filterStartDate && expense.date < filterStartDate) return false;
            if (filterEndDate && expense.date > filterEndDate) return false;
            if (filterStatus && expense.status !== filterStatus) return false;
            return true;
        });
    }, [expenses, filterEmployee, filterTrip, filterStartDate, filterEndDate, filterStatus]);
    
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [filteredExpenses]);

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Revisión de Gastos</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="w-full px-3 py-2 border-gray-300 rounded-md">
                    <option value="">Todos los Empleados</option>
                    {employeeOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <select value={filterTrip} onChange={e => setFilterTrip(e.target.value)} className="w-full px-3 py-2 border-gray-300 rounded-md">
                    <option value="">Todos los Viajes</option>
                    {tripOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full px-3 py-2 border-gray-300 rounded-md">
                    <option value="">Todos los Estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                </select>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full px-3 py-2 border-gray-300 rounded-md" placeholder="Fecha inicio"/>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full px-3 py-2 border-gray-300 rounded-md" placeholder="Fecha fin"/>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Empleado</th>
                            <th scope="col" className="px-6 py-3">Viaje</th>
                            <th scope="col" className="px-6 py-3">Fecha</th>
                            <th scope="col" className="px-6 py-3">Vendedor</th>
                            <th scope="col" className="px-6 py-3">Categoría</th>
                            <th scope="col" className="px-6 py-3 text-right">Monto</th>
                            <th scope="col" className="px-6 py-3">Comprobante</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                             <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{expense.employeeName}</td>
                                <td className="px-6 py-4">{expense.tripName}</td>
                                <td className="px-6 py-4">{expense.date}</td>
                                <td className="px-6 py-4">{expense.vendor}</td>
                                <td className="px-6 py-4">{expense.category}</td>
                                <td className="px-6 py-4 text-right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expense.amount)} {expense.currency}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedExpense(expense)} className="font-medium text-noroeste-red hover:underline">Ver</button>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={expense.status} />
                                </td>
                                <td className="px-6 py-4 space-x-2">
                                    {expense.status === 'Pendiente' && (
                                        <>
                                            <button onClick={() => updateExpenseStatus(expense.id, 'Aprobado')} className="font-medium text-green-600 hover:underline">Aprobar</button>
                                            <button onClick={() => updateExpenseStatus(expense.id, 'Rechazado')} className="font-medium text-red-600 hover:underline">Rechazar</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                     <tfoot>
                        <tr className="font-semibold text-gray-900 bg-gray-100">
                            <td colSpan={5} className="px-6 py-3 text-base text-right">Total</td>
                            <td className="px-6 py-3 text-right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}</td>
                            <td colSpan={3}></td>
                        </tr>
                    </tfoot>
                </table>
                 {filteredExpenses.length === 0 && <p className="text-center py-8 text-gray-500">No se encontraron gastos con los filtros aplicados.</p>}
            </div>
            {selectedExpense && <ReceiptModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />}
        </div>
    );
};

export default AccountantView;
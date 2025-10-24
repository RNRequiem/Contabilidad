import React, { useState } from 'react';
import { Role, Expense } from './types';
import EmployeeView from './components/EmployeeView';
import AccountantView from './components/AccountantView';
import mockExpenses from './mockData';

const Header: React.FC<{ role: Role; setRole: (role: Role) => void }> = ({ role, setRole }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0">
                        <h1 className="text-3xl font-bold text-noroeste-red tracking-wider">Noroeste</h1>
                        <p className="text-sm text-gray-500">Gestor de Viáticos Inteligente</p>
                    </div>
                    <div className="flex items-center bg-gray-200 rounded-full p-1">
                        <button
                            onClick={() => setRole(Role.Employee)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${role === Role.Employee ? 'bg-noroeste-red text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                        >
                            {Role.Employee}
                        </button>
                        <button
                            onClick={() => setRole(Role.Accountant)}
                             className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${role === Role.Accountant ? 'bg-noroeste-red text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                        >
                            {Role.Accountant}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
    const [role, setRole] = useState<Role>(Role.Employee);
    const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

    const addExpenses = (newExpenses: Expense[]) => {
        setExpenses(prevExpenses => [...newExpenses, ...prevExpenses]);
        alert(`${newExpenses.length} gasto(s) agregado(s) exitosamente!`);
    };

    const updateExpenseStatus = (expenseId: string, status: 'Aprobado' | 'Rechazado') => {
        setExpenses(prevExpenses =>
            prevExpenses.map(expense =>
                expense.id === expenseId ? { ...expense, status } : expense
            )
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Header role={role} setRole={setRole} />
            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {role === Role.Employee ? (
                        <EmployeeView addExpenses={addExpenses} />
                    ) : (
                        <AccountantView expenses={expenses} updateExpenseStatus={updateExpenseStatus} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
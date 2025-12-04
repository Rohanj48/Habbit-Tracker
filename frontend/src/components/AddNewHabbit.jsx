import React, { useState } from 'react';

const CATEGORIES = [
    { name: 'Health', color: 'text-green-600', code: 'Health' },
    { name: 'Work', color: 'text-blue-600', code: 'Work' },
    { name: 'Learning', color: 'text-yellow-600', code: 'Learning' },
    { name: 'Finance', color: 'text-indigo-600', code: 'Finance' },
];

const FREQUENCIES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
];


// --- AddNewHabit Component ---
// Note: This component is self-contained within Dashboard.jsx as required for a single file React app.
const AddNewHabit = ({ onNewHabit, isLoading }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState(FREQUENCIES[0].value);
    const [category, setCategory] = useState(CATEGORIES[0].code);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Calls the prop function (handleNewHabit in Dashboard.jsx), which handles the API call
        onNewHabit({ name, frequency, category });

        // Reset and collapse form after submission is initiated
        setName('');
        setFrequency(FREQUENCIES[0].value);
        setCategory(CATEGORIES[0].code);
        setIsExpanded(false);
    };

    // If not expanded, show only the button
    if (!isExpanded) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-dashed border-indigo-200">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-800 font-semibold transition"
                >
                    <div className='flex items-center space-x-2'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Add New Habit</span>
                    </div>
                </button>
            </div>
        );
    }


    // If expanded, show the form
    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl border border-indigo-300 transition-all duration-200">
            <h3 className="text-3xl font-extrabold text-indigo-800 mb-6">Define a New Habit</h3>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Title */}
                <div>
                    <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Habit Title (What is the action?)
                    </label>
                    <input
                        id="habit-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Drink 8 glasses of water"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        disabled={isLoading}
                    />
                </div>

                {/* 2. Frequency */}
                <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                    </label>
                    <select
                        id="frequency"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                        disabled={isLoading}
                    >
                        {FREQUENCIES.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                        disabled={isLoading}
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                    <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Habit'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="px-6 py-3 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddNewHabit;
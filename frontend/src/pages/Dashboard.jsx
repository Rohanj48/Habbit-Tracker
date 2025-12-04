import React, { useState, useEffect, useCallback } from 'react';
import AddNewHabit from '../components/AddNewHabbit';



// --- Habit Card Component ---
const HabitCard = ({ habit, onCheckIn, isLoading }) => {
    // Corrected to use habit.category and habit.currentStreak/habit.isDue
    const categoryColor = {
        Health: 'bg-green-100 text-green-700 border-green-300',
        Work: 'bg-blue-100 text-blue-700 border-blue-300',
        Learning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        default: 'bg-gray-100 text-gray-700 border-gray-300'
    };

    const isDue = habit.isDue; // Use mapped property
    const statusColor = isDue ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600';
    const statusText = isDue ? 'Check In' : 'Done for Today!';

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
            <div className="flex flex-col">
                {/* Habit Name */}
                <span className="text-lg font-bold text-gray-800">{habit.name}</span>

                {/* Category Tag */}
                <span className={`text-xs font-semibold px-2 py-0.5 mt-1 rounded-full w-fit ${categoryColor[habit.category] || categoryColor.default}`}>
                    {habit.category}
                </span>

                {/* Streak */}
                <span className="text-sm text-gray-500 mt-2">
                    Streak: <span className="font-semibold text-indigo-600">{habit.currentStreak} Days</span>
                </span>
            </div>

            {/* Check In Button */}
            <button
                onClick={() => onCheckIn(habit.id)}
                disabled={!isDue || isLoading}
                className={`px-4 py-2 font-semibold text-white rounded-lg transition duration-300 shadow-md 
                    ${isDue && !isLoading ? statusColor : 'bg-green-500/70 cursor-not-allowed'}`}
            >
                {isLoading ? '...' : statusText}
            </button>
        </div>
    );
};


// --- MAIN COMPONENT ---
const Dashboard = () => {
    const [habits, setHabits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isSavingHabit, setIsSavingHabit] = useState(false);


    // Function to fetch data from the backend
    const fetchHabits = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/data');

            // --- CRITICAL FIX: Read the body as text ONCE ---
            const responseText = await response.text();

            if (!response.ok) {
                // If status is bad, we treat the text as an error. Try to parse it to see if it's a JSON error body.
                let errorDetails = responseText;
                try {
                    const errorData = JSON.parse(responseText);
                    // Prioritize the error message from the JSON body
                    errorDetails = errorData.message || errorData.error || responseText;
                } catch (e) {
                    // responseText contains non-JSON content (e.g., HTML traceback)
                    console.error("Server Error Response (Non-JSON):", responseText);
                    errorDetails = `Server returned an unexpected response (Status ${response.status}). Check console for details.`;
                }
                throw new Error(`Fetch failed: ${errorDetails}`);
            }

            // 2. Now attempt to parse the already read text as JSON for success data.
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonErr) {
                // The server returned 200 OK but the body was not JSON.
                console.error("JSON Parse Failed. Response Text:", responseText);
                throw new Error("Received non-JSON content on successful response. Check console.");
            }

            // Map backend keys to frontend keys
            const mappedHabits = (data.habits || []).map(h => ({
                id: h.id,
                name: h.name,
                category: h.category,
                frequency: h.frequency,
                currentStreak: h.mock_current_streak, // Mapped from backend name
                isDue: h.is_due_today,             // Mapped from backend name
            }));

            setHabits(mappedHabits);

        } catch (err) {
            console.error('Fetch Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchHabits();
        // Set up a refresh interval (e.g., every 60 seconds) for real-time applications
        const interval = setInterval(fetchHabits, 60000);
        return () => clearInterval(interval);
    }, [fetchHabits]);


    // Handler for when a user checks in a habit
    const handleCheckIn = useCallback(async (habitId) => {
        setIsCheckingIn(true);
        setError(null);
        console.log(`Attempting check-in for habit ${habitId}...`);

        try {
            const response = await fetch('/api/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ habit_id: habitId }),
            });

            // --- CRITICAL FIX: Read the body as text ONCE ---
            const responseText = await response.text();


            if (!response.ok) {
                let errorMessage = responseText;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || responseText;
                } catch (e) {
                    // non-json error, use raw text as the error message
                    console.error("Check-in Server Error Response (Non-JSON):", responseText);
                    errorMessage = `Server returned an unexpected error response (Status ${response.status}). Check console for details.`;
                }

                // Handle 409 (Conflict) specifically as a warning, not a hard error
                if (response.status === 409) {
                    console.warn(`Check-in warning (409): ${errorMessage}`);
                } else {
                    throw new Error(`Check-in failed: ${errorMessage}`);
                }
            }
            // --------------------------------------------------

            // Refresh the habit list from the backend
            await fetchHabits();
            console.log(`Habit ${habitId} successfully checked in and dashboard refreshed.`);

        } catch (error) {
            console.error("Check-in error:", error);
            setError(`Error checking in: ${error.message}`);
        } finally {
            setIsCheckingIn(false);
        }
    }, [fetchHabits]);


    // Handler for when a new habit is created (currently mocked)
    const handleNewHabit = useCallback(async (newHabitData) => {
        setIsSavingHabit(true);
        setError(null);
        console.log('Submitting new habit:', newHabitData.name);

        try {
            const response = await fetch('/api/habits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newHabitData),
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = responseText;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || responseText;
                } catch (e) {
                    console.error("New Habit Server Error Response (Non-JSON):", responseText);
                    errorMessage = `Server returned an error creating habit (Status ${response.status}). Check console for details.`;
                }
                throw new Error(`Failed to create habit: ${errorMessage}`);
            }

            // After successful creation, refresh the habit list
            await fetchHabits();
            console.log(`Habit ${newHabitData.name} created successfully and dashboard refreshed.`);

        } catch (error) {
            console.error("New Habit creation error:", error);
            setError(`Error creating habit: ${error.message}`);
        } finally {
            setIsSavingHabit(false);
        }
    }, [fetchHabits]);


    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">

            <main className="max-w-7xl mx-auto py-8">

                <div className="lg:grid lg:grid-cols-10 lg:gap-8">

                    {/* Column 1 (Left: 70% - Habit List/Action Area) */}
                    <div className="lg:col-span-7 mb-8 lg:mb-0">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
                            Habit Tracker Dashboard
                        </h1>

                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Actionable Habits ({habits.filter(h => h.isDue).length} Due)</h2>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                **Error:** {error}
                            </div>
                        )}

                        {isLoading && habits.length === 0 ? (
                            <div className="text-center p-10 text-gray-500">Loading habits...</div>
                        ) : (
                            <div className="space-y-4">
                                {/* Habits Due Today */}
                                {habits
                                    .filter(h => h.isDue)
                                    .map(habit => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            onCheckIn={handleCheckIn}
                                            isLoading={isCheckingIn}
                                        />
                                    ))
                                }

                                {/* All Done Message */}
                                {habits.filter(h => h.isDue).length === 0 && (
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                                        <p className="text-sm text-green-700 font-medium">🎉 All habits checked off for today! Great job!</p>
                                    </div>
                                )}

                                {/* Completed Habits Section */}
                                <h3 className="text-xl font-bold text-gray-700 pt-6 border-t mt-6">Completed Habits</h3>
                                <div className="space-y-4 pt-2 opacity-70">
                                    {habits
                                        .filter(h => !h.isDue)
                                        .map(habit => (
                                            <HabitCard
                                                key={habit.id}
                                                habit={habit}
                                                onCheckIn={handleCheckIn}
                                                isLoading={isCheckingIn}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {!isLoading && habits.length === 0 && !error && (
                            <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-lg mt-8">
                                <p className="text-xl font-medium">No habits found.</p>
                                <p className="mt-2 text-sm">Please check your backend seeding or connection.</p>
                            </div>
                        )}
                    </div>

                    {/* Column 2 (Right: 30% - Habit Creation/Form Area) */}
                    <div className="lg:col-span-3 ">
                        <h2 className="text-3xl font-extrabold text-gray-800 mb-20">Define</h2>
                        <AddNewHabit onNewHabit={handleNewHabit} />
                    </div>

                </div>
            </main>

        </div>
    );
};


export default Dashboard;
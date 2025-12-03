import React from 'react';

function Navbar() {
    return (
        // Fixed positioning and background for a consistent header
        <nav className="bg-white shadow-md sticky top-0 z-10 p-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">

                {/* Logo/Project Name */}
                <div className="text-2xl font-bold text-indigo-600">
                    Habbit Tracker
                </div>

                {/* Navigation Links */}
                <div className="space-x-4 flex items-center">
                    {/* Dashboard Link */}
                    <a
                        href="/dashboard"
                        className="text-gray-600 hover:text-indigo-500 transition duration-150"
                    >
                        Dashboard
                    </a>

                    {/* Analytics Link */}
                    <a
                        href="/analytics"
                        className="text-gray-600 hover:text-indigo-500 transition duration-150"
                    >
                        Analytics
                    </a>


                </div>

            </div>
        </nav>
    );
};

export default Navbar;
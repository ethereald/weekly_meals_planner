import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Weekly Meals Planner
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plan your meals for the week, track nutrition, and generate shopping lists with our comprehensive meal planning application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Meal Planning Card */}
          <Link href="/meal-planning" className="group">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group-hover:border-blue-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Meal Planning</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Plan your daily, weekly, and monthly meals with our intuitive calendar interface.
              </p>
            </div>
          </Link>

          {/* Profile Management Card */}
          <Link href="/auth" className="group">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group-hover:border-green-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Profile & Settings</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Manage your account, preferences, and dietary restrictions.
              </p>
            </div>
          </Link>

          {/* Coming Soon - Recipes */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Recipe Database</h3>
            </div>
            <p className="text-gray-500 text-sm">
              Browse and save your favorite recipes. Coming soon!
            </p>
          </div>

          {/* Coming Soon - Shopping Lists */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V7a2 2 0 00-2-2H9a2 2 0 00-2 2v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Shopping Lists</h3>
            </div>
            <p className="text-gray-500 text-sm">
              Auto-generate shopping lists from your meal plans. Coming soon!
            </p>
          </div>

          {/* Coming Soon - Nutrition Tracking */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Nutrition Tracking</h3>
            </div>
            <p className="text-gray-500 text-sm">
              Track calories, macros, and nutritional goals. Coming soon!
            </p>
          </div>

          {/* Coming Soon - Meal Suggestions */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Smart Suggestions</h3>
            </div>
            <p className="text-gray-500 text-sm">
              Get AI-powered meal suggestions based on your preferences. Coming soon!
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-6">
            Start planning your meals and take control of your nutrition today.
          </p>
          <Link
            href="/meal-planning"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Start Planning Meals
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

// Mock navbar component - replace with your actual Navbar

export default function JurisdictionPlaceholderPage() {
  const [userLocation, setUserLocation] = useState<string | null>(null);

  const handleDetectLocation = () => {
    // Mock location detection
    setUserLocation("New York, NY");
    setTimeout(() => {
      setUserLocation(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Resources by Jurisdiction
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're building a comprehensive directory of immigration support resources statewide.
             This page will automatically connect you with relevant advocacy groups and legal aid
              services based on your location and the type of assistance needed.
          </p>
        </div>

        {/* Placeholder Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📍</span>
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Location-Based Legal Resources
              </h2>
              <p className="text-gray-600">
                This feature will automatically find police departments, legal aid organizations, 
                and privacy regulators near you when you need to escalate a situation.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-4">⚖️</div>
              <h3 className="font-medium text-gray-900 mb-2">Legal Support</h3>
              <p className="text-sm text-gray-500">
                Legal aid organizations and victim support services in your area.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="font-medium text-gray-900 mb-2">Document Requirements</h3>
              <p className="text-sm text-gray-500">
                Required forms and procedures specific to your jurisdiction.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Enable Location Detection</h3>
                <p className="text-sm text-gray-600">
                  Allow location access to automatically find resources near you.
                </p>
              </div>
              <button
                onClick={handleDetectLocation}
                className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {userLocation ? "Detected: " + userLocation : "Detect My Location"}
              </button>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-300 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-6">
              <span className="text-2xl">🔄</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Feature in Development
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We're building a comprehensive database of legal resources statewide. 
              This page will automatically update with relevant contacts based on your 
              detected location and the type of assistance needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
// app/home/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { sessionDB, userDB } from "../lib/database";
import type { Session } from "../lib/types";
import { testFirebaseConnection } from "../lib/firebaseDebug";
import { useLocation } from "../hooks/useLocation";
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  Shield, 
  MapPin,
  Bell,
  CheckCircle,
  Phone,
  Mail,
  Briefcase,
  Home,
  Plane,
  ShieldAlert,
  Settings
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [detentionTimer, setDetentionTimer] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [checkIns, setCheckIns] = useState<number>(0);
  const [showProtectionModal, setShowProtectionModal] = useState<boolean>(false);
  const [destination, setDestination] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionUnsubscribe, setSessionUnsubscribe] = useState<(() => void) | null>(null);

  // Location hook for tracking user location
  const { 
    location, 
    address, 
    loading: locationLoading, 
    error: locationError, 
    permissionDenied,
    requestLocationWithAddress 
  } = useLocation(true);

  // Request location with address on mount
  useEffect(() => {
    if (location && !address && !locationLoading) {
      requestLocationWithAddress();
    }
  }, [location, address, locationLoading, requestLocationWithAddress]);

  useEffect(() => {
  // 'auth' is already imported from "@/lib/firebase"
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      router.replace("/");
    } else {
      setUser(currentUser);
      
      // Test Firebase connection
      const isConnected = await testFirebaseConnection();
      if (!isConnected) {
        alert('Warning: Firebase connection failed. Please check your configuration.');
        return;
      }
      
      loadUserData(currentUser.uid);
    }
  });

  return () => {
    unsubscribe();
    // Clean up session listener when component unmounts
    if (sessionUnsubscribe) {
      sessionUnsubscribe();
    }
  };
  }, [router, sessionUnsubscribe]);

  // Timer countdown effect
  useEffect(() => {
    if (!activeSession || !isActive) {
      setDetentionTimer(0);
      return;
    }

    // Update timer every second
    const interval = setInterval(() => {
      if (!activeSession.nextCheckInDue) {
        setDetentionTimer(0);
        return;
      }
      
      const nextCheckIn = activeSession.nextCheckInDue.toMillis();
      const now = Date.now();
      const msRemaining = Math.max(0, nextCheckIn - now);
      const minutesRemaining = Math.floor(msRemaining / 60000);
      
      setDetentionTimer(minutesRemaining);
      
      // If timer expired, stop the interval
      if (msRemaining === 0) {
        clearInterval(interval);
        console.log('Timer expired - escalation should be triggered by Cloud Function');
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [activeSession, isActive]);

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);
      
      // Clean up existing listener
      if (sessionUnsubscribe) {
        sessionUnsubscribe();
        setSessionUnsubscribe(null);
      }
      
      // Load active sessions
      const sessions = await sessionDB.getActiveSessions(userId);
      console.log('Active sessions found:', sessions.length);
      
      if (sessions.length > 0) {
        const session = sessions[0];
        console.log('Setting active session:', session.sessionId);
        
        // Set initial state
        setActiveSession(session);
        setIsActive(true);
        setCheckIns(session.stats.totalCheckIns);
        setSelectedDuration(session.protectionLevel);
        
        // Calculate initial timer
        const nextCheckIn = session.nextCheckInDue?.toMillis() || 0;
        const now = Date.now();
        const msRemaining = Math.max(0, nextCheckIn - now);
        const minutesRemaining = Math.floor(msRemaining / 60000);
        setDetentionTimer(minutesRemaining);
        
        // Set up real-time listener for the active session
        const sessionRef = doc(db, 'sessions', session.sessionId);
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
          if (docSnap.exists()) {
            const updatedSession = docSnap.data() as Session;
            
            // Check if session is still active
            if (updatedSession.status === 'active') {
              console.log('Session updated from Firestore');
              setActiveSession(updatedSession);
              setIsActive(true);
              setCheckIns(updatedSession.stats.totalCheckIns);
            } else {
              console.log('Session ended, status:', updatedSession.status);
              setActiveSession(null);
              setIsActive(false);
            }
          } else {
            console.log('Session no longer exists');
            setActiveSession(null);
            setIsActive(false);
          }
        }, (error) => {
          console.error('Error in session listener:', error);
        });
        
        setSessionUnsubscribe(() => unsubscribe);
      } else {
        console.log('No active sessions found');
        setIsActive(false);
        setActiveSession(null);
      }
      
      // Load user profile for stats
      const userProfile = await userDB.getUserProfile(userId);
      if (userProfile) {
        if (!sessions.length) {
          setCheckIns(userProfile.stats.totalCheckIns);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Failed to load user data: ' + (error as Error).message);
    }
  };

  const protectionOptions = [
    { id: "short", name: "Short Trip", duration: 120, icon: "🏃", color: "bg-green-100 text-green-800" },
    { id: "work", name: "Work Day", duration: 480, icon: "💼", color: "bg-blue-100 text-blue-800" },
    { id: "overnight", name: "Overnight", duration: 1440, icon: "🌙", color: "bg-purple-100 text-purple-800" },
    { id: "highrisk", name: "High Risk", duration: 60, icon: "🚨", color: "bg-red-100 text-red-800" },
    { id: "custom", name: "Custom", duration: 0, icon: "⚙️", color: "bg-gray-100 text-gray-800" },
  ];

  const startProtection = async (option: any) => {
    if (option.id === "custom") {
      // TODO: Open custom time input
      setSelectedDuration("custom");
      return;
    }
    
    if (!user) {
      alert('Please log in to start a session.');
      return;
    }
    
    // Close modal immediately
    setShowProtectionModal(false);
    setIsLoading(true);
    
    try {
      console.log('Starting session...');
      
      // Use existing location data if available
      let locationData: any = undefined;
      if (location) {
        locationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          ...(address && { address })
        };
      }
      
      const sessionId = await sessionDB.startSession(user.uid, {
        protectionLevel: option.id,
        destination: destination || undefined,
        notes: `Started ${option.name} protection`,
        checkInIntervalMinutes: option.duration,
        durationMinutes: option.duration * 2, // Session duration is 2x check-in interval
        ...(locationData && { location: locationData })
      });
      
      console.log('Session created:', sessionId);
      
      setSelectedDuration(option.id);
      setDestination("");
      
      // Reload user data to set up listener and get the new session
      await loadUserData(user.uid);
      
      console.log(`Started ${option.name} protection, session ID: ${sessionId}`);
    } catch (error) {
      console.error('Error starting protection:', error);
      alert('Failed to start protection: ' + (error as Error).message);
      // Reopen modal if there was an error
      setShowProtectionModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async () => {
    if (!activeSession) {
      console.error('No active session found for check-in');
      alert('No active session found. Please start a protection session first.');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Recording check-in for session:', activeSession.sessionId);
      
      // Use existing location data if available
      let locationData: any = undefined;
      if (location) {
        locationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          ...(address && { address })
        };
      }
      
      await sessionDB.recordCheckIn(activeSession.sessionId, {
        method: 'manual',
        notes: 'User checked in via dashboard',
        location: locationData,
      });
      
      console.log("Checked in successfully");
      // The onSnapshot listener will automatically update the UI
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyStop = async () => {
    // Check if user is authenticated
    if (!user || !user.uid) {
      alert('Error: You must be logged in to trigger emergency escalation.');
      setIsLoading(false);
      return;
    }

    if (!confirm('⚠️ EMERGENCY ESCALATION\n\nAre you sure you want to trigger emergency escalation?\n\nThis will immediately notify all your emergency contacts.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Get current location for emergency (refresh it)
      let currentLocation: any = undefined;
      try {
        if (location) {
          console.log('📍 Using current location for emergency');
          currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            ...(address && { address })
          };
          console.log('📍 Current location captured:', currentLocation);
        } else {
          console.log('📍 No location available for emergency');
        }
      } catch (locError) {
        console.warn('⚠️ Could not capture location for emergency:', locError);
      }

      console.log('📍 Emergency location being sent:', currentLocation);
      // Send emergency notifications
      const response = await fetch('/api/notifications/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          sessionId: activeSession?.sessionId || `emergency_${Date.now()}`,
          session: activeSession,
          location: currentLocation
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send emergency notifications');
      }

      // Clear active session
      if (activeSession) {
        setIsActive(false);
        setActiveSession(null);
      }

      console.log('Emergency notifications sent:', result);
      alert(`✅ EMERGENCY ALERT SENT\n\n${result.notificationsSent} recipients notified\n\nYour emergency contacts and legal organizations (if consented) have been alerted with your location.`);
    } catch (error) {
      console.error('Error triggering emergency:', error);
      alert('❌ Failed to send emergency notifications.\n\n' + (error as Error).message + '\n\nPlease call 911 directly immediately.');
    } finally {
      setIsLoading(false);
    }
  };

  const escalationLadder = [
    { level: 1, name: "Trusted Contacts", time: "60 min", status: "Standby" },
    { level: 2, name: "Consented Legal Org", time: "24 hours", status: "Standby" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-900">Processing...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="font-medium">{isActive ? "ACTIVE PROTECTION" : "INACTIVE"}</span>
            </div>
            {isActive && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>Next check-in: {detentionTimer} min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ChainAlert <span className={`${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {isActive ? 'Protection Active' : 'Inactive'}
            </span>
          </h1>
          <p className="text-gray-600">
            Silent escalation system for ICE encounters. The system triggers automatic cascades when you can't.
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Core Features */}
          <div className="lg:col-span-2 space-y-8">
            {/* Protection Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {isActive ? `Protection Active: ${selectedDuration ? selectedDuration.charAt(0).toUpperCase() + selectedDuration.slice(1) : 'Custom'}` : 'Start Protection'}
                  </h2>
                </div>
                {isActive && (
                  <div className="text-3xl font-bold text-green-600">
                    {detentionTimer}<span className="text-lg">min</span>
                  </div>
                )}
              </div>
              
              {isActive ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Protection active. Your location is being tracked. End session when you're safe.
                  </p>
                  
                  <button
                    onClick={async () => {
                      if (!activeSession) {
                        alert('No active session found.');
                        return;
                      }
                      if (confirm('Are you sure you want to end protection?')) {
                        setIsLoading(true);
                        try {
                          await sessionDB.endSession(activeSession.sessionId, 'completed');
                          setIsActive(false);
                          setActiveSession(null);
                          console.log('Session ended successfully');
                        } catch (error) {
                          console.error('Error ending session:', error);
                          alert('Failed to end session. Please try again.');
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition duration-200"
                  >
                    {isLoading ? 'Ending...' : 'End Protection'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Select protection level based on your activity. System will escalate if you don't check in.
                  </p>
                  <button
                    onClick={() => setShowProtectionModal(true)}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-lg transition duration-200 text-lg"
                  >
                    {isLoading ? 'Loading...' : 'Start Protection'}
                  </button>
                </>
              )}
            </div>

            {/* Escalation Ladder Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">🔁 Escalation Ladder</h2>
              </div>
              <div className="space-y-4">
                {escalationLadder.map((step) => (
                  <div 
                    key={step.level} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold mr-4">
                        {step.level}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{step.name}</h3>
                        <p className="text-sm text-gray-500">Contacts after {step.time}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      step.status === 'Standby' ? 'bg-gray-100 text-gray-800' : 
                      step.status === 'Alerted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {step.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Status & Actions */}
          <div className="space-y-8">
            {/* Emergency Stop */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Emergency Trigger</h2>
              </div>
              <p className="text-gray-700 mb-6">
                If you're in immediate danger or detained, trigger immediate escalation to all contacts.
              </p>
              <button
                onClick={emergencyStop}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition duration-200 text-lg shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'TRIGGERING...' : 'EMERGENCY ESCALATE NOW'}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {isActive ? 'Immediately notify all emergency contacts' : 'Trigger emergency notifications even without active session'}
              </p>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Protection Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Successful Check-ins</span>
                  <span className="font-bold text-blue-600">{checkIns}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Last Location</span>
                    {permissionDenied && (
                      <span className="text-xs text-yellow-600">Permission Denied</span>
                    )}
                  </div>
                  {/* Display location from active session or current location from hook */}
                  {(activeSession?.location?.lat !== undefined && activeSession?.location?.lng !== undefined) || 
                   (location?.latitude !== undefined && location?.longitude !== undefined) ? (
                    <div className="text-sm">
                      {/* Prefer session location, fallback to current location */}
                      {(() => {
                        // Get coordinates from either source
                        const sessionLat = activeSession?.location?.lat;
                        const sessionLng = activeSession?.location?.lng;
                        const currentLat = location?.latitude;
                        const currentLng = location?.longitude;
                        
                        const displayLat = sessionLat !== undefined ? sessionLat : currentLat;
                        const displayLng = sessionLng !== undefined ? sessionLng : currentLng;
                        
                        // Get address from either source - session stores as addressData, current is from hook
                        const addr = (activeSession?.location as any)?.addressData || address;
                        
                        if (addr) {
                          // Try to build a readable location string
                          const locationParts = [
                            addr.neighbourhood || addr.suburb,
                            addr.city || addr.town || addr.village,
                            addr.state,
                            addr.country
                          ].filter(Boolean);
                          
                          if (locationParts.length > 0) {
                            return (
                              <div>
                                <p className="font-bold text-blue-600">
                                  {locationParts.slice(0, 2).join(', ')}
                                </p>
                                {locationParts.length > 2 && (
                                  <p className="text-xs text-gray-500">
                                    {locationParts.slice(2).join(', ')}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {displayLat?.toFixed(4)}, {displayLng?.toFixed(4)}
                                </p>
                              </div>
                            );
                          }
                        }
                        
                        // Fallback to coordinates only
                        if (displayLat && displayLng) {
                          return (
                            <p className="font-bold text-blue-600">
                              {displayLat.toFixed(4)}, {displayLng.toFixed(4)}
                            </p>
                          );
                        }
                        
                        return null;
                      })()}
                      {(() => {
                        const acc = (activeSession?.location as any)?.accuracy || location?.accuracy;
                        return acc !== undefined ? (
                          <p className="text-xs text-gray-500">±{Math.round(acc)}m</p>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <span className="font-bold text-gray-400">
                      {permissionDenied ? 'Location access denied' : locationLoading ? 'Getting location...' : 'No location data'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">System Status</span>
                  <span className={`font-bold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => router.push('/contacts')}
                  className="flex flex-col items-center text-gray-900 justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <Users className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Contacts</span>
                </button>
                <button 
                  onClick={() => router.push('/docs')}
                  className="flex flex-col items-center text-gray-900 justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <FileText className="w-6 h-6 text-purple-600 mb-2" />
                  <span className="text-sm font-medium">Documents</span>
                </button>
                <button 
                  onClick={() => router.push('/consent')}
                  className="flex flex-col items-center text-gray-900 justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <Shield className="w-6 h-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium">Consent</span>
                </button>
                <button 
                  onClick={() => router.push('/jurisdiction')}
                  className="flex flex-col items-center text-gray-900 justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <MapPin className="w-6 h-6 text-orange-600 mb-2" />
                  <span className="text-sm font-medium">Jurisdiction</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Protection Modal */}
        {showProtectionModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
            onClick={() => setShowProtectionModal(false)}
          >
            <div 
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Start Protection</h2>
                <button
                  onClick={() => setShowProtectionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Where are you going? (Optional)
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Work, Court, Grocery Store"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
                <p className="text-sm text-gray-700 mt-1">
                  This helps contacts know where to look if needed.
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                <h3 className="font-medium text-gray-700 mb-2">Select protection level:</h3>
                {protectionOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => startProtection(option)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ${option.color}`}
                  >
                    <div className="flex items-center text-gray-900">
                      <span className="text-2xl mr-3">{option.icon}</span>
                      <div className="text-left">
                        <div className="font-semibold">{option.name}</div>
                        <div className="text-sm">
                          {option.duration === 0 ? 'Custom time' : `${option.duration / 60} hours`}
                        </div>
                      </div>
                    </div>
                    {option.duration > 0 && (
                      <div className="font-bold">{option.duration} min</div>
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                System will automatically escalate to contacts if you don't check in before time expires.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 mb-4 md:mb-0">
              <p className="font-semibold">Remember your rights:</p>
              <p className="text-sm">You have the right to remain silent. You have the right to an attorney.</p>
            </div>
            <div className="flex space-x-4">
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                <Phone className="w-4 h-4 mr-2" />
                Emergency Hotline
              </button>
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
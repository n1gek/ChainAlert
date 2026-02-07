"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../authContext";
import {
  Scale,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  Lock,
  Eye,
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Signature,
  Phone,
  Mail,
  Clock
} from "lucide-react";

export default function ConsentPage() {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFullConsent, setShowFullConsent] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [dateSigned, setDateSigned] = useState(new Date().toISOString().split('T')[0]);
  
  const consentVersion = "2.1";

  useEffect(() => {
    // Pre-populate email from Firebase auth
    if (user?.email && !userEmail) {
      setUserEmail(user.email);
    }
    checkExistingConsent();
  }, [user]);

  const checkExistingConsent = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/consent/api?userId=${user.uid}`);
      const data = await response.json();

      if (data.hasConsent && data.consent) {
        setAccepted(true);
        // Handle Firestore Timestamp format (has seconds field)
        if (data.consent.grantedAt?.seconds) {
          const date = new Date(data.consent.grantedAt.seconds * 1000);
          setDateSigned(date.toISOString().split('T')[0]);
        } else {
          setDateSigned(new Date().toISOString().split('T')[0]);
        }
        
        // Load user profile data when consent exists
        if (data.userProfile) {
          setUserName(data.userProfile.fullName || "");
          setUserEmail(data.userProfile.email || user.email || "");
          setUserPhone(data.userProfile.phoneNumber || "");
        } else {
          // Fallback to user info if profile doesn't exist but consent does
          if (user.email) {
            setUserEmail(user.email);
          }
        }
      } else {
        // Pre-populate email from auth if no consent yet
        if (user.email && !userEmail) {
          setUserEmail(user.email);
        }
      }
    } catch (error) {
      console.error('Error checking consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!userName.trim()) {
      alert("Please enter your full name to sign the consent.");
      return;
    }

    if (!user) {
      alert("You must be logged in to accept consent.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/consent/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName,
          userEmail,
          userPhone,
          version: consentVersion,
          templateId: 'default_template'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAccepted(true);
        alert('Consent recorded successfully!');
        // Reload data to ensure all fields are populated from database
        await checkExistingConsent();
      } else {
        throw new Error(data.error || 'Failed to record consent');
      }
    } catch (error) {
      console.error('Error recording consent:', error);
      alert(`Failed to record consent: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!user || !confirm('Are you sure you want to revoke your consent? This action can be reversed by signing again.')) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/consent/api?userId=${user.uid}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setAccepted(false);
        alert('Consent revoked successfully. You can sign again whenever you\'re ready.');
      } else {
        throw new Error(data.error || 'Failed to revoke consent');
      }
    } catch (error) {
      console.error('Error revoking consent:', error);
      alert(`Failed to revoke consent: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-4">
            <Scale className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Legal Consent & Release Agreement
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            This agreement outlines your consent for ChainAlert to act on your behalf during emergencies.
            Please read carefully before signing.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading consent status...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Key Points */}
          <div className="lg:col-span-1 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Key Points Summary
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">What You Consent To:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Automated notifications to contacts
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Information sharing with lawyers
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Location tracking during protection
                    </li>
                  </ul>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">Your Rights:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      Revoke consent anytime
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      Access your data
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      Request data deletion
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Important Notice</h3>
                  <p className="text-sm text-gray-700">
                    This agreement does not create an attorney-client relationship. 
                    ChainAlert is not a law firm and does not provide legal advice. 
                    For legal questions, consult a qualified attorney.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Consent Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Toggle Full Consent */}
              <div className="p-6 border-b border-gray-200">
                <button
                  onClick={() => setShowFullConsent(!showFullConsent)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-bold text-gray-900">
                    {showFullConsent ? "Hide Full Agreement" : "Show Full Agreement"}
                  </span>
                  {showFullConsent ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Consent Text */}
              <div className="p-6">
                {showFullConsent ? (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
                    {/* Full Legal Agreement */}
                    <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">LEGAL CONSENT AND RELEASE AGREEMENT</h2>
                      
                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">1. PARTIES</h3>
                        <p>
                          This Agreement is entered into between <strong>ChainAlert, Inc.</strong> ("Service Provider") 
                          and the undersigned user ("User" or "You").
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">2. PURPOSE</h3>
                        <p>
                          This Agreement grants ChainAlert permission to act on your behalf during emergency situations 
                          when you are unable to communicate, specifically for the purpose of notifying designated contacts 
                          and sharing limited information with legal service providers.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">3. GRANT OF CONSENT</h3>
                        <p className="font-medium mb-2">You hereby consent to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Automated notifications to your designated emergency contacts when you fail to check in</li>
                          <li>Sharing of your name, last known location, and uploaded documents with pre-approved legal organizations after 24 hours of no check-in</li>
                          <li>Geolocation tracking during active protection sessions</li>
                          <li>Storage and encryption of your personal data as outlined in our Privacy Policy</li>
                          <li>Automated escalation procedures as described in the ChainAlert documentation</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">4. INFORMATION SHARING LIMITS</h3>
                        <p>ChainAlert will only share the following information during escalation:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Your full name and photograph (if provided)</li>
                          <li>Last known location with timestamp</li>
                          <li>Documents you have specifically marked for sharing</li>
                          <li>Emergency contact information (names and phone numbers only)</li>
                          <li>Timeline of your last known activities within the app</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">5. USER REPRESENTATIONS AND WARRANTIES</h3>
                        <p>You represent and warrant that:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>You are at least 18 years of age</li>
                          <li>You have informed your emergency contacts that they are listed</li>
                          <li>You have legal authority to share any uploaded documents</li>
                          <li>All provided information is accurate and current</li>
                          <li>You understand this is not a substitute for emergency services (911)</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">6. LIMITATION OF LIABILITY</h3>
                        <p>
                          TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHAINALERT SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, 
                          LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Your inability to use the service</li>
                          <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                          <li>Any interruption or cessation of transmission to or from the service</li>
                          <li>Any bugs, viruses, or the like that may be transmitted to or through the service</li>
                          <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">7. INDEMNIFICATION</h3>
                        <p>
                          You agree to defend, indemnify, and hold harmless ChainAlert, its affiliates, officers, 
                          directors, employees, and agents from and against any claims, liabilities, damages, losses, 
                          and expenses, including without limitation, reasonable legal fees, arising out of or in any 
                          way connected with your access to or use of the Service, your violation of this Agreement, 
                          or your violation of any third-party rights.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">8. RELEASE OF CLAIMS</h3>
                        <p>
                          You hereby release ChainAlert, its officers, employees, agents, and successors from claims, 
                          demands, any and all losses, damages, rights, claims, and actions of any kind including, 
                          without limitation, personal injuries, death, and property damage, that is either directly 
                          or indirectly related to or arises from your use of the Service, including but not limited 
                          to, any interactions with or conduct of other Service users or third-party websites.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">9. DATA PRIVACY AND SECURITY</h3>
                        <p>
                          ChainAlert employs industry-standard security measures including AES-256 encryption for 
                          data at rest and TLS 1.3 for data in transit. However, you acknowledge that no security 
                          system is impenetrable and that data transmission over the Internet cannot be guaranteed 
                          to be 100% secure.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">10. REVOCATION OF CONSENT</h3>
                        <p>
                          You may revoke this consent at any time by: (1) disabling all protection sessions, 
                          (2) deleting your account, or (3) submitting a written revocation to support@chainalert.com. 
                          Revocation will not affect actions taken prior to receipt of your revocation notice.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">11. GOVERNING LAW AND DISPUTE RESOLUTION</h3>
                        <p>
                          This Agreement shall be governed by the laws of the State of Delaware without regard to 
                          its conflict of law provisions. Any dispute arising from this Agreement shall be resolved 
                          through binding arbitration in accordance with the American Arbitration Association's 
                          commercial arbitration rules.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">12. SEVERABILITY</h3>
                        <p>
                          If any provision of this Agreement is held to be invalid or unenforceable, such provision 
                          shall be struck and the remaining provisions shall be enforced to the fullest extent under law.
                        </p>
                      </section>

                      <section>
                        <h3 className="font-bold text-gray-900 mb-2">13. ENTIRE AGREEMENT</h3>
                        <p>
                          This Agreement, together with our Privacy Policy and Terms of Service, constitutes the 
                          entire agreement between you and ChainAlert regarding the Service and supersedes any 
                          prior agreements.
                        </p>
                      </section>

                      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600">
                          <strong>Disclaimer:</strong> This agreement does not create an attorney-client relationship. 
                          ChainAlert is not a law firm and does not provide legal advice. The information provided 
                          through the Service is for informational purposes only and should not be considered legal advice.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Click "Show Full Agreement" above to read the complete legal consent document.
                    </p>
                  </div>
                )}

                {/* Signing Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-6 text-center">Electronic Signature</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Legal Name <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Signature className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Enter your full name as signature"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                          disabled={accepted}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                            disabled={accepted}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            placeholder="(555) 123-4567"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                            disabled={accepted}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Signature
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={dateSigned}
                          onChange={(e) => setDateSigned(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                          disabled={accepted}
                        />
                      </div>
                    </div>

                    {/* Terms Checkboxes */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          className="mt-1 mr-3"
                          required
                          disabled={accepted}
                        />
                        <span className="text-sm text-gray-700">
                          I have read and understood the full Legal Consent and Release Agreement
                        </span>
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          className="mt-1 mr-3"
                          required
                          disabled={accepted}
                        />
                        <span className="text-sm text-gray-700">
                          I understand that ChainAlert is not a law firm and does not provide legal advice
                        </span>
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          className="mt-1 mr-3"
                          required
                          disabled={accepted}
                        />
                        <span className="text-sm text-gray-700">
                          I confirm that I am at least 18 years of age
                        </span>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    {accepted ? (
                      <div className="text-center p-6 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center justify-center mb-3">
                          <CheckCircle className="w-8 h-8 text-green-600 mr-2" />
                          <div className="text-lg font-bold text-green-700">Consent Accepted</div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Signed by: <span className="font-medium">{userName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Version {consentVersion} • Signed on {dateSigned}
                        </p>
                        <button
                          onClick={handleRevoke}
                          disabled={saving}
                          className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          {saving ? 'Revoking...' : 'Revoke Consent'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={handleAccept}
                          disabled={!userName.trim() || saving}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Signature className="w-5 h-5 mr-2" />
                              Accept & Sign Agreement
                            </>
                          )}
                        </button>
                        <p className="text-xs text-center text-gray-500">
                          By clicking "Accept & Sign Agreement", you acknowledge that your electronic signature 
                          is legally binding and equivalent to your handwritten signature.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Lock className="w-5 h-5 text-blue-600 mr-2" />
                  How Your Data is Protected
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    AES-256 encryption for all stored data
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    TLS 1.3 for data in transit
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Regular security audits and penetration testing
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Eye className="w-5 h-5 text-purple-600 mr-2" />
                  Your Right to Access
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Request a copy of all your stored data
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    View consent history and versions
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Export your data at any time
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
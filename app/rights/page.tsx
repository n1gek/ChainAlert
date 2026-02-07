"use client";
import  Navbar from "../components/Navbar";

import { useState } from "react";
import {
  Shield,
  Scale,
  Users,
  Phone,
  FileText,
  MapPin,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Volume2,
  Lock,
  Globe,
  Building,
  ShieldAlert,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  stateResources, 
  getStateResources, 
  availableStates,
  type StateResource 
} from "../lib/stateResources";

export default function RightsPage() {
  const [activeSection, setActiveSection] = useState("basics");
  const [selectedState, setSelectedState] = useState("CA");
  
  const stateInfo = getStateResources(selectedState);
  const riskColor = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800"
  };

  const legalRights = [
    {
      id: "silent",
      title: "Right to Remain Silent",
      icon: Volume2,
      content: "You are not required to answer questions about your immigration status, birthplace, or citizenship. You can say: 'I choose to remain silent and wish to speak with my attorney.'",
      warning: "Lying to immigration officers is a crime. It's safer to remain silent than to give false information.",
    },
    {
      id: "counsel",
      title: "Right to Legal Counsel",
      icon: Scale,
      content: "You have the right to speak with an attorney before answering questions. If detained, you have the right to a lawyer at your own expense during removal proceedings.",
      note: "ICE does not provide free lawyers for immigration court. Organizations like RAICES (TX) and CARECEN (CA) may provide pro bono assistance.",
    },
    {
      id: "warrant",
      title: "Right to See a Warrant",
      icon: FileText,
      content: "You have the right to see a warrant before allowing officers into your home. Ask them to slide the warrant under the door. An 'administrative warrant' from ICE is not the same as a judicial warrant.",
      warning: "ICE cannot enter your home without consent unless they have a judicial warrant signed by a judge.",
    },
    {
      id: "consent",
      title: "Right to Refuse Consent",
      icon: Lock,
      content: "You do not have to consent to a search of your car, home, or belongings. You may say: 'I do not consent to a search.' Do not physically resist, but make your objection clear.",
    },
    {
      id: "documents",
      title: "Document Rights",
      icon: Shield,
      content: "You have the right to carry certain documents. If you are not a U.S. citizen, you must carry proof of lawful status. Know what documents you have and keep copies in a safe place.",
      note: "Never carry false documents. This can result in criminal charges.",
    },
  ];

  const encounterSteps = [
    { step: 1, title: "Stay Calm", description: "Take a deep breath. Panic can lead to mistakes. Remember your rights." },
    { step: 2, title: "Ask Questions", description: "Ask: 'Am I free to leave?' If yes, leave calmly. If no, ask: 'Why am I being detained?'" },
    { step: 3, title: "Invoke Rights", description: "Clearly state: 'I wish to remain silent. I want to speak with a lawyer.' Repeat if necessary." },
    { step: 4, title: "Document Everything", description: "If safe, note officers' names, badge numbers, and what happened. Ask witnesses to record." },
    { step: 5, title: "Contact Help", description: "Call your emergency contacts or a hotline. Use ChainAlert's emergency button if available." },
  ];

  const navigationItems = [
    { id: "basics", label: "Basic Rights", icon: Shield },
    { id: "encounter", label: "Encounter Guide", icon: AlertTriangle },
    { id: "state", label: "State Resources", icon: MapPin },
    { id: "preparation", label: "ChainAlert System", icon: Users },
    { id: "resources", label: "More Resources", icon: Globe }
  ];

  return (
    <>
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-4">
            <Scale className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Know Your Rights
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Critical legal information for immigration encounters. This information is for educational purposes and not legal advice.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg inline-flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              In emergency: Call 911. For immigration help, contact a qualified attorney.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Navigation & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Navigation - Improved Visibility */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Quick Navigation
              </h2>
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${activeSection === item.id 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`w-4 h-4 mr-3 ${activeSection === item.id ? "text-white" : "text-blue-500"}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeSection === item.id ? "text-white" : "text-gray-400"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-red-600" />
                Immediate Help
              </h2>
              <div className="space-y-3">
                <a href="tel:911" className="block p-3 bg-white rounded-lg border hover:border-red-300 transition">
                  <div className="font-bold text-red-600">Emergency Police/Fire/Medical</div>
                  <div className="text-2xl text-red-600 font-bold mt-1">911</div>
                </a>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="font-bold text-gray-900">National Immigration Hotline</div>
                  <a href="tel:18885091239" className="text-xl font-bold text-blue-600 mt-1 block">
                    1-888-509-1239
                  </a>
                  <p className="text-sm text-gray-600 mt-1">Free legal help & referrals</p>
                </div>
              </div>
            </div>

            {/* State Selector - Updated */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Your Location
              </h2>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
                {availableStates.map((state) => (
                <option 
                    key={state.code} 
                    value={state.code}
                    className="text-gray-900"
                >
                    {state.name} ({state.riskLevel.toUpperCase()})
                </option>
                ))}
            </select>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-900">Local Legal Aid</div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${riskColor[stateInfo.riskLevel]}`}>
                    {stateInfo.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
                <div className="font-bold text-gray-900">{stateInfo.name} Immigration Resources</div>
                <a href={`tel:${stateInfo.hotline}`} className="text-blue-600 font-medium mt-1 block">
                  {stateInfo.hotline}
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  {stateInfo.orgs.length} local organizations available
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Rights Section */}
            {activeSection === "basics" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Fundamental Rights</h2>
                <div className="space-y-6">
                  {legalRights.map((right) => {
                    const Icon = right.icon;
                    return (
                      <div key={right.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 transition">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{right.title}</h3>
                            <p className="text-gray-700 mb-3">{right.content}</p>
                            {right.warning && (
                              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <div className="flex items-center text-yellow-800">
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  <span className="font-medium">Important:</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">{right.warning}</p>
                              </div>
                            )}
                            {right.note && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700">{right.note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Encounter Guide */}
            {activeSection === "encounter" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">During an Immigration Encounter</h2>
                <div className="space-y-6">
                  {encounterSteps.map((step) => (
                    <div key={step.step} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-gray-700">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-5 bg-red-50 border border-red-200 rounded-xl">
                  <h3 className="font-bold text-red-700 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    What NOT to Do
                  </h3>
                  <ul className="space-y-2 text-red-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Do not run or resist physically</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Do not sign any documents without a lawyer</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Do not lie about your identity or status</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Do not volunteer information beyond identification</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* State Resources Section - Updated */}
            {activeSection === "state" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">State Resources</h2>
                      <p className="text-gray-600">Local organizations and laws for {stateInfo.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${riskColor[stateInfo.riskLevel]}`}>
                      {stateInfo.riskLevel.toUpperCase()} RISK STATE
                    </div>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableStates.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Risk Assessment */}
                <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                    Risk Assessment for {stateInfo.name}
                  </h3>
                  <p className="text-gray-700">
                    {stateInfo.riskLevel === "high" && "This state has active immigration enforcement and restrictive laws. Exercise increased caution."}
                    {stateInfo.riskLevel === "medium" && "Mixed policies with some protections and some enforcement. Know your local city policies."}
                    {stateInfo.riskLevel === "low" && "This state has strong immigrant protections and sanctuary policies in many cities."}
                  </p>
                </div>
                
                {/* Sanctuary Cities */}
                {stateInfo.sanctuaryCities.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-3">Sanctuary Cities in {stateInfo.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {stateInfo.sanctuaryCities.map((city) => (
                        <span key={city} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {city}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      These cities have policies limiting local law enforcement cooperation with ICE.
                    </p>
                  </div>
                )}
                
                {/* Key Laws */}
                {stateInfo.keyLaws.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Key State Laws
                    </h3>
                    <ul className="space-y-2">
                      {stateInfo.keyLaws.map((law, index) => (
                        <li key={index} className="flex items-start">
                          <ChevronRight className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{law}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Local Organizations */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Local Legal & Support Organizations
                  </h3>
                  <div className="space-y-4">
                    {stateInfo.orgs.map((org, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{org.name}</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Services Offered:</div>
                                <div className="flex flex-wrap gap-2">
                                  {org.services.map((service, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                                      {service}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Languages:</div>
                                <div className="flex flex-wrap gap-2">
                                  {org.languages.map((lang, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-3">
                            <a 
                              href={`tel:${org.phone}`}
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call {org.phone}
                            </a>
                            <a 
                              href={`https://${org.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Visit Website
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Notes */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-bold text-gray-900 mb-2">Important Notes for {stateInfo.name}</h4>
                  <p className="text-gray-700">{stateInfo.notes}</p>
                </div>
                
                {/* Disclaimer */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>
                    <strong>Note:</strong> This information is for educational purposes and may change. 
                    Always verify with local organizations. Sanctuary city policies vary and may not 
                    prevent all ICE enforcement.
                  </p>
                </div>
              </div>
            )}

            {/* ChainAlert System */}
            {activeSection === "preparation" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ChainAlert Protection System</h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-600" />
                      How ChainAlert Protects You
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold text-green-600">1</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Automatic Check-ins</h4>
                          <p className="text-gray-700">Set protection timers for daily activities. Check in before timer ends.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold text-yellow-600">2</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Grace Period</h4>
                          <p className="text-gray-700">15-minute grace period after timer ends. Multiple reminders sent.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold text-orange-600">3</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Contact Notification</h4>
                          <p className="text-gray-700">After 45 minutes, trusted contacts receive alert with your last location.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold text-red-600">4</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Legal Escalation</h4>
                          <p className="text-gray-700">After 24 hours, pre-consented lawyers receive your case file automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-blue-50 text-black rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3">Recommended Preparation</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <ChevronRight className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Upload critical documents (visa, work permit, ID) under the Documents tab</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Add trusted contacts who can help in emergencies</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Research and add local immigration lawyers from your state</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                        <span>Set daily protection patterns for routine activities</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Resources */}
            {activeSection === "resources" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="https://www.aclu.org/know-your-rights/immigrants-rights" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                    <div className="font-bold text-blue-600 mb-1">ACLU: Know Your Rights</div>
                    <p className="text-sm text-gray-600">Comprehensive guide to immigration rights</p>
                  </a>
                  <a href="https://www.immigrationadvocates.org" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                    <div className="font-bold text-blue-600 mb-1">Immigration Advocates Network</div>
                    <p className="text-sm text-gray-600">Find legal help and resources</p>
                  </a>
                  <a href="https://www.uscis.gov/avoid-scams" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                    <div className="font-bold text-blue-600 mb-1">Avoid Immigration Scams</div>
                    <p className="text-sm text-gray-600">Official USCIS information on avoiding fraud</p>
                  </a>
                  <a href="https://www.ilrc.org" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                    <div className="font-bold text-blue-600 mb-1">Immigrant Legal Resource Center</div>
                    <p className="text-sm text-gray-600">Legal manuals and training materials</p>
                  </a>
                </div>
                
                <div className="mt-8 p-5 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-3">Disclaimer</h3>
                  <p className="text-gray-600 text-sm">
                    This information is for educational purposes only and does not constitute legal advice. 
                    Immigration law is complex and constantly changing. Always consult with a qualified 
                    immigration attorney for advice about your specific situation. ChainAlert is not a 
                    law firm and does not provide legal services.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Information last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-2">For legal updates, consult with an immigration attorney or legal aid organization.</p>
        </div>
      </div>
    </main>
    </>
  );
}
"use client";

import { 
  Shield, 
  Clock, 
  Bell, 
  Users, 
  Scale, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  Timer,
  FileText,
  Zap,
  ShieldCheck,
  Calendar,
  Hourglass
} from "lucide-react";
import { useState } from "react";

export default function HowItWorksPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const protectionLevels = [
    {
      level: "Short Trip",
      duration: "2 hours",
      icon: Timer,
      color: "bg-green-100 text-green-800",
      description: "Quick errands, grocery runs, coffee shop visits",
      gracePeriod: "15 minutes",
      idealFor: "Low-risk activities in familiar areas"
    },
    {
      level: "Work Day",
      duration: "8 hours",
      icon: Calendar,
      color: "bg-blue-100 text-blue-800",
      description: "Work shifts, school day, appointments",
      gracePeriod: "15 minutes",
      idealFor: "Predictable daily routines"
    },
    {
      level: "Overnight",
      duration: "24 hours",
      icon: ShieldCheck,
      color: "bg-purple-100 text-purple-800",
      description: "Family visits, overnight trips, conferences",
      gracePeriod: "30 minutes",
      idealFor: "Extended absences with planned returns"
    },
    {
      level: "High Risk",
      duration: "1-2 hours",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
      description: "ICE check-ins, court appointments, protests",
      gracePeriod: "5 minutes",
      idealFor: "Known confrontation points or elevated risk"
    },
    {
      level: "Custom",
      duration: "Set your own",
      icon: Zap,
      color: "bg-yellow-100 text-yellow-800",
      description: "Flexible timing for unique situations",
      gracePeriod: "Customizable",
      idealFor: "Any scenario not covered above"
    }
  ];

  const escalationTimeline = [
    {
      phase: "Active Protection",
      time: "User-selected duration",
      icon: Shield,
      color: "bg-green-50 border-green-200",
      actions: [
        "Timer counts down normally",
        "User can check in anytime",
        "All systems on standby"
      ],
      notifications: []
    },
    {
      phase: "Grace Period",
      time: "Timer ends + 0-15 minutes",
      icon: Hourglass,
      color: "bg-yellow-50 border-yellow-200",
      actions: [
        "Soft reminder notifications",
        "Easy one-tap check-in",
        "Option to extend timer"
      ],
      notifications: [
        "In-app notification: 'Time's up! All good?'",
        "Option to: [I'm Safe] [Extend] [Emergency]"
      ]
    },
    {
      phase: "Warning Period",
      time: "15-60 minutes after timer",
      icon: Bell,
      color: "bg-orange-50 border-orange-200",
      actions: [
        "Multiple reminder channels",
        "Escalation warning sent",
        "Final chance to cancel"
      ],
      notifications: [
        "Push notification + SMS",
        "Message: 'Contacts notified in 30 minutes if no check-in'",
        "One last [I'm Safe] button"
      ]
    },
    {
      phase: "First Escalation",
      time: "60 minutes after timer",
      icon: Users,
      color: "bg-red-50 border-red-200",
      actions: [
        "Trusted contacts notified",
        "Last known location shared",
        "Contact verification begins"
      ],
      notifications: [
        "Contacts receive: 'John's ChainAlert timer ended 60 minutes ago'",
        "Includes last location and timestamp",
        "Contacts can: [Mark Safe] [Escalate]"
      ]
    },
    {
      phase: "Legal Escalation",
      time: "24 hours after timer",
      icon: Scale,
      color: "bg-purple-50 border-purple-200",
      actions: [
        "Pre-consented lawyers notified",
        "Full case file transmitted",
        "Legal intervention begins"
      ],
      notifications: [
        "Complete info package sent to lawyers",
        "Includes documents, contacts, timeline",
        "Lawyers can file missing persons or begin legal action"
      ]
    }
  ];

  const notificationTypes = [
    {
      type: "User Warnings",
      icon: Bell,
      description: "In-app and push notifications reminding you to check in",
      timing: "0-60 minutes",
      channel: "App & push notifications"
    },
    {
      type: "Trusted Contacts",
      icon: Users,
      description: "Alert your pre-selected trusted contacts with your location",
      timing: "60 minutes after timer",
      channel: "SMS & Email"
    },
    {
      type: "Legal Organizations",
      icon: Scale,
      description: "Notify pre-consented lawyers with full case file",
      timing: "24 hours after timer",
      channel: "Email & secure portal"
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-red-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              How ChainAlert <span className="text-red-600">Works</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A silent escalation system that automatically triggers cascading alerts when you can't.
            No action required during emergencies.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {["overview", "levels", "timeline", "notifications", "features"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-5 py-2.5 rounded-full font-medium capitalize transition-all ${
                activeSection === section
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {section.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <Timer className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Set & Forget</h3>
                </div>
                <p className="text-gray-700">
                  Start protection with one tap. Choose duration based on your activity.
                  The system handles everything else automatically.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Smart Escalation</h3>
                </div>
                <p className="text-gray-700">
                  If you don't check in, the system starts with gentle reminders,
                  then escalates through trusted contacts, finally reaching legal help.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">24/7 Protection</h3>
                </div>
                <p className="text-gray-700">
                  Works silently in the background. Even if you can't act during a crisis,
                  your safety network is automatically activated.
                </p>
              </div>
            </div>

            {/* Step-by-Step Process */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                The ChainAlert Safety Net
              </h2>
              
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 transform -translate-y-1/2 hidden md:block"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                  {[
                    { step: 1, title: "Start Protection", desc: "Choose duration based on activity", icon: Shield },
                    { step: 2, title: "Timer Active", desc: "Check in anytime before timer ends", icon: Clock },
                    { step: 3, title: "Grace Period", desc: "15-60 minute window after timer to disable alert", icon: Hourglass },
                    { step: 4, title: "Contact Alert", desc: "Trusted contacts notified after 60 minutes of no check-in", icon: Users },
                    { step: 5, title: "Legal Escalation", desc: "Lawyers receive full case file after 24 hours of no check-in", icon: Scale }
                  ].map((item) => (
                    <div key={item.step} className="relative z-10">
                      <div className="bg-white border-2 border-blue-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 mb-1">{item.title}</div>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Protection Levels */}
        {activeSection === "levels" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Choose Your Protection Level
              </h2>
              <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                Different activities carry different risks. ChainAlert adapts to your needs
                with customizable protection levels.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {protectionLevels.map((level) => {
                  const Icon = level.icon;
                  return (
                    <div key={level.level} className={`border rounded-xl p-5 hover:shadow-md transition ${level.color.replace('bg-', 'border-').replace('text-', 'border-')} border-opacity-30`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${level.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{level.level}</h3>
                          <div className="text-lg font-bold text-gray-900">{level.duration}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Grace period:</span>
                          <span className="font-medium">{level.gracePeriod}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Ideal for: {level.idealFor}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 p-5 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  Smart Recommendations
                  <span className="ml-2 text-xs font-semibold px-2 py-1 bg-purple-200 text-purple-800 rounded-full">Coming Soon</span>
                </h3>
                <p className="text-gray-700">
                  ChainAlert will learn your patterns and suggest appropriate protection levels.
                  Going to work every day? It'll suggest "Work Day." Heading to court?
                  It'll flag it as "High Risk" and adjust escalation timing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Timeline */}
        {activeSection === "timeline" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Escalation Timeline & Grace Periods
              </h2>

              <div className="space-y-6">
                {escalationTimeline.map((phase, index) => {
                  const Icon = phase.icon;
                  return (
                    <div key={phase.phase} className={`rounded-xl border p-6 ${phase.color}`}>
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
                            <Icon className="w-6 h-6 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{phase.phase}</h3>
                            <div className="text-sm font-medium text-gray-700">{phase.time}</div>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Actions Taken:</div>
                              <ul className="space-y-1">
                                {phase.actions.map((action, i) => (
                                  <li key={i} className="flex items-center text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {phase.notifications.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Notifications Sent:</div>
                                <ul className="space-y-1">
                                  {phase.notifications.map((notification, i) => (
                                    <li key={i} className="flex items-start text-gray-600">
                                      <Bell className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                                      {notification}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Key Features */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-bold text-gray-900 mb-2">False Alarm Prevention</div>
                  <p className="text-sm text-gray-600">
                    Multiple grace periods and reminder stages prevent unnecessary panic
                    while ensuring genuine emergencies get immediate attention.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-bold text-gray-900 mb-2">Contact Verification</div>
                  <p className="text-sm text-gray-600">
                    Contacts can verify your safety and stop escalation, or request
                    more information before escalating further.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-bold text-gray-900 mb-2 flex items-center justify-between">
                    <span>Emergency Override</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-purple-200 text-purple-800 rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Shake phone or press volume buttons to trigger immediate escalation
                    to all contacts, bypassing all timers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Multi-Channel Notification System
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {notificationTypes.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div key={notif.type} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="font-bold text-gray-900">{notif.type}</div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{notif.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700">Timing:</span>
                          <span className="font-medium text-gray-800">{notif.timing}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700">Channel:</span>
                          <span className="font-medium text-gray-800">{notif.channel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notification Example */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Example Contact Notification</h3>
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-300">
                  <div className="font-bold text-gray-900 mb-2">📱 SMS to Trusted Contact (60 min):</div>
                  <div className="text-gray-700 bg-white p-4 rounded border">
                    <p className="mb-2">URGENT: John's ChainAlert protection ended 60 minutes ago.</p>
                    <p className="mb-2">Last location: Downtown NYC (2:30 PM)</p>
                    <p className="mb-2">Activity: Court appointment</p>
                    <p>Please confirm safety or escalate.</p>
                    <div className="mt-3 flex gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">MARK SAFE</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">MORE INFO</span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">ESCALATE NOW</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Features */}
        {activeSection === "features" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Advanced Protection Features (Coming Soon)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-5 border border-gray-200 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-blue-600" />
                      Auto-Detection & Suggestions
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-blue-500 mr-2" />
                        Recognizes frequent locations and patterns
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-blue-500 mr-2" />
                        Suggests appropriate protection levels
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-blue-500 mr-2" />
                        Flags high-risk locations automatically
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 border border-gray-200 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                      Safety Verification
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-green-500 mr-2" />
                        Optional photo verification for check-ins
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-green-500 mr-2" />
                        Pre-set safe words for duress situations
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-green-500 mr-2" />
                        Location verification requests
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 border border-gray-200 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Automated Documentation
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-purple-500 mr-2" />
                        Auto-attach relevant documents during escalation
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-purple-500 mr-2" />
                        Timeline of events for legal cases
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-purple-500 mr-2" />
                        Encrypted storage of sensitive information
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 border border-gray-200 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-orange-600" />
                      Community Features
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-orange-500 mr-2" />
                        Group check-ins for family or teams
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-orange-500 mr-2" />
                        Area alerts if multiple users report issues
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-orange-500 mr-2" />
                        Shared safety resources by location
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-10 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ready to Secure Your Safety?</h3>
                    <p>Start your first protection session in under 2 minutes.</p>
                  </div>
                  <button className="mt-4 md:mt-0 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition">
                    Start Protection Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>ChainAlert is designed for emergency situations. Always call 911 for immediate danger.</p>
          <p className="mt-1">This system augments but does not replace emergency services.</p>
        </div>
      </div>
    </main>
  );
}
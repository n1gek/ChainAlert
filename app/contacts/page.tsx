"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../authContext";
import {
  Users,
  Scale,
  UserPlus,
  UserMinus,
  Phone,
  Mail,
  Building,
  Shield,
  AlertTriangle,
  ChevronRight,
  FileText,
  Search,
  Edit2,
  Trash2,
  Download,
  X
} from "lucide-react";

interface Contact {
  id: string;
  contactId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationship: string;
  isLegal: boolean;
  organization?: string;
  barNumber?: string;
  specialization?: string;
  notifyVia?: ('sms' | 'email' | 'call')[];
}

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"emergency" | "legal">("emergency");
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Form state for adding/editing
  const [formData, setFormData] = useState<Partial<Contact>>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    relationship: "",
    isLegal: false,
    organization: "",
    barNumber: "",
    specialization: ""
  });

  // Load contacts on mount
  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/contacts/api?userId=${user.uid}`);
      const data = await response.json();
      
      if (response.ok) {
        // Transform contacts from database format to UI format
        const transformedContacts = data.contacts.map((c: any) => {
          const metadata = c.metadata || {};
          const [firstName, ...lastNameParts] = c.name.split(' ');
          return {
            id: c.contactId,
            contactId: c.contactId,
            firstName: metadata.firstName || firstName || '',
            lastName: metadata.lastName || lastNameParts.join(' ') || '',
            phone: c.phone,
            email: c.email || '',
            relationship: c.relationship,
            isLegal: metadata.isLegal || false,
            organization: metadata.organization || '',
            barNumber: metadata.barNumber || '',
            specialization: metadata.specialization || '',
            notifyVia: c.notifyVia || ['sms', 'email']
          };
        });
        setContacts(transformedContacts);
      } else {
        console.error('Failed to load contacts:', data.error);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAdding) {
        handleCancel();
      }
    };

    if (isAdding) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isAdding]);

  const filteredContacts = contacts
    .filter(contact => contact.isLegal === (activeTab === "legal"))
    .filter(contact => 
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.relationship.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleAddContact = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !user) {
      alert("Please fill in required fields (First Name, Last Name, and Phone)");
      return;
    }

    try {
      const contactData = {
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        phone: formData.phone!,
        email: formData.email || "",
        relationship: formData.relationship || "Other",
        isLegal: activeTab === "legal",
        organization: formData.organization || "",
        barNumber: formData.barNumber || "",
        specialization: formData.specialization || "",
        notifyVia: ['sms', 'email'] as ('sms' | 'email' | 'call')[]
      };

      const response = await fetch('/contacts/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, contact: contactData })
      });

      const data = await response.json();

      if (response.ok) {
        await loadContacts(); // Reload from database
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          relationship: "",
          isLegal: activeTab === "legal",
          organization: "",
          barNumber: "",
          specialization: ""
        });
        setIsAdding(false);
        alert('Contact added successfully!');
      } else {
        throw new Error(data.error || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert(`Failed to add contact: ${(error as Error).message}`);
    }
  };

  const handleEditContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      setFormData(contact);
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const handleUpdateContact = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !user) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const contactData = {
        contactId: editingId!,
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        phone: formData.phone!,
        email: formData.email || "",
        relationship: formData.relationship || "Other",
        isLegal: formData.isLegal || false,
        organization: formData.organization || "",
        barNumber: formData.barNumber || "",
        specialization: formData.specialization || "",
        notifyVia: formData.notifyVia || ['sms', 'email'] as ('sms' | 'email' | 'call')[]
      };

      const response = await fetch('/contacts/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, contact: contactData })
      });

      const data = await response.json();

      if (response.ok) {
        await loadContacts(); // Reload from database
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          relationship: "",
          isLegal: false,
          organization: "",
          barNumber: "",
          specialization: ""
        });
        setEditingId(null);
        setIsAdding(false);
        alert('Contact updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      alert(`Failed to update contact: ${(error as Error).message}`);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to remove this contact?") || !user) {
      return;
    }

    try {
      const response = await fetch(`/contacts/api?userId=${user.uid}&contactId=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        await loadContacts(); // Reload from database
        alert('Contact deleted successfully!');
      } else {
        throw new Error(data.error || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert(`Failed to delete contact: ${(error as Error).message}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      relationship: "",
      isLegal: activeTab === "legal",
      organization: "",
      barNumber: "",
      specialization: ""
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Emergency Contacts
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Add trusted emergency contacts and legal representatives who will be notified if you need help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                How Contacts Are Used
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-sm font-medium text-gray-900 mb-1">
                    <Users className="w-4 h-4 text-blue-500 mr-2" />
                    Emergency Contacts
                  </div>
                  <p className="text-sm text-gray-600">
                    Notified if you don't check in during an active session. Should be immediate family or close friends.
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center text-sm font-medium text-gray-900 mb-1">
                    <Scale className="w-4 h-4 text-purple-500 mr-2" />
                    Legal Contacts
                  </div>
                  <p className="text-sm text-gray-600">
                    Receive your full case file 24 hours after no check-in if escalation occurs.
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Contacts Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-purple-600" />
                Legal Contacts
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Legal representatives receive your full case file 24 hours after no check-in.
                </p>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-1">What's sent to lawyers:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      Your profile information
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      All uploaded documents
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      Timeline of events
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      Contact list with relationships
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => router.push('/consent')}
                  className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Manage Legal Consent
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Contact Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Emergency Contacts:</span>
                  <span className="font-bold">
                    {contacts.filter(c => !c.isLegal).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Legal Contacts:</span>
                  <span className="font-bold">
                    {contacts.filter(c => c.isLegal).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ready for Escalation:</span>
                  <span className="font-bold text-green-600">
                    {contacts.length > 0 ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contacts List & Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("emergency")}
                  className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center ${
                    activeTab === "emergency"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Emergency Contacts ({contacts.filter(c => !c.isLegal).length})
                </button>
                <button
                  onClick={() => setActiveTab("legal")}
                  className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center ${
                    activeTab === "legal"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Scale className="w-5 h-5 mr-2" />
                  Legal Contacts ({contacts.filter(c => c.isLegal).length})
                </button>
              </div>

              {/* Search & Add Button */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add {activeTab === "legal" ? "Legal Contact" : "Contact"}
                  </button>
                </div>
              </div>

              {/* Add/Edit Modal */}
              {isAdding && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={handleCancel}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                      <h3 className="font-bold text-xl text-gray-900">
                        {editingId ? "Edit Contact" : `Add New ${activeTab === "legal" ? "Legal Contact" : "Contact"}`}
                      </h3>
                      <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              value={formData.firstName || ""}
                              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              placeholder="John"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              value={formData.lastName || ""}
                              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              placeholder="Doe"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              Phone Number *
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                value={formData.phone || ""}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="(555) 123-4567"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              Email Address
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-1">
                            Relationship
                          </label>
                          <select
                            value={formData.relationship || ""}
                            onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          >
                            <option value="">Select relationship</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Attorney">Attorney</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Legal-specific fields */}
                        {activeTab === "legal" && (
                          <div className="space-y-4 mt-4 p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">Legal Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Organization
                                </label>
                                <div className="relative">
                                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={formData.organization || ""}
                                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="Law firm name"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bar Number
                                </label>
                                <input
                                  type="text"
                                  value={formData.barNumber || ""}
                                  onChange={(e) => setFormData({...formData, barNumber: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                  placeholder="State-Bar-Number"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Specialization
                              </label>
                              <input
                                type="text"
                                value={formData.specialization || ""}
                                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="e.g., Immigration Law, Asylum Cases"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={editingId ? handleUpdateContact : handleAddContact}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                      >
                        {editingId ? "Update Contact" : "Save Contact"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts List */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading contacts...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery ? "Try a different search" : `Add your first ${activeTab === "legal" ? "legal contact" : "emergency contact"}`}
                    </p>
                    <button
                      onClick={() => setIsAdding(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Add Contact
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3 className="text-lg font-bold text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </h3>
                              {contact.isLegal && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                  Legal
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-gray-600">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{contact.phone}</span>
                                </div>
                                {contact.email && (
                                  <div className="flex items-center text-gray-600">
                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{contact.email}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="text-gray-600">
                                  <span className="font-medium">Relationship:</span> {contact.relationship}
                                </div>
                                {contact.organization && (
                                  <div className="flex items-center text-gray-600">
                                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{contact.organization}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {contact.specialization && (
                              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700">Specialization:</div>
                                <div className="text-sm text-gray-600">{contact.specialization}</div>
                              </div>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditContact(contact.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Important Note */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">Important</div>
                  <p className="text-sm text-gray-700">
                    Make sure your contacts know they are listed as emergency contacts.
                    Primary contacts should be people who can act quickly in emergencies.
                    Legal contacts must have signed consent forms on file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
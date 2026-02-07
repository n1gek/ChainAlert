"use client";

import { useRef, useState, useEffect } from "react";
import { useAuth } from "../authContext";
import {
  Upload,
  FileText,
  Image,
  Shield,
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  User,
  Building,
  FileCheck2,
  Search,
  Filter,
  FolderPlus,
  ShieldAlert,
  ChevronRight,
  File as FileIcon
} from "lucide-react";

interface Document {
  id: string;
  documentId?: string;
  name: string;
  type: 'identification' | 'immigration' | 'legal' | 'medical' | 'other';
  category: string;
  size: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'expired';
  description?: string;
  file?: File;
  storagePath?: string;
  isEncrypted: boolean;
  accessLevel: 'public' | 'contacts' | 'legal_only';
}

const documentCategories = [
  { id: 'all', name: 'All Documents', icon: FileIcon, color: 'bg-gray-100 text-gray-700' },
  { id: 'identification', name: 'Identification', icon: User, color: 'bg-blue-100 text-blue-700' },
  { id: 'immigration', name: 'Immigration', icon: Building, color: 'bg-green-100 text-green-700' },
  { id: 'legal', name: 'Legal', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  { id: 'medical', name: 'Medical', icon: Shield, color: 'bg-red-100 text-red-700' },
  { id: 'other', name: 'Other', icon: FolderPlus, color: 'bg-yellow-100 text-yellow-700' }
];

// Required documents organized by category
const requiredDocuments = {
  identification: {
    required: true,
    documents: [
      { id: 'gov_id', name: 'Government-Issued ID', description: 'Driver\'s License, State ID, or Passport', required: true },
      { id: 'birth_certificate', name: 'Birth Certificate', description: 'Official birth certificate', required: false }
    ]
  },
  immigration: {
    required: true,
    documents: [
      { id: 'passport', name: 'Passport', description: 'Valid passport', required: false },
      { id: 'visa', name: 'Visa', description: 'Current visa documentation', required: false },
      { id: 'work_permit', name: 'Work Authorization', description: 'EAD, Green Card, or Work Permit', required: false },
      { id: 'i94', name: 'I-94 Form', description: 'Arrival/Departure record', required: false }
    ]
  },
  legal: {
    required: false,
    documents: [
      { id: 'court_docs', name: 'Court Documents', description: 'Any pending court documents', required: false },
      { id: 'legal_rep', name: 'Legal Representation', description: 'Attorney contact or power of attorney', required: false }
    ]
  },
  medical: {
    required: false,
    documents: [
      { id: 'insurance', name: 'Health Insurance Card', description: 'Current health insurance', required: false },
      { id: 'medical_conditions', name: 'Medical Conditions List', description: 'List of conditions and medications', required: false }
    ]
  },
  other: {
    required: false,
    documents: [
      { id: 'proof_address', name: 'Proof of Address', description: 'Utility bill or lease agreement', required: false },
      { id: 'employment', name: 'Employment Verification', description: 'Pay stub or employment letter', required: false }
    ]
  }
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocument, setNewDocument] = useState<Partial<Document>>({
    type: 'identification',
    category: '',
    description: '',
    accessLevel: 'legal_only',
    isEncrypted: true
  });

  // Load documents on mount
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/docs/api?userId=${user.uid}`);
      const data = await response.json();
      
      if (response.ok) {
        // Transform Firestore documents to UI format
        const transformedDocs = data.documents.map((doc: any) => ({
          id: doc.documentId,
          documentId: doc.documentId,
          name: doc.name,
          type: doc.type,
          category: doc.category,
          size: formatFileSize(doc.size),
          uploadDate: new Date(doc.uploadedAt?.seconds * 1000).toISOString().split('T')[0],
          status: doc.status,
          description: doc.description || '',
          storagePath: doc.storagePath,
          isEncrypted: doc.isEncrypted,
          accessLevel: doc.accessLevel
        }));
        setDocuments(transformedDocs);
      } else {
        console.error('Failed to load documents:', data.error);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents
    .filter(doc => selectedCategory === 'all' || doc.type === selectedCategory)
    .filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    setNewDocument({
      ...newDocument,
      name: file.name,
      size: formatFileSize(file.size),
      uploadDate: new Date().toISOString().split('T')[0],
      file: file
    });

    setShowUploadForm(true);
  };

  // Get list of missing required documents
  const getMissingDocuments = () => {
    const missing: Array<{category: string, docName: string}> = [];
    
    Object.entries(requiredDocuments).forEach(([category, config]) => {
      config.documents.forEach(doc => {
        if (doc.required) {
          const hasDoc = documents.some(d => d.type === category && d.category === doc.id);
          if (!hasDoc) {
            missing.push({ category, docName: doc.name });
          }
        }
      });
    });
    
    return missing;
  };

  // Get human-readable document type name
  const getDocumentTypeName = (type: string, categoryId: string): string => {
    const category = requiredDocuments[type as keyof typeof requiredDocuments];
    if (!category) return categoryId;
    
    const doc = category.documents.find(d => d.id === categoryId);
    return doc ? doc.name : categoryId;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!newDocument.file || !user || !newDocument.type || !newDocument.category) {
      alert('Please select a document type and category');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newDocument.file);
      formData.append('userId', user.uid);
      formData.append('type', newDocument.type || 'other');
      formData.append('category', newDocument.category || 'Other');
      formData.append('description', newDocument.description || '');
      formData.append('accessLevel', newDocument.accessLevel || 'legal_only');
      formData.append('isEncrypted', String(newDocument.isEncrypted ?? true));

      const response = await fetch('/docs/api', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Reload documents from database
        await loadDocuments();
        
        // Reset form
        setNewDocument({
          type: 'identification',
          category: '',
          description: '',
          accessLevel: 'legal_only',
          isEncrypted: true
        });
        setShowUploadForm(false);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        alert('Document uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? It will also be removed from emergency escalations.')) {
      return;
    }

    try {
      const doc = documents.find(d => d.id === id);
      if (!doc) {
        throw new Error('Document not found');
      }

      const response = await fetch(`/docs/api?documentId=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id));
        alert('Document metadata deleted successfully!');
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${(error as Error).message}`);
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getAccessLevelBadge = (level: Document['accessLevel']) => {
    const styles = {
      public: 'bg-gray-100 text-gray-800',
      contacts: 'bg-blue-100 text-blue-800',
      legal_only: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      public: 'Public',
      contacts: 'Trusted Contacts',
      legal_only: 'Legal Only'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-center mb-4">
            <ShieldAlert className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Document Vault
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto text-center">
            Securely store and manage important documents. These will be automatically shared with legal contacts during escalation.
          </p>
          
          {/* Info Banner - Metadata Only Mode */}
          <div className="mt-4 max-w-3xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <strong>Free Tier Mode:</strong> Document metadata (names, types, details) are saved to track what you have. Actual file storage requires upgrading to a paid Firebase plan.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Categories & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Categories
              </h2>
              <div className="space-y-2">
                {documentCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center p-3 rounded-lg transition ${
                        selectedCategory === cat.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{cat.name}</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {documents.filter(d => cat.id === 'all' || d.type === cat.id).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-green-600" />
                Upload Document
              </h2>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <div className="font-medium text-gray-700">Click to upload</div>
                    <div className="text-sm text-gray-500 mt-1">
                      PDF, JPG, PNG up to 10MB
                    </div>
                  </div>
                </button>

                {showUploadForm && newDocument.file && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                    <div className="font-medium text-black">Selected File:</div>
                    <div className="text-sm text-black font-medium">
                      {newDocument.name} ({newDocument.size})
                    </div>

                    {/* Document Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Category *
                      </label>
                      <select
                        value={newDocument.type}
                        onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value as Document['type'], category: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                      >
                        <option value="identification">Identification</option>
                        <option value="immigration">Immigration</option>
                        <option value="legal">Legal</option>
                        <option value="medical">Medical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Document Subtype Selection */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Document Type *
                      </label>
                      <select
                        value={newDocument.category}
                        onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                      >
                        <option value="" disabled>Select document type...</option>
                        {newDocument.type && requiredDocuments[newDocument.type as keyof typeof requiredDocuments]?.documents.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} {doc.required && '(Required)'}
                          </option>
                        ))}
                      </select>
                      {newDocument.type && newDocument.category && (
                        <p className="text-xs text-black mt-1">
                          {requiredDocuments[newDocument.type as keyof typeof requiredDocuments]?.documents.find(d => d.id === newDocument.category)?.description}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={newDocument.description || ''}
                        onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                        placeholder="Add any additional notes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUpload}
                        disabled={uploading || !newDocument.category}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        onClick={() => {
                          setShowUploadForm(false);
                          setNewDocument({
                            type: 'identification',
                            category: '',
                            description: '',
                            accessLevel: 'legal_only',
                            isEncrypted: true
                          });
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Missing Required Documents */}
              {!loading && getMissingDocuments().length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-yellow-900 mb-1">Missing Required Documents</div>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        {getMissingDocuments().map((doc, idx) => (
                          <li key={idx}>• {doc.docName}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-purple-600" />
                Security & Access
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-1">Encryption</div>
                  <p className="text-xs text-gray-600">
                    All documents are encrypted at rest and in transit using AES-256 encryption.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-1">Access Control</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Legal Only: Lawyers during escalation
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Trusted Contacts: With your approval
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                      Public: Never used for sensitive documents
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Documents List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Search & Stats */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      {documents.filter(d => d.status === 'verified').length} verified
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                      {documents.filter(d => d.status === 'pending').length} pending
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading documents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'Try a different search' : 'Upload your first document'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Document Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              {doc.name.match(/\.(pdf)$/i) ? (
                                <FileText className="w-6 h-6 text-blue-600" />
                              ) : (
                                <Image className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                          </div>

                          {/* Document Info */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3 className="text-lg font-bold text-gray-900">
                                {doc.name}
                              </h3>
                              <div className="flex items-center">
                                {getStatusIcon(doc.status)}
                                <span className="ml-1 text-xs font-medium capitalize">
                                  {doc.status}
                                </span>
                              </div>
                              {getAccessLevelBadge(doc.accessLevel)}
                              {doc.isEncrypted && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Encrypted
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-gray-600">
                                  <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center mr-2">
                                    <FileIcon className="w-2 h-2 text-blue-600" />
                                  </div>
                                  <span className="text-sm">{getDocumentTypeName(doc.type, doc.category)}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <div className="w-4 h-4 rounded bg-green-100 flex items-center justify-center mr-2">
                                    <FileCheck2 className="w-2 h-2 text-green-600" />
                                  </div>
                                  <span>{doc.size}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-gray-600">
                                  <span className="font-medium">Uploaded:</span> {doc.uploadDate}
                                </div>
                                {doc.description && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Note:</span> {doc.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
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

            {/* Important Information */}
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    Recommended Documents
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Passport or State ID
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Immigration documents (visa, work permit)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Proof of address (lease, utility bill)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Emergency contact list
                    </li>
                  </ul>
                </div>

                <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    During Escalation
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    These documents will be automatically shared with legal contacts 24 hours after no check-in.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      Only documents marked "Legal Only" or "Trusted Contacts"
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      Encrypted during transmission
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      Access logged for security
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Mail, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  MoreVertical,
  Users,
  PhoneCall,
  Filter,
  Download,
  Upload,
  Star,
  Clock
} from "lucide-react";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  country?: string;
  notes?: string;
  createdAt: string;
}

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'frequent'>('name');
  const [newContact, setNewContact] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchContacts();
    }
  }, [status, router]);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/user/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        console.error("Failed to fetch contacts");
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/user/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newContact),
      });

      if (response.ok) {
        const contact = await response.json();
        setContacts([...contacts, contact]);
        setNewContact({ name: "", phoneNumber: "", email: "", notes: "" });
        setShowAddContact(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("Failed to add contact. Please try again.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    try {
      const response = await fetch(`/api/user/contacts?id=${contactId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setContacts(contacts.filter(contact => contact.id !== contactId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact. Please try again.");
    }
  };

  const handleCall = (phoneNumber: string) => {
    router.push(`/dashboard/dialer?number=${encodeURIComponent(phoneNumber)}`);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumber.includes(searchTerm) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-white/80 rounded-xl transition-colors shadow-sm"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                    <p className="text-sm text-gray-600">{contacts.length} contacts</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddContact(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search & Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search contacts by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'frequent')}
                  className="appearance-none bg-white/80 border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer"
                >
                  <option value="name">Sort by Name</option>
                  <option value="recent">Recently Added</option>
                  <option value="frequent">Most Called</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="p-2.5 bg-white/80 hover:bg-white border border-gray-200 rounded-xl transition-colors"
                  title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
                >
                  <Users className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2.5 bg-white/80 hover:bg-white border border-gray-200 rounded-xl transition-colors" title="Export Contacts">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2.5 bg-white/80 hover:bg-white border border-gray-200 rounded-xl transition-colors" title="Import Contacts">
                  <Upload className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          {contacts.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {filteredContacts.length} of {contacts.length} contacts
                  </span>
                </div>
                {selectedContacts.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {selectedContacts.length} selected
                    </span>
                  </div>
                )}
              </div>
              
              {selectedContacts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Delete Selected
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Export Selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modern Contacts Display */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="p-16 text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm ? "No contacts found" : "Your contact book is empty"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? `No contacts match "${searchTerm}". Try a different search term.`
                  : "Add your first contact to start building your personal phone book and make calling easier."
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddContact(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  Add Your First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="group p-6 hover:bg-white/80 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    {/* Contact Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-lg">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{contact.name}</h3>
                          <Star className="h-4 w-4 text-gray-300 hover:text-yellow-500 cursor-pointer transition-colors" />
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm font-medium">{contact.phoneNumber}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm truncate max-w-xs">{contact.email}</span>
                            </div>
                          )}
                        </div>

                        {contact.notes && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-1">{contact.notes}</p>
                        )}

                        {/* Last contacted */}
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>Added {new Date(contact.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCall(contact.phoneNumber)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl group/call"
                        title="Call this contact"
                      >
                        <PhoneCall className="h-4 w-4 group-hover/call:scale-110 transition-transform" />
                      </button>
                      
                      <button 
                        className="bg-white/80 hover:bg-white text-gray-600 hover:text-blue-600 p-3 rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                        title="Edit contact"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <div className="relative">
                        <button 
                          className="bg-white/80 hover:bg-white text-gray-600 hover:text-gray-700 p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {/* Dropdown menu could go here */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modern Add Contact Modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Contact</h2>
                    <p className="text-sm text-gray-600">Create a new contact in your phone book</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <span className="text-gray-400 hover:text-gray-600 text-xl">✕</span>
                </button>
              </div>
              
              <form onSubmit={handleAddContact} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-3">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={newContact.phoneNumber}
                        onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  
                  {/* Notes Field */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-3">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none"
                      placeholder="Add notes about this contact..."
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Add Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



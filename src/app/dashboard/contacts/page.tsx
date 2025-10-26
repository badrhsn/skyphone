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
  const [favoriteContacts, setFavoriteContacts] = useState<string[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    contactId?: string;
    contactName?: string;
    isMultiple?: boolean;
    count?: number;
  }>({ show: false });
  const [errorModal, setErrorModal] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({ show: false, title: '', message: '' });
  const [infoModal, setInfoModal] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({ show: false, title: '', message: '' });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchContacts();
    }
  }, [status, router]);

  // Reset to first page when the search term or contacts list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, contacts.length]);

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
    setIsSaving(true);
    try {
      if (editingContact) {
        // Update existing contact
        const response = await fetch("/api/user/contacts", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...newContact, id: editingContact.id }),
        });

        if (response.ok) {
          const updatedContact = await response.json();
          setContacts(contacts.map(c => c.id === editingContact.id ? updatedContact : c));
          setNewContact({ name: "", phoneNumber: "", email: "", notes: "" });
          setEditingContact(null);
          setShowAddContact(false);
        } else {
          const errorData = await response.json();
          setErrorModal({
            show: true,
            title: "Update Failed",
            message: errorData.error || "Failed to update contact"
          });
        }
      } else {
        // Add new contact
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
          setErrorModal({
            show: true,
            title: "Add Contact Failed",
            message: errorData.error || "Failed to add contact"
          });
        }
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      setErrorModal({
        show: true,
        title: "Save Failed",
        message: "Failed to save contact. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: string, skipConfirmation: boolean = false) => {
    if (!skipConfirmation) {
      const contact = contacts.find(c => c.id === contactId);
      setDeleteModal({
        show: true,
        contactId,
        contactName: contact?.name || "this contact",
        isMultiple: false
      });
      return;
    }

    try {
      const response = await fetch(`/api/user/contacts?id=${contactId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setContacts(contacts.filter(contact => contact.id !== contactId));
        setDeleteModal({ show: false });
      } else {
        const errorData = await response.json();
        setErrorModal({
          show: true,
          title: "Delete Failed",
          message: errorData.error || "Failed to delete contact"
        });
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      setErrorModal({
        show: true,
        title: "Delete Failed",
        message: "Failed to delete contact. Please try again."
      });
    }
  };

  const handleCall = (phoneNumber: string, contactCountry?: string) => {
    const params = new URLSearchParams();
    params.set('number', phoneNumber);
    if (contactCountry) {
      params.set('country', contactCountry);
    }
    router.push(`/dashboard/dialer?${params.toString()}`);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header (mirrors Add Credits structure) */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-[#00aff0]" />
              <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
            </div>

            <div>
              <button
                onClick={() => setShowAddContact(true)}
                className="bg-[#00aff0] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#0099d6]"
              >
                <Plus className="inline h-4 w-4 mr-2" /> Add Contact
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-dashed flex items-center justify-between" style={{ borderColor: '#cfeeff', backgroundColor: '#f5fbff' }}>
            <div className="text-gray-700">Need Yadaphone for the team?</div>
            <Link href="/dashboard/enterprise" className="inline-flex items-center text-white px-4 py-2 rounded-full font-semibold" style={{ backgroundColor: '#00aff0' }}>
              See enterprise plans
            </Link>
          </div>

          <p className="mt-4 text-lg text-gray-700">Quickly call, edit and organize your contacts. Use search and filters to find someone fast.</p>
        </div>

  {/* Search & Controls (styled like Add Credits panels) */}
  <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#00aff0] h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search contacts by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all"
                />
              </div>
            </div>

            {/* Pagination */}
            {filteredContacts.length > pageSize && (
              <div className="flex items-center justify-between mt-4 px-3 py-2">
                <div className="text-sm text-gray-600">Showing {Math.min((currentPage - 1) * pageSize + 1, filteredContacts.length)}-{Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length}</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-200 bg-white text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-700">Page {currentPage} of {Math.ceil(filteredContacts.length / pageSize)}</div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredContacts.length / pageSize), p + 1))}
                    disabled={currentPage === Math.ceil(filteredContacts.length / pageSize)}
                    className="px-3 py-1 rounded-md border border-gray-200 bg-white text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="p-2.5 bg-white/80 hover:bg-white border border-gray-200 rounded-lg transition-colors"
                  title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
                >
                  <Users className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Name,Phone Number,Email,Notes\n"
                      + contacts.map(c => `"${c.name}","${c.phoneNumber}","${c.email || ''}","${c.notes || ''}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "contacts.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-2.5 bg-white/80 hover:bg-white border border-gray-200 rounded-lg transition-colors" 
                  title="Export Contacts"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => setInfoModal({
                    show: true,
                    title: "Import Contacts",
                    message: "Import feature coming soon! You can manually add contacts for now."
                  })}
                  className="p-2.5 bg-white/80 hover:bg-white border border-gray-200 rounded-lg transition-colors" 
                  title="Import Contacts"
                >
                  <Upload className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row (compact) */}
          {contacts.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">{filteredContacts.length} of {contacts.length} contacts</div>
                {selectedContacts.length > 0 && <div className="text-sm text-gray-600">{selectedContacts.length} selected</div>}
              </div>

              {selectedContacts.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button onClick={() => setDeleteModal({ show: true, isMultiple: true, count: selectedContacts.length })} className="text-sm text-red-600">Delete Selected</button>
                  <button onClick={() => {
                    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
                    const csvContent = "data:text/csv;charset=utf-8," + "Name,Phone Number,Email,Notes\n" + selectedContactsData.map(c => `"${c.name}","${c.phoneNumber}","${c.email || ''}","${c.notes || ''}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "selected_contacts.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }} className="text-sm text-[#00aff0]">Export Selected</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contacts List (cards like Add Credits panels) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="p-16 text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-[#e6fbff] rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-10 w-10 text-[#00aff0]" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#00aff0] rounded-full flex items-center justify-center">
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
                  className="bg-[#00aff0] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#0099d6] transition-all"
                >
                  Add Your First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 px-3 py-3">
              {filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((contact) => (
                  <div key={contact.id} className={`p-4 rounded-xl border ${selectedContacts.includes(contact.id) ? 'border-[#00aff0] bg-[#e6fbff]' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      {/* Contact Info (compact single-line) */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact.id]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                          }
                        }}
                        className="w-4 h-4 text-[#00aff0] bg-gray-100 border-gray-300 rounded focus:ring-[#00aff0] focus:ring-2"
                      />

                      {/* Avatar (circle, subtle border) */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-[#00aff0] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      </div>

                      {/* Details (single-line, truncating) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{contact.name}</h3>
                          <span className="text-sm text-gray-500 truncate max-w-xs">{contact.phoneNumber}</span>
                          {contact.email && (
                            <span className="text-sm text-gray-400 truncate max-w-xs">{contact.email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions (always visible) */}
                    <div className="flex items-center space-x-2 transition-opacity">
                      <button
                        onClick={() => handleCall(contact.phoneNumber, contact.country)}
                        className="bg-white/80 text-gray-600 p-2.5 rounded-lg border border-gray-200 hover:text-[#00aff0] transition-colors"
                        title="Call this contact"
                      >
                        <PhoneCall className="h-4 w-4" />
                      </button>
                      
                      <button 
                        onClick={() => {
                          setEditingContact(contact);
                          setNewContact({
                            name: contact.name,
                            phoneNumber: contact.phoneNumber,
                            email: contact.email || "",
                            notes: contact.notes || ""
                          });
                          setShowAddContact(true);
                        }}
                        className="bg-white/80 text-gray-600 p-2.5 rounded-lg border border-gray-200 hover:text-[#00aff0] transition-colors"
                        title="Edit contact"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="bg-white/80 text-gray-600 p-2.5 rounded-lg border border-gray-200 hover:text-red-600 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Add button (mobile/quick access) */}
        <button
          onClick={() => setShowAddContact(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#00aff0] text-white p-3.5 rounded-full hover:bg-[#0099d6] lg:hidden"
          aria-label="Add contact"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Add / Edit Contact Modal (two-column layout similar to provided design, using our tokens) */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-2xl w-full border border-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
              </div>

              <form onSubmit={handleAddContact} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all"
                        placeholder="Contact name"
                        required
                      />
                    </div>
                  </div>

                  {/* Company (placeholder empty) */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input type="text" id="company" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all" placeholder="Company name" />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all"
                      placeholder="Phone number"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all"
                      placeholder="Email address"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input type="url" id="website" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all" placeholder="Website URL" />
                  </div>

                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <input type="text" id="tags" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all" placeholder="Tags (comma separated)" />
                  </div>

                  {/* Notes spanning two columns */}
                  <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea
                      id="notes"
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] transition-all resize-none"
                      placeholder="Additional notes"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContact(false);
                      setEditingContact(null);
                      setNewContact({ name: "", phoneNumber: "", email: "", notes: "" });
                    }}
                    className="bg-transparent text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    aria-busy={isSaving}
                    className={`flex items-center justify-center bg-[#00aff0] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#0099d6] transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 mr-3 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                      </>
                    ) : (
                      (editingContact ? "Save changes" : "Save contact")
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-lg w-full border border-gray-100">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="h-9 w-9 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {deleteModal.isMultiple ? "Delete Multiple Contacts" : "Delete Contact"}
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  {deleteModal.isMultiple 
                    ? `Are you sure you want to delete ${deleteModal.count} selected contacts? This action cannot be undone.`
                    : `Are you sure you want to delete "${deleteModal.contactName}"? This action cannot be undone.`
                  }
                </p>
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => setDeleteModal({ show: false })}
                    className="flex-1 max-w-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-4 rounded-full font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteModal.isMultiple) {
                        // Handle bulk delete
                        Promise.all(selectedContacts.map(contactId => 
                          fetch(`/api/user/contacts?id=${contactId}`, { method: "DELETE" })
                        )).then(() => {
                          setContacts(contacts.filter(c => !selectedContacts.includes(c.id)));
                          setSelectedContacts([]);
                          setDeleteModal({ show: false });
                        }).catch(() => {
                          setErrorModal({
                            show: true,
                            title: "Delete Failed",
                            message: "Failed to delete some contacts. Please try again."
                          });
                          setDeleteModal({ show: false });
                        });
                      } else if (deleteModal.contactId) {
                        handleDeleteContact(deleteModal.contactId, true);
                      }
                    }}
                    className="flex-1 max-w-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {errorModal.title}
                </h3>
                <p className="text-gray-600 mb-8">
                  {errorModal.message}
                </p>
                <button
                  onClick={() => setErrorModal({ show: false, title: '', message: '' })}
                  className="w-full bg-[#00aff0] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0099d6] transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {infoModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-blue-600 text-2xl">ℹ️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {infoModal.title}
                </h3>
                <p className="text-gray-600 mb-8">
                  {infoModal.message}
                </p>
                <button
                  onClick={() => setInfoModal({ show: false, title: '', message: '' })}
                  className="w-full bg-[#00aff0] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0099d6] transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



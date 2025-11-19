"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Sponsor {
  id: number;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminSponsorsPage() {
  const { data: session } = useSession();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    is_active: true,
    display_order: 0,
    logo: null as File | null
  });

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/sponsors');
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('website', formData.website);
    submitData.append('description', formData.description);
    submitData.append('is_active', formData.is_active.toString());
    submitData.append('display_order', formData.display_order.toString());

    if (formData.logo) {
      submitData.append('logo', formData.logo);
    }

    try {
      const url = editingSponsor ? `/api/sponsors/${editingSponsor.id}` : '/api/sponsors';
      const method = editingSponsor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData
      });

      if (response.ok) {
        fetchSponsors();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert('Error: ' + JSON.stringify(error.errors));
      }
    } catch (error) {
      console.error('Error saving sponsor:', error);
      alert('Error saving sponsor');
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      website: sponsor.website || '',
      description: sponsor.description || '',
      is_active: sponsor.is_active,
      display_order: sponsor.display_order,
      logo: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    try {
      const response = await fetch(`/api/sponsors/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSponsors();
      } else {
        alert('Error deleting sponsor');
      }
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      alert('Error deleting sponsor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      description: '',
      is_active: true,
      display_order: 0,
      logo: null
    });
    setEditingSponsor(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, logo: e.target.files[0] });
    }
  };

  if (loading) {
    return (
      <div className="container-max py-8">
        <div className="text-center">Loading sponsors...</div>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Sponsor Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn bg-blue-600 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Sponsor'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                rows={3}
                placeholder="Brief description of the sponsor"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn bg-green-600 text-white hover:bg-green-700">
                {editingSponsor ? 'Update' : 'Create'} Sponsor
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold">All Sponsors ({sponsors.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {sponsor.logo && (
                        <div className="w-8 h-8 mr-3 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs">
                          Logo
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{sponsor.name}</div>
                        {sponsor.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {sponsor.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sponsor.website ? (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Visit
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sponsor.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {sponsor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {sponsor.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(sponsor)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sponsor.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sponsors.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            No sponsors found. Add your first sponsor above.
          </div>
        )}
      </div>
    </div>
  );
}
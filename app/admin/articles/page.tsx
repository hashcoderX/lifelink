"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
});

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_name?: string;
  is_published: boolean;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export default function AdminArticlesPage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author_name: '',
    is_published: false,
    published_at: '',
    meta_title: '',
    meta_description: '',
    tags: [] as string[],
    featured_image: null as File | null
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('content', formData.content);
    submitData.append('excerpt', formData.excerpt);
    submitData.append('author_name', formData.author_name);
    submitData.append('is_published', formData.is_published.toString());
    submitData.append('published_at', formData.published_at);
    submitData.append('meta_title', formData.meta_title);
    submitData.append('meta_description', formData.meta_description);
    submitData.append('tags', JSON.stringify(formData.tags));

    if (formData.featured_image) {
      submitData.append('featured_image', formData.featured_image);
    }

    try {
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData
      });

      if (response.ok) {
        fetchArticles();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert('Error: ' + JSON.stringify(error.errors));
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Error saving article');
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      author_name: article.author_name || '',
      is_published: article.is_published,
      published_at: article.published_at || '',
      meta_title: article.meta_title || '',
      meta_description: article.meta_description || '',
      tags: article.tags || [],
      featured_image: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchArticles();
      } else {
        alert('Error deleting article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Error deleting article');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      author_name: '',
      is_published: false,
      published_at: '',
      meta_title: '',
      meta_description: '',
      tags: [],
      featured_image: null
    });
    setEditingArticle(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, featured_image: e.target.files[0] });
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  if (loading) {
    return (
      <div className="container-max py-8">
        <div className="text-center">Loading articles...</div>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Article Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn bg-blue-600 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Article'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingArticle ? 'Edit Article' : 'Add New Article'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content *</label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Article content (rich text editor)"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  rows={3}
                  placeholder="Brief summary of the article"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Author Name</label>
                <input
                  type="text"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  placeholder="Article author"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  placeholder="SEO title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <input
                  type="text"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  placeholder="SEO description"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Publish Date</label>
                <input
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Featured Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_published" className="text-sm font-medium">Publish Article</label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn bg-green-600 text-white hover:bg-green-700">
                {editingArticle ? 'Update' : 'Create'} Article
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
          <h2 className="text-lg font-semibold">All Articles ({articles.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {article.featured_image && (
                        <div className="w-8 h-8 mr-3 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs">
                          Img
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{article.title}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">/{article.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {article.author_name || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      article.is_published
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(article)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
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

        {articles.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            No articles found. Add your first article above.
          </div>
        )}
      </div>
    </div>
  );
}
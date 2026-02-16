<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ArticleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $articles = Article::ordered()->get();
        return response()->json($articles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'author_name' => 'nullable|string|max:255',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:160',
            'tags' => 'nullable|array'
        ]);

        $data = $request->only([
            'title', 'content', 'excerpt', 'author_name',
            'is_published', 'published_at', 'meta_title', 'meta_description', 'tags'
        ]);

        // Generate slug from title
        $data['slug'] = Str::slug($request->title);

        // Ensure unique slug
        $originalSlug = $data['slug'];
        $count = 1;
        while (Article::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $originalSlug . '-' . $count;
            $count++;
        }

        // Handle featured image upload
        if ($request->hasFile('featured_image')) {
            $imagePath = $request->file('featured_image')->store('articles', 'public');
            $data['featured_image'] = $imagePath;
        }

        // Set published_at if publishing now
        if ($request->is_published && !$request->published_at) {
            $data['published_at'] = now();
        }

        $article = Article::create($data);

        return response()->json($article, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Article $article)
    {
        return response()->json($article);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Article $article)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'author_name' => 'nullable|string|max:255',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:160',
            'tags' => 'nullable|array'
        ]);

        $data = $request->only([
            'title', 'content', 'excerpt', 'author_name',
            'is_published', 'published_at', 'meta_title', 'meta_description', 'tags'
        ]);

        // Update slug if title changed
        if ($request->title !== $article->title) {
            $data['slug'] = Str::slug($request->title);

            // Ensure unique slug
            $originalSlug = $data['slug'];
            $count = 1;
            while (Article::where('slug', $data['slug'])->where('id', '!=', $article->id)->exists()) {
                $data['slug'] = $originalSlug . '-' . $count;
                $count++;
            }
        }

        // Handle featured image upload
        if ($request->hasFile('featured_image')) {
            // Delete old image if exists
            if ($article->featured_image && Storage::disk('public')->exists($article->featured_image)) {
                Storage::disk('public')->delete($article->featured_image);
            }

            $imagePath = $request->file('featured_image')->store('articles', 'public');
            $data['featured_image'] = $imagePath;
        }

        // Set published_at if publishing now
        if ($request->is_published && !$article->is_published && !$request->published_at) {
            $data['published_at'] = now();
        }

        $article->update($data);

        return response()->json($article);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Article $article)
    {
        // Delete featured image if exists
        if ($article->featured_image && Storage::disk('public')->exists($article->featured_image)) {
            Storage::disk('public')->delete($article->featured_image);
        }

        $article->delete();

        return response()->json(['message' => 'Article deleted successfully']);
    }

    /**
     * Get published articles for public display
     */
    public function published()
    {
        $articles = Article::published()->ordered()->get();
        return response()->json($articles);
    }

    /**
     * Get article by slug for public display
     */
    public function showBySlug($slug)
    {
        $article = Article::where('slug', $slug)->where('is_published', true)->firstOrFail();
        return response()->json($article);
    }
}

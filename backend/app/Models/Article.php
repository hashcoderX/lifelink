<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'author_name',
        'is_published',
        'published_at',
        'meta_title',
        'meta_description',
        'tags'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'tags' => 'array'
    ];

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('published_at', 'desc')->orderBy('created_at', 'desc');
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}

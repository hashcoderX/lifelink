<?php

namespace App\Http\Controllers;

use App\Models\Sponsor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SponsorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $sponsors = Sponsor::ordered()->get();
        return response()->json($sponsors);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'website' => 'nullable|url',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'display_order' => 'integer'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'website', 'description', 'is_active', 'display_order']);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('sponsors', 'public');
            $data['logo'] = $logoPath;
        }

        $sponsor = Sponsor::create($data);

        return response()->json($sponsor, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sponsor $sponsor)
    {
        return response()->json($sponsor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sponsor $sponsor)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'website' => 'nullable|url',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'display_order' => 'integer'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'website', 'description', 'is_active', 'display_order']);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($sponsor->logo && Storage::disk('public')->exists($sponsor->logo)) {
                Storage::disk('public')->delete($sponsor->logo);
            }

            $logoPath = $request->file('logo')->store('sponsors', 'public');
            $data['logo'] = $logoPath;
        }

        $sponsor->update($data);

        return response()->json($sponsor);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sponsor $sponsor)
    {
        // Delete logo file if exists
        if ($sponsor->logo && Storage::disk('public')->exists($sponsor->logo)) {
            Storage::disk('public')->delete($sponsor->logo);
        }

        $sponsor->delete();

        return response()->json(['message' => 'Sponsor deleted successfully']);
    }

    /**
     * Get active sponsors for public display
     */
    public function active()
    {
        $sponsors = Sponsor::active()->ordered()->get();
        return response()->json($sponsors);
    }
}

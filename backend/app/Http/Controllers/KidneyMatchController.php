<?php

namespace App\Http\Controllers;

use App\Models\KidneyMatch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KidneyMatchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = KidneyMatch::query();
        if ($request->has('donor_id')) {
            $query->where('donor_id', $request->integer('donor_id'));
        }
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->has('status')) {
            $query->where('status', $request->string('status'));
        }
        return response()->json($query->paginate(25));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'donor_id' => ['required','exists:donors,id'],
            'patient_id' => ['required','exists:patients,id'],
            'compatibility_score' => ['nullable','integer','min:0','max:100'],
            'status' => ['nullable', Rule::in(['PENDING','APPROVED','REJECTED','COMPLETED'])],
            'matched_at' => ['nullable','date'],
        ]);
        $match = KidneyMatch::create($data);
        return response()->json($match, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(KidneyMatch $kidneyMatch)
    {
        return response()->json($kidneyMatch);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, KidneyMatch $kidneyMatch)
    {
        $data = $request->validate([
            'compatibility_score' => ['sometimes','integer','min:0','max:100'],
            'status' => ['sometimes', Rule::in(['PENDING','APPROVED','REJECTED','COMPLETED'])],
            'matched_at' => ['sometimes','date'],
        ]);
        $kidneyMatch->update($data);
        return response()->json($kidneyMatch);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(KidneyMatch $kidneyMatch)
    {
        $kidneyMatch->delete();
        return response()->json(['message' => 'Deleted']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::query();
        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->string('entity_type'));
        }
        if ($request->has('entity_id')) {
            $query->where('entity_id', $request->integer('entity_id'));
        }
        return response()->json($query->paginate(50));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'action' => ['required','string','max:100'],
            'entity_type' => ['nullable','string','max:100'],
            'entity_id' => ['nullable','integer'],
            'user_id' => ['nullable','exists:users,id'],
            'details' => ['nullable','array'],
        ]);
        $log = ActivityLog::create($data);
        return response()->json($log, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ActivityLog $activityLog)
    {
        return response()->json($activityLog);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ActivityLog $activityLog)
    {
        $data = $request->validate([
            'action' => ['sometimes','string','max:100'],
            'entity_type' => ['sometimes','string','max:100'],
            'entity_id' => ['sometimes','integer'],
            'user_id' => ['sometimes','exists:users,id'],
            'details' => ['sometimes','array'],
        ]);
        $activityLog->update($data);
        return response()->json($activityLog);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ActivityLog $activityLog)
    {
        $activityLog->delete();
        return response()->json(['message' => 'Deleted']);
    }
}

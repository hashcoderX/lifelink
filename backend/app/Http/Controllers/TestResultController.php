<?php

namespace App\Http\Controllers;

use App\Models\TestResult;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TestResultController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TestResult::query();
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->has('donor_id')) {
            $query->where('donor_id', $request->integer('donor_id'));
        }
        if ($request->has('type')) {
            $query->where('type', $request->string('type'));
        }
        return response()->json($query->paginate(25));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['nullable','exists:patients,id'],
            'donor_id' => ['nullable','exists:donors,id'],
            'type' => ['required', Rule::in(['HLA','CROSSMATCH','INFECTIOUS','OTHER'])],
            'name' => ['nullable','string','max:100'],
            'result' => ['nullable','string'],
            'is_positive' => ['nullable','boolean'],
            'performed_at' => ['nullable','date'],
        ]);
        $tr = TestResult::create($data);
        return response()->json($tr, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(TestResult $testResult)
    {
        return response()->json($testResult);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TestResult $testResult)
    {
        $data = $request->validate([
            'type' => ['sometimes', Rule::in(['HLA','CROSSMATCH','INFECTIOUS','OTHER'])],
            'name' => ['sometimes','string','max:100'],
            'result' => ['sometimes','string'],
            'is_positive' => ['sometimes','boolean'],
            'performed_at' => ['sometimes','date'],
        ]);
        $testResult->update($data);
        return response()->json($testResult);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TestResult $testResult)
    {
        $testResult->delete();
        return response()->json(['message' => 'Deleted']);
    }
}

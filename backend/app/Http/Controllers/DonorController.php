<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DonorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Donor::query();
        if ($request->has('donor_type')) {
            $query->where('donor_type', $request->input('donor_type'));
        }
        if ($request->has('blood_group')) {
            $query->where('blood_group', $request->input('blood_group'));
        }
        if ($request->boolean('available')) {
            $query->where('availability', true);
        }
        return response()->json($query->paginate(25));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'donor_code' => ['nullable','string','max:50', Rule::unique('donors','donor_code')],
            'full_name' => ['required','string','max:255'],
            'age' => ['nullable','integer','min:0','max:120'],
            'bmi' => ['nullable','numeric','min:0','max:100'],
            'sex' => ['nullable', Rule::in(['MALE','FEMALE','OTHER'])],
            'donor_type' => ['nullable', Rule::in(['BLOOD','KIDNEY'])],
            'blood_group' => ['nullable', Rule::in(['A+','A-','B+','B-','AB+','AB-','O+','O-'])],
            'rh_factor' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'hla_typing' => ['nullable','array'],
            'crossmatch_result' => ['nullable', Rule::in(['POSITIVE','NEGATIVE','UNKNOWN'])],
            'dsa' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'pra_score' => ['nullable','integer','min:0','max:100'],
            'creatinine_level' => ['nullable','numeric','min:0'],
            'gfr' => ['nullable','numeric','min:0'],
            'urea_level' => ['nullable','numeric','min:0'],
            'infectious_test_results' => ['nullable','array'],
            'medical_history' => ['nullable','string'],
            'location' => ['nullable','string','max:255'],
            'availability' => ['boolean'],
            'diabetes' => ['nullable','boolean'],
            'hypertension' => ['nullable','boolean'],
            'rejection_history' => ['nullable','boolean'],
            'previous_transplant' => ['nullable','boolean'],
            // linked account (optional)
            'new_user_email' => ['nullable','email','max:255', Rule::unique('users','email')],
            'new_user_password' => ['nullable','string','min:8'],
        ]);

        // Create linked user if credentials provided
        $wantsNewUser = $request->filled('new_user_email') || $request->filled('new_user_password');
        if ($wantsNewUser) {
            if (!$request->filled('new_user_email') || !$request->filled('new_user_password')) {
                return response()->json(['message' => 'Both new_user_email and new_user_password are required to create an account.'], 422);
            }
            $user = User::create([
                'name' => $data['full_name'] ?? 'Donor',
                'email' => $data['new_user_email'],
                'password' => $data['new_user_password'],
                'role' => 'DONOR',
            ]);
            $data['user_id'] = $user->id;
        } elseif ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        // If not provided, default to KIDNEY for admin-created donors
        if (!isset($data['donor_type'])) {
            $data['donor_type'] = 'KIDNEY';
        }
        
        // Remove user creation fields from donor data
        unset($data['new_user_email'], $data['new_user_password']);
        
        $donor = Donor::create($data);
        // Auto-generate donor_code if not provided
        if (empty($donor->donor_code)) {
            $donor->donor_code = sprintf('DNR-%06d', $donor->id);
            $donor->save();
        }
        $donor->refresh();
        return response()->json($donor, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Donor $donor)
    {
        return response()->json($donor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Donor $donor)
    {
        $data = $request->validate([
            'donor_code' => ['nullable','string','max:50', Rule::unique('donors','donor_code')->ignore($donor->id)],
            'full_name' => ['sometimes','string','max:255'],
            'age' => ['sometimes','integer','min:0','max:120'],
            'bmi' => ['sometimes','numeric','min:0','max:100'],
            'sex' => ['sometimes', Rule::in(['MALE','FEMALE','OTHER'])],
            'donor_type' => ['sometimes', Rule::in(['BLOOD','KIDNEY'])],
            'blood_group' => ['sometimes', Rule::in(['A+','A-','B+','B-','AB+','AB-','O+','O-'])],
            'rh_factor' => ['sometimes', Rule::in(['POSITIVE','NEGATIVE'])],
            'hla_typing' => ['sometimes','array'],
            'crossmatch_result' => ['sometimes', Rule::in(['POSITIVE','NEGATIVE','UNKNOWN'])],
            'dsa' => ['sometimes', Rule::in(['POSITIVE','NEGATIVE'])],
            'pra_score' => ['sometimes','integer','min:0','max:100'],
            'creatinine_level' => ['sometimes','numeric','min:0'],
            'gfr' => ['sometimes','numeric','min:0'],
            'urea_level' => ['sometimes','numeric','min:0'],
            'infectious_test_results' => ['sometimes','array'],
            'medical_history' => ['sometimes','string'],
            'location' => ['sometimes','string','max:255'],
            'availability' => ['sometimes','boolean'],
            'diabetes' => ['sometimes','boolean'],
            'hypertension' => ['sometimes','boolean'],
            'rejection_history' => ['sometimes','boolean'],
            'previous_transplant' => ['sometimes','boolean'],
        ]);
        $donor->update($data);
        return response()->json($donor);
    }

    /**
     * Display the authenticated user's donor profile.
     */
    public function me(Request $request)
    {
        $donor = $request->user()->donor;
        if (!$donor) {
            return response()->json(['message' => 'No donor profile found for user'], 404);
        }
        return response()->json(['donor' => $donor]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Donor $donor)
    {
        $donor->delete();
        return response()->json(['message' => 'Deleted']);
    }
}

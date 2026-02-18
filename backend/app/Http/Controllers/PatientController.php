<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Patient::query();
        if ($request->has('blood_group')) {
            $query->where('blood_group', $request->string('blood_group'));
        }
        if ($request->has('urgent_level')) {
            $query->where('urgent_level', $request->string('urgent_level'));
        }
        return response()->json($query->paginate(25));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_code' => ['nullable','string','max:50', Rule::unique('patients','patient_code')],
            'full_name' => ['required','string','max:255'],
            'age' => ['nullable','integer','min:0','max:120'],
            'sex' => ['nullable', Rule::in(['MALE','FEMALE','OTHER'])],
            'blood_group' => ['nullable', Rule::in(['A+','A-','B+','B-','AB+','AB-','O+','O-'])],
            'hla_typing' => ['nullable','array'],
            'crossmatch_result' => ['nullable', Rule::in(['POSITIVE','NEGATIVE','UNKNOWN'])],
            'pra_score' => ['nullable','integer','min:0','max:100'],
            'current_creatinine' => ['nullable','numeric','min:0'],
            'gfr' => ['nullable','numeric','min:0'],
            'diagnosis' => ['nullable','string'],
            'urgent_level' => ['nullable', Rule::in(['LOW','MEDIUM','HIGH','CRITICAL'])],
            'location' => ['nullable','string','max:255'],
            // Optional new user account creation
            'new_user_email' => ['nullable','email','max:255', Rule::unique('users','email')],
            'new_user_password' => ['nullable','string','min:8'],
            // Newly added fields
            'rh_factor' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'dsa' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'urea_level' => ['nullable','numeric','min:0'],
            'bmi' => ['nullable','numeric','min:0','max:100'],
            'diabetes' => ['nullable','boolean'],
            'hypertension' => ['nullable','boolean'],
            'hiv_status' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'hbv_status' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'hcv_status' => ['nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'previous_transplant' => ['nullable','boolean'],
            'rejection_history' => ['nullable','boolean'],
        ]);
        // Create a linked user if credentials provided; else associate to current user if present
        $auth = $request->user();
        // If authenticated user already has a patient profile, avoid unique constraint violation
        if ($auth) {
            $existing = Patient::where('user_id', $auth->id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Patient profile already exists for this user.',
                    'patient' => $existing,
                ], 409);
            }
        }
        $wantsNewUser = $request->filled('new_user_email') || $request->filled('new_user_password');
        if ($wantsNewUser) {
            if (!$request->filled('new_user_email') || !$request->filled('new_user_password')) {
                return response()->json(['message' => 'Both new_user_email and new_user_password are required to create an account.'], 422);
            }
            $user = User::create([
                'name' => $data['full_name'] ?? 'Patient',
                'email' => $request->string('new_user_email'),
                'password' => $request->string('new_user_password'), // hashed via cast
                'role' => 'PATIENT',
            ]);
            $data['user_id'] = $user->id;
        } elseif ($auth) {
            $data['user_id'] = $auth->id;
            if (empty($data['full_name'])) {
                $data['full_name'] = $auth->name ?? 'Unnamed';
            }
        }
        $patient = Patient::create($data);
        // Auto-generate patient_code if not provided
        if (empty($patient->patient_code)) {
            $patient->patient_code = sprintf('PAT-%06d', $patient->id);
            $patient->save();
        }
        return response()->json($patient->fresh(), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient)
    {
        return response()->json($patient);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Patient $patient)
    {
        // Authorization: only owner or (future) admin roles can update
        $auth = $request->user();
        if ($patient->user_id && (!$auth || $auth->id !== $patient->user_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'patient_code' => ['nullable','string','max:50', Rule::unique('patients','patient_code')->ignore($patient->id)],
            'full_name' => ['sometimes','nullable','string','max:255'],
            'age' => ['sometimes','nullable','integer','min:0','max:120'],
            'sex' => ['sometimes','nullable', Rule::in(['MALE','FEMALE','OTHER'])],
            'blood_group' => ['sometimes','nullable', Rule::in(['A+','A-','B+','B-','AB+','AB-','O+','O-'])],
            'hla_typing' => ['sometimes','nullable','array'],
            'crossmatch_result' => ['sometimes','nullable', Rule::in(['POSITIVE','NEGATIVE','UNKNOWN'])],
            'pra_score' => ['sometimes','nullable','integer','min:0','max:100'],
            'current_creatinine' => ['sometimes','nullable','numeric','min:0'],
            'gfr' => ['sometimes','nullable','numeric','min:0'],
            'diagnosis' => ['sometimes','nullable','string'],
            'urgent_level' => ['sometimes','nullable', Rule::in(['LOW','MEDIUM','HIGH','CRITICAL'])],
            'location' => ['sometimes','nullable','string','max:255'],
            // Newly added fields
            'rh_factor' => ['sometimes','nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'dsa' => ['sometimes','nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'urea_level' => ['sometimes','nullable','numeric','min:0'],
            'bmi' => ['sometimes','nullable','numeric','min:0','max:100'],
            'diabetes' => ['sometimes','nullable','boolean'],
            'hypertension' => ['sometimes','nullable','boolean'],
            'hiv_status' => ['sometimes','nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'hbv_status' => ['sometimes','nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'hcv_status' => ['sometimes','nullable', Rule::in(['POSITIVE','NEGATIVE'])],
            'previous_transplant' => ['sometimes','nullable','boolean'],
            'rejection_history' => ['sometimes','nullable','boolean'],
        ]);
        $patient->update($data);
        return response()->json($patient);
    }

    /**
     * Return the patient profile for the authenticated user.
     */
    public function me(Request $request)
    {
        $auth = $request->user();
        if (!$auth) return response()->json(['message' => 'Unauthenticated'], 401);
        $patient = Patient::where('user_id', $auth->id)->first();
        if (!$patient) return response()->json(['patient' => null]);
        return response()->json(['patient' => $patient]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient)
    {
        $patient->delete();
        return response()->json(['message' => 'Deleted']);
    }
}

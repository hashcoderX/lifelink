<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\Patient;

class AuthController extends Controller
{
    /**
     * Register a new user and return a token.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', 'string', 'max:32']
        ]);

        // Normalize role (uppercase, replace spaces/dashes) and validate
        $allowedRoles = ['DOCTOR','HOSPITAL','PATIENT','DONER','FUND_RAISER','GUEST'];
        $rawRole = $data['role'] ?? 'GUEST';
        $normalizedRole = strtoupper(preg_replace('/[\s-]+/', '_', $rawRole));
        // Accept both DONOR and DONER (map DONOR => DONER to match existing data)
        if ($normalizedRole === 'DONOR') {
            $normalizedRole = 'DONER';
        }
        if (! in_array($normalizedRole, $allowedRoles, true)) {
            $normalizedRole = 'GUEST';
        }

        // Fallback name from email prefix if name not provided
        $name = $data['name'] ?? explode('@', $data['email'])[0];

        $user = User::create([
            'name' => $name,
            'email' => $data['email'],
            'password' => $data['password'], // "hashed" cast will hash automatically (Laravel 12)
            'role' => $normalizedRole,
        ]);

        // Auto-create a Patient profile when role is PATIENT
        if ($normalizedRole === 'PATIENT') {
            Patient::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'user_id' => $user->id,
                    'full_name' => $user->name,
                    // Optional: initialize fields as null; front-end can fill later
                ]
            );
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Login a user and return a token.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Optionally delete old tokens
        // $user->tokens()->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Return the authenticated user's profile.
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([ 'message' => 'Logged out' ]);
    }

    /**
     * Update the authenticated user's profile (name/role).
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:32'],
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('role', $data) && $data['role']) {
            $normalizedRole = strtoupper(preg_replace('/[\s-]+/', '_', $data['role']));
            if ($normalizedRole === 'DONOR') {
                $normalizedRole = 'DONER';
            }
            $allowedRoles = ['DOCTOR','HOSPITAL','PATIENT','DONER','FUND_RAISER','GUEST'];
            $user->role = in_array($normalizedRole, $allowedRoles, true) ? $normalizedRole : $user->role;
        }
        $user->save();

        return response()->json(['user' => $user]);
    }

    /**
     * Upload and set the user's profile photo.
     */
    public function uploadPhoto(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $file = $request->file('photo');
        $path = $file->store('profile-photos', 'public');
        $user->profile_photo_url = asset('storage/'.$path);
        $user->save();

        return response()->json(['user' => $user]);
    }

    /**
     * Upload and set the user's cover photo.
     */
    public function uploadCover(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'cover' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $file = $request->file('cover');
        $path = $file->store('cover-photos', 'public');
        $user->cover_photo_url = asset('storage/'.$path);
        $user->save();

        return response()->json(['user' => $user]);
    }
}

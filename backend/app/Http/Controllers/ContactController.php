<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Donor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactController extends Controller
{
    /**
     * Get the authenticated user's contact record (create empty if missing)
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);
        $contact = Contact::firstOrCreate(['user_id' => $user->id]);
        return response()->json(['contact' => $contact]);
    }

    /**
     * Update (or create) the authenticated user's contact
     */
    public function updateMe(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $data = $request->validate([
            'phone' => ['nullable','string','max:32'],
            'alt_phone' => ['nullable','string','max:32'],
            'whatsapp' => ['nullable','string','max:32'],
            'secondary_email' => ['nullable','email','max:255'],
            'address_line1' => ['nullable','string','max:255'],
            'address_line2' => ['nullable','string','max:255'],
            'city' => ['nullable','string','max:100'],
            'state' => ['nullable','string','max:100'],
            'postal_code' => ['nullable','string','max:20'],
            'country' => ['nullable','string','max:100'],
            'location' => ['nullable','string','max:255'],
            'organization_name' => ['nullable','string','max:255'],
            'specialty' => ['nullable','string','max:255'],
            'website' => ['nullable','url','max:255'],
            'preferred_contact_method' => ['nullable','string','max:32'],
            'emergency_contact_name' => ['nullable','string','max:255'],
            'emergency_contact_phone' => ['nullable','string','max:32'],
        ]);

        $contact = DB::transaction(function () use ($user, $data) {
            $contact = Contact::firstOrCreate(['user_id' => $user->id]);
            $contact->fill($data)->save();

            if (array_key_exists('location', $data)) {
                Donor::where('user_id', $user->id)->update([
                    'location' => $data['location'],
                ]);
            }

            return $contact;
        });

        return response()->json(['contact' => $contact]);
    }
}

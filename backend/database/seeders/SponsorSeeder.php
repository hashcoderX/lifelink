<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sponsor;

class SponsorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sponsors = [
            [
                'name' => 'Global Health Foundation',
                'website' => 'https://globalhealth.org',
                'description' => 'Leading international organization dedicated to improving global health outcomes through research and community programs.',
                'is_active' => true,
                'display_order' => 1,
            ],
            [
                'name' => 'Medical Research Institute',
                'website' => 'https://medresearch.edu',
                'description' => 'Premier medical research institution focused on breakthrough discoveries in organ transplantation and regenerative medicine.',
                'is_active' => true,
                'display_order' => 2,
            ],
            [
                'name' => 'Life Sciences Corporation',
                'website' => 'https://lifesciences.com',
                'description' => 'Biotechnology company developing innovative solutions for organ preservation and transplant compatibility testing.',
                'is_active' => true,
                'display_order' => 3,
            ],
            [
                'name' => 'Community Health Network',
                'website' => 'https://communityhealth.net',
                'description' => 'Non-profit organization connecting local communities with healthcare resources and supporting organ donation awareness.',
                'is_active' => true,
                'display_order' => 4,
            ],
            [
                'name' => 'Wellness Partners Alliance',
                'website' => 'https://wellnesspartners.org',
                'description' => 'Alliance of healthcare providers and wellness companies promoting preventive care and organ donation education.',
                'is_active' => true,
                'display_order' => 5,
            ],
            [
                'name' => 'Transplant Research Center',
                'website' => 'https://transplantresearch.org',
                'description' => 'Specialized research center dedicated to advancing transplant medicine through clinical trials and patient care innovation.',
                'is_active' => true,
                'display_order' => 6,
            ],
        ];

        foreach ($sponsors as $sponsor) {
            Sponsor::create($sponsor);
        }
    }
}

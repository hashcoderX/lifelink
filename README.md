# LifeLink - Donor Management System

A comprehensive platform for connecting organ and blood donors with patients in need.

## Donor Types

### Blood Donors
- **Registration Page**: `/donate-blood`
- **Required Fields**: Identity files (front/back of NIC or license), BMI (optional)
- **Purpose**: Quick donations to local blood banks, appears in public Blood Bank listing

### Kidney Donors
- **Registration Page**: `/donate-kidney`
- **Required Fields**: Age, BMI, sex, clinical markers (HLA typing, crossmatch, PRA score, creatinine, GFR, urea, DSA, HIV/HBV/HCV status, medical history)
- **Purpose**: Kidney transplant matching, appears in public kidney matching results

### Eye Donors
- **Registration Page**: `/donate-eye`
- **Required Fields**: Identity files (front/back of NIC or license), BMI (optional)
- **Purpose**: Corneal transplants, eyes donated after death, helps restore sight

## Backend Validations

- Donor type enum: `BLOOD`, `KIDNEY`, `EYE`
- File uploads required for BLOOD and EYE types
- Clinical fields stored as JSON for KIDNEY type
- OCR processing extracts text from uploaded identity documents

## Development

### Frontend
- Next.js 14 with App Router
- TypeScript, Tailwind CSS
- Components: DonorRegisterForm (unified form with type-specific fields)

### Backend
- Laravel with Sanctum authentication
- MySQL database with donor_type enum
- API endpoints for public donor registration

## Getting Started

1. Start the backend server (Laravel)
2. Start the frontend server: `npm run dev`
3. Access at http://localhost:3001
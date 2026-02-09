# **App Name**: Teleconnect Workflow

## Core Features:

- Authentication: Simple email/password authentication for technicians using Firebase Authentication.
- Work Order Form: A dynamic form to capture work order details including client data, timestamps, technical specifications, checklists, and a description field.
- Signature Capture: Capture signatures from technicians and clients using react-signature-canvas.
- Image Upload: Allow technicians to upload a 'sketch' image to Firebase Storage, and store the URL in Firestore.
- Data Storage: Store work order data in Cloud Firestore with the specified schema, including auto-generated folio numbers.
- PDF Generation: Generate a PDF document from the work order data, formatted as a technical invoice, using jspdf.

## Style Guidelines:

- Primary color: Forest green (#38A3A5) to evoke trust and efficiency.
- Background color: Off-white (#F5F5F5) for a clean, professional look.
- Accent color: Emerald green (#43D88B) for interactive elements and highlights, drawing the user's eye.
- Body and headline font: 'Inter' (sans-serif) for a modern, neutral, and readable design. It will be suitable for both the work order form and any data display elements.
- Use flat, line-style icons in green and gray to represent different work order elements.
- A clean and structured layout that mimics the paper form, ensuring a user-friendly data input process.
- Subtle transitions and feedback animations on form submissions and data updates.
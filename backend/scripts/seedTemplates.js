const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Template = require('../models/Template');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Template data
const templates = [
  {
    name: 'Standard Non-Disclosure Agreement',
    documentType: 'NDA',
    content: `
NON-DISCLOSURE AGREEMENT

THIS AGREEMENT is made and entered into as of the date of the last signature below (the "Effective Date") by and between the parties identified below.

1. PURPOSE
The parties wish to explore a potential business relationship (the "Purpose"). In connection with the Purpose, the Disclosing Party may disclose Confidential Information to the Receiving Party.

2. DEFINITIONS
"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally, or by inspection of tangible objects.

{{Confidentiality_Clause}}

{{Term_of_Confidentiality}}

{{Exclusions_Clause}}

{{Return_of_Materials}}

3. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction].

4. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.
    `,
    placeholders: [
      { key: 'Confidentiality_Clause', description: 'The main confidentiality obligations' },
      { key: 'Term_of_Confidentiality', description: 'How long the confidentiality obligations last' },
      { key: 'Exclusions_Clause', description: 'Exceptions to confidentiality obligations' },
      { key: 'Return_of_Materials', description: 'Requirements for returning confidential materials' }
    ],
    language: 'English'
  },
  {
    name: 'Residential Lease Agreement',
    documentType: 'Lease Agreement',
    content: `
RESIDENTIAL LEASE AGREEMENT

THIS LEASE AGREEMENT (the "Agreement") is made and entered into as of [Date], by and between [Landlord Name] ("Landlord") and [Tenant Name] ("Tenant").

1. PROPERTY
Landlord leases to Tenant, and Tenant leases from Landlord, the residential property located at [Address] (the "Property").

2. TERM
The term of this Agreement shall be for [Lease Period], beginning on [Start Date] and ending on [End Date].

3. RENT
{{Rent_Payment_Terms}}

{{Security_Deposit}}

4. UTILITIES AND SERVICES
{{Utilities_Clause}}

5. MAINTENANCE AND REPAIRS
{{Maintenance_Responsibility}}

6. USE OF PREMISES
Tenant shall use the Property as a residence only.

{{Pet_Policy}}

7. DEFAULT
{{Late_Payment_Clause}}

8. GOVERNING LAW
This Agreement shall be governed by the laws of [Jurisdiction].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.
    `,
    placeholders: [
      { key: 'Rent_Payment_Terms', description: 'Details about rent amount, due date, and payment method' },
      { key: 'Security_Deposit', description: 'Security deposit amount and terms' },
      { key: 'Utilities_Clause', description: 'Who is responsible for which utilities' },
      { key: 'Maintenance_Responsibility', description: 'Maintenance and repair responsibilities' },
      { key: 'Pet_Policy', description: 'Rules regarding pets on the property' },
      { key: 'Late_Payment_Clause', description: 'Penalties for late rent payments' }
    ],
    language: 'English'
  },
  {
    name: 'Employment Agreement',
    documentType: 'Employment Contract',
    content: `
EMPLOYMENT AGREEMENT

THIS EMPLOYMENT AGREEMENT (the "Agreement") is made and entered into as of [Date], by and between [Employer Name] ("Employer") and [Employee Name] ("Employee").

1. POSITION AND DUTIES
Employee shall be employed in the position of [Position Title]. Employee shall perform the duties as described in the attached job description and as assigned by Employer.

2. TERM
{{Employment_Term}}

3. COMPENSATION
{{Compensation_Clause}}

4. BENEFITS
{{Benefits_Clause}}

5. TERMINATION
{{Termination_Clause}}

6. CONFIDENTIALITY
{{Confidentiality_Clause}}

7. INTELLECTUAL PROPERTY
{{Intellectual_Property_Rights}}

8. NON-COMPETE
{{Non_Compete_Clause}}

9. GOVERNING LAW
This Agreement shall be governed by the laws of [Jurisdiction].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.
    `,
    placeholders: [
      { key: 'Employment_Term', description: 'Duration of employment and start date' },
      { key: 'Compensation_Clause', description: 'Salary, bonuses, and payment schedule' },
      { key: 'Benefits_Clause', description: 'Health insurance, retirement, and other benefits' },
      { key: 'Termination_Clause', description: 'Conditions for termination of employment' },
      { key: 'Confidentiality_Clause', description: 'Protection of company confidential information' },
      { key: 'Intellectual_Property_Rights', description: 'Ownership of work created during employment' },
      { key: 'Non_Compete_Clause', description: 'Restrictions on working for competitors' }
    ],
    language: 'English'
  }
];

// Seed the database
const seedDatabase = async () => {
  try {
    // Clear existing templates
    await Template.deleteMany({});
    console.log('Cleared existing templates');
    
    // Insert new templates
    await Template.insertMany(templates);
    console.log(`Inserted ${templates.length} templates`);
    
    mongoose.connection.close();
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 
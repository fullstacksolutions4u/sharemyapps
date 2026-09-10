# Chapter 4: Functional and Non-Functional Requirements

When designing a system, requirements are broken down into two main categories: **Functional Requirements** (what the system should do) and **Non-Functional Requirements** (how the system should perform).

Here is a breakdown of the requirements specifically for the **ShareMyApps** platform.

---

## 1. Functional Requirements (FRs)
Functional requirements define the core features and business logic of the application. They describe specific behaviors or functions.

### User Management & Authentication
* **Registration/Login:** Users must be able to sign up and log in using email/password or Google SSO.
* **Role-Based Access:** The system must support different user roles (Admin, Developer, Recruiter/Client, Mentee) with distinct permissions and dashboard views.

### Core Business Logic
* **Portfolios & Profiles:** Developers must be able to create profiles, upload resumes, and showcase their projects/portfolios.
* **Job Feed & Vacancies:** The system must display a feed of active job links and vacancies to developers.
* **Job Extraction:** Admins must be able to paste job descriptions, and the system will use AI (OpenAI) to extract structured details (title, company, work mode, etc.).
* **Apply Limits (Freemium Model):** Regular developers are limited to a certain number of free job applications (e.g., 3 per week).
* **Premium Services:** Users must be able to upgrade to premium plans for unlimited applications and premium placement services, integrating with a payment gateway.
* **Application Feedback:** Users must be able to indicate whether they heard back from a job application ("Yes" or "No").

---

## 2. Non-Functional Requirements (NFRs)
Non-functional requirements specify the criteria that judge the operation of the system, rather than specific behaviors. They represent the "quality attributes" of the system.

### Performance & Latency
* The web interface must be snappy and responsive. The job feed should load quickly (e.g., under 1 second) to provide a smooth user experience.
* The AI job extraction process must complete within an acceptable timeframe without timing out the server request.

### Scalability
* The backend infrastructure must gracefully handle spikes in traffic (e.g., a viral post leading to hundreds of simultaneous logins) by horizontally scaling out API containers on GCP Cloud Run.
* The database schema must be designed so that queries (like aggregating clicks for a dashboard) remain fast even as the number of users grows to the thousands.

### Availability & Reliability
* The system should aim for high availability (e.g., 99.9% uptime). 
* If a third-party service (like OpenAI or Cloudinary) goes down, the rest of the application (like user login or feed browsing) should still function normally.

### Security
* **Authentication Security:** User sessions must be securely managed via HttpOnly cookies or secure JWTs. Passwords must be heavily salted and hashed (using bcrypt).
* **Data Privacy:** Sensitive user data (resumes, emails, contact info) must be protected. 
* **Authorization:** Strict backend route protection to ensure normal users cannot access or trigger admin-only APIs (like creating Admin Job Links).

### Cost Efficiency
* The system must be optimized to run cost-effectively, taking advantage of Cloud Run's scale-to-zero capabilities to minimize idle costs.

### Maintainability
* The codebase must be modular, allowing new features (like a new user role or a new AI tool) to be added without breaking existing functionality.

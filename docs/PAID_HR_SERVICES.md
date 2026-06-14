# Paid HR Services

## Overview

ShareMyApps will offer premium HR/job hunting services where developers can pay to get personalized support from our team in finding jobs, preparing for interviews, and connecting with hiring companies.

---

## Planned Features

### 1. Resume Review Service
- Developer submits their resume link and a target job role
- Our HR team reviews and provides feedback
- Turnaround: 24–48 hours

### 2. Job Application Assistance
- HR team applies to jobs on behalf of the developer
- Developer provides preferences (location, role, salary, job type)
- Weekly status updates sent via notifications

### 3. Interview Preparation
- Mock interview sessions (scheduled via platform)
- Role-specific question banks
- Feedback report after each session

### 4. Direct Referral to Companies
- HR team refers developer profiles directly to partner companies
- Developer gets notified when their profile is shared
- Status tracked: referred → interview scheduled → offer

### 5. LinkedIn & Profile Optimization
- HR team reviews LinkedIn, GitHub, and ShareMyApps portfolio
- Suggestions provided as a checklist
- Optional: HR team makes edits on developer's behalf

---

## Pricing Plans (Draft)

| Plan        | Price (₹) | Includes                                              |
|-------------|-----------|-------------------------------------------------------|
| Basic       | 499       | Resume review + feedback                              |
| Standard    | 999       | Resume review + 10 job applications                   |
| Premium     | 1999      | All Standard + interview prep + LinkedIn optimization |
| Elite       | 3999      | All Premium + direct referrals + dedicated HR manager |

---

## User Flow

1. Developer navigates to **HR Services** page
2. Selects a plan and pays via payment gateway
3. Fills out a job preference form (role, location, salary, job type, experience)
4. Assigned HR manager reviews profile and begins work
5. Developer receives updates via the in-app notification system
6. On completion, developer can leave a rating/review for the HR service

---

## Data Requirements

- Developer's `cvUrl` (mandatory — must be a real resume link)
- Job preferences: role, location, salary range, job type, experience level
- HR manager assignment (admin side)
- Service status tracking: `pending → in_progress → completed`
- Payment record linked to the developer's account

---

## Admin Side

- View all active HR service requests
- Assign HR manager to each request
- Update service status
- Add internal notes per developer
- Track completion and follow-up actions

---

## Notes

- Only developers with a valid resume link can purchase HR services
- Service requests are visible only to the developer and assigned HR manager
- Payment integration: Razorpay (preferred, already in scope)

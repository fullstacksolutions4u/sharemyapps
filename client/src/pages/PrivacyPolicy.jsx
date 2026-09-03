import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-text">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-sm md:text-base leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>
            Welcome to ShareMyApps. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Data We Collect (Google Sign-In)</h2>
          <p>
            When you choose to authenticate using Google Sign-In, we request access to the following information 
            from your Google Account:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Email Address:</strong> Used as your primary identifier to create and manage your account.</li>
            <li><strong>Basic Profile Information:</strong> Such as your name and profile picture, used to personalize your experience on our platform.</li>
          </ul>
          <p className="mt-2">
            We <strong>do not</strong> request access to your contacts, Google Drive, emails, or any other sensitive or restricted scopes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
          <p>We use the data collected via Google Sign-In exclusively to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Verify your identity and log you into the application.</li>
            <li>Create your user profile on our platform.</li>
            <li>Communicate with you regarding your account and services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
          <p>
            Your data is stored securely in our database. We implement appropriate security measures to prevent your 
            personal data from being accidentally lost, used, or accessed in an unauthorized way. We do not sell, rent, 
            or share your personal data with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Deletion and Your Rights</h2>
          <p>
            You have the right to request the deletion of your personal data at any time. If you wish to delete your 
            account and all associated data (including data retrieved from Google), please contact us at our support email. 
            Upon request, we will promptly erase your data from our systems.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:<br/>
            <strong>Email:</strong> sharemyappsportal@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}

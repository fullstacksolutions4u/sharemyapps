export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-text">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-text/60 mb-10">Last updated: June 1, 2025</p>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">

        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>
            Welcome to <strong>ShareMyApps</strong> ("we", "us", or "our"), a platform at{" "}
            <a href="https://sharemyapps.in" className="underline">https://sharemyapps.in</a> that
            helps developers showcase their side-projects to clients and recruiters. This Privacy
            Policy explains what personal data we collect, why we collect it, how we use and
            protect it, and the rights you have over your data.
          </p>
          <p className="mt-3">
            By creating an account or otherwise using ShareMyApps, you agree to the practices
            described in this policy. If you do not agree, please do not use our services.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

          <h3 className="font-semibold mt-4 mb-2">2.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account registration:</strong> name, email address, and password (stored as a bcrypt hash).</li>
            <li><strong>Profile information:</strong> bio, skills, location, social-media links, avatar image, and any other fields you choose to fill in.</li>
            <li><strong>Project content:</strong> project titles, descriptions, URLs, screenshots, and banner images you upload.</li>
            <li><strong>Messages:</strong> content of messages you send to other users via our in-app messaging feature.</li>
            <li><strong>Comments:</strong> text you post as comments on projects.</li>
            <li><strong>Feedback and support requests:</strong> any communications you send to us.</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">2.2 Information Collected via Google Sign-In (OAuth 2.0)</h3>
          <p>
            If you choose to sign in with your Google account, we request only the following
            OAuth scopes from Google:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Email address</strong> — used as your unique account identifier.</li>
            <li>
              <strong>Basic profile</strong> (name &amp; profile picture) — used to pre-fill your
              display name and avatar so you do not have to upload one manually.
            </li>
          </ul>
          <p className="mt-2">
            We <strong>do not</strong> request, and have no access to, your Google contacts,
            Google Drive files, Gmail messages, Calendar events, or any other restricted or
            sensitive OAuth scopes. The data received from Google is used solely to create or
            log you in to your ShareMyApps account.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.3 Information Collected Automatically</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Log data:</strong> IP address, browser type and version, pages visited, time and date of visits, and referring URLs.</li>
            <li><strong>Device information:</strong> operating system, screen resolution, and language preferences.</li>
            <li><strong>Cookies and local storage:</strong> session tokens (JWT) stored in an HTTP-only cookie and/or localStorage to keep you signed in across page reloads. We do not use third-party advertising cookies.</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">2.4 Images and File Uploads</h3>
          <p>
            Project screenshots and banner images you upload are stored via{" "}
            <strong>Cloudinary</strong> (a third-party cloud image service). Cloudinary processes
            and hosts these files on our behalf. We do not store raw image files on our own
            servers. Please review{" "}
            <a
              href="https://cloudinary.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Cloudinary's Privacy Policy
            </a>{" "}
            for their data practices.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p>We use the information described above for the following purposes:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Account management:</strong> to create, authenticate, and maintain your account.</li>
            <li><strong>Service delivery:</strong> to display your profile and projects to other users and to enable the messaging, commenting, and project-rating features.</li>
            <li><strong>Personalisation:</strong> to show you relevant projects, developers, or job postings based on your stated role and interests.</li>
            <li><strong>Security and fraud prevention:</strong> to detect, investigate, and prevent abuse or unauthorised access.</li>
            <li><strong>Platform improvement:</strong> to analyse aggregated, anonymised usage trends and to debug errors.</li>
            <li><strong>Communications:</strong> to send you transactional emails (e.g., password reset, account notifications). We do not send unsolicited marketing emails.</li>
            <li><strong>Legal compliance:</strong> to comply with applicable laws and regulations.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Legal Basis for Processing (GDPR)</h2>
          <p>
            If you are located in the European Economic Area (EEA) or the United Kingdom, we
            process your personal data under the following legal bases:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Contract performance:</strong> processing is necessary to provide the service you signed up for.</li>
            <li><strong>Legitimate interests:</strong> for security, fraud prevention, and platform improvements, provided these interests are not overridden by your rights.</li>
            <li><strong>Consent:</strong> where you have explicitly given consent (e.g., opting in to email notifications).</li>
            <li><strong>Legal obligation:</strong> where we are required to retain or disclose data by law.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">5. How We Share Your Information</h2>
          <p>
            We <strong>do not sell, rent, or trade</strong> your personal data to third parties.
            We may share your information only in the following limited circumstances:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Service providers:</strong> Cloudinary (image hosting), MongoDB Atlas
              (database hosting), and Google Cloud / Firebase (infrastructure and authentication).
              These providers act as data processors and are contractually obligated to protect
              your data.
            </li>
            <li>
              <strong>Other users:</strong> your public profile information, projects, and
              comments are visible to all users of the platform by design. You control what you
              choose to publish.
            </li>
            <li>
              <strong>Legal requirements:</strong> if required by law, court order, or
              governmental authority, we may disclose information as necessary.
            </li>
            <li>
              <strong>Business transfers:</strong> in the event of a merger, acquisition, or
              sale of assets, your data may be transferred to the successor entity, with the
              same privacy protections applied.
            </li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to
            provide our services. If you request deletion of your account, we will erase your
            personal data within <strong>30 days</strong>, except where retention is required by
            law or for legitimate business purposes (e.g., fraud prevention records).
          </p>
          <p className="mt-2">
            Aggregated, anonymised analytics data that cannot be used to identify you may be
            retained indefinitely for internal reporting purposes.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal data,
            including:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>All data in transit is encrypted via <strong>HTTPS / TLS</strong>.</li>
            <li>Passwords are hashed using <strong>bcrypt</strong> and never stored in plain text.</li>
            <li>Authentication tokens (JWT) are signed with a secret key and expire after a set period.</li>
            <li>Our backend API runs on <strong>Google Cloud Run</strong> within GCP's managed security perimeter.</li>
            <li>Access to our production database is restricted by IP allowlist and requires authentication.</li>
          </ul>
          <p className="mt-2">
            Despite these measures, no system is completely secure. In the event of a data
            breach that is likely to result in a risk to your rights, we will notify you as
            required by applicable law.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">8. Cookies &amp; Local Storage</h2>
          <p>We use the following technologies to maintain your session:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>HTTP-only cookies</strong> — to store your session token securely in the
              browser, inaccessible to JavaScript.
            </li>
            <li>
              <strong>localStorage</strong> — to cache non-sensitive user preferences on your
              device for a faster experience.
            </li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> use third-party advertising, tracking, or analytics
            cookies. You can clear cookies and localStorage at any time via your browser
            settings, though this will log you out of your account.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">9. Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have the following rights regarding your
            personal data:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Access:</strong> request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification:</strong> update or correct inaccurate data (much of this you can do directly in your Profile settings).</li>
            <li><strong>Erasure ("right to be forgotten"):</strong> request deletion of your account and all associated personal data.</li>
            <li><strong>Restriction:</strong> request that we limit how we process your data in certain circumstances.</li>
            <li><strong>Portability:</strong> receive your data in a machine-readable format.</li>
            <li><strong>Objection:</strong> object to processing based on legitimate interests.</li>
            <li><strong>Withdraw consent:</strong> revoke consent at any time where processing is based on consent.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please email us at{" "}
            <a href="mailto:hello@sharemyapps.in" className="underline">
              hello@sharemyapps.in
            </a>
            . We will respond within 30 days. You also have the right to lodge a complaint
            with your local data protection authority.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
          <p>
            ShareMyApps is not directed at children under the age of 13. We do not knowingly
            collect personal data from children under 13. If you believe we have inadvertently
            collected such information, please contact us immediately and we will delete it.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">11. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites or services (e.g., GitHub,
            LinkedIn, deployed project URLs). We are not responsible for the privacy practices
            of those sites. We encourage you to review the privacy policies of any third-party
            services you visit.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise
            the "Last updated" date at the top of this page. We encourage you to review this
            policy periodically. For significant changes, we will notify you via a notice on
            our website or by email.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or
            our data practices, please contact us:
          </p>
          <ul className="list-none mt-2 space-y-1">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:hello@sharemyapps.in" className="underline">
                hello@sharemyapps.in
              </a>
            </li>
            <li>
              <strong>Website:</strong>{" "}
              <a href="https://sharemyapps.in" className="underline">
                https://sharemyapps.in
              </a>
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
}

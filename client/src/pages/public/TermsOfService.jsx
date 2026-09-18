export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-text">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
      <p className="text-sm text-text/60 mb-10">Last updated: September 18, 2026</p>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing or using ShareMyApps ("we", "us", or "our") at{" "}
            <a href="https://sharemyapps.in" className="underline text-accent">https://sharemyapps.in</a>, 
            you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, 
            you may not access or use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p>
            ShareMyApps is a platform designed to help developers showcase their side projects, portfolios, 
            and skills to potential clients and recruiters. We provide tools for hosting portfolios, sharing links, 
            and connecting developers with opportunities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 13 years of age to use this service.</li>
            <li>You are responsible for safeguarding the password that you use to access the service.</li>
            <li>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
            <li>You may not use as a username the name of another person or entity that is not lawfully available for use, or a name or trademark that is subject to any rights of another person or entity without appropriate authorization.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>
          <p className="mt-3">
            By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post, or display on or through the Service.
          </p>
          <p className="mt-3 text-red-600/80 font-medium">
            You agree not to post Content that:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Contains explicit, adult, or otherwise inappropriate material.</li>
            <li>Violates intellectual property rights of any third party.</li>
            <li>Is defamatory, libelous, hateful, or discriminatory.</li>
            <li>Contains viruses, malware, or malicious code.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of Service.
          </p>
          <p className="mt-2">
            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or delete your account from the dashboard settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
          <p>
            In no event shall ShareMyApps, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Your access to or use of or inability to access or use the Service.</li>
            <li>Any conduct or content of any third party on the Service.</li>
            <li>Any content obtained from the Service.</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:{" "}
            <a href="mailto:support@sharemyapps.in" className="text-accent underline">support@sharemyapps.in</a>
          </p>
        </section>

      </div>
    </div>
  );
}

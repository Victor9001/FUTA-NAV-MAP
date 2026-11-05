const OPERATOR = 'Victor (FUTA Nav)'
const CONTACT = 'vicshelby804@gmail.com'
const UPDATED = '5 November 2026'

function Part({ children }) {
  return <h3 className="mt-6 text-sm font-semibold text-white first:mt-0">{children}</h3>
}

function H({ children }) {
  return <h4 className="mt-4 text-xs font-medium text-white">{children}</h4>
}

function P({ children }) {
  return <p className="mt-1 text-xs leading-relaxed text-white/70">{children}</p>
}

function Bullets({ items }) {
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-white/70">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

export default function TermsText() {
  return (
    <div>
      <p className="text-xs text-white/50">Last updated: {UPDATED}</p>

      <Part>Terms of Use</Part>
      <P>
        These terms apply when you use FUTA Nav, a campus map and walking-directions web app for
        the Federal University of Technology, Akure (FUTA). By creating an account or using the
        app you agree to them. If you do not agree, please do not use the app.
      </P>

      <H>1. About FUTA Nav</H>
      <P>
        FUTA Nav is an independent student project run from Akure, Nigeria, by {OPERATOR}. It is
        not an official service of the Federal University of Technology, Akure, and the university
        does not endorse it.
      </P>

      <H>2. Who can use it</H>
      <P>
        You must be 18 or older. If you are under 18, you may use FUTA Nav only with the permission
        of a parent or legal guardian, who agrees to these terms on your behalf. Nigerian data
        protection law requires a parent or guardian to consent before a child's personal data is
        used.
      </P>

      <H>3. Your account</H>
      <P>
        Give us accurate details and keep your password private. You are responsible for what
        happens under your account. Tell us if you think someone else has used it. We may suspend or
        remove accounts that break these terms.
      </P>

      <H>4. What you must not do</H>
      <Bullets
        items={[
          'Submit false, misleading or abusive suggestions or reports.',
          "Share another person's location, or any personal information, without their knowledge and permission.",
          'Try to break into, overload, scrape or interfere with the app, its data or its servers.',
          'Use the app for anything unlawful, or in a way that harms other people.',
        ]}
      />

      <H>5. Routes, maps and your safety</H>
      <P>
        Routes, times and distances are estimates. Paths shown on the map may be unofficial
        shortcuts, and they may be unsafe, closed, private or out of date. Use your own judgment,
        follow signs, security instructions and the law, and do not use the app while driving.
        FUTA Nav is not an emergency service. In an emergency, contact campus security or the
        emergency services.
      </P>

      <H>6. Sharing your location</H>
      <P>
        If you create a share link, anyone who has the link can see the location it contains until
        the link expires. Only send it to people you trust. Share links expire automatically, but
        you are responsible for who you send them to.
      </P>

      <H>7. Suggestions and reports you send us</H>
      <P>
        When you suggest a place or report a problem, you give us permission to use, review, edit,
        publish or reject it as part of running the app. You promise that what you send is accurate
        to the best of your knowledge and does not break anyone's rights. We are not obliged to
        publish any suggestion.
      </P>

      <H>8. Map data and other services</H>
      <P>
        Map data is © OpenStreetMap contributors and is available under the Open Database Licence.
        FUTA Nav also relies on services run by other companies, such as Google Firebase, Vercel,
        and map, routing and search providers. We do not control them and are not responsible for
        their availability or accuracy.
      </P>

      <H>9. Availability and changes to the app</H>
      <P>
        We aim to keep FUTA Nav running, but we do not promise it will always be available or
        error-free. We may change, suspend or stop any part of it at any time.
      </P>

      <H>10. Our responsibility</H>
      <P>
        FUTA Nav is provided as it is. To the extent the law allows, we are not responsible for
        losses that result from using, or being unable to use, the app, including injury, lost time,
        or missed classes or exams that follow a wrong or unavailable route. Nothing in these terms
        limits any right you have under Nigerian law that cannot be limited.
      </P>

      <H>11. Ending your use</H>
      <P>
        You can stop using FUTA Nav at any time. To have your account deleted, email us at the
        address below from the email on your account.
      </P>

      <H>12. Changes to these terms</H>
      <P>
        We may update these terms and the privacy notice. The date at the top shows when they last
        changed. If you keep using the app after a change, you accept the new version.
      </P>

      <H>13. Governing law</H>
      <P>
        These terms are governed by the laws of the Federal Republic of Nigeria, and any dispute
        will be decided by the courts of Nigeria.
      </P>

      <Part>Privacy Notice</Part>
      <P>
        This notice explains what personal data FUTA Nav collects, why, and what your rights are
        under the Nigeria Data Protection Act 2023.
      </P>

      <H>1. Who is responsible</H>
      <P>
        {OPERATOR} is responsible for your personal data in FUTA Nav. Contact: {CONTACT}.
      </P>

      <H>2. What we collect</H>
      <Bullets
        items={[
          'Account details: your name, your email address and your password. Passwords are handled by Google Firebase Authentication and we cannot read them.',
          'Your live location: your phone or browser shares it with the app, with your permission, to draw routes. It is used in your browser and sent to the routing service. We do not save it unless you create a share link or submit a suggestion with a pin.',
          'Share links: the location you choose to share and when the link was made.',
          'Suggestions and reports: the details you type, any map pin, your name and account ID, and the time you sent them.',
          'Technical data: your IP address and device and browser details, which hosting and map services receive as part of normal web traffic.',
          'On your device: a small setting that remembers we have shown you the sign-up prompt, and saved copies of app files so the app loads faster and works on slow connections.',
        ]}
      />

      <H>3. Why we use it</H>
      <P>
        We use your data to run your account, give you routes and directions, show shared
        locations, review suggestions and reports, keep the app secure, and reply when you contact
        us. We rely on your consent (for example, when you allow location access or create an
        account), and on our legitimate interest in keeping the app working and safe. You can
        withdraw consent at any time by turning off location access in your browser or asking us to
        delete your account.
      </P>

      <H>4. Who receives your data</H>
      <Bullets
        items={[
          'Google Firebase, which stores accounts and the database (suggestions, reports and share links).',
          'Vercel, which hosts the app.',
          'Map, routing and search services such as OpenStreetMap routing and search, OpenFreeMap and Esri satellite imagery. These receive the coordinates or search text needed to give you a route, a place or a map tile, together with your IP address.',
          'Authorities, only where the law requires us to share data.',
        ]}
      />
      <P>We do not sell your personal data.</P>

      <H>5. Transfers outside Nigeria</H>
      <P>
        The services above may store or process data on servers outside Nigeria. By using the app
        you understand that your data may be transferred there. We choose well-established
        providers that apply their own security safeguards.
      </P>

      <H>6. How long we keep it</H>
      <P>
        We keep account details until you ask us to delete your account. Suggestions and reports
        are kept while we review them and as records of the changes made to the map. Share links
        stop working shortly after you create them, but the stored location record may stay in our
        database until we remove it. You can ask us to delete any of it.
      </P>

      <H>7. Your rights</H>
      <P>
        You can ask us to give you a copy of your data, correct it, delete it, restrict or object
        to how we use it, or move it to another service. You can also withdraw your consent
        whenever you like, which does not affect earlier use. Email us at the address above and we
        will reply within a reasonable time. You also have the right to complain to the Nigeria
        Data Protection Commission.
      </P>

      <H>8. Security</H>
      <P>
        We protect your data with secure connections, account sign-in and access rules on the
        database. No online service is completely secure, so we cannot guarantee absolute security.
        Please use a strong password that you do not use elsewhere.
      </P>

      <H>9. Children</H>
      <P>
        FUTA Nav is not meant for children under 18 acting alone. If we learn that we hold a
        child's data without a parent or guardian's consent, we will delete it. A parent or
        guardian can contact us at any time to ask for their child's data to be deleted.
      </P>

      <H>10. Changes and contact</H>
      <P>
        We will update this notice if we change how we use data, and the date at the top will
        change. Questions or requests: {CONTACT}.
      </P>
    </div>
  )
}
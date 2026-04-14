import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SettingsPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="flex items-center gap-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-condensed text-xl">{title}</h1>
      </div>
      <div className="px-4 pt-4">{children}</div>
    </div>
  );
};

export const PrivacyPolicy: React.FC = () => (
  <SettingsPage title="PRIVACY POLICY">
    <p className="text-xs text-muted-foreground">Last updated: April 2025</p>
    <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/80">
      <div><h3 className="font-bold text-foreground">1. Information We Collect</h3><p className="mt-1">We collect information you provide when creating an account, including your name, email address, and content preferences. We also collect usage data such as swipe history, generated scripts, and app interaction patterns to improve our service.</p><p className="mt-1">Additionally, we may collect device information (device type, operating system, browser type), IP address, and general location data to optimize app performance and security. We also collect data related to your subscription plan, payment history, and feature usage to manage your account and billing.</p></div>
      <div><h3 className="font-bold text-foreground">2. How We Use Your Information</h3><ul className="mt-1 list-disc pl-5 space-y-1"><li>Personalizing content recommendations based on your niche and preferences</li><li>Generating AI-powered scripts tailored to your content style</li><li>Tracking usage limits (daily swipes, monthly scripts)</li><li>Sending notifications about new features and content ideas</li><li>Processing payments via secure payment gateways</li><li>Improving our AI algorithms and content suggestion accuracy</li><li>Analyzing usage patterns to enhance user experience</li><li>Communicating with you about account updates, promotions, and service changes</li><li>Preventing fraud and ensuring platform security</li></ul></div>
      <div><h3 className="font-bold text-foreground">3. Data Storage & Security</h3><p className="mt-1">Your data is stored securely using industry-standard encryption. We use cloud infrastructure with PostgreSQL databases to ensure reliability and data protection. Your passwords are hashed and never stored in plain text.</p><p className="mt-1">We implement SSL/TLS encryption for all data in transit, and at-rest encryption for sensitive stored data. Regular security audits and penetration testing are conducted to maintain the highest level of data protection. Access to user data is restricted to authorized personnel only.</p></div>
      <div><h3 className="font-bold text-foreground">4. Third-Party Services</h3><p className="mt-1">We use trusted third-party services for payment processing (Dodo Payments), AI content generation, and analytics. These services have their own privacy policies governing data handling. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p><p className="mt-1">Our AI content generation partners process your niche and platform data to generate relevant content suggestions. Payment processors handle financial transactions securely under PCI-DSS compliance standards.</p></div>
      <div><h3 className="font-bold text-foreground">5. Cookies & Tracking</h3><p className="mt-1">We use essential cookies and local storage to maintain your session, remember preferences, and track your daily usage (swipe counts, streak data). We do not use third-party advertising cookies or sell user tracking data.</p></div>
      <div><h3 className="font-bold text-foreground">6. Data Retention</h3><p className="mt-1">We retain your personal data for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal data within 30 days, except where required by law for record-keeping purposes. Anonymous, aggregated data may be retained indefinitely for analytics and service improvement.</p></div>
      <div><h3 className="font-bold text-foreground">7. Children's Privacy</h3><p className="mt-1">DECKR is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal data, we will promptly delete such information.</p></div>
      <div><h3 className="font-bold text-foreground">8. International Data Transfers</h3><p className="mt-1">Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.</p></div>
      <div><h3 className="font-bold text-foreground">9. Your Rights</h3><p className="mt-1">You have the right to access, correct, delete, or export your personal data at any time. You can also opt out of non-essential communications. To exercise any of these rights, contact us at appdeckr@gmail.com. We will respond to your request within 30 business days.</p></div>
      <div><h3 className="font-bold text-foreground">10. Changes to This Policy</h3><p className="mt-1">We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of DECKR after changes constitutes acceptance of the updated policy.</p></div>
      <div><h3 className="font-bold text-foreground">11. Contact Us</h3><p className="mt-1">For questions, concerns, or requests regarding your privacy, contact us at:<br/>Email: appdeckr@gmail.com</p></div>
    </div>
  </SettingsPage>
);

export const TermsConditions: React.FC = () => (
  <SettingsPage title="TERMS & CONDITIONS">
    <p className="text-xs text-muted-foreground">Last updated: April 2025</p>
    <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/80">
      <div><h3 className="font-bold text-foreground">1. Acceptance of Terms</h3><p className="mt-1">By downloading, installing, or using DECKR, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the application. These terms apply to all users, including visitors, registered users, and subscribers.</p></div>
      <div><h3 className="font-bold text-foreground">2. Description of Service</h3><p className="mt-1">DECKR is a content creation assistant application that provides:</p><ul className="mt-1 list-disc pl-5 space-y-1"><li>Swipeable content idea cards curated by AI</li><li>AI-powered script generation for multiple platforms</li><li>Content calendar for planning and scheduling</li><li>Multi-platform content optimization</li><li>Viral score analysis and trend detection</li><li>Hashtag recommendations and thumbnail ideas</li></ul></div>
      <div><h3 className="font-bold text-foreground">3. User Accounts</h3><p className="mt-1">Account creation is required to use DECKR. You are responsible for:</p><ul className="mt-1 list-disc pl-5 space-y-1"><li>Maintaining the confidentiality of your login credentials</li><li>All activities that occur under your account</li><li>Providing accurate and complete information</li><li>Notifying us immediately of unauthorized use</li></ul><p className="mt-1">Users must be at least 13 years of age to create an account. We reserve the right to suspend or terminate accounts that violate these terms.</p></div>
      <div><h3 className="font-bold text-foreground">4. Subscription Plans & Pricing</h3><p className="mt-1">DECKR offers the following subscription tiers:</p><ul className="mt-1 list-disc pl-5 space-y-1"><li><strong>Free Plan:</strong> $0/month — 10 swipes/day, 3 scripts/month, 1 niche</li><li><strong>Creator Plan:</strong> $5/month (or $3.99/month billed yearly) — 50 swipes/day, 15 scripts/month, up to 3 niches, full calendar & export, priority support</li><li><strong>Pro Plan:</strong> $19/month (or $14.99/month billed yearly) — Unlimited swipes, unlimited scripts, unlimited niches, priority AI generation, early access features</li></ul><p className="mt-1">All prices are in USD. Subscriptions renew automatically unless cancelled before the renewal date. You can cancel your subscription at any time from your Profile settings. Refunds are handled according to our payment processor's refund policy.</p></div>
      <div><h3 className="font-bold text-foreground">5. Payment & Billing</h3><p className="mt-1">Payments are processed through our payment partner, Dodo Payments. By subscribing, you authorize recurring charges to your payment method. If a payment fails, your subscription may be downgraded to the Free plan. All billing disputes should be directed to appdeckr@gmail.com.</p></div>
      <div><h3 className="font-bold text-foreground">6. Content Ownership & Usage</h3><p className="mt-1">Scripts and content ideas generated through DECKR are yours to use freely for any purpose, including commercial use. We retain no ownership over content you create using our tools. However, the underlying AI models and DECKR platform remain our intellectual property.</p><p className="mt-1">You may not resell, redistribute, or white-label AI-generated scripts as a competing service.</p></div>
      <div><h3 className="font-bold text-foreground">7. Acceptable Use</h3><p className="mt-1">You agree not to:</p><ul className="mt-1 list-disc pl-5 space-y-1"><li>Use DECKR for illegal, harmful, or fraudulent purposes</li><li>Attempt to reverse-engineer, hack, or exploit the application</li><li>Create accounts to circumvent usage limits</li><li>Use automated scripts or bots to interact with the service</li><li>Upload or generate content that is hateful, abusive, or violates others' rights</li></ul></div>
      <div><h3 className="font-bold text-foreground">8. Service Availability</h3><p className="mt-1">We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may perform scheduled maintenance with advance notice. We are not liable for service interruptions due to factors beyond our control.</p></div>
      <div><h3 className="font-bold text-foreground">9. Limitation of Liability</h3><p className="mt-1">DECKR is provided "as is" without warranties of any kind. We are not responsible for the performance of content created using our suggestions. Our total liability shall not exceed the amount you paid for the service in the 12 months preceding the claim.</p></div>
      <div><h3 className="font-bold text-foreground">10. Termination</h3><p className="mt-1">We reserve the right to terminate or suspend your account at our discretion if you violate these terms. You may also terminate your account at any time by contacting us. Upon termination, your data will be handled per our Privacy Policy.</p></div>
      <div><h3 className="font-bold text-foreground">11. Governing Law</h3><p className="mt-1">These terms are governed by applicable laws. Any disputes arising from these terms shall be resolved through binding arbitration.</p></div>
      <div><h3 className="font-bold text-foreground">12. Contact</h3><p className="mt-1">For questions about these terms, contact us at appdeckr@gmail.com.</p></div>
    </div>
  </SettingsPage>
);

export const AboutScreen: React.FC = () => (
  <SettingsPage title="ABOUT DECKR">
    <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
      <div><h3 className="font-bold text-foreground">What is DECKR?</h3><p className="mt-1">DECKR is an AI-powered content ideation app that helps creators discover viral content ideas in minutes. It combines trending data, audience psychology, and AI to deliver personalized content recommendations.</p><p className="mt-2">Think of it as Tinder for content ideas — swipe right on ideas you love, left on ones you don't, and up to generate a full script with AI.</p></div>
      <div><h3 className="font-bold text-foreground">Our Mission</h3><p className="mt-1">We believe every creator deserves professional-grade tools to compete in the content economy. No more hours spent brainstorming or staring at a blank page.</p><p className="mt-2">DECKR is built to help solo creators compete with studios by providing data-driven content strategies at their fingertips. Our goal is to empower millions of creators worldwide to produce consistent, high-quality content that resonates with their audience.</p></div>
      <div><h3 className="font-bold text-foreground">Key Features</h3>
        <p className="mt-2 font-semibold">🃏 SWIPE DECK</p><p>Browse endless AI-curated content ideas tailored to your niche. Each card includes viral scores, hooks, insights, and platform-specific optimization. Save the winners, skip the rest.</p>
        <p className="mt-2 font-semibold">✨ AI SCRIPTS</p><p>Generate platform-optimized scripts with hooks, body, CTAs, hashtags, thumbnail ideas, and captions in seconds. Scripts are designed for maximum engagement on your chosen platform.</p>
        <p className="mt-2 font-semibold">📅 CONTENT CALENDAR</p><p>Plan your content strategy with a built-in calendar featuring daily, weekly, and monthly views. Schedule ideas, track your posting consistency, and never miss a content day.</p>
        <p className="mt-2 font-semibold">📊 VIRAL INSIGHTS</p><p>Every content idea comes with a viral potential score, competition analysis, best posting time, and estimated reach. Make data-driven decisions about what to create.</p>
        <p className="mt-2 font-semibold">🎯 MULTI-PLATFORM</p><p>Optimized for YouTube (Shorts & Long-form), TikTok, Instagram Reels, LinkedIn, and Twitter/X. Each platform gets content tailored to its unique format and audience.</p>
      </div>
      <div><h3 className="font-bold text-foreground">Why Choose DECKR?</h3><ul className="mt-1 list-disc pl-5 space-y-1"><li>Save 5+ hours per week on content planning</li><li>Never run out of content ideas again</li><li>AI-generated scripts with proven viral formulas</li><li>Platform-specific optimization for maximum reach</li><li>Track your content creation streak and stay motivated</li><li>Affordable plans starting from $0/month</li></ul></div>
      <div><h3 className="font-bold text-foreground">Version</h3><p className="mt-1">DECKR v1.0</p><p className="mt-1">Contact: appdeckr@gmail.com</p></div>
    </div>
  </SettingsPage>
);

export const ContactScreen: React.FC = () => (
  <SettingsPage title="CONTACT US">
    <p className="text-sm text-muted-foreground">We'd love to hear from you. Reach out for support, feedback, or business inquiries.</p>
    <div className="mt-4 space-y-4">
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">SUPPORT</p>
      <ContactCard icon="✉️" title="Email Support" sub="Get help with your account or subscription" detail="appdeckr@gmail.com" />
      <ContactCard icon="🕐" title="Response Time" sub="We typically reply within 24-48 hours" detail="Mon-Fri, 9AM-6PM" />
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">BUSINESS INQUIRIES</p>
      <ContactCard icon="💼" title="Partnerships & Sponsorships" sub="Brand deals, collaborations, and partnerships" detail="appdeckr@gmail.com" />
      <ContactCard icon="🛡️" title="Legal & Privacy" sub="Privacy concerns or legal matters" detail="appdeckr@gmail.com" />
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">FOLLOW US</p>
      <ContactCard icon="📸" title="Instagram" sub="Behind the scenes and updates" detail="@deckrapp" />
      <ContactCard icon="🐦" title="Twitter/X" sub="Tips and announcements" detail="@deckrapp" />
    </div>
  </SettingsPage>
);

const ContactCard: React.FC<{ icon: string; title: string; sub: string; detail: string }> = ({ icon, title, sub, detail }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
    <span className="text-lg">{icon}</span>
    <div className="flex-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <p className="mt-1 text-xs font-medium">{detail}</p>
    </div>
  </div>
);

export const HelpScreen: React.FC = () => {
  const [open, setOpen] = React.useState<number | null>(null);
  const faqs = [
    { q: "How does DECKR work?", a: "DECKR uses AI to generate personalized content ideas based on your niche, platform, and posting frequency. Swipe right to save ideas, left to skip, and up to generate a full script. Each card includes viral scores, hooks, insights, and platform-specific optimization tips." },
    { q: "What's the daily swipe limit?", a: "Free users get 10 swipes per day. Creator plan users get 50 swipes per day, and Pro plan users get unlimited swipes. Swipe counts reset daily at midnight." },
    { q: "How do I generate a script?", a: "Swipe up on any content card, or tap the star button below the card. The AI will generate a complete script with hook, body, CTA, hashtags, thumbnail idea, and caption — all optimized for your chosen platform." },
    { q: "Where are my saved ideas?", a: "Saved ideas appear in your Calendar (unscheduled section) and can be scheduled to specific dates. You can view them in daily, weekly, or monthly view." },
    { q: "How does the streak work?", a: "Your streak counts consecutive days you've used the app. Open DECKR daily and make at least one swipe to maintain your streak! Streaks motivate consistent content planning." },
    { q: "Can I export my calendar?", a: "Yes! Creator and Pro plan users can export their calendar. Tap the share icon on the calendar screen to export your content schedule." },
    { q: "How do I change my niches?", a: "Go to Profile → My Niches. Free users can select 1 niche, Creator users up to 3, and Pro users can select unlimited niches. Your content ideas will update based on your selected niches." },
    { q: "What platforms are supported?", a: "DECKR supports YouTube (Shorts & Long-form), TikTok, Instagram Reels, LinkedIn, and Twitter/X. Each platform gets uniquely optimized content ideas and scripts." },
    { q: "How do subscription plans work?", a: "DECKR offers Free ($0), Creator ($5/month), and Pro ($19/month) plans. Paid plans include more swipes, scripts, niches, and premium features. You can upgrade or downgrade anytime from Profile → Manage Subscription." },
    { q: "What happens when my plan expires?", a: "Your account reverts to the Free plan. Saved ideas and scripts are preserved, but you'll have reduced daily swipes and monthly script limits." },
    { q: "How do I cancel my subscription?", a: "Go to Profile → Manage Subscription → Cancel. Your plan remains active until the billing period ends. You won't be charged again after cancellation." },
    { q: "Why am I seeing different platforms?", a: "DECKR optimizes ideas across platforms. You may see cross-platform suggestions even if you selected specific platforms, as some content ideas perform well across multiple platforms." },
    { q: "How accurate are the viral scores?", a: "Viral scores are AI-estimated based on trending patterns, competition analysis, and audience engagement data. While not guaranteed, they provide a strong indicator of content potential. Higher-scored ideas tend to perform better." },
    { q: "Can I use generated scripts commercially?", a: "Absolutely! All scripts generated through DECKR are yours to use freely, including for commercial content, brand deals, and monetized videos." },
    { q: "How do I contact support?", a: "Email us at appdeckr@gmail.com. We typically respond within 24-48 hours on business days." },
  ];

  return (
    <SettingsPage title="HELP & FAQ">
      <p className="text-sm text-muted-foreground">Got questions? We've got answers.</p>
      <div className="mt-4 space-y-2">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between rounded-2xl bg-muted px-4 py-3.5 text-left">
              <span className="text-sm font-medium pr-4">{faq.q}</span>
              <span className={`text-xs text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`}>▼</span>
            </button>
            {open === i && <p className="px-4 py-3 text-sm text-muted-foreground">{faq.a}</p>}
          </div>
        ))}
      </div>
    </SettingsPage>
  );
};
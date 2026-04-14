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
      <div><h3 className="font-bold text-foreground">1. Information We Collect</h3><p className="mt-1">We collect information you provide when creating an account, including your name, email address, and content preferences. We also collect usage data such as swipe history, generated scripts, and app interaction patterns to improve our service.</p></div>
      <div><h3 className="font-bold text-foreground">2. How We Use Your Information</h3><ul className="mt-1 list-disc pl-5 space-y-1"><li>Personalizing content recommendations based on your niche and preferences</li><li>Generating AI-powered scripts tailored to your content style</li><li>Tracking usage limits (daily swipes, monthly scripts)</li><li>Sending notifications about new features and content ideas</li><li>Processing payments via secure payment gateways</li></ul></div>
      <div><h3 className="font-bold text-foreground">3. Data Storage</h3><p className="mt-1">Your data is stored securely using industry-standard encryption. We use cloud infrastructure with PostgreSQL databases to ensure reliability and data protection. Your passwords are hashed and never stored in plain text.</p></div>
      <div><h3 className="font-bold text-foreground">4. Third-Party Services</h3><p className="mt-1">We use trusted third-party services for payment processing, AI content generation, and analytics. These services have their own privacy policies governing data handling.</p></div>
      <div><h3 className="font-bold text-foreground">5. Your Rights</h3><p className="mt-1">You can request access to, correction of, or deletion of your personal data at any time by contacting us at support@deckrapp.com.</p></div>
    </div>
  </SettingsPage>
);

export const TermsConditions: React.FC = () => (
  <SettingsPage title="TERMS & CONDITIONS">
    <p className="text-xs text-muted-foreground">Last updated: April 2025</p>
    <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/80">
      <div><h3 className="font-bold text-foreground">1. Acceptance of Terms</h3><p className="mt-1">By downloading, installing, or using DECKR, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the application.</p></div>
      <div><h3 className="font-bold text-foreground">2. Description of Service</h3><p className="mt-1">DECKR is a content creation assistant application that provides:</p><ul className="mt-1 list-disc pl-5 space-y-1"><li>Swipeable content idea cards curated by AI</li><li>AI-powered script generation for multiple platforms</li><li>Content calendar for planning and scheduling</li><li>Multi-platform content optimization</li></ul></div>
      <div><h3 className="font-bold text-foreground">3. User Accounts</h3><p className="mt-1">Account creation is required to use DECKR. You are responsible for:</p><ul className="mt-1 list-disc pl-5 space-y-1"><li>Maintaining the confidentiality of your login credentials</li><li>All activities that occur under your account</li><li>Providing accurate and complete information</li><li>Notifying us immediately of unauthorized use</li></ul><p className="mt-1">Users must be at least 13 years of age to create an account.</p></div>
      <div><h3 className="font-bold text-foreground">4. Subscription Plans</h3><p className="mt-1">DECKR offers Free, Creator (₹299/month), and Pro (₹699/month) subscription tiers. Each plan has specific feature limits. Subscriptions renew automatically unless cancelled before the renewal date.</p></div>
      <div><h3 className="font-bold text-foreground">5. Content Ownership</h3><p className="mt-1">Scripts and content ideas generated through DECKR are yours to use. We retain no ownership over content you create using our tools.</p></div>
    </div>
  </SettingsPage>
);

export const AboutScreen: React.FC = () => (
  <SettingsPage title="ABOUT DECKR">
    <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
      <div><h3 className="font-bold text-foreground">What is DECKR?</h3><p className="mt-1">DECKR is an AI-powered content ideation app that helps creators discover viral content ideas in minutes. It combines trending data, audience psychology, and AI to deliver personalized content recommendations.</p><p className="mt-2">Think of it as Tinder for content ideas — swipe right on ideas you love, left on ones you don't, and up to generate a full script with AI.</p></div>
      <div><h3 className="font-bold text-foreground">Our Mission</h3><p className="mt-1">We believe every creator deserves professional-grade tools to compete in the content economy. No more hours spent brainstorming or staring at a blank page.</p><p className="mt-2">DECKR is built to help solo creators compete with studios by providing data-driven content strategies at their fingertips.</p></div>
      <div><h3 className="font-bold text-foreground">Key Features</h3>
        <p className="mt-2 font-semibold">🃏 SWIPE DECK</p><p>Browse endless AI-curated content ideas. Save the winners, skip the rest.</p>
        <p className="mt-2 font-semibold">✨ AI SCRIPTS</p><p>Generate platform-optimized scripts with hooks, body, and CTAs in seconds.</p>
        <p className="mt-2 font-semibold">📅 CONTENT CALENDAR</p><p>Plan your content strategy with a built-in calendar and scheduling system.</p>
      </div>
    </div>
  </SettingsPage>
);

export const ContactScreen: React.FC = () => (
  <SettingsPage title="CONTACT US">
    <p className="text-sm text-muted-foreground">We'd love to hear from you. Reach out for support, feedback, or business inquiries.</p>
    <div className="mt-4 space-y-4">
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">SUPPORT</p>
      <ContactCard icon="✉️" title="Email Support" sub="Get help with your account or subscription" detail="support@deckrapp.com" />
      <ContactCard icon="🕐" title="Response Time" sub="We typically reply within 24-48 hours" detail="Mon-Fri, 9AM-6PM" />
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">BUSINESS INQUIRIES</p>
      <ContactCard icon="💼" title="Partnerships & Sponsorships" sub="Brand deals, collaborations, and partnerships" detail="partners@deckrapp.com" />
      <ContactCard icon="🛡️" title="Legal & Privacy" sub="Privacy concerns or legal matters" detail="legal@deckrapp.com" />
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
    { q: "How does DECKR work?", a: "DECKR uses AI to generate personalized content ideas based on your niche, platform, and posting frequency. Swipe right to save ideas, left to skip, and up to generate a full script." },
    { q: "What's the daily swipe limit?", a: "Free users get 10 swipes per day. Creator and Pro plans offer unlimited swipes." },
    { q: "How do I generate a script?", a: "Swipe up on any content card, or tap the star button below the card. You can also generate scripts from saved ideas in your Content Library." },
    { q: "Where are my saved ideas?", a: "Saved ideas appear in your Calendar (unscheduled section) and Content Library (Saved tab)." },
    { q: "How does the streak work?", a: "Your streak counts consecutive days you've used the app. Open DECKR daily to maintain your streak!" },
    { q: "Can I export my calendar?", a: "Yes! Creator and Pro plan users can export their calendar. Tap the share icon on the calendar screen." },
    { q: "How do I change my niches?", a: "Go to Profile → My Niches. Free users can select 1 niche, Creator up to 3, and Pro unlimited." },
    { q: "What happens when my plan expires?", a: "Your account reverts to the Free plan. Saved ideas and scripts are preserved but limited features apply." },
    { q: "How do I cancel my subscription?", a: "Go to Profile → Manage Subscription → Cancel. Your plan remains active until the billing period ends." },
    { q: "Why am I seeing different platforms?", a: "DECKR optimizes ideas across platforms. You may see cross-platform suggestions even if you selected specific platforms." },
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

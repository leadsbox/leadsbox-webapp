import type { TemplateCategory, TemplatePlaceholder } from '@/types';

export type TemplateSample = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  header?: string;
  body: string;
  footer?: string;
  buttons: unknown;
  placeholders: TemplatePlaceholder[];
  sampleValues: Record<string, string>;
  whyItWorks: string;
  tips: string[];
};

const buildPlaceholders = (items: Array<TemplatePlaceholder & { example: string }>) =>
  items.map((item, index) => ({
    key: item.key,
    label: item.label ?? item.key.replace(/_/g, ' '),
    example: item.example,
    index: index + 1,
  }));

export const TEMPLATE_SAMPLES: TemplateSample[] = [
  {
    id: 'sample_marketing_welcome_offer',
    name: 'welcome_offer',
    category: 'MARKETING',
    language: 'en',
    header: 'Welcome to {{brand_name}} ✨',
    body:
      'Hi {{first_name}}, thanks for joining {{brand_name}}! Enjoy {{discount}} off your first order. Use code {{coupon_code}} before {{expiry_date}}. Reply STOP to opt out.',
    footer: 'Need help? Chat with us anytime.',
    buttons: null,
    placeholders: buildPlaceholders([
      { key: 'first_name', label: 'First name', example: 'Ada' },
      { key: 'brand_name', label: 'Brand name', example: 'LeadsBox' },
      { key: 'discount', label: 'Discount percent', example: '20%' },
      { key: 'coupon_code', label: 'Coupon code', example: 'HELLO20' },
      { key: 'expiry_date', label: 'Expiry date', example: '30 Sep' },
    ]),
    sampleValues: {
      first_name: 'Ada',
      brand_name: 'LeadsBox',
      discount: '20%',
      coupon_code: 'HELLO20',
      expiry_date: '30 Sep',
    },
    whyItWorks: 'Clear incentive, compliance-friendly opt-out language, and timely call to action.',
    tips: [
      'Mention the customer benefit in the opening sentence.',
      'Include opt-out instructions to satisfy Meta marketing policies.',
      'Keep numbers and codes easy to scan on mobile.',
    ],
  },
  {
    id: 'sample_marketing_winback',
    name: 'winback_offer',
    category: 'MARKETING',
    language: 'en',
    header: 'We miss you at {{brand_name}}',
    body:
      'Hi {{first_name}}, it’s been a while! Come back to {{brand_name}} and save {{discount}} on your next booking. Tap the button to reclaim your offer.',
    footer: 'Reply STOP to opt out.',
    buttons: [
      {
        type: 'URL',
        text: 'Redeem offer',
        url: 'https://example.com/offers',
      },
    ],
    placeholders: buildPlaceholders([
      { key: 'first_name', label: 'First name', example: 'Ada' },
      { key: 'brand_name', label: 'Brand name', example: 'LeadsBox' },
      { key: 'discount', label: 'Discount value', example: '$15' },
    ]),
    sampleValues: {
      first_name: 'Ada',
      brand_name: 'LeadsBox',
      discount: '$15',
    },
    whyItWorks: 'Personalised re-engagement message with a single, clear call to action.',
    tips: [
      'Use friendly tone but avoid excessive punctuation.',
      'Highlight a specific benefit to drive clicks.',
      'Link button to a dedicated landing page for easier tracking.',
    ],
  },
  {
    id: 'sample_utility_order_update',
    name: 'order_update',
    category: 'UTILITY',
    language: 'en',
    header: 'Order {{order_number}} update',
    body:
      'Hello {{first_name}}, your order {{order_number}} is now {{order_status}}. Track progress here: {{tracking_url}}. We’ll notify you again on delivery day. Thanks for choosing {{brand_name}}!',
    footer: null,
    buttons: null,
    placeholders: buildPlaceholders([
      { key: 'first_name', label: 'First name', example: 'Ada' },
      { key: 'order_number', label: 'Order number', example: '#48291' },
      { key: 'order_status', label: 'Order status', example: 'out for delivery' },
      { key: 'tracking_url', label: 'Tracking URL', example: 'https://example.com/track/48291' },
      { key: 'brand_name', label: 'Brand name', example: 'LeadsBox' },
    ]),
    sampleValues: {
      first_name: 'Ada',
      order_number: '#48291',
      order_status: 'out for delivery',
      tracking_url: 'https://example.com/track/48291',
      brand_name: 'LeadsBox',
    },
    whyItWorks: 'Transactional clarity with next-step guidance and no promotional language.',
    tips: [
      'State the current status early in the message.',
      'Avoid marketing hooks or discount mentions in utility templates.',
      'Provide a direct tracking link when available.',
    ],
  },
  {
    id: 'sample_utility_appointment_reminder',
    name: 'appointment_reminder',
    category: 'UTILITY',
    language: 'en',
    header: 'Appointment reminder',
    body:
      'Hi {{first_name}}, this is a reminder for your {{service_name}} appointment with {{staff_name}} on {{appointment_date}} at {{appointment_time}}. Reply YES to confirm or NO to reschedule.',
    footer: 'We look forward to seeing you!',
    buttons: null,
    placeholders: buildPlaceholders([
      { key: 'first_name', label: 'First name', example: 'Ada' },
      { key: 'service_name', label: 'Service name', example: 'consultation' },
      { key: 'staff_name', label: 'Staff name', example: 'Jordan' },
      { key: 'appointment_date', label: 'Appointment date', example: '04 Sep' },
      { key: 'appointment_time', label: 'Appointment time', example: '2:00 PM' },
    ]),
    sampleValues: {
      first_name: 'Ada',
      service_name: 'consultation',
      staff_name: 'Jordan',
      appointment_date: '04 Sep',
      appointment_time: '2:00 PM',
    },
    whyItWorks: 'Confirms essential details and sets expectations for the customer response.',
    tips: [
      'Keep instructions short—WhatsApp users skim on mobile.',
      'Use polite, neutral tone to avoid sounding automated.',
      'Offer a clear path to reschedule within the 24-hour window.',
    ],
  },
  {
    id: 'sample_authentication_otp',
    name: 'login_otp',
    category: 'AUTHENTICATION',
    language: 'en',
    header: 'Your login code',
    body:
      'Use {{otp_code}} to sign in to {{product_name}}. Do not share this code with anyone. It expires in {{valid_for_minutes}} minutes.',
    footer: 'Need help? Visit {{help_url}}',
    buttons: null,
    placeholders: buildPlaceholders([
      { key: 'otp_code', label: 'OTP code', example: '482193' },
      { key: 'product_name', label: 'Product name', example: 'LeadsBox' },
      { key: 'valid_for_minutes', label: 'Validity in minutes', example: '5' },
      { key: 'help_url', label: 'Help URL', example: 'https://leadsbox.io/help' },
    ]),
    sampleValues: {
      otp_code: '482193',
      product_name: 'LeadsBox',
      valid_for_minutes: '5',
      help_url: 'https://leadsbox.io/help',
    },
    whyItWorks: 'Direct, secure language and clear instructions for the one-time password.',
    tips: [
      'Never include promotional language in authentication templates.',
      'Remind the user to keep the code private.',
      'Mention expiration to encourage prompt action.',
    ],
  },
  {
    id: 'sample_authentication_alert',
    name: 'security_alert',
    category: 'AUTHENTICATION',
    language: 'en',
    header: 'Security alert',
    body:
      'Hi {{first_name}}, we detected a sign-in attempt to {{product_name}} from {{location}}. If this was you, ignore this message. Otherwise reset your password here: {{reset_url}}.',
    footer: 'Need support? Contact us at {{support_email}}',
    buttons: null,
    placeholders: buildPlaceholders([
      { key: 'first_name', label: 'First name', example: 'Ada' },
      { key: 'product_name', label: 'Product name', example: 'LeadsBox' },
      { key: 'location', label: 'Location', example: 'Lagos, Nigeria' },
      { key: 'reset_url', label: 'Password reset URL', example: 'https://leadsbox.io/reset' },
      { key: 'support_email', label: 'Support email', example: 'support@leadsbox.io' },
    ]),
    sampleValues: {
      first_name: 'Ada',
      product_name: 'LeadsBox',
      location: 'Lagos, Nigeria',
      reset_url: 'https://leadsbox.io/reset',
      support_email: 'support@leadsbox.io',
    },
    whyItWorks: 'Quickly informs users of risky activity and gives an immediate action step.',
    tips: [
      'Avoid sensational language; stay factual and calm.',
      'Provide a trusted path to secure the account.',
      'Include support contact for additional help.',
    ],
  },
];

export const TEMPLATE_SAMPLES_BY_CATEGORY: Record<TemplateCategory, TemplateSample[]> = TEMPLATE_SAMPLES.reduce(
  (acc, sample) => {
    acc[sample.category] = acc[sample.category] ? [...acc[sample.category], sample] : [sample];
    return acc;
  },
  {
    MARKETING: [] as TemplateSample[],
    UTILITY: [] as TemplateSample[],
    AUTHENTICATION: [] as TemplateSample[],
  }
);

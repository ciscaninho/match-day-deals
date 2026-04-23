UPDATE public.assistant_settings
SET 
  support_email = 'support.footticket@gmail.com',
  email_subject = 'Support Request - Foot Ticket Finder',
  fallback_message = 'I''m sorry, I couldn''t find a reliable answer to that. I''ll send your request to our support team and they will get back to you within 24 hours.',
  updated_at = now()
WHERE id = 1;

ALTER TABLE public.assistant_settings 
  ALTER COLUMN support_email SET DEFAULT 'support.footticket@gmail.com',
  ALTER COLUMN email_subject SET DEFAULT 'Support Request - Foot Ticket Finder',
  ALTER COLUMN fallback_message SET DEFAULT 'I''m sorry, I couldn''t find a reliable answer to that. I''ll send your request to our support team and they will get back to you within 24 hours.';
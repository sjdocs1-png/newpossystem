
-- Fix existing plaintext passwords by re-hashing them
UPDATE public.stores
SET password = extensions.crypt(password, extensions.gen_salt('bf', 10))
WHERE password IS NOT NULL AND password != '' AND LEFT(password, 2) != '$2';

-- Fix existing plaintext pins
UPDATE public.user_roles
SET pin = extensions.crypt(pin, extensions.gen_salt('bf', 10))
WHERE pin IS NOT NULL AND pin != '' AND LEFT(pin, 2) != '$2';

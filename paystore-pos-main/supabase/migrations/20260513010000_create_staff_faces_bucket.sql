-- Create staff-faces storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-faces', 'staff-faces', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public;

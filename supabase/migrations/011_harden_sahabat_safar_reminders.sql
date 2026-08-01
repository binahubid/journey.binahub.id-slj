-- Mengamankan alur "Ingatkan Sahabat Safar".
-- Jalankan setelah tabel support_team, profiles, dan notifications tersedia.

CREATE TABLE IF NOT EXISTS public.safar_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sahabat_safar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  reminded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bersihkan duplikat lama sebelum menambahkan batas satu pengingat per hari.
DELETE FROM public.safar_reminders duplicate
USING public.safar_reminders retained
WHERE duplicate.user_id = retained.user_id
  AND duplicate.sahabat_safar_user_id = retained.sahabat_safar_user_id
  AND duplicate.date = retained.date
  AND duplicate.id > retained.id;

CREATE UNIQUE INDEX IF NOT EXISTS safar_reminders_sender_target_date_key
  ON public.safar_reminders (user_id, sahabat_safar_user_id, date);

ALTER TABLE public.safar_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own safar reminders" ON public.safar_reminders;
DROP POLICY IF EXISTS "Users can view their own safar reminders" ON public.safar_reminders;
DROP POLICY IF EXISTS "Admins can view all safar reminders" ON public.safar_reminders;

CREATE POLICY "Participants view related safar reminders"
  ON public.safar_reminders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = sahabat_safar_user_id);

CREATE POLICY "Admins view all safar reminders"
  ON public.safar_reminders FOR SELECT
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.remind_sahabat_safar()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_id UUID := auth.uid();
  partner_id UUID;
  sender_name TEXT;
  reminder_date DATE := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
  inserted_id UUID;
BEGIN
  IF sender_id IS NULL THEN
    RAISE EXCEPTION 'Anda harus masuk untuk mengirim pengingat.';
  END IF;

  SELECT p.sahabat_safar_user_id, COALESCE(NULLIF(p.full_name, ''), 'Sahabat Safar')
  INTO partner_id, sender_name
  FROM public.profiles p
  WHERE p.user_id = sender_id;

  IF partner_id IS NULL THEN
    RAISE EXCEPTION 'Sahabat Safar belum ditetapkan.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles partner
    WHERE partner.user_id = partner_id
      AND partner.sahabat_safar_user_id = sender_id
  ) THEN
    RAISE EXCEPTION 'Data pasangan Sahabat Safar belum sinkron. Hubungi admin.';
  END IF;

  BEGIN
    INSERT INTO public.safar_reminders (user_id, sahabat_safar_user_id, date, reminded_at)
    VALUES (sender_id, partner_id, reminder_date, NOW())
    RETURNING id INTO inserted_id;
  EXCEPTION
    WHEN unique_violation THEN
      inserted_id := NULL;
  END;

  IF inserted_id IS NULL THEN
    RETURN jsonb_build_object('sent', false, 'already_sent', true, 'date', reminder_date);
  END IF;

  INSERT INTO public.notifications (user_id, title, message, category, is_read)
  VALUES (
    partner_id,
    'Pengingat dari Sahabat Safar',
    sender_name || ' mengingatkan Anda untuk tetap konsisten dan semangat menjalankan PTP hari ini!',
    'reminder',
    false
  );

  RETURN jsonb_build_object('sent', true, 'already_sent', false, 'date', reminder_date);
END;
$$;

REVOKE ALL ON FUNCTION public.remind_sahabat_safar() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remind_sahabat_safar() TO authenticated;

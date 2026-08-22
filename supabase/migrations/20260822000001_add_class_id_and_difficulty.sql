-- Add class_id to missions
ALTER TABLE public.missions
ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- Add difficulty column to cleanly separate from jenjang
ALTER TABLE public.missions
ADD COLUMN difficulty TEXT CHECK (difficulty IN ('Mudah', 'Sedang', 'Tinggi'));

-- Set default difficulty for existing data based on jenjang if we wanted to,
-- but we can just update existing rows
UPDATE public.missions
SET difficulty = CASE 
  WHEN jenjang = 'SD' THEN 'Mudah'
  WHEN jenjang = 'SMP' THEN 'Sedang'
  WHEN jenjang = 'SMA' THEN 'Tinggi'
  ELSE 'Sedang'
END;

-- For existing missions, we need to assign them to a class.
-- We can assign them to the first class that matches the teacher and jenjang, or just leave them null for now.
-- Actually, let's allow class_id to be NULL to represent "Global/Template" missions.

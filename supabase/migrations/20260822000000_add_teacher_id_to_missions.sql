-- Add teacher_id to missions to allow teacher-specific missions
ALTER TABLE public.missions
ADD COLUMN teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop the old select policy
DROP POLICY IF EXISTS "missions_select_all" ON public.missions;

-- Create new policies
-- Select: Teachers see global missions (teacher_id IS NULL) and their own.
-- Students see global missions and missions from their teachers.
CREATE POLICY "missions_select_policy" ON public.missions
FOR SELECT
USING (
  teacher_id IS NULL 
  OR teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.classes c ON cm.class_id = c.id
    WHERE cm.student_id = auth.uid() AND c.teacher_id = public.missions.teacher_id
  )
);

-- Insert/Update/Delete for Teachers
CREATE POLICY "missions_insert_teacher" ON public.missions
FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
);

CREATE POLICY "missions_update_teacher" ON public.missions
FOR UPDATE
USING (
  teacher_id = auth.uid()
);

CREATE POLICY "missions_delete_teacher" ON public.missions
FOR DELETE
USING (
  teacher_id = auth.uid()
);

-- Fix infinite recursion in RLS policies
-- Problem: get_user_role() queries profiles → profiles policy calls get_user_role() → infinite loop

-- 1. Drop function with CASCADE (auto-drops all policies that depend on it)
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- 2. Drop remaining policies that don't depend on the function
DO $$
DECLARE
  _tbl text;
  _pol record;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY[
    'profiles','classes','class_members','missions','rubrics',
    'sessions','activity_logs','step_answers','markers','marker_rules','ai_reports'
  ]) LOOP
    FOR _pol IN SELECT policyname FROM pg_policies WHERE tablename = _tbl AND schemaname = 'public' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- 3. Helper: check if current user is teacher of a given student
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(student_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_members cm
    JOIN classes c ON c.id = cm.class_id
    WHERE cm.student_id = student_uuid
    AND c.teacher_id = auth.uid()
  );
$$;

-- 4. PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "profiles_select_teacher" ON public.profiles FOR SELECT
  USING (public.is_teacher_of_student(id));

-- 5. CLASSES
CREATE POLICY "classes_select_student" ON public.classes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.class_members WHERE class_id = classes.id AND student_id = auth.uid()
  ));
CREATE POLICY "classes_all_teacher" ON public.classes FOR ALL
  USING (teacher_id = auth.uid());

-- 6. CLASS_MEMBERS
CREATE POLICY "class_members_select_own" ON public.class_members FOR SELECT
  USING (student_id = auth.uid());
CREATE POLICY "class_members_all_teacher" ON public.class_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.classes WHERE id = class_members.class_id AND teacher_id = auth.uid()
  ));

-- 7. MISSIONS: public read
CREATE POLICY "missions_select_all" ON public.missions FOR SELECT USING (true);

-- 8. RUBRICS: public read
CREATE POLICY "rubrics_select_all" ON public.rubrics FOR SELECT USING (true);

-- 9. MARKER_RULES: public read
CREATE POLICY "marker_rules_select_all" ON public.marker_rules FOR SELECT USING (true);

-- 10. SESSIONS
CREATE POLICY "sessions_all_student" ON public.sessions FOR ALL
  USING (student_id = auth.uid());
CREATE POLICY "sessions_select_teacher" ON public.sessions FOR SELECT
  USING (public.is_teacher_of_student(student_id));

-- 11. ACTIVITY_LOGS
CREATE POLICY "logs_all_student" ON public.activity_logs FOR ALL
  USING (student_id = auth.uid());
CREATE POLICY "logs_select_teacher" ON public.activity_logs FOR SELECT
  USING (public.is_teacher_of_student(student_id));

-- 12. STEP_ANSWERS
CREATE POLICY "answers_all_student" ON public.step_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.sessions WHERE id = step_answers.session_id AND student_id = auth.uid()
  ));
CREATE POLICY "answers_select_teacher" ON public.step_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions s WHERE s.id = step_answers.session_id AND public.is_teacher_of_student(s.student_id)
  ));

-- 13. MARKERS
CREATE POLICY "markers_select_student" ON public.markers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions WHERE id = markers.session_id AND student_id = auth.uid()
  ));
CREATE POLICY "markers_select_teacher" ON public.markers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions s WHERE s.id = markers.session_id AND public.is_teacher_of_student(s.student_id)
  ));

-- 14. AI_REPORTS
CREATE POLICY "reports_select_student" ON public.ai_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions WHERE id = ai_reports.session_id AND student_id = auth.uid()
  ));
CREATE POLICY "reports_select_teacher" ON public.ai_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions s WHERE s.id = ai_reports.session_id AND public.is_teacher_of_student(s.student_id)
  ));

-- DECIDA Initial Schema & RLS

-- 1. Create custom types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE mission_jenjang AS ENUM ('SD', 'SMP', 'SMA');

-- 2. Tables

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLASSES
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jenjang mission_jenjang NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLASS_MEMBERS
CREATE TABLE public.class_members (
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- MISSIONS
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  jenjang mission_jenjang NOT NULL,
  scenario TEXT NOT NULL,
  dataset JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RUBRICS
CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  jenjang mission_jenjang NOT NULL,
  indicators JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- SESSIONS
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ACTIVITY_LOGS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- STEP_ANSWERS
CREATE TABLE public.step_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  answer_text TEXT,
  evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, step_number)
);

-- MARKERS
CREATE TABLE public.markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE,
  indicators JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- MARKER_RULES
CREATE TABLE public.marker_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE UNIQUE,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- AI_REPORTS
CREATE TABLE public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  prompt_used TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security (RLS)

-- Helper function to get user role securely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marker_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can view students in their classes" ON public.profiles FOR SELECT USING (
  public.get_user_role() = 'teacher' AND 
  id IN (
    SELECT student_id FROM public.class_members 
    JOIN public.classes ON public.class_members.class_id = public.classes.id 
    WHERE public.classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (public.get_user_role() = 'admin');

-- Classes Policies
CREATE POLICY "Students can view classes they are in" ON public.classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = public.classes.id AND student_id = auth.uid())
);
CREATE POLICY "Teachers can view and manage their own classes" ON public.classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admins have full access to classes" ON public.classes FOR ALL USING (public.get_user_role() = 'admin');

-- Class Members Policies
CREATE POLICY "Students can view their own memberships" ON public.class_members FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view and manage their class memberships" ON public.class_members FOR ALL USING (
  class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
);
CREATE POLICY "Admins have full access to class members" ON public.class_members FOR ALL USING (public.get_user_role() = 'admin');

-- Missions, Rubrics, Marker Rules Policies (Read-only for users, Full for Admin)
CREATE POLICY "Anyone can view missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Admins manage missions" ON public.missions FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Anyone can view rubrics" ON public.rubrics FOR SELECT USING (true);
CREATE POLICY "Admins manage rubrics" ON public.rubrics FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Anyone can view marker rules" ON public.marker_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage marker rules" ON public.marker_rules FOR ALL USING (public.get_user_role() = 'admin');

-- Sessions Policies
CREATE POLICY "Students manage their own sessions" ON public.sessions FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers view sessions of their students" ON public.sessions FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM public.class_members 
    JOIN public.classes ON public.class_members.class_id = public.classes.id 
    WHERE public.classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to sessions" ON public.sessions FOR ALL USING (public.get_user_role() = 'admin');

-- Activity Logs, Step Answers, Markers, AI Reports Policies (Same as Sessions)
-- Activity Logs
CREATE POLICY "Students manage their own activity logs" ON public.activity_logs FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers view logs of their students" ON public.activity_logs FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM public.class_members 
    JOIN public.classes ON public.class_members.class_id = public.classes.id 
    WHERE public.classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to logs" ON public.activity_logs FOR ALL USING (public.get_user_role() = 'admin');

-- Step Answers
CREATE POLICY "Students manage their own step answers" ON public.step_answers FOR ALL USING (
  session_id IN (SELECT id FROM public.sessions WHERE student_id = auth.uid())
);
CREATE POLICY "Teachers view answers of their students" ON public.step_answers FOR SELECT USING (
  session_id IN (
    SELECT id FROM public.sessions WHERE student_id IN (
      SELECT student_id FROM public.class_members 
      JOIN public.classes ON public.class_members.class_id = public.classes.id 
      WHERE public.classes.teacher_id = auth.uid()
    )
  )
);
CREATE POLICY "Admins have full access to step answers" ON public.step_answers FOR ALL USING (public.get_user_role() = 'admin');

-- Markers
CREATE POLICY "Students view their own markers" ON public.markers FOR SELECT USING (
  session_id IN (SELECT id FROM public.sessions WHERE student_id = auth.uid())
);
CREATE POLICY "Teachers view markers of their students" ON public.markers FOR SELECT USING (
  session_id IN (
    SELECT id FROM public.sessions WHERE student_id IN (
      SELECT student_id FROM public.class_members 
      JOIN public.classes ON public.class_members.class_id = public.classes.id 
      WHERE public.classes.teacher_id = auth.uid()
    )
  )
);
CREATE POLICY "Admins have full access to markers" ON public.markers FOR ALL USING (public.get_user_role() = 'admin');

-- AI Reports
CREATE POLICY "Students view their own AI reports" ON public.ai_reports FOR SELECT USING (
  session_id IN (SELECT id FROM public.sessions WHERE student_id = auth.uid())
);
CREATE POLICY "Teachers view AI reports of their students" ON public.ai_reports FOR SELECT USING (
  session_id IN (
    SELECT id FROM public.sessions WHERE student_id IN (
      SELECT student_id FROM public.class_members 
      JOIN public.classes ON public.class_members.class_id = public.classes.id 
      WHERE public.classes.teacher_id = auth.uid()
    )
  )
);
CREATE POLICY "Admins have full access to AI reports" ON public.ai_reports FOR ALL USING (public.get_user_role() = 'admin');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_step_answers_modtime
BEFORE UPDATE ON public.step_answers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

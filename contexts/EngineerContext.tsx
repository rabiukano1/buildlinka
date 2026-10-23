import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

export type ProjectStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed';
export type SpecStatus = 'draft' | 'review' | 'approved';
export type MemberStatus = 'active' | 'on-site' | 'idle';

export type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
  budget: number;
  spent: number;
  progress: number;
  status: ProjectStatus;
  deadline: string;
};

export type Spec = {
  id: string;
  name: string;
  projectId: string;
  type: string;
  sheets: number;
  updatedAt: number;
  status: SpecStatus;
};

export type Member = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: MemberStatus;
  projectId: string | null;
  email: string;
  phone: string;
};

export type Visit = {
  id: string;
  projectId: string;
  purpose: string;
  date: string;
  done: boolean;
};

type EngineerContextType = {
  projects: Project[];
  specs: Spec[];
  team: Member[];
  visits: Visit[];
  loading: boolean;
  addProject: (p: Omit<Project, 'id' | 'spent' | 'progress' | 'status'>) => Promise<string>;
  updateProject: (id: string, patch: Partial<Project>) => void;
  logExpense: (id: string, amount: number) => void;
  addSpec: (s: Omit<Spec, 'id' | 'updatedAt' | 'status'>) => void;
  setSpecStatus: (id: string, status: SpecStatus) => void;
  assignMember: (memberId: string, projectId: string | null) => void;
  setMemberStatus: (memberId: string, status: MemberStatus) => void;
  addVisit: (v: Omit<Visit, 'id' | 'done'>) => void;
  toggleVisit: (id: string) => void;
  removeVisit: (id: string) => void;
};

const EngineerContext = createContext<EngineerContextType | null>(null);

export function EngineerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const projectRows = useQuery(api.projects.list, isAuthenticated ? {} : 'skip');
  const specRows = useQuery(api.projects.listSpecs, isAuthenticated ? {} : 'skip');
  const memberRows = useQuery(api.projects.listMembers, isAuthenticated ? {} : 'skip');
  const visitRows = useQuery(api.projects.listVisits, isAuthenticated ? {} : 'skip');

  const createProject = useMutation(api.projects.create);
  const updateProjectMutation = useMutation(api.projects.update);
  const logExpenseMutation = useMutation(api.projects.logExpense);
  const addSpecMutation = useMutation(api.projects.addSpec);
  const setSpecStatusMutation = useMutation(api.projects.setSpecStatus);
  const assignMemberMutation = useMutation(api.projects.assignMember);
  const setMemberStatusMutation = useMutation(api.projects.setMemberStatus);
  const addVisitMutation = useMutation(api.projects.addVisit);
  const toggleVisitMutation = useMutation(api.projects.toggleVisit);
  const removeVisitMutation = useMutation(api.projects.removeVisit);

  const projects = useMemo<Project[]>(
    () => (projectRows ?? []).map((p) => ({
      id: p._id,
      name: p.name,
      client: p.client,
      location: p.location,
      budget: p.budget,
      spent: p.spent,
      progress: p.progress,
      status: p.status as ProjectStatus,
      deadline: p.deadline,
    })),
    [projectRows],
  );

  const specs = useMemo<Spec[]>(
    () => (specRows ?? []).map((s) => ({
      id: s._id,
      name: s.name,
      projectId: s.projectId,
      type: s.type,
      sheets: s.sheets,
      updatedAt: s.updatedAt,
      status: s.status as SpecStatus,
    })),
    [specRows],
  );

  const team = useMemo<Member[]>(
    () => (memberRows ?? []).map((m) => ({
      id: m._id,
      name: m.name,
      role: m.role,
      avatar: m.avatar ?? '👷',
      status: m.status as MemberStatus,
      projectId: m.projectId,
      email: m.email,
      phone: m.phone,
    })),
    [memberRows],
  );

  const visits = useMemo<Visit[]>(
    () => (visitRows ?? []).map((v) => ({
      id: v._id,
      projectId: v.projectId,
      purpose: v.purpose,
      date: v.date,
      done: v.done,
    })),
    [visitRows],
  );

  const value: EngineerContextType = {
    projects,
    specs,
    team,
    visits,
    loading: isAuthenticated && projectRows === undefined,
    addProject: async (p) => {
      const id = await createProject({
        name: p.name,
        client: p.client,
        location: p.location,
        budget: p.budget,
        deadline: p.deadline,
      });
      return id;
    },
    updateProject: (id, patch) => {
      void updateProjectMutation({
        id: id as Id<'projects'>,
        name: patch.name,
        client: patch.client,
        location: patch.location,
        budget: patch.budget,
        progress: patch.progress,
        status: patch.status,
        deadline: patch.deadline,
      });
    },
    logExpense: (id, amount) => {
      void logExpenseMutation({ projectId: id as Id<'projects'>, amount });
    },
    addSpec: (s) => {
      void addSpecMutation({ projectId: s.projectId as Id<'projects'>, name: s.name, type: s.type, sheets: s.sheets });
    },
    setSpecStatus: (id, status) => {
      void setSpecStatusMutation({ id: id as Id<'specifications'>, status });
    },
    assignMember: (memberId, projectId) => {
      void assignMemberMutation({ memberId: memberId as Id<'projectMembers'>, projectId: projectId as Id<'projects'> | null });
    },
    setMemberStatus: (memberId, status) => {
      void setMemberStatusMutation({ memberId: memberId as Id<'projectMembers'>, status });
    },
    addVisit: (v) => {
      void addVisitMutation({ projectId: v.projectId as Id<'projects'>, purpose: v.purpose, date: v.date });
    },
    toggleVisit: (id) => {
      void toggleVisitMutation({ id: id as Id<'siteVisits'> });
    },
    removeVisit: (id) => {
      void removeVisitMutation({ id: id as Id<'siteVisits'> });
    },
  };

  return <EngineerContext.Provider value={value}>{children}</EngineerContext.Provider>;
}

export function useEngineer() {
  const ctx = useContext(EngineerContext);
  if (!ctx) throw new Error('useEngineer must be used inside EngineerProvider');
  return ctx;
}

import { createContext, useContext, useState, type ReactNode } from 'react';

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
  date: string; // ISO
  done: boolean;
};

const DAY = 86400000;
const at = (daysFromNow: number, hour: number) => {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const INITIAL_PROJECTS: Project[] = [
  { id: 'pr1', name: 'Greenview Estate', client: 'Habitat Dev. Corp', location: 'Lekki, Lagos', budget: 120000000, spent: 72000000, progress: 60, status: 'on-track', deadline: 'Dec 2026' },
  { id: 'pr2', name: 'Ikeja Mall Complex', client: 'RetailSpace Ltd', location: 'Ikeja, Lagos', budget: 85000000, spent: 25500000, progress: 30, status: 'at-risk', deadline: 'Mar 2027' },
  { id: 'pr3', name: 'Lekki Bridge Access Rd', client: 'State Gov.', location: 'Lekki, Lagos', budget: 250000000, spent: 212500000, progress: 85, status: 'on-track', deadline: 'Aug 2026' },
  { id: 'pr4', name: 'Abuja Mall Renovation', client: 'Prime Properties', location: 'Abuja, FCT', budget: 45000000, spent: 33750000, progress: 75, status: 'delayed', deadline: 'Sep 2026' },
];

const INITIAL_SPECS: Spec[] = [
  { id: 'sp1', name: 'Structural Steel Specs', projectId: 'pr1', type: 'Structural', sheets: 12, updatedAt: Date.now() - 2 * DAY, status: 'approved' },
  { id: 'sp2', name: 'Foundation Design', projectId: 'pr2', type: 'Geotechnical', sheets: 8, updatedAt: Date.now() - 7 * DAY, status: 'review' },
  { id: 'sp3', name: 'Reinforcement Schedule', projectId: 'pr3', type: 'Structural', sheets: 16, updatedAt: Date.now() - 3 * DAY, status: 'approved' },
  { id: 'sp4', name: 'MEP Specifications', projectId: 'pr2', type: 'MEP', sheets: 24, updatedAt: Date.now() - 5 * DAY, status: 'draft' },
  { id: 'sp5', name: 'Concrete Mix Design', projectId: 'pr4', type: 'Materials', sheets: 6, updatedAt: Date.now() - DAY, status: 'approved' },
  { id: 'sp6', name: 'Steel Connection Details', projectId: 'pr1', type: 'Structural', sheets: 10, updatedAt: Date.now() - 14 * DAY, status: 'review' },
];

const INITIAL_TEAM: Member[] = [
  { id: 'tm2', name: 'Emeka Okafor', role: 'Master Mason', avatar: '👷', status: 'active', projectId: 'pr2', email: 'emeka.o@buildlinka.com', phone: '+2348034567890' },
  { id: 'tm3', name: 'Eng. Amina Bello', role: 'Civil Engineer', avatar: '👩‍💼', status: 'active', projectId: 'pr3', email: 'amina.b@buildlinka.com', phone: '+2348056789012' },
  { id: 'tm4', name: 'Bello Adamu', role: 'Electrician', avatar: '⚡', status: 'on-site', projectId: 'pr1', email: 'bello.a@buildlinka.com', phone: '+2348067890123' },
  { id: 'tm5', name: 'Eng. Segun O.', role: 'Project Manager', avatar: '👨‍💻', status: 'active', projectId: null, email: 'segun.o@buildlinka.com', phone: '+2348078901234' },
  { id: 'tm6', name: 'Chukwudi Eze', role: 'Plumber', avatar: '🔧', status: 'idle', projectId: 'pr2', email: 'chukwudi.e@buildlinka.com', phone: '+2348089012345' },
  { id: 'tm7', name: 'Aminu Garba', role: 'Carpenter', avatar: '🪚', status: 'active', projectId: 'pr3', email: 'aminu.g@buildlinka.com', phone: '+2348090123456' },
  { id: 'tm8', name: 'Eng. Funmi A.', role: 'Site Supervisor', avatar: '👩‍🏗️', status: 'on-site', projectId: 'pr1', email: 'funmi.a@buildlinka.com', phone: '+2348101234567' },
];

const INITIAL_VISITS: Visit[] = [
  { id: 'v1', projectId: 'pr2', purpose: 'Foundation inspection', date: at(0, 14), done: false },
  { id: 'v2', projectId: 'pr1', purpose: 'Steel frame check', date: at(1, 10), done: false },
  { id: 'v3', projectId: 'pr4', purpose: 'Delay review with contractor', date: at(3, 9), done: false },
  { id: 'v4', projectId: 'pr3', purpose: 'Asphalt layer sign-off', date: at(-2, 11), done: true },
];

const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}`;

type EngineerContextType = {
  projects: Project[];
  specs: Spec[];
  team: Member[];
  visits: Visit[];
  addProject: (p: Omit<Project, 'id' | 'spent' | 'progress' | 'status'>) => string;
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
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [specs, setSpecs] = useState(INITIAL_SPECS);
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [visits, setVisits] = useState(INITIAL_VISITS);

  const updateProject = (id: string, patch: Partial<Project>) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const value: EngineerContextType = {
    projects,
    specs,
    team,
    visits,
    addProject: (p) => {
      const id = newId('pr');
      setProjects((prev) => [{ ...p, id, spent: 0, progress: 0, status: 'on-track' }, ...prev]);
      return id;
    },
    updateProject,
    logExpense: (id, amount) => setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, spent: p.spent + amount } : p))),
    addSpec: (s) => setSpecs((prev) => [{ ...s, id: newId('sp'), updatedAt: Date.now(), status: 'draft' }, ...prev]),
    setSpecStatus: (id, status) => setSpecs((prev) => prev.map((s) => (s.id === id ? { ...s, status, updatedAt: Date.now() } : s))),
    assignMember: (memberId, projectId) => setTeam((prev) => prev.map((m) => (m.id === memberId ? { ...m, projectId } : m))),
    setMemberStatus: (memberId, status) => setTeam((prev) => prev.map((m) => (m.id === memberId ? { ...m, status } : m))),
    addVisit: (v) => setVisits((prev) => [...prev, { ...v, id: newId('v'), done: false }]),
    toggleVisit: (id) => setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, done: !v.done } : v))),
    removeVisit: (id) => setVisits((prev) => prev.filter((v) => v.id !== id)),
  };

  return <EngineerContext.Provider value={value}>{children}</EngineerContext.Provider>;
}

export function useEngineer() {
  const ctx = useContext(EngineerContext);
  if (!ctx) throw new Error('useEngineer must be used inside EngineerProvider');
  return ctx;
}

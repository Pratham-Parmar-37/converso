// type User = {
//   name: string;
//   email: string;
//   image?: string;
//   accountId: string;
// };

enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

type Companion = Models.DocumentList<Models.Document> & {
  $id: string;
  id?: string;
  name: string;
  subject: Subject;
  topic: string;
  duration: number;
  bookmarked: boolean;
  author?: string;
  voice?: string;
  style?: string;
  created_at?: string;
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
  duration: number;
  userPlan?: string;
}

// ── Skill Tree Types ──────────────────────────────────────────────
interface SubjectProgress {
  subject: string;
  sessionCount: number;
  level: number;
  levelName: string;
  xpCurrent: number;
  xpNext: number;
}

interface SkillLevel {
  level: number;
  name: string;
  xpRequired: number;
  icon: string;
}

interface SubjectConfig {
  label: string;
  color: string;
  darkColor: string;
  icon: string;
}

interface SkillTreeProps {
  subjectCounts: Record<string, number>;
  totalSessions: number;
  userName: string;
  userImage: string;
}

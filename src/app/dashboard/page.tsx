import { getProgressForUser } from "@/repositories/progress.repository";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const data = await getProgressForUser();

  return <DashboardContent data={data} />;
}

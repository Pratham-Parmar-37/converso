import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectProgress, getUserSessions } from "@/lib/actions/companion.actions";
import SkillTree from "@/components/SkillTree";
import Link from "next/link";

export const metadata = {
    title: "Skill Tree — Converso",
    description: "Track your learning progress across subjects with an RPG-style skill tree.",
};

const SkillTreePage = async () => {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const userPlan = (user.publicMetadata?.subscriptionPlan as string | undefined) ?? "free";

    if (userPlan !== "elite") {
        return (
            <main>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                    <div className="text-6xl">🔒</div>
                    <h2 className="text-3xl font-extrabold text-white">Skill Tree is an Elite Feature</h2>
                    <p className="text-white/50 max-w-md">
                        Track your learning progress across all subjects with an RPG-style skill tree.
                        Upgrade to the <span className="text-primary font-semibold">Elite plan</span> to unlock this feature.
                    </p>
                    <Link
                        href="/subscription"
                        className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition"
                    >
                        Upgrade to Elite
                    </Link>
                </div>
            </main>
        );
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    const subjectCounts = await getSubjectProgress();
    const sessions = await getUserSessions(user.id, 100, userEmail);
    const totalSessions = sessions.length;

    return (
        <main>
            <div className="section-header reveal-up" style={{ animationDelay: "0.05s" }}>
                <p className="section-header-kicker">Progress</p>
                <h2 className="section-header-title">
                    Your Skill Tree
                </h2>
                <p className="text-white/50 text-sm mt-1">
                    Complete sessions to unlock skills and level up across subjects
                </p>
            </div>

            <div className="reveal-up" style={{ animationDelay: "0.18s" }}>
                <SkillTree
                    subjectCounts={subjectCounts}
                    totalSessions={totalSessions}
                    userName={user.firstName ?? "Learner"}
                    userImage={user.imageUrl}
                />
            </div>
        </main>
    );
};

export default SkillTreePage;

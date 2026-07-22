import { getAllCompanions, getBookmarkedCompanionIds } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { currentUser } from "@clerk/nextjs/server";
import AutoFixMissingAuthors from "@/components/AutoFixMissingAuthors";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : '';
    const topic = filters.topic ? filters.topic : '';

    const user = await currentUser();

    const companions = await getAllCompanions({ subject, topic });
    const bookmarkedIds = await getBookmarkedCompanionIds();
    const userId = user?.id;
    const userPlan = (user?.publicMetadata?.subscriptionPlan as string | undefined) ?? "free";
    const FREE_SUBJECTS = ['maths', 'science'];
    const filteredCompanions = userPlan === 'free'
        ? companions.filter((c) => FREE_SUBJECTS.includes(c.subject?.toLowerCase()))
        : companions;

    return (
        <main>
            <section className="flex justify-between gap-4 max-sm:flex-col">
                <h1>Companion Library</h1>
                <div className="flex gap-4">
                    <SearchInput />
                    <SubjectFilter />
                </div>
            </section>

            {user && <AutoFixMissingAuthors companionNames={["java", "gujju bhai", "biology"]} />}

            {userPlan === 'free' && (
                <p className="text-xs text-white/40 mt-2 mb-0">
                    🔒 Free plan shows <span className="text-primary font-semibold">Math & Science</span> only. <a href="/subscription" className="text-primary underline">Upgrade</a> for all subjects.
                </p>
            )}

            <section className="companions-grid">
                {filteredCompanions.map((companion) => (
                    <CompanionCard
                        key={companion.id}
                        {...companion}
                        color={getSubjectColor(companion.subject)}
                        bookmarked={bookmarkedIds.has(companion.id)}
                        userId={userId}
                    />
                ))}
            </section>
        </main>
    )
}

export default CompanionsLibrary

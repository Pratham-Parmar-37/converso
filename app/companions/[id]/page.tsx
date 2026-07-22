import { getCompanion } from "@/lib/actions/companion.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import CompanionComponent from "@/components/CompanionComponent";
import Link from "next/link";
import DeleteCompanionButton from "@/components/DeleteCompanionButton";

interface CompanionSessionPageProps {
    params: Promise<{ id: string }>;
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
    const { id } = await params;
    const companion = await getCompanion(id);
    const user = await currentUser();

    if (!user) redirect('/sign-in');
    if (!companion) redirect('/companions')

    const { name, subject, topic, duration, author } = companion;
    const canManage = author === user.id || author === user.emailAddresses[0]?.emailAddress;
    const userPlan = (user.publicMetadata?.subscriptionPlan as string | undefined) ?? "free";

    return (
        <main>
            <article className="flex rounded-border justify-between p-6 max-md:flex-col">
                <div className="flex items-center gap-2">
                    <div className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden" style={{ backgroundColor: getSubjectColor(subject) }}>
                        <Image src={`/icons/${subject}.svg`} alt={subject} width={35} height={35} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-2xl">
                                {name}
                            </p>
                            <div className="subject-badge max-sm:hidden">
                                {subject}
                            </div>
                        </div>
                        <p className="text-lg">{topic}</p>
                    </div>
                </div>
                <div className="items-start text-2xl max-md:hidden flex flex-col items-end gap-3">
                    <p>{duration} minutes</p>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Link href={`/companions/${id}/edit`} className="border border-black rounded-md px-3 py-2 text-sm">
                                Edit
                            </Link>
                            <DeleteCompanionButton companionId={id} />
                        </div>
                    )}
                </div>
            </article>

            <CompanionComponent
                {...companion}
                companionId={id}
                userName={user.firstName!}
                userImage={user.imageUrl!}
                userPlan={userPlan}
            />
        </main>
    )
}

export default CompanionSession

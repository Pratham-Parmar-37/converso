import CompanionForm from "@/components/CompanionForm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCompanion } from "@/lib/actions/companion.actions";

interface EditCompanionPageProps {
    params: Promise<{ id: string }>;
}

const EditCompanionPage = async ({ params }: EditCompanionPageProps) => {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { id } = await params;
    const companion = await getCompanion(id);
    const user = await currentUser();

    if (!companion) redirect("/companions");
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    if (companion.author !== userId && companion.author !== userEmail) redirect("/my-journey");

    return (
        <main className="min-lg:w-1/3 min-md:w-2/3 items-center justify-center">
            <article className="w-full gap-4 flex flex-col">
                <h1>Edit Companion</h1>
                <CompanionForm
                    mode="edit"
                    companionId={id}
                    initialValues={{
                        name: companion.name,
                        subject: companion.subject,
                        topic: companion.topic,
                        voice: companion.voice,
                        style: companion.style,
                        duration: companion.duration,
                    }}
                />
            </article>
        </main>
    );
};

export default EditCompanionPage;

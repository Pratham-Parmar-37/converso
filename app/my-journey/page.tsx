import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getUserCompanions,
  getUserSessions,
  getBookmarkedCompanions,
} from "@/lib/actions/companion.actions";
import Image from "next/image";
import Link from "next/link";
import CompanionsList from "@/components/CompanionsList";
import CleanupDuplicateCompanionsButton from "@/components/CleanupDuplicateCompanionsButton";

const Profile = async () => {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const userEmail = user.emailAddresses[0]?.emailAddress;
  const subscriptionPlan = (user.publicMetadata?.subscriptionPlan as string | undefined) ?? "free";
  const subscriptionBillingCycle = user.publicMetadata?.subscriptionBillingCycle as string | undefined;
  const isActiveSubscription = (user.publicMetadata?.subscriptionStatus as string | undefined) === "active";
  const planLabel = `${subscriptionPlan.toUpperCase()}${subscriptionBillingCycle ? ` (${subscriptionBillingCycle})` : ""}`;

  const companions = await getUserCompanions(user.id, userEmail);
  const sessionHistory = await getUserSessions(user.id, 10, userEmail);
  const bookmarkedCompanions = await getBookmarkedCompanions(user.id);

  return (
    <main className="min-lg:w-3/4">
      <section className="flex justify-between gap-4 max-sm:flex-col items-center">
        <div className="flex gap-4 items-center">
          <Image
            src={user.imageUrl}
            alt={user.firstName!}
            width={110}
            height={110}
          />
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-2xl">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.emailAddresses[0].emailAddress}
            </p>
            <Link href="/subscription" title="Manage subscription">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300 cursor-pointer">
                <span>{isActiveSubscription ? "Active Plan" : "Current Plan"}</span>
                <span className="text-white">{planLabel}</span>
              </div>
            </Link>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="border border-black rouded-lg p-3 gap-2 flex flex-col h-fit">
            <div className="flex gap-2 items-center">
              <Image
                src="/icons/check.svg"
                alt="checkmark"
                width={22}
                height={22}
              />
              <p className="text-2xl font-bold">{sessionHistory.length}</p>
            </div>
            <div>Lessons completed</div>
          </div>
          <div className="border border-black rouded-lg p-3 gap-2 flex flex-col h-fit">
            <div className="flex gap-2 items-center">
              <Image src="/icons/cap.svg" alt="cap" width={22} height={22} />
              <p className="text-2xl font-bold">{companions.length}</p>
            </div>
            <div>Companions created</div>
          </div>
        </div>
      </section>
      <Accordion type="multiple">
        <AccordionItem value="bookmarks">
          <AccordionTrigger className="text-2xl font-bold">
            Bookmarked Companions {`(${bookmarkedCompanions.length})`}
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList
              companions={bookmarkedCompanions}
              title="Bookmarked Companions"
              showUnbookmark
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="recent">
          <AccordionTrigger className="text-2xl font-bold">
            Recent Sessions
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList
              title="Recent Sessions"
              companions={sessionHistory}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="companions">
          <AccordionTrigger className="text-2xl font-bold">
            My Companions {`(${companions.length})`}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <CleanupDuplicateCompanionsButton />
            </div>
            <CompanionsList title="My Companions" companions={companions} showManageActions />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
};
export default Profile;

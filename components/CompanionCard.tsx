"use client";
import { removeBookmark } from "@/lib/actions/companion.actions";
import { addBookmark } from "@/lib/actions/companion.actions";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DeleteCompanionButton from "./DeleteCompanionButton";

interface CompanionCardProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
  bookmarked: boolean;
  author?: string;
  userId?: string;
}

const CompanionCard = ({
  id,
  name,
  topic,
  subject,
  duration,
  color,
  bookmarked,
  author,
  userId,
}: CompanionCardProps) => {
  const pathname = usePathname();
  const canManage = userId && author && userId === author;
  const handleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(id, pathname);
    } else {
      await addBookmark(id, pathname);
    }
  };
  return (
    <article className="companion-card group">
      <div
        className="absolute top-0 left-0 w-full h-32 opacity-20 blur-2xl pointer-events-none transition-all duration-700 group-hover:opacity-40 group-hover:h-40"
        style={{ background: `radial-gradient(ellipse at top, ${color}, transparent)` }}
      />
      <div className="flex justify-between items-center relative z-10">
        <div className="subject-badge">{subject}</div>
        <button className="companion-bookmark" onClick={handleBookmark}>
          <Image
            src={
              bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"
            }
            alt="bookmark"
            width={12.5}
            height={15}
          />
        </button>
      </div>

      <h2 className="text-2xl font-bold relative z-10">{name}</h2>
      <p className="text-sm text-gray-300 relative z-10">{topic}</p>
      <div className="flex items-center gap-2">
        <Image
          src="/icons/clock.svg"
          alt="duration"
          width={13.5}
          height={13.5}
        />
        <p className="text-sm">{duration} minutes</p>
      </div>

      <Link href={`/companions/${id}`} className="w-full">
        <button className="btn-primary w-full justify-center">
          Launch Lesson
        </button>
      </Link>

      {canManage && (
        <div className="flex items-center gap-2 mt-3">
          <Link href={`/companions/${id}/edit`} className="border border-black rounded-md px-3 py-2 text-sm flex-1 text-center">
            Edit
          </Link>
          <DeleteCompanionButton companionId={id} />
        </div>
      )}
    </article>
  );
};

export default CompanionCard;

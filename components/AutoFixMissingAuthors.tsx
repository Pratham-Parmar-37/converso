"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fixMissingAuthors } from "@/lib/actions/companion.actions";

interface AutoFixMissingAuthorsProps {
    companionNames: string[];
}

const AutoFixMissingAuthors = ({ companionNames }: AutoFixMissingAuthorsProps) => {
    const router = useRouter();
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (hasRunRef.current) return;
        hasRunRef.current = true;

        const runFix = async () => {
            if (!companionNames.length) return;

            const updated = await fixMissingAuthors(companionNames);
            if (updated && updated.length > 0) {
                router.refresh();
            }
        };

        void runFix();
    }, [companionNames, router]);

    return null;
};

export default AutoFixMissingAuthors;

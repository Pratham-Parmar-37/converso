"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cleanupDuplicateCompanions } from "@/lib/actions/companion.actions";
import { Button } from "@/components/ui/button";

const CleanupDuplicateCompanionsButton = () => {
    const router = useRouter();
    const [isRunning, setIsRunning] = useState(false);

    const handleCleanup = async () => {
        const confirmed = window.confirm(
            "Run one-time cleanup? Older duplicate companions will be merged into the newest one."
        );

        if (!confirmed) return;

        setIsRunning(true);
        const result = await cleanupDuplicateCompanions();
        setIsRunning(false);

        if (!result?.success) {
            window.alert("Cleanup failed. Please try again.");
            return;
        }

        window.alert(
            `Cleanup complete. Removed ${result.removedCompanions} duplicate companion(s) across ${result.mergedGroups} group(s).`
        );
        router.refresh();
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCleanup}
            disabled={isRunning}
            className="cursor-pointer"
        >
            {isRunning ? "Cleaning..." : "Cleanup Duplicates"}
        </Button>
    );
};

export default CleanupDuplicateCompanionsButton;

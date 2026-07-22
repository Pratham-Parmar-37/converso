"use client";

import { fixMissingAuthors } from "@/lib/actions/companion.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FixMissingAuthorsButtonProps {
    companionNames: string[];
}

const FixMissingAuthorsButton = ({ companionNames }: FixMissingAuthorsButtonProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFix = async () => {
        if (!companionNames.length) return;

        setLoading(true);
        setMessage("");

        try {
            const result = await fixMissingAuthors(companionNames);

            if (result && result.length > 0) {
                setMessage(`✓ Fixed ${result.length} companion(s)!`);
                setTimeout(() => {
                    router.refresh();
                }, 1000);
            } else {
                setMessage("No companions needed fixing");
            }
        } catch (error) {
            setMessage("Error fixing companions");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm mb-2">
                {companionNames.length} companion{companionNames.length !== 1 ? "s" : ""} missing edit/delete options:
                <br />
                <strong>{companionNames.join(", ")}</strong>
            </p>
            <button
                onClick={handleFix}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
                {loading ? "Fixing..." : "Fix Missing Authors"}
            </button>
            {message && <p className="mt-2 text-sm text-orange-700">{message}</p>}
        </div>
    );
};

export default FixMissingAuthorsButton;

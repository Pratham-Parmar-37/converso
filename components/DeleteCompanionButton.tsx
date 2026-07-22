"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCompanion } from "@/lib/actions/companion.actions";
import { Button } from "@/components/ui/button";

interface DeleteCompanionButtonProps {
    companionId: string;
}

const DeleteCompanionButton = ({ companionId }: DeleteCompanionButtonProps) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm("Delete this companion? This action cannot be undone.");
        if (!confirmed) return;

        setIsDeleting(true);
        const result = await deleteCompanion(companionId);
        setIsDeleting(false);

        if (result?.success) {
            router.refresh();
        } else {
            window.alert("Failed to delete companion. Please try again.");
        }
    };

    return (
        <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="cursor-pointer"
        >
            {isDeleting ? "Deleting..." : "Delete"}
        </Button>
    );
};

export default DeleteCompanionButton;

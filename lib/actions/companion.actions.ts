'use server';

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    const user = await currentUser();
    const authorEmail = user?.emailAddresses?.[0]?.emailAddress;
    const ownershipIdentifiers = [author, authorEmail].filter(Boolean) as string[];

    if (ownershipIdentifiers.length === 0) return null;

    const supabase = createSupabaseServerClient();

    const normalizedFormData = {
        ...formData,
        name: formData.name.trim(),
        topic: formData.topic.trim(),
    };

    // Prevent accidental duplicate inserts from repeated submissions.
    const { data: existingCompanion, error: existingCompanionError } = await supabase
        .from('companions')
        .select()
        .in('author', ownershipIdentifiers)
        .eq('name', normalizedFormData.name)
        .eq('subject', normalizedFormData.subject)
        .eq('topic', normalizedFormData.topic)
        .eq('voice', normalizedFormData.voice)
        .eq('style', normalizedFormData.style)
        .eq('duration', normalizedFormData.duration)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingCompanionError) {
        console.error("Existing companion lookup error:", existingCompanionError);
    }

    if (existingCompanion) {
        return existingCompanion;
    }

    const companionAuthor = author ?? authorEmail;
    const companionId = crypto.randomUUID();
    const companionRecord = {
        id: companionId,
        ...normalizedFormData,
        author: companionAuthor,
    };

    const { data, error } = await supabase
        .from('companions')
        .insert(companionRecord)
        .select();

    if (error || !data) {
        console.error("Create companion error:", error);
        return null;
    }

    return data[0] ?? companionRecord;
}

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    const supabase = createSupabaseServerClient();

    let query = supabase.from('companions').select();

    if (subject && topic) {
        query = query
            .ilike('subject', `%${subject}%`)
            .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    } else if (subject) {
        query = query.ilike('subject', `%${subject}%`)
    } else if (topic) {
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    }

    query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    const { data: companions, error } = await query;

    if (error) {
        console.error("Supabase error:", error.message);
        return [];
    }

    const seenCompanionSignatures = new Set<string>();

    return (companions ?? []).filter((companion) => {
        const signature = [
            companion.author ?? 'unknown-author',
            (companion.subject ?? '').toLowerCase(),
            (companion.name ?? '').trim().toLowerCase(),
            (companion.topic ?? '').trim().toLowerCase(),
        ].join('|');

        if (seenCompanionSignatures.has(signature)) return false;
        seenCompanionSignatures.add(signature);
        return true;
    });
}

export const getCompanion = async (id: string) => {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id);

    if (error) {
        console.error(error);
        return null;
    }

    return data?.[0];
}

export const updateCompanion = async (id: string, formData: CreateCompanion) => {
    const { userId } = await auth();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const ownershipIdentifiers = [userId, userEmail].filter(Boolean) as string[];

    if (ownershipIdentifiers.length === 0) return null;

    const supabase = createSupabaseServerClient();

    const normalizedFormData = {
        ...formData,
        name: formData.name.trim(),
        topic: formData.topic.trim(),
    };

    const { data, error } = await supabase
        .from('companions')
        .update(normalizedFormData)
        .eq('id', id)
        .in('author', ownershipIdentifiers)
        .select()
        .maybeSingle();

    if (error) {
        console.error("Update companion error:", error.message);
        return null;
    }

    revalidatePath('/companions');
    revalidatePath('/my-journey');
    revalidatePath(`/companions/${id}`);

    return data;
}

export const deleteCompanion = async (id: string) => {
    const { userId } = await auth();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const ownershipIdentifiers = [userId, userEmail].filter(Boolean) as string[];

    if (ownershipIdentifiers.length === 0) return { success: false };

    const supabase = createSupabaseServerClient();

    const { data: companion, error: companionError } = await supabase
        .from('companions')
        .select('id, author')
        .eq('id', id)
        .maybeSingle();

    if (companionError || !companion || !ownershipIdentifiers.includes(companion.author)) {
        return { success: false };
    }

    const { error } = await supabase
        .from('companions')
        .delete()
        .eq('id', id)
        .in('author', ownershipIdentifiers);

    if (error) {
        console.error("Delete companion error:", error.message);
        return { success: false };
    }

    revalidatePath('/companions');
    revalidatePath('/my-journey');
    revalidatePath('/');

    return { success: true };
}

export const cleanupDuplicateCompanions = async () => {
    const { userId } = await auth();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const ownershipIdentifiers = [userId, userEmail].filter(Boolean) as string[];

    if (ownershipIdentifiers.length === 0) {
        return { success: false, removedCompanions: 0, mergedGroups: 0 };
    }

    const supabase = createSupabaseServerClient();

    const { data: companions, error: companionsError } = await supabase
        .from('companions')
        .select('id, created_at, author, name, subject, topic, style, voice, duration')
        .in('author', ownershipIdentifiers)
        .order('created_at', { ascending: false });

    if (companionsError) {
        console.error("Cleanup companions query error:", companionsError.message);
        return { success: false, removedCompanions: 0, mergedGroups: 0 };
    }

    const signatureToKeepId = new Map<string, string>();
    const duplicatePairs: Array<{ duplicateId: string; keepId: string }> = [];

    for (const companion of companions ?? []) {
        const signature = [
            companion.author ?? 'unknown-author',
            (companion.subject ?? '').toLowerCase(),
            (companion.name ?? '').trim().toLowerCase(),
            (companion.topic ?? '').trim().toLowerCase(),
            (companion.style ?? '').toLowerCase(),
            (companion.voice ?? '').toLowerCase(),
            String(companion.duration ?? ''),
        ].join('|');

        const keepId = signatureToKeepId.get(signature);
        if (!keepId) {
            signatureToKeepId.set(signature, companion.id);
            continue;
        }

        if (companion.id !== keepId) {
            duplicatePairs.push({ duplicateId: companion.id, keepId });
        }
    }

    if (duplicatePairs.length === 0) {
        return { success: true, removedCompanions: 0, mergedGroups: 0 };
    }

    let removedCompanions = 0;

    for (const { duplicateId, keepId } of duplicatePairs) {
        const { data: duplicateBookmarks, error: duplicateBookmarksError } = await supabase
            .from('bookmarks')
            .select('id, user_id')
            .eq('companion_id', duplicateId);

        if (duplicateBookmarksError) {
            console.error("Cleanup bookmarks lookup error:", duplicateBookmarksError.message);
            continue;
        }

        for (const bookmark of duplicateBookmarks ?? []) {
            const { data: existingKeepBookmark, error: keepBookmarkError } = await supabase
                .from('bookmarks')
                .select('id')
                .eq('user_id', bookmark.user_id)
                .eq('companion_id', keepId)
                .limit(1)
                .maybeSingle();

            if (keepBookmarkError) {
                console.error("Cleanup bookmark check error:", keepBookmarkError.message);
                continue;
            }

            if (existingKeepBookmark) {
                const { error: deleteBookmarkError } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('id', bookmark.id);

                if (deleteBookmarkError) {
                    console.error("Cleanup duplicate bookmark delete error:", deleteBookmarkError.message);
                }

                continue;
            }

            const { error: updateBookmarkError } = await supabase
                .from('bookmarks')
                .update({ companion_id: keepId })
                .eq('id', bookmark.id);

            if (updateBookmarkError) {
                console.error("Cleanup bookmark remap error:", updateBookmarkError.message);
            }
        }

        const { error: remapSessionsError } = await supabase
            .from('session_history')
            .update({ companion_id: keepId })
            .eq('companion_id', duplicateId);

        if (remapSessionsError) {
            console.error("Cleanup session remap error:", remapSessionsError.message);
            continue;
        }

        const { error: deleteCompanionError } = await supabase
            .from('companions')
            .delete()
            .eq('id', duplicateId)
            .in('author', ownershipIdentifiers);

        if (deleteCompanionError) {
            console.error("Cleanup companion delete error:", deleteCompanionError.message);
            continue;
        }

        removedCompanions += 1;
    }

    revalidatePath('/companions');
    revalidatePath('/my-journey');
    revalidatePath('/');

    return {
        success: true,
        removedCompanions,
        mergedGroups: new Set(duplicatePairs.map((pair) => pair.keepId)).size,
    };
}

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
        .from('session_history')
        .insert({
            companion_id: companionId,
            user_id: userId,
        });

    if (error) {
        console.error("Session history error:", error.message);
        return null;
    }

    return data;
}

export const getRecentSessions = async (limit = 10) => {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error(error.message);
        return [];
    }

    const seenCompanionIds = new Set<string>();

    return data
        .map(({ companions }) => companions)
        .filter((companion) => {
            if (!companion) return false;

            const companionId = companion.id ?? companion.$id;
            if (!companionId || seenCompanionIds.has(companionId)) return false;

            seenCompanionIds.add(companionId);
            return true;
        });
}

export const getUserSessions = async (userId: string, limit = 10, userEmail?: string) => {
    const supabase = createSupabaseServerClient();

    const queries = [
        supabase
            .from('session_history')
            .select(`created_at, companions:companion_id (*)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)
    ];

    if (userEmail) {
        queries.push(
            supabase
                .from('session_history')
                .select(`created_at, companions:companion_id (*)`)
                .eq('user_id', userEmail)
                .order('created_at', { ascending: false })
                .limit(limit)
        );
    }

    const results = await Promise.all(queries);
    const firstError = results.find(({ error }) => error)?.error;

    if (firstError) {
        console.error(firstError.message);
        return [];
    }

    const seenCompanionIds = new Set<string>();
    const mergedSessions = results.flatMap(({ data }) => data ?? []);

    return mergedSessions
        .sort((left, right) => {
            const leftDate = new Date((left as { created_at?: string }).created_at ?? 0).getTime();
            const rightDate = new Date((right as { created_at?: string }).created_at ?? 0).getTime();
            return rightDate - leftDate;
        })
        .map(({ companions }) => companions)
        .filter((companion) => {
            if (!companion) return false;

            const companionId = companion.id ?? companion.$id;
            if (!companionId || seenCompanionIds.has(companionId)) return false;

            seenCompanionIds.add(companionId);
            return true;
        });
}

export const getUserCompanions = async (userId: string, userEmail?: string) => {
    const supabase = createSupabaseServerClient();

    const queries = [
        supabase
            .from('companions')
            .select()
            .eq('author', userId)
            .order('created_at', { ascending: false })
    ];

    if (userEmail) {
        queries.push(
            supabase
                .from('companions')
                .select()
                .eq('author', userEmail)
                .order('created_at', { ascending: false })
        );
    }

    const results = await Promise.all(queries);
    const firstError = results.find(({ error }) => error)?.error;

    if (firstError) {
        console.error(firstError.message);
        return [];
    }

    const merged = results
        .flatMap(({ data }) => data ?? [])
        .sort((left, right) => {
            const leftDate = new Date((left as { created_at?: string }).created_at ?? 0).getTime();
            const rightDate = new Date((right as { created_at?: string }).created_at ?? 0).getTime();
            return rightDate - leftDate;
        });

    const seenSignatures = new Set<string>();

    return merged.filter((companion) => {
        if (!companion?.id) return false;

        const signature = [
            companion.author ?? 'unknown-author',
            (companion.subject ?? '').toLowerCase(),
            (companion.name ?? '').trim().toLowerCase(),
            (companion.topic ?? '').trim().toLowerCase(),
            (companion.style ?? '').toLowerCase(),
            (companion.voice ?? '').toLowerCase(),
            String(companion.duration ?? ''),
        ].join('|');

        if (seenSignatures.has(signature)) return false;
        seenSignatures.add(signature);
        return true;
    });
}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const supabase = createSupabaseServerClient();

    let limit = 10;

    if (has({ plan: 'pro' })) {
        return true;
    } else if (has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if (has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const queries = [
        supabase.from('companions').select('id').eq('author', userId)
    ];

    if (userEmail) {
        queries.push(
            supabase.from('companions').select('id').eq('author', userEmail)
        );
    }

    const results = await Promise.all(queries);
    const firstError = results.find(({ error }) => error)?.error;

    if (firstError) {
        console.error(firstError.message);
        return false;
    }

    const companionCount = new Set(results.flatMap(({ data }) => (data ?? []).map((companion) => companion.id))).size;

    return companionCount < limit;
}

// Bookmarks
export const addBookmark = async (companionId: string, path: string) => {
    const { userId } = await auth();
    if (!userId) return;

    const supabase = createSupabaseServerClient();

    const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("companion_id", companionId)
        .eq("user_id", userId)
        .single();

    if (existing) {
        await supabase.from("bookmarks").delete().eq("id", existing.id);
        revalidatePath(path);
        return null;
    }

    const { data, error } = await supabase.from("bookmarks").insert({
        companion_id: companionId,
        user_id: userId,
    });

    if (error) {
        console.error(error.message);
        return null;
    }

    revalidatePath(path);
    return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
    const { userId } = await auth();
    if (!userId) return;

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("companion_id", companionId)
        .eq("user_id", userId);

    if (error) {
        console.error(error.message);
        return null;
    }

    revalidatePath(path);
    return data;
};

export const getBookmarkedCompanions = async (userId: string) => {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
        .from("bookmarks")
        .select(`companions:companion_id (*)`)
        .eq("user_id", userId);

    if (error) {
        console.error(error.message);
        return [];
    }

    return data.map(({ companions }) => companions);
};

export const getBookmarkedCompanionIds = async (): Promise<Set<string>> => {
    const { userId } = await auth();
    if (!userId) return new Set();

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
        .from("bookmarks")
        .select("companion_id")
        .eq("user_id", userId);

    if (error) return new Set();

    return new Set(data.map((b: { companion_id: string }) => b.companion_id));
};

export const fixMissingAuthors = async (companionNames: string[]) => {
    const { userId } = await auth();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userId && !userEmail) return null;

    const supabase = createSupabaseServerClient();
    const authorToSet = userId || userEmail;

    // Get all companions - then match by case-insensitive name
    const { data: allCompanions, error: fetchError } = await supabase
        .from('companions')
        .select('id, name, author');

    if (fetchError) {
        console.error("Fetch error:", fetchError);
        return null;
    }

    // Filter by case-insensitive name match
    const lowerCaseNames = companionNames.map(n => n.toLowerCase());
    const matchingCompanions = (allCompanions ?? []).filter((c) =>
        lowerCaseNames.includes((c.name ?? '').toLowerCase())
    );

    if (matchingCompanions.length === 0) {
        console.log("No companions found matching names:", companionNames);
        return [];
    }

    const companionIdsToUpdate = matchingCompanions
        .filter((c) => (c.author ?? "") !== authorToSet)
        .map((c) => c.id);

    if (companionIdsToUpdate.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('companions')
        .update({ author: authorToSet })
        .in('id', companionIdsToUpdate)
        .select();

    if (error) {
        console.error("Update error:", error);
        return null;
    }

    revalidatePath('/companions');
    revalidatePath('/my-journey');

    return data ?? [];
};

// ── Skill Tree: Subject Progress ─────────────────────────────────
export const getSubjectProgress = async (): Promise<Record<string, number>> => {
    const { userId } = await auth();
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userId) return {};

    const supabase = createSupabaseServerClient();

    const queries = [
        supabase
            .from('session_history')
            .select(`companions:companion_id (subject)`)
            .eq('user_id', userId)
    ];

    if (userEmail) {
        queries.push(
            supabase
                .from('session_history')
                .select(`companions:companion_id (subject)`)
                .eq('user_id', userEmail)
        );
    }

    const results = await Promise.all(queries);
    const subjectCounts: Record<string, number> = {};

    for (const { data, error } of results) {
        if (error) {
            console.error("Subject progress query error:", error.message);
            continue;
        }
        for (const session of data ?? []) {
            const companion = session.companions as unknown as { subject?: string } | null;
            const subject = companion?.subject;
            if (subject) {
                subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
            }
        }
    }

    return subjectCounts;
};